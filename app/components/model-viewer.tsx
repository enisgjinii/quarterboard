"use client"

import { useRef, useEffect, useState } from "react"
import { useGLTF, OrbitControls, Center, Text3D, Grid } from "@react-three/drei"
import { useFrame, useThree } from "@react-three/fiber"
import * as THREE from "three"
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js"
import type { GLTF } from "three/examples/jsm/loaders/GLTFLoader.js"

interface ModelViewerProps {
  modelPath: string
  color?: string
  text3D?: string
  textColor?: string
  textPosition?: { x: number; y: number; z: number }
  textScale?: { x: number; y: number; z: number }
}

export function ModelViewer({
  modelPath,
  color = "#ffffff",
  text3D = "",
  textColor = "#ffffff",
  textPosition = { x: 0, y: 0.5, z: 0 },
  textScale = { x: 1.2, y: 1.2, z: 1.2 }
}: ModelViewerProps) {
  const groupRef = useRef<THREE.Group>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [modelBounds, setModelBounds] = useState<THREE.Box3 | null>(null)
  const { scene } = useGLTF(modelPath)
  const { camera, viewport } = useThree()

  // Calculate optimal grid size based on model bounds
  const calculateGridSize = (bounds: THREE.Box3) => {
    const size = bounds.getSize(new THREE.Vector3())
    const maxDimension = Math.max(size.x, size.y, size.z)
    // Grid size should be at least 2x the model's largest dimension
    return Math.ceil(maxDimension * 2)
  }

  // Calculate optimal camera position
  const calculateCameraPosition = (bounds: THREE.Box3) => {
    const center = bounds.getCenter(new THREE.Vector3())
    const size = bounds.getSize(new THREE.Vector3())
    const maxDimension = Math.max(size.x, size.y, size.z)
    
    // Calculate distance based on model size and viewport aspect ratio
    const aspectRatio = viewport.width / viewport.height
    const fov = 75 // Default camera FOV
    const distance = maxDimension / (2 * Math.tan((fov * Math.PI / 180) / 2))
    
    // Adjust distance based on aspect ratio
    const adjustedDistance = distance * (aspectRatio > 1 ? 1.5 : 2)
    
    return {
      position: new THREE.Vector3(
        center.x + adjustedDistance * 0.7,
        center.y + adjustedDistance * 0.5,
        center.z + adjustedDistance
      ),
      target: center
    }
  }

  // Load model
  useEffect(() => {
    if (modelPath) {
      setIsLoading(true)
      const loader = new GLTFLoader()
      loader.load(modelPath, (gltf: GLTF) => {
        const newScene = gltf.scene
        
        // Calculate bounding box
        const box = new THREE.Box3().setFromObject(newScene)
        setModelBounds(box)
        
        // Center the model horizontally
        const center = box.getCenter(new THREE.Vector3())
        newScene.position.x = -center.x
        newScene.position.z = -center.z
        
        // Place model on the ground
        const size = box.getSize(new THREE.Vector3())
        newScene.position.y = -box.min.y
        
        // Scale model to fit a reasonable size
        const maxSize = Math.max(size.x, size.y, size.z)
        const targetSize = 2.0
        if (maxSize > 0) {
          const scale = targetSize / maxSize
          newScene.scale.setScalar(scale)
        }
        
        // Ensure model is upright
        newScene.rotation.set(0, 0, 0)
        
        setIsLoading(false)
      })
    }
  }, [modelPath])

  // Update camera position based on model bounds
  useEffect(() => {
    if (modelBounds && camera) {
      const { position, target } = calculateCameraPosition(modelBounds)
      camera.position.copy(position)
      camera.lookAt(target)
      camera.near = 0.1
      camera.far = position.length() * 3
      camera.updateProjectionMatrix()
    }
  }, [modelBounds, camera, viewport])

  // Apply color to model
  useEffect(() => {
    if (!scene) return;
    
    const materialColor = new THREE.Color(color)
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
  }, [scene, color])

  if (isLoading) {
    return null
  }

  return (
    <>
      <Center>
        <group ref={groupRef}>
          <primitive 
            object={scene} 
            position={[0, 0, 0]}
            rotation={[0, 0, 0]}
          />
          {text3D && (
            <Text3D
              font="/fonts/helvetiker_regular.typeface.json"
              position={[textPosition.x, textPosition.y, textPosition.z]}
              rotation={[0, 0, 0]}
              scale={[textScale.x * 0.1, textScale.y * 0.1, textScale.z * 0.1]}
              size={0.1}
              height={0.02}
              curveSegments={8}
              bevelEnabled={true}
              bevelThickness={0.002}
              bevelSize={0.001}
              bevelOffset={0}
              bevelSegments={2}
            >
              {text3D}
              <meshStandardMaterial color={textColor} />
            </Text3D>
          )}
        </group>
      </Center>

      {/* Grid with dynamic size */}
      {modelBounds && (
        <Grid
          args={[calculateGridSize(modelBounds), calculateGridSize(modelBounds)]}
          position={[0, 0, 0]}
          cellSize={0.5}
          cellThickness={0.5}
          cellColor="#6f6f6f"
          sectionSize={1}
          sectionThickness={1}
          sectionColor="#9d4b4b"
          fadeDistance={30}
          fadeStrength={1}
          followCamera={false}
          infiniteGrid={true}
        />
      )}

      <ambientLight intensity={0.7} />
      <directionalLight 
        position={[5, 5, 3]}
        intensity={0.8}
        castShadow
      />
      <pointLight position={[-5, -5, -3]} intensity={0.2} />

      <OrbitControls
        makeDefault
        enableDamping
        dampingFactor={0.05}
        target={[0, 0, 0]}
        minDistance={1}
        maxDistance={20}
        maxPolarAngle={Math.PI / 2} // Limit rotation to prevent viewing from below
      />
    </>
  )
}

// Preload the default model
useGLTF.preload("/models/quarterboard_2.glb")
