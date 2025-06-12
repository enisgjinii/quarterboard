"use client"

import { useRef, useEffect, useMemo, useState, useCallback } from "react"
import { useGLTF, OrbitControls, Center, Text3D, Text } from "@react-three/drei"
import { useFrame, useThree } from "@react-three/fiber"
import * as THREE from "three"
import { GLTFLoader, GLTF } from "three/examples/jsm/loaders/GLTFLoader"
import { CSG } from 'three-csg-ts'

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
  textPosition = { x: 0, y: 0.5, z: 0 },
  textRotation = { x: 0, y: 0, z: 0 },
  textScale = { x: 1.2, y: 1.2, z: 1.2 },
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
        
        // Scale model to fit an extremely small size
        const size = box.getSize(new THREE.Vector3())
        const maxSize = Math.max(size.x, size.y, size.z)
        const targetSize = 0.3 // Drastically reduced from 0.8 to 0.3
        if (maxSize > 0) {
          const scale = targetSize / maxSize
          newScene.scale.setScalar(scale)
        }
        
        // Re-center after scaling
        const newBox = new THREE.Box3().setFromObject(newScene)
        const newCenter = newBox.getCenter(new THREE.Vector3())
        newScene.position.sub(newCenter)
        
        setIsLoading(false)
        onModelLoad?.(newScene)
      })
    }
  }, [modelPath, onModelLoad])

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

  // Calculate position for text to be on top of the model
  const calculateTextOnModelPosition = useCallback(() => {
    if (!modelBounds) return { x: 0, y: 0, z: 0 };
    const center = modelBounds.getCenter(new THREE.Vector3());
    const box = modelBounds;
    // Place text at center X/Z, and at the top Y of the model
    let y = box.max.y;
    // If engraving, move slightly into the model, else sit just above
    y += isEngraving ? -((text3DOptions.height || 0.02) / 2) : 0.005; // Reduced height and offset
    return {
      x: center.x,
      y,
      z: center.z
    };
  }, [modelBounds, isEngraving, text3DOptions.height]);

  // Update camera position based on model bounds
  useEffect(() => {
    if (modelBounds && camera) {
      const center = modelBounds.getCenter(new THREE.Vector3())
      const size = modelBounds.getSize(new THREE.Vector3())
      const maxDimension = Math.max(size.x, size.y, size.z)
      
      // Position camera much closer to the tiny model
      const viewportAspect = viewport.width / viewport.height
      const distance = maxDimension * (viewportAspect > 1 ? 0.8 : 1) // Significantly reduced distance
      
      camera.position.set(center.x, center.y, center.z + distance)
      camera.lookAt(center)
      
      // Update camera's near and far planes
      camera.near = 0.1
      camera.far = distance * 2 // Reduced far plane
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
    
    scene.traverse((child) => {
      if (child instanceof THREE.Mesh && child.name === 'text3D') {
        // Create a copy of the original model geometry
        const modelGeometry = originalModelGeometry.clone();
        const modelMesh = new THREE.Mesh(modelGeometry, new THREE.MeshStandardMaterial());
        
        // Get the text geometry
        const textGeometry = child.geometry.clone();
        const textMesh = new THREE.Mesh(textGeometry, new THREE.MeshStandardMaterial());
        
        // Position the text mesh for engraving
        textMesh.position.copy(child.position);
        textMesh.rotation.copy(child.rotation);
        textMesh.scale.copy(child.scale);
        
        // Perform CSG subtraction
        try {
          const result = CSG.subtract(modelMesh, textMesh);
          
          // Update the model's geometry with the engraved result
          if (result.geometry) {
            child.geometry.dispose(); // Clean up old geometry
            child.geometry = result.geometry;
            
            // Apply engraved material
            child.material = new THREE.MeshStandardMaterial({
              color: materialColor.clone().multiplyScalar(0.4),
              metalness: 0.9,
              roughness: 0.1,
              transparent: true,
              opacity: 0.8
            });
          }
        } catch (error) {
          console.error('CSG operation failed:', error);
        }
      }
    });
  }, [scene, text3D, isEngraving, engraveDepth, materialColor, originalModelGeometry]);

  // Animation loop
  useFrame(() => {
    if (groupRef.current && isPreviewMode) {
      groupRef.current.rotation.y += 0.005
    }
  })

  if (isLoading) {
    return null
  }

  // Use new logic for text position
  const textOnModelPos = calculateTextOnModelPosition();
  const centerPos = calculateCenterPosition();

  return (
    <>      {/* Main scene */}
      <Center>
        <group ref={groupRef}>
          <primitive 
            object={scene} 
            position={[0, 0, 0]}
            rotation={[0, 0, 0]}
          />
            {/* 3D Text Geometry - Positioned relative to model center */}
          {text3D && (
            <Text3D
              font="/fonts/helvetiker_regular.typeface.json"
              position={[textOnModelPos.x, textOnModelPos.y, textOnModelPos.z]}
              rotation={[0, 0, 0]}
              scale={[textScale.x * 0.2, textScale.y * 0.2, textScale.z * 0.2]} // Drastically reduced text scale
              size={text3DOptions.size || 0.02} // Much smaller default size
              height={text3DOptions.height || 0.005} // Much smaller default height
              curveSegments={text3DOptions.curveSegments || 8}
              bevelEnabled={text3DOptions.bevelEnabled ?? true}
              bevelThickness={text3DOptions.bevelThickness || 0.0005} // Tiny bevel
              bevelSize={text3DOptions.bevelSize || 0.0002} // Tiny bevel size
              bevelOffset={text3DOptions.bevelOffset || 0}
              bevelSegments={text3DOptions.bevelSegments || 2}
            >
              {text3D}
              <meshStandardMaterial 
                color={textColor}
                emissive={textMaterial === 'emissive' ? textColor : undefined}
                emissiveIntensity={textMaterial === 'emissive' ? 0.2 : undefined}
                metalness={textMaterial === 'engraved' ? 0.6 : 0.1}
                roughness={textMaterial === 'engraved' ? 0.3 : 0.4}
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
      <ambientLight intensity={0.7} />
      <directionalLight 
        ref={directionalLightRef}
        position={[5, 5, 3]}
        intensity={0.8}
        castShadow
      />
      <pointLight position={[-5, -5, -3]} intensity={0.2} />

      {/* Controls */}
      <OrbitControls
        makeDefault
        enableDamping
        dampingFactor={0.05}
        target={[0, 0, 0]}
        minDistance={0.5}
        maxDistance={10}
        maxPolarAngle={Math.PI / 2}
      />

      {/* Environment helpers */}
      <gridHelper args={[5, 5]} />
    </>
  )
}

// Preload the default model for better performance
useGLTF.preload("/models/quarterboard.glb")
