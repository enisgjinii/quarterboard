"use client"

import { useRef, useEffect, useMemo, useCallback } from "react"
import { useGLTF } from "@react-three/drei"
import { useFrame } from "@react-three/fiber"
import * as THREE from "three"

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
  
  // Memoize color for performance
  const materialColor = useMemo(() => new THREE.Color(color), [color])
    // Memoize texture loading
  const texture = useMemo(() => {
    if (!textureUrl) return null
    
    try {
      const loader = new THREE.TextureLoader()
      const loadedTexture = loader.load(
        textureUrl,
        // onLoad callback
        (texture) => {
          console.log('Texture loaded successfully')
        },
        // onProgress callback
        (progress) => {
          console.log('Texture loading progress:', progress)
        },
        // onError callback
        (error) => {
          console.error('Error loading texture:', error)
        }
      )
      
      // Enhanced texture settings for better text rendering
      loadedTexture.wrapS = THREE.RepeatWrapping
      loadedTexture.wrapT = THREE.RepeatWrapping
      loadedTexture.generateMipmaps = true
      loadedTexture.minFilter = THREE.LinearMipmapLinearFilter
      loadedTexture.magFilter = THREE.LinearFilter
      loadedTexture.flipY = false
      loadedTexture.colorSpace = THREE.SRGBColorSpace
      
      return loadedTexture
    } catch (error) {
      console.warn("Failed to load texture:", error)
      return null
    }
  }, [textureUrl])
  // Use callback to prevent unnecessary re-renders
  const setupMaterial = useCallback((child: THREE.Mesh) => {
    if (textureUrl && texture) {
      // Apply texture with enhanced material properties for text
      child.material = new THREE.MeshStandardMaterial({
        map: texture,
        roughness: 0.3,
        metalness: 0.1,
        transparent: true,
        alphaTest: 0.1,
        // Enhance text visibility
        emissiveIntensity: 0.1,
        emissive: new THREE.Color(0x111111),
      })
    } else {
      // Apply color material
      child.material = new THREE.MeshStandardMaterial({
        color: materialColor,
        roughness: 0.4,
        metalness: 0.6,
      })
    }
    
    child.castShadow = true
    child.receiveShadow = true
  }, [textureUrl, texture, materialColor])
  useEffect(() => {
    if (!scene || !meshRef.current) return

    let isMounted = true

    try {
      // Calculate bounding box and center the model
      const box = new THREE.Box3().setFromObject(scene)
      const center = box.getCenter(new THREE.Vector3())
      const size = box.getSize(new THREE.Vector3())
      const maxDimension = Math.max(size.x, size.y, size.z)
      const scale = maxDimension > 0 ? 2 / maxDimension : 1

      if (!isMounted) return

      // Apply transformations
      meshRef.current.scale.setScalar(scale)
      meshRef.current.position.set(-center.x * scale, -center.y * scale, -center.z * scale)

      // Apply materials to all meshes with better material management
      let materialApplied = false
      scene.traverse((child) => {
        if (child instanceof THREE.Mesh && isMounted) {
          // Dispose of old material to prevent memory leaks
          if (child.material && child.material !== scene.userData.originalMaterial) {
            if (Array.isArray(child.material)) {
              child.material.forEach(mat => mat.dispose?.())
            } else {
              child.material.dispose?.()
            }
          }
          
          setupMaterial(child)
          materialApplied = true
          
          // Store reference to original material if needed
          if (!scene.userData.originalMaterialsStored) {
            scene.userData.originalMaterial = child.material.clone()
          }
        }
      })
      
      scene.userData.originalMaterialsStored = true

      if (isMounted && materialApplied) {
        onModelLoaded?.(true)
      }

    } catch (error) {
      console.error('Error processing model:', error)
      if (isMounted) {
        onModelLoaded?.(false)
      }
    }

    return () => {
      isMounted = false
    }
  }, [scene, setupMaterial, onModelLoaded])

  // Optimized animation with reduced frequency
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.1) * 0.05
    }
  })

  // Show fallback if scene is not available
  if (!scene) {
    return (
      <mesh>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={materialColor} roughness={0.4} metalness={0.6} />
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

// Preload the default model for better performance
useGLTF.preload("/models/quarterboard.glb")