"use client"

import { useEffect, useRef, useState } from "react"
import { useGLTF } from "@react-three/drei"
import * as THREE from "three"

interface UVMapExtractorProps {
  modelUrl: string
  onUVMapExtracted: (uvMapUrl: string) => void
  onMeshInfoExtracted?: (meshInfo: MeshInfo[]) => void
  resolution?: number
  showWireframe?: boolean
  showTexture?: boolean
  backgroundColor?: string
  lineColor?: string
}

interface MeshInfo {
  name: string
  vertices: number
  faces: number
  materials: string[]
  uvSets: string[]
}

export default function UVMapExtractor({
  modelUrl,
  onUVMapExtracted,
  onMeshInfoExtracted,
  resolution = 2048,
  showWireframe = true,
  showTexture = true,
  backgroundColor = "#ffffff",
  lineColor = "#000000",
}: UVMapExtractorProps) {
  const { scene } = useGLTF(modelUrl)
  const [uvSets, setUvSets] = useState<{ name: string; url: string }[]>([])
  const [meshInfo, setMeshInfo] = useState<MeshInfo[]>([])

  useEffect(() => {
    if (!scene) return

    try {
      const analyzeMesh = (mesh: THREE.Mesh): MeshInfo => {
        const geometry = mesh.geometry
        const materials = Array.isArray(mesh.material)
          ? mesh.material.map(m => m.name || 'Unnamed Material')
          : [mesh.material.name || 'Unnamed Material']
        
        const uvSets = []
        for (let i = 0; i < 8; i++) {
          const attrName = `uv${i === 0 ? '' : i + 1}`
          if (geometry.attributes[attrName]) {
            uvSets.push(attrName)
          }
        }

        return {
          name: mesh.name || 'Unnamed Mesh',
          vertices: geometry.attributes.position.count,
          faces: geometry.index ? geometry.index.count / 3 : geometry.attributes.position.count / 3,
          materials,
          uvSets,
        }
      }

      const processMesh = (mesh: THREE.Mesh) => {
        if (!mesh.geometry) return

        const geometry = mesh.geometry
        const uvAttributes: { name: string; attribute: THREE.BufferAttribute }[] = []
        
        // Get all UV attributes (UV1, UV2, etc.)
        for (let i = 0; i < 8; i++) {
          const attrName = `uv${i === 0 ? '' : i + 1}`
          const uvAttribute = geometry.attributes[attrName]
          if (uvAttribute && uvAttribute instanceof THREE.BufferAttribute) {
            uvAttributes.push({ name: attrName, attribute: uvAttribute })
          }
        }

        return uvAttributes
      }

      const extractUVMap = (uvAttribute: THREE.BufferAttribute, name: string, mesh: THREE.Mesh) => {
        const canvas = document.createElement("canvas")
        canvas.width = resolution
        canvas.height = resolution

        const ctx = canvas.getContext("2d")
        if (!ctx) return null

        // Clear canvas with background color
        ctx.fillStyle = backgroundColor
        ctx.fillRect(0, 0, canvas.width, canvas.height)

        // Set up drawing style for UV wireframe
        ctx.strokeStyle = lineColor
        ctx.lineWidth = 1

        const uvArray = uvAttribute.array
        const indexAttribute = mesh.geometry.index

        // Draw texture first if enabled
        if (showTexture) {
          const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
          materials.forEach(material => {
            if (material instanceof THREE.MeshStandardMaterial) {
              const maps = [
                { map: material.map, name: 'diffuse' },
                { map: material.normalMap, name: 'normal' },
                { map: material.roughnessMap, name: 'roughness' },
                { map: material.metalnessMap, name: 'metalness' },
                { map: material.aoMap, name: 'ao' },
                { map: material.emissiveMap, name: 'emissive' },
              ]

              maps.forEach(({ map, name }) => {
                if (map && map.image) {
                  ctx.globalAlpha = 0.2 // Make textures semi-transparent
                  ctx.drawImage(map.image, 0, 0, canvas.width, canvas.height)
                }
              })
            }
          })
        }

        // Draw UV wireframe
        if (showWireframe) {
          ctx.globalAlpha = 1
          ctx.beginPath()

          if (indexAttribute) {
            // Draw triangles using indices
            for (let i = 0; i < indexAttribute.count; i += 3) {
              const a = indexAttribute.getX(i) * 2
              const b = indexAttribute.getX(i + 1) * 2
              const c = indexAttribute.getX(i + 2) * 2

              const u1 = uvArray[a] * canvas.width
              const v1 = (1 - uvArray[a + 1]) * canvas.height
              const u2 = uvArray[b] * canvas.width
              const v2 = (1 - uvArray[b + 1]) * canvas.height
              const u3 = uvArray[c] * canvas.width
              const v3 = (1 - uvArray[c + 1]) * canvas.height

              // Draw triangle wireframe
              ctx.moveTo(u1, v1)
              ctx.lineTo(u2, v2)
              ctx.lineTo(u3, v3)
              ctx.lineTo(u1, v1)
            }
          } else {
            // Draw triangles without indices
            for (let i = 0; i < uvArray.length; i += 6) {
              const u1 = uvArray[i] * canvas.width
              const v1 = (1 - uvArray[i + 1]) * canvas.height
              const u2 = uvArray[i + 2] * canvas.width
              const v2 = (1 - uvArray[i + 3]) * canvas.height
              const u3 = uvArray[i + 4] * canvas.width
              const v3 = (1 - uvArray[i + 5]) * canvas.height

              // Draw triangle wireframe
              ctx.moveTo(u1, v1)
              ctx.lineTo(u2, v2)
              ctx.lineTo(u3, v3)
              ctx.lineTo(u1, v1)
            }
          }

          ctx.stroke()
        }

        return canvas
      }

      const newUvSets: { name: string; url: string }[] = []
      const newMeshInfo: MeshInfo[] = []

      scene.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          // Analyze mesh
          const info = analyzeMesh(child)
          newMeshInfo.push(info)

          // Process UV maps
          const uvAttributes = processMesh(child)
          if (uvAttributes) {
            uvAttributes.forEach(({ name, attribute }) => {
              const canvas = extractUVMap(attribute, name, child)
              if (canvas) {
                canvas.toBlob((blob) => {
                  if (blob) {
                    const url = URL.createObjectURL(blob)
                    newUvSets.push({ name, url })
                    setUvSets(prev => [...prev, { name, url }])
                    onUVMapExtracted(url)
                  }
                }, "image/png")
              }
            })
          }
        }
      })

      setMeshInfo(newMeshInfo)
      if (onMeshInfoExtracted) {
        onMeshInfoExtracted(newMeshInfo)
      }
    } catch (error) {
      console.error("Error extracting UV map:", error)
    }
  }, [scene, onUVMapExtracted, onMeshInfoExtracted, resolution, showWireframe, showTexture, backgroundColor, lineColor])

  return null // This component doesn't render anything visible
}
