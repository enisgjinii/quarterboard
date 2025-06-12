"use client"

import { useRef, useEffect } from "react"
import { useGLTF, useTexture } from "@react-three/drei"
import { useFrame } from "@react-three/fiber"
import * as THREE from "three"

interface ModelViewerProps {
  modelUrl: string
  textureUrl: string | null
  color: string
}

function ModelWithTexture({ modelUrl, textureUrl, color }: ModelViewerProps) {
  const meshRef = useRef<THREE.Group>(null)
  const { scene } = useGLTF(modelUrl)
  const texture = useTexture(textureUrl!)

  useEffect(() => {
    if (meshRef.current && texture) {
      meshRef.current.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.material = new THREE.MeshStandardMaterial({
            map: texture,
            roughness: 0.3,
            metalness: 0.7,
          })
        }
      })
    }
  }, [texture])

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.1) * 0.05
    }
  })

  return (
    <group ref={meshRef}>
      <primitive object={scene.clone()} scale={[2, 2, 2]} />
    </group>
  )
}

function ModelWithColor({ modelUrl, color }: { modelUrl: string; color: string }) {
  const meshRef = useRef<THREE.Group>(null)
  const { scene } = useGLTF(modelUrl)

  useEffect(() => {
    if (meshRef.current) {
      meshRef.current.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.material = new THREE.MeshStandardMaterial({
            color: new THREE.Color(color),
            roughness: 0.3,
            metalness: 0.7,
          })
        }
      })
    }
  }, [color])

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.1) * 0.05
    }
  })

  return (
    <group ref={meshRef}>
      <primitive object={scene.clone()} scale={[2, 2, 2]} />
    </group>
  )
}

export default function ModelViewer({ modelUrl, textureUrl, color }: ModelViewerProps) {
  try {
    if (textureUrl) {
      return <ModelWithTexture modelUrl={modelUrl} textureUrl={textureUrl} color={color} />
    } else {
      return <ModelWithColor modelUrl={modelUrl} color={color} />
    }
  } catch (error) {
    console.error("Error loading model:", error)
    return (
      <mesh>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={color} roughness={0.3} metalness={0.7} />
      </mesh>
    )
  }
}

useGLTF.preload("/models/quarterboard.glb")
