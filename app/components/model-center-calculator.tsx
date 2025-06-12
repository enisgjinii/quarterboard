"use client"

import { useEffect } from "react"
import { useGLTF } from "@react-three/drei"
import * as THREE from "three"

interface ModelCenterCalculatorProps {
  modelUrl: string
  onModelData: (data: {
    center: { x: number; y: number; z: number }
    scale: number
    bounds: { width: number; height: number; depth: number }
  }) => void
}

export default function ModelCenterCalculator({ modelUrl, onModelData }: ModelCenterCalculatorProps) {
  const { scene } = useGLTF(modelUrl)

  useEffect(() => {
    if (!scene) return

    // Calculate bounding box
    const box = new THREE.Box3().setFromObject(scene)
    const center = box.getCenter(new THREE.Vector3())
    const size = box.getSize(new THREE.Vector3())

    // Calculate optimal scale to fit in viewport
    const maxDimension = Math.max(size.x, size.y, size.z)
    const targetSize = 3 // Target size in world units
    const optimalScale = maxDimension > 0 ? targetSize / maxDimension : 1

    // Provide calculated data
    onModelData({
      center: { x: center.x, y: center.y, z: center.z },
      scale: optimalScale,
      bounds: {
        width: size.x,
        height: size.y,
        depth: size.z,
      },
    })
  }, [scene, onModelData])

  return null // This component doesn't render anything visible
}
