"use client"

import { useEffect } from "react"
import { useGLTF } from "@react-three/drei"
import * as THREE from "three"

interface UVMapExtractorProps {
  modelUrl: string
  onUVMapExtracted: (uvMapUrl: string) => void
}

export default function UVMapExtractor({ modelUrl, onUVMapExtracted }: UVMapExtractorProps) {
  const { scene } = useGLTF(modelUrl)

  useEffect(() => {
    if (!scene) return

    try {
      // Create a canvas for UV map visualization
      const canvas = document.createElement("canvas")
      canvas.width = 512
      canvas.height = 512

      const ctx = canvas.getContext("2d")
      if (!ctx) return

      // Clear canvas with white background
      ctx.fillStyle = "#ffffff"
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Set up drawing style for UV wireframe
      ctx.strokeStyle = "#000000"
      ctx.lineWidth = 1

      scene.traverse((child) => {
        if (child instanceof THREE.Mesh && child.geometry) {
          const geometry = child.geometry
          const uvAttribute = geometry.attributes.uv

          if (uvAttribute) {
            const uvArray = uvAttribute.array
            const indexAttribute = geometry.index

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

                // Draw triangle
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

                // Draw triangle
                ctx.moveTo(u1, v1)
                ctx.lineTo(u2, v2)
                ctx.lineTo(u3, v3)
                ctx.lineTo(u1, v1)
              }
            }

            ctx.stroke()
          }
        }
      })

      // Convert canvas to blob URL
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob)
          onUVMapExtracted(url)
        }
      }, "image/png")
    } catch (error) {
      console.error("Error extracting UV map:", error)
    }
  }, [scene, onUVMapExtracted])

  return null // This component doesn't render anything visible
}
