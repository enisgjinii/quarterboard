"use client"

import { useRef, useEffect, useState } from "react"
import { useGLTF, useTexture } from "@react-three/drei"
import { useFrame } from "@react-three/fiber"
import * as THREE from "three"

interface ModelViewerProps {
  modelUrl: string
  textureUrl: string | null
  color: string
  onModelLoaded?: (loaded: boolean) => void
}

function ModelWithTexture({
  modelUrl,
  textureUrl,
  color,
  onModelLoaded,
}: { modelUrl: string; textureUrl: string; color: string; onModelLoaded?: (loaded: boolean) => void }) {
  const meshRef = useRef<THREE.Group>(null)
  const { scene } = useGLTF(modelUrl)
  const texture = useTexture(textureUrl)

  useEffect(() => {
    if (scene && onModelLoaded) {
      onModelLoaded(true)
    }
  }, [scene, onModelLoaded])

  useEffect(() => {
    if (meshRef.current && texture && scene) {
      // Calculate bounding box and center the model
      const box = new THREE.Box3().setFromObject(scene)
      const center = box.getCenter(new THREE.Vector3())
      const size = box.getSize(new THREE.Vector3())

      // Calculate scale to fit in viewport
      const maxDimension = Math.max(size.x, size.y, size.z)
      const scale = maxDimension > 0 ? 2 / maxDimension : 1

      meshRef.current.scale.setScalar(scale)
      meshRef.current.position.set(-center.x * scale, -center.y * scale, -center.z * scale)

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
    }
  }, [texture, scene])

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
    if (scene && onModelLoaded) {
      onModelLoaded(true)
    }
  }, [scene, onModelLoaded])

  useEffect(() => {
    if (meshRef.current && scene) {
      // Calculate bounding box and center the model
      const box = new THREE.Box3().setFromObject(scene)
      const center = box.getCenter(new THREE.Vector3())
      const size = box.getSize(new THREE.Vector3())

      // Calculate scale to fit in viewport
      const maxDimension = Math.max(size.x, size.y, size.z)
      const scale = maxDimension > 0 ? 2 / maxDimension : 1

      meshRef.current.scale.setScalar(scale)
      meshRef.current.position.set(-center.x * scale, -center.y * scale, -center.z * scale)

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
    }
  }, [color, scene])

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

export default function ModelViewer({ modelUrl, textureUrl, color, onModelLoaded }: ModelViewerProps) {
  const [error, setError] = useState<string | null>(null)

  try {
    // Only render ModelWithTexture if textureUrl is not null
    if (textureUrl) {
      return (
        <ModelWithTexture modelUrl={modelUrl} textureUrl={textureUrl} color={color} onModelLoaded={onModelLoaded} />
      )
    } else {
      return <ModelWithColor modelUrl={modelUrl} color={color} onModelLoaded={onModelLoaded} />
    }
  } catch (error) {
    console.error("Error loading model:", error)
    setError("Failed to load model")
    return <FallbackModel color={color} />
  }
}

// Preload the default model
useGLTF.preload("/models/object.glb")
