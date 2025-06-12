"use client"

import { useRef, useEffect, useState } from "react"
import { useGLTF, useTexture } from "@react-three/drei"
import { useFrame } from "@react-three/fiber"
import * as THREE from "three"
import { Mesh, MeshStandardMaterial, TextureLoader, Object3D, Box3, Vector3 } from "three"
import { Html } from "@react-three/drei"

interface ModelViewerProps {
  modelUrl: string
  textureUrl: string | null
  color: string
  onModelLoaded: (loaded: boolean) => void
}

function ModelWithTexture({
  modelUrl,
  textureUrl,
  color,
  onModelLoaded,
}: { modelUrl: string; textureUrl: string; color: string; onModelLoaded?: (loaded: boolean) => void }) {
  const meshRef = useRef<THREE.Group>(null)
  const { scene } = useGLTF(modelUrl)
  const texture = useTexture(textureUrl!)

  useEffect(() => {
    if (!scene || !meshRef.current) return

    try {
      // Calculate bounding box
      const box = new THREE.Box3().setFromObject(scene)
      const center = box.getCenter(new THREE.Vector3())
      const size = box.getSize(new THREE.Vector3())

      // Calculate optimal scale
      const maxDimension = Math.max(size.x, size.y, size.z)
      const targetSize = 2 // Target size in world units
      const scale = maxDimension > 0 ? targetSize / maxDimension : 1

      // Apply transformations
      meshRef.current.scale.setScalar(scale)
      meshRef.current.position.set(-center.x * scale, -center.y * scale, -center.z * scale)

      // Apply texture
      meshRef.current.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.material = new THREE.MeshStandardMaterial({
            map: texture,
            roughness: 0.3,
            metalness: 0.7,
          })
          child.castShadow = true
          child.receiveShadow = true
        }
      })

      onModelLoaded?.(true)
    } catch (error) {
      console.error('Error processing model:', error)
      onModelLoaded?.(false)
    }
  }, [scene, texture, onModelLoaded])

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.2) * 0.1
    }
  })

  return (
    <group ref={meshRef}>
      <primitive object={scene.clone()} />
    </group>
  )
}

function ModelWithColor({
  modelUrl,
  color,
  onModelLoaded,
}: { modelUrl: string; color: string; onModelLoaded?: (loaded: boolean) => void }) {
  const meshRef = useRef<THREE.Group>(null)
  const { scene } = useGLTF(modelUrl)

  useEffect(() => {
    if (!scene || !meshRef.current) return

    try {
      // Calculate bounding box
      const box = new THREE.Box3().setFromObject(scene)
      const center = box.getCenter(new THREE.Vector3())
      const size = box.getSize(new THREE.Vector3())

      // Calculate optimal scale
      const maxDimension = Math.max(size.x, size.y, size.z)
      const targetSize = 2 // Target size in world units
      const scale = maxDimension > 0 ? targetSize / maxDimension : 1

      // Apply transformations
      meshRef.current.scale.setScalar(scale)
      meshRef.current.position.set(-center.x * scale, -center.y * scale, -center.z * scale)

      // Apply material
      meshRef.current.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.material = new THREE.MeshStandardMaterial({
            color: new THREE.Color(color),
            roughness: 0.3,
            metalness: 0.7,
          })
          child.castShadow = true
          child.receiveShadow = true
        }
      })

      onModelLoaded?.(true)
    } catch (error) {
      console.error('Error processing model:', error)
      onModelLoaded?.(false)
    }
  }, [scene, color, onModelLoaded])

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.2) * 0.1
    }
  })

  return (
    <group ref={meshRef}>
      <primitive object={scene.clone()} />
    </group>
  )
}

function FallbackModel({ color }: { color: string }) {
  const meshRef = useRef<THREE.Mesh>(null)

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.5
    }
  })

  return (
    <mesh ref={meshRef} position={[0, 0, 0]}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color={color} roughness={0.3} metalness={0.7} />
    </mesh>
  )
}

const ModelViewer: React.FC<ModelViewerProps> = ({
  modelUrl,
  textureUrl,
  color,
  onModelLoaded,
}) => {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const gltf = useGLTF(modelUrl)
  const modelRef = useRef<Mesh>(null)

  useEffect(() => {
    if (!gltf) return

    try {
      setIsLoading(true)
      setError(null)

      // Calculate bounding box
      const box = new Box3().setFromObject(gltf.scene)
      const size = box.getSize(new Vector3())
      const center = box.getCenter(new Vector3())

      // Calculate scale to fit in view
      const maxDim = Math.max(size.x, size.y, size.z)
      const scale = 2 / maxDim

      // Apply scale and center the model
      gltf.scene.scale.setScalar(scale)
      gltf.scene.position.set(-center.x * scale, -center.y * scale, -center.z * scale)

      // Apply color to all materials
      gltf.scene.traverse((child: Object3D) => {
        if (child instanceof Mesh) {
          const material = child.material as MeshStandardMaterial
          if (material) {
            material.color.set(color)
            material.needsUpdate = true
          }
        }
      })

      onModelLoaded?.(true)
      setIsLoading(false)
    } catch (error) {
      console.error('Error loading model:', error)
      setError('Failed to load model')
      onModelLoaded?.(false)
      setIsLoading(false)
    }
  }, [gltf, color, onModelLoaded])

  if (error) {
    return (
      <Html center>
        <div className="text-red-500">Error: {error}</div>
      </Html>
    )
  }

  if (isLoading) {
    return (
      <Html center>
        <div className="flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm rounded-lg border shadow-lg">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mr-3"></div>
          <span className="text-foreground font-medium">Loading 3D model...</span>
        </div>
      </Html>
    )
  }

  return (
    <primitive
      ref={modelRef}
      object={gltf.scene}
      position={[0, 0, 0]}
      rotation={[0, 0, 0]}
      scale={[1, 1, 1]}
    />
  )
}

export default ModelViewer

// Preload the default model
useGLTF.preload("/models/object.glb")
