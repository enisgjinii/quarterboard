"use client"

import { useRef, useEffect, useMemo, useState } from "react"
import { useGLTF, useHelper, OrbitControls, Grid, GizmoHelper, GizmoViewport, useTexture } from "@react-three/drei"
import { useFrame, useThree } from "@react-three/fiber"
import * as THREE from "three"

interface MeshInfo {
  name: string
  type: string
  position: THREE.Vector3
  scale: THREE.Vector3
  geometry?: THREE.BufferGeometry
}

interface ModelViewerProps {
  modelPath: string
  color?: string
  onModelLoad?: (info: any) => void
  selectedMaterial?: string | null
  materialPreview?: string | null
  isPreviewMode?: boolean
}

export function ModelViewer({
  modelPath,
  color,
  onModelLoad,
  selectedMaterial,
  materialPreview,
  isPreviewMode
}: ModelViewerProps) {
  const groupRef = useRef<THREE.Group>(null)
  const directionalLightRef = useRef<THREE.DirectionalLight>(null)
  const [isLoading, setIsLoading] = useState(true)
  const { scene } = useGLTF(modelPath)
  const { camera } = useThree()

  useEffect(() => {
    if (scene) {
      console.log('Model loaded:', scene)
      console.log('Scene children:', scene.children)
      scene.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          console.log('Mesh:', child.name)
          console.log('Position:', child.position)
          console.log('Scale:', child.scale)
        }
      })
      setIsLoading(false)
      onModelLoad?.(scene)
    }
  }, [scene, onModelLoad])

  // Setup shadows
  useEffect(() => {
    if (directionalLightRef.current) {
      directionalLightRef.current.castShadow = true
      directionalLightRef.current.shadow.mapSize.width = 2048
      directionalLightRef.current.shadow.mapSize.height = 2048
      directionalLightRef.current.shadow.camera.near = 0.5
      directionalLightRef.current.shadow.camera.far = 500
      directionalLightRef.current.shadow.bias = -0.0001
    }
  }, [])

  // Memoize material color
  const materialColor = useMemo(() => new THREE.Color(color || '#ffffff'), [color])

  // Apply color to all materials
  useEffect(() => {
    if (!scene) return;
    
    scene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        const material = child.material
        if (Array.isArray(material)) {
          material.forEach(m => {
            if (m instanceof THREE.MeshStandardMaterial) {
              m.color = materialColor
              m.needsUpdate = true
            }
          })
        } else if (material instanceof THREE.MeshStandardMaterial) {
          material.color = materialColor
          material.needsUpdate = true
        }
      }
    })
  }, [scene, materialColor])

  // Handle material preview
  useEffect(() => {
    if (!selectedMaterial || !materialPreview || !scene) return;
    
    const [meshName, materialIndex] = selectedMaterial.split('_')
    const mesh = scene.getObjectByName(meshName)
    if (mesh instanceof THREE.Mesh) {
      const material = Array.isArray(mesh.material) 
        ? mesh.material[parseInt(materialIndex)]
        : mesh.material

      if (material instanceof THREE.MeshStandardMaterial) {
        material.color.set(materialPreview)
        material.needsUpdate = true
      }
    }
  }, [selectedMaterial, materialPreview, scene])

  // Animation loop
  useFrame(() => {
    if (groupRef.current && isPreviewMode) {
      groupRef.current.rotation.y += 0.005
    }
  })

  if (isLoading) {
    return null
  }

  return (
    <>
      {/* Main scene */}
      <group ref={groupRef}>
        <primitive 
          object={scene} 
          scale={[1, 1, 1]}
          position={[0, 0, 0]}
          rotation={[0, 0, 0]}
        />
      </group>

      {/* Basic lighting */}
      <ambientLight intensity={1.0} />
      <directionalLight position={[5, 5, 5]} intensity={1.0} />

      {/* Controls */}
      <OrbitControls
        makeDefault
        enableDamping
        dampingFactor={0.05}
        target={[0, 0, 0]}
      />

      {/* Debug helpers */}
      <axesHelper args={[5]} />
    </>
  )
}

// Preload the default model for better performance
useGLTF.preload("/models/quarterboard.glb")