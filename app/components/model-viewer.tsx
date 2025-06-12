"use client"

import { useRef, useEffect } from "react"
import { useGLTF, useTexture } from "@react-three/drei"
import { useFrame } from "@react-three/fiber"
import * as THREE from "three"
import { Html } from "@react-three/drei"

interface ModelViewerProps {
  modelUrl: string
  textureUrl?: string | null
  color: string
  onModelLoaded?: (loaded: boolean) => void
}

const ModelViewer: React.FC<ModelViewerProps> = ({
  modelUrl,
  textureUrl,
  color,
  onModelLoaded,
}) => {
  const meshRef = useRef<THREE.Group>(null)
  const { scene } = useGLTF(modelUrl)
  
  // Load texture if provided - use try-catch to handle data URLs
  let texture: THREE.Texture | null = null
  try {
    texture = textureUrl ? useTexture(textureUrl) : null
  } catch (err) {
    console.warn("Failed to load texture:", err)
    texture = null
  }

  useEffect(() => {
    if (!scene || !meshRef.current) return

    try {
      // Calculate bounding box and center the model
      const box = new THREE.Box3().setFromObject(scene)
      const center = box.getCenter(new THREE.Vector3())
      const size = box.getSize(new THREE.Vector3())
      const maxDimension = Math.max(size.x, size.y, size.z)
      const scale = maxDimension > 0 ? 2 / maxDimension : 1

      // Apply transformations
      meshRef.current.scale.setScalar(scale)
      meshRef.current.position.set(-center.x * scale, -center.y * scale, -center.z * scale)

      // Apply material to all meshes
      scene.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          if (texture) {
            // Apply texture
            child.material = new THREE.MeshStandardMaterial({
              map: texture,
              roughness: 0.3,
              metalness: 0.7,
            })
          } else {
            // Apply color
            child.material = new THREE.MeshStandardMaterial({
              color: new THREE.Color(color),
              roughness: 0.3,
              metalness: 0.7,
            })
          }
          child.castShadow = true
          child.receiveShadow = true
        }
      })

      onModelLoaded?.(true)
    } catch (error) {
      console.error('Error processing model:', error)
      onModelLoaded?.(false)
    }
  }, [scene, texture, color, onModelLoaded])

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.2) * 0.1
    }
  })
  // Show fallback if scene is not available
  if (!scene) {
    return (
      <mesh>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={color} roughness={0.3} metalness={0.7} />
      </mesh>
    )
  }

  return (
    <group ref={meshRef}>
      <primitive object={scene} />
    </group>
  )
}

export default ModelViewer

// Preload the default model
useGLTF.preload("/models/quarterboard.glb")
