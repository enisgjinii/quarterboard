"use client"

import { useRef, useEffect, useMemo, useState, useCallback } from "react"
import { useGLTF, OrbitControls, Center, Text3D, Text } from "@react-three/drei"
import { useFrame, useThree } from "@react-three/fiber"
import * as THREE from "three"
import { GLTFLoader, GLTF } from "three/examples/jsm/loaders/GLTFLoader"

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
  textRotation?: { x: number; y: number; z: number }
  textScale?: { x: number; y: number; z: number }
  // 3D text specific props
  text3D?: string
  text3DOptions?: {
    size?: number
    height?: number
    curveSegments?: number
    bevelEnabled?: boolean
    bevelThickness?: number
    bevelSize?: number
    bevelOffset?: number
    bevelSegments?: number
  }
  textMaterial?: 'standard' | 'emissive' | 'engraved'
  engraveDepth?: number
  isEngraving?: boolean
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
  textPosition = { x: 0, y: 1, z: 0 },
  textRotation = { x: 0, y: 0, z: 0 },
  textScale = { x: 1, y: 1, z: 1 },
  text3D = "",
  text3DOptions = {},
  textMaterial = 'standard',
  engraveDepth = 0.02,
  isEngraving = false
}: ModelViewerProps) {
  const groupRef = useRef<THREE.Group>(null)
  const directionalLightRef = useRef<THREE.DirectionalLight>(null)
  const text3DRef = useRef<THREE.Mesh>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [modelBounds, setModelBounds] = useState<THREE.Box3 | null>(null)
  const [originalModelGeometry, setOriginalModelGeometry] = useState<THREE.BufferGeometry | null>(null)
  const { scene } = useGLTF(modelPath)
  const { camera } = useThree()
  const viewport = useThree((state) => state.viewport)

  // Load model
  useEffect(() => {
    if (modelPath) {
      setIsLoading(true)
      const loader = new GLTFLoader()
      loader.load(modelPath, (gltf: GLTF) => {
        const newScene = gltf.scene
        
        // Store original geometry for engraving operations
        newScene.traverse((child: THREE.Object3D) => {
          if (child instanceof THREE.Mesh && !originalModelGeometry) {
            setOriginalModelGeometry(child.geometry.clone())
          }
        })
        
        // Calculate bounding box
        const box = new THREE.Box3().setFromObject(newScene)
        setModelBounds(box)
        
        // Center the model
        const center = box.getCenter(new THREE.Vector3())
        newScene.position.sub(center)
        
        // Scale model to fit better in view
        const size = box.getSize(new THREE.Vector3())
        const maxSize = Math.max(size.x, size.y, size.z)
        const targetSize = Math.min(viewport.width, viewport.height) * 0.8 // 80% of viewport
        if (maxSize > 0) {
          const scale = targetSize / maxSize
          newScene.scale.multiplyScalar(scale)
        }
        
        setIsLoading(false)
        onModelLoad?.(newScene)
      })
    }
  }, [modelPath, onModelLoad, viewport])

  // Calculate center position based on viewport and model bounds
  const calculateCenterPosition = useCallback(() => {
    if (!modelBounds) return { x: 0, y: 0, z: 0.2 }
    
    const center = modelBounds.getCenter(new THREE.Vector3())
    const size = modelBounds.getSize(new THREE.Vector3())
    const maxDimension = Math.max(size.x, size.y, size.z)
    
    // Calculate offset based on viewport size and model dimensions
    const viewportAspect = viewport.width / viewport.height
    const zOffset = maxDimension * (viewportAspect > 1 ? 0.15 : 0.25) // Adjust offset based on aspect ratio
    
    return {
      x: center.x,
      y: center.y + (size.y * 0.1), // Slightly above center
      z: center.z + zOffset
    }
  }, [modelBounds, viewport])

  // Update camera position based on model bounds
  useEffect(() => {
    if (modelBounds && camera) {
      const center = modelBounds.getCenter(new THREE.Vector3())
      const size = modelBounds.getSize(new THREE.Vector3())
      const maxDimension = Math.max(size.x, size.y, size.z)
      
      // Position camera based on model size and viewport
      const viewportAspect = viewport.width / viewport.height
      const distance = maxDimension * (viewportAspect > 1 ? 2.5 : 3.5) // Adjust distance based on aspect ratio
      
      camera.position.set(center.x, center.y, center.z + distance)
      camera.lookAt(center)
      
      // Update camera's near and far planes
      camera.near = 0.1
      camera.far = distance * 4
      camera.updateProjectionMatrix()
    }
  }, [modelBounds, camera, viewport])

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
      if (child instanceof THREE.Mesh && child.name !== 'text3D') {
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

  // Create 3D text material
  const text3DMaterial = useMemo(() => {
    const baseColor = new THREE.Color(textColor)
    
    switch (textMaterial) {
      case 'emissive':
        return new THREE.MeshStandardMaterial({
          color: baseColor,
          emissive: baseColor,
          emissiveIntensity: 0.3,
          metalness: 0.1,
          roughness: 0.3
        })
      case 'engraved':
        return new THREE.MeshStandardMaterial({
          color: baseColor.multiplyScalar(0.6), // Darker for engraved effect
          metalness: 0.8,
          roughness: 0.2
        })
      default:
        return new THREE.MeshStandardMaterial({
          color: baseColor,
          metalness: 0.1,
          roughness: 0.3
        })
    }
  }, [textColor, textMaterial])

  // Engraving effect using CSG (Constructive Solid Geometry)
  useEffect(() => {
    if (!scene || !text3D || !isEngraving || !originalModelGeometry) return;

    console.log('Applying engraving effect...')
    
    // This is a simplified approach - in a real implementation you'd use a CSG library
    // For now, we'll simulate engraving by adjusting the text position and material
    scene.traverse((child) => {
      if (child instanceof THREE.Mesh && child.name === 'text3D') {
        // Move text slightly into the model surface
        child.position.z -= engraveDepth
        
        // Apply engraved material
        child.material = new THREE.MeshStandardMaterial({
          color: materialColor.clone().multiplyScalar(0.4),
          metalness: 0.9,
          roughness: 0.1,
          transparent: true,
          opacity: 0.8
        })
      }
    })
  }, [scene, text3D, isEngraving, engraveDepth, materialColor, originalModelGeometry])

  // Animation loop
  useFrame(() => {
    if (groupRef.current && isPreviewMode) {
      groupRef.current.rotation.y += 0.005
    }
  })

  if (isLoading) {
    return null
  }

  const centerPos = calculateCenterPosition()

  return (
    <>      {/* Main scene */}
      <Center>
        <group ref={groupRef}>
          <primitive 
            object={scene} 
            scale={[1, 1, 1]}
            position={[0, 0, 0]}
            rotation={[0, 0, 0]}
          />
            {/* 3D Text Geometry - Positioned relative to model center */}
          {text3D && (
            <Text3D
              font="/fonts/helvetiker_regular.typeface.json"
              position={[centerPos.x, centerPos.y, centerPos.z]}
              rotation={[0, 0, 0]}
              scale={[1, 1, 1]}
              size={text3DOptions.size || 0.15}
              height={text3DOptions.height || 0.03}
              curveSegments={text3DOptions.curveSegments || 12}
              bevelEnabled={text3DOptions.bevelEnabled ?? true}
              bevelThickness={text3DOptions.bevelThickness || 0.005}
              bevelSize={text3DOptions.bevelSize || 0.002}
              bevelOffset={text3DOptions.bevelOffset || 0}
              bevelSegments={text3DOptions.bevelSegments || 3}
            >
              {text3D}
              <meshStandardMaterial 
                color={textColor}
                emissive={textMaterial === 'emissive' ? textColor : undefined}
                emissiveIntensity={textMaterial === 'emissive' ? 0.3 : undefined}
                metalness={textMaterial === 'engraved' ? 0.8 : 0.1}
                roughness={textMaterial === 'engraved' ? 0.2 : 0.3}
              />
            </Text3D>
          )}
          {overlayText && (
            <Text
              position={[centerPos.x, centerPos.y, centerPos.z]}
              rotation={[0, 0, 0]}
              scale={[1, 1, 1]}
              fontSize={fontSize}
              color={textColor}
              anchorX="center"
              anchorY="middle"
            >
              {overlayText}
            </Text>
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
