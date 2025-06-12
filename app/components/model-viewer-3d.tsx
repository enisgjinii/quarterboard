"use client"

import { useRef, useEffect, useMemo, useState } from "react"
import { useGLTF, OrbitControls, Center } from "@react-three/drei"
import { useFrame, useThree } from "@react-three/fiber"
import * as THREE from "three"

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

  // Calculate model bounds and center it
  useEffect(() => {
    if (scene) {
      console.log('Model loaded:', scene)

      // 1. Gather all meshes and compute a combined bounding box
      let combinedBox = new THREE.Box3();
      let meshCount = 0;
      scene.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.geometry.computeBoundingBox();
          const meshBox = child.geometry.boundingBox.clone();
          meshBox.applyMatrix4(child.matrixWorld);
          combinedBox.union(meshBox);
          meshCount++;
        }
      });
      if (meshCount === 0) return; // No visible meshes

      // 2. Center the group based on the combined bounding box
      const center = combinedBox.getCenter(new THREE.Vector3());
      const size = combinedBox.getSize(new THREE.Vector3());
      console.log('Combined bounds:', { center, size });

      // 3. Reset transforms
      scene.position.set(0, 0, 0);
      scene.rotation.set(0, 0, 0);
      scene.scale.set(1, 1, 1);

      // 4. Move the scene so the center is at the origin and ground it
      scene.position.x = -center.x;
      scene.position.y = -combinedBox.min.y;
      scene.position.z = -center.z;

      // 5. Scale to fit the grid
      const maxSize = Math.max(size.x, size.y, size.z);
      const targetSize = 2.0;
      let modelScale = 1.0;
      if (maxSize > 0) {
        modelScale = targetSize / maxSize;
        scene.scale.setScalar(modelScale);
      }

      // 6. Force update
      scene.updateMatrix();
      scene.updateMatrixWorld(true);

      console.log('Final position:', scene.position);
      setIsLoading(false);
      onModelLoad?.(scene);
    }
  }, [scene, onModelLoad])

  // Update camera position for better view
  useEffect(() => {
    if (camera) {
      camera.position.set(0, 2, 6)
      camera.lookAt(0, 0, 0)
      camera.updateProjectionMatrix()
    }
  }, [camera])

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
              // Set BORDERS_curve_.006 to gold color
              if (child.name === 'BORDERS_curve_.006') {
                m.color.set('#FFD700') // Gold color
                m.metalness = 0.8
                m.roughness = 0.2
              } else {
                m.color = materialColor
              }
              m.needsUpdate = true
            }
          })
        } else if (material instanceof THREE.MeshStandardMaterial) {
          // Set BORDERS_curve_.006 to gold color
          if (child.name === 'BORDERS_curve_.006') {
            material.color.set('#FFD700') // Gold color
            material.metalness = 0.8
            material.roughness = 0.2
          } else {
            material.color = materialColor
          }
          material.needsUpdate = true
        }
      }
    })
  }, [scene, materialColor])

  // Extract mesh information
  useEffect(() => {
    if (!scene) return;
    
    const meshInfo: any[] = []
    scene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        const geometry = child.geometry
        meshInfo.push({
          name: child.name,
          vertices: geometry.attributes.position.count,
          faces: geometry.index ? geometry.index.count / 3 : 0,
          materials: Array.isArray(child.material) 
            ? child.material.map((m, i) => `${child.name}_${i}`)
            : [`${child.name}_0`],
          uvSets: geometry.attributes.uv ? ['UV0'] : []
        })
      }
    })
    
    console.log('Extracted mesh information:', meshInfo)
  }, [scene])

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
            <mesh
              position={[textPosition.x, textPosition.y, textPosition.z]}
              rotation={[textRotation.x, textRotation.y, textRotation.z]}
              scale={[textScale.x, textScale.y, textScale.z]}
              name="text3D"
            >
              <boxGeometry args={[Math.max(text3D.length * 0.1, 0.3), 0.15, 0.03]} />
              <meshStandardMaterial 
                color={textColor}
                {...(textMaterial === 'emissive' && { 
                  emissive: textColor, 
                  emissiveIntensity: 0.3 
                })}
                {...(textMaterial === 'engraved' && { 
                  metalness: 0.8, 
                  roughness: 0.2,
                  color: new THREE.Color(textColor).multiplyScalar(0.6)
                })}
              />
            </mesh>
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
