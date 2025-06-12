"use client"

import { useRef, useEffect, useMemo, useState } from "react"
import { useGLTF, OrbitControls, Center, Html } from "@react-three/drei"
import { useFrame, useThree } from "@react-three/fiber"
import * as THREE from "three"

// Text overlay component
const TextOverlay = ({ text, color, size }: { text: string; color: string; size: number }) => {
  const textRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (textRef.current) {
      textRef.current.style.color = color
      textRef.current.style.fontSize = `${size * 16}px`
    }
  }, [color, size])

  return (
    <div 
      ref={textRef}
      className="text-overlay-3d"
    >
      {text}
    </div>
  )
}

interface ModelViewerProps {
  modelPath: string
  color?: string
  onModelLoad?: (info: any) => void
  selectedMaterial?: string | null
  materialPreview?: string | null
  isPreviewMode?: boolean
  overlayText?: string
  textColor?: string
  fontSize?: number
  textPosition?: { x: number; y: number; z: number }
}

export function ModelViewer({
  modelPath,
  color,
  onModelLoad,
  selectedMaterial,
  materialPreview,
  isPreviewMode,
  overlayText = "",
  textColor = "#ffffff",
  fontSize = 1,
  textPosition = { x: 0, y: 1, z: 0 }
}: ModelViewerProps) {
  const groupRef = useRef<THREE.Group>(null)
  const directionalLightRef = useRef<THREE.DirectionalLight>(null)
  const textRef = useRef<THREE.Mesh>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [modelBounds, setModelBounds] = useState<THREE.Box3 | null>(null)
  const { scene } = useGLTF(modelPath)
  const { camera } = useThree()

  // Calculate model bounds and center it
  useEffect(() => {
    if (scene) {
      console.log('Model loaded:', scene)
      
      // Calculate bounding box
      const box = new THREE.Box3().setFromObject(scene)
      setModelBounds(box)
      
      // Center the model
      const center = box.getCenter(new THREE.Vector3())
      scene.position.sub(center)
      
      // Scale model to fit better in view
      const size = box.getSize(new THREE.Vector3())
      const maxSize = Math.max(size.x, size.y, size.z)
      const targetSize = 3 // Target size in units
      if (maxSize > 0) {
        const scale = targetSize / maxSize
        scene.scale.multiplyScalar(scale)
      }
      
      console.log('Model centered and scaled')
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
    
    // Make text always face camera
    if (textRef.current && camera) {
      textRef.current.lookAt(camera.position)
    }
  })

  if (isLoading) {
    return null
  }

  return (
    <>
      {/* Main scene */}
      <Center>
        <group ref={groupRef}>
          <primitive 
            object={scene} 
            scale={[1, 1, 1]}
            position={[0, 0, 0]}
            rotation={[0, 0, 0]}
          />
          
          {/* 3D Text Overlay */}
          {overlayText && (
            <group position={[textPosition.x, textPosition.y, textPosition.z]}>
              <Html
                center
                distanceFactor={10}
                transform
                sprite
              >
                <TextOverlay 
                  text={overlayText}
                  color={textColor}
                  size={fontSize}
                />
              </Html>
            </group>
          )}
        </group>
      </Center>

      {/* Improved lighting setup */}
      <ambientLight intensity={0.6} />
      <directionalLight 
        ref={directionalLightRef}
        position={[10, 10, 5]} 
        intensity={1.0}
        castShadow
      />
      <pointLight position={[-10, -10, -5]} intensity={0.3} />

      {/* Controls */}
      <OrbitControls
        makeDefault
        enableDamping
        dampingFactor={0.05}
        target={[0, 0, 0]}
        minDistance={1}
        maxDistance={20}
      />

      {/* Environment helpers */}
      <gridHelper args={[10, 10]} />
    </>
  )
}

// Preload the default model for better performance
useGLTF.preload("/models/quarterboard.glb")