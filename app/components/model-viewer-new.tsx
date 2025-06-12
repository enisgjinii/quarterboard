"use client"

import { useRef, useEffect, useMemo, useState } from "react"
import { useGLTF, OrbitControls, Center, Html } from "@react-three/drei"
import { useFrame, useThree } from "@react-three/fiber"
import * as THREE from "three"

// Create a canvas texture with text
const createTextTexture = (
  text: string, 
  options: {
    fontSize?: number,
    fontFamily?: string,
    textColor?: string,
    backgroundColor?: string,
    width?: number,
    height?: number,
    padding?: number
  } = {}
): THREE.CanvasTexture => {
  const {
    fontSize = 64,
    fontFamily = 'Arial, sans-serif',
    textColor = '#ffffff',
    backgroundColor = 'transparent',
    width = 512,
    height = 512,
    padding = 20
  } = options

  // Create canvas
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext('2d')!

  // Clear canvas first
  context.clearRect(0, 0, width, height)

  // Set background if not transparent
  if (backgroundColor !== 'transparent') {
    context.fillStyle = backgroundColor
    context.fillRect(0, 0, width, height)
  }

  // Set text properties
  context.fillStyle = textColor
  context.font = `bold ${fontSize}px ${fontFamily}`
  context.textAlign = 'center'
  context.textBaseline = 'middle'

  // Add text stroke for better visibility
  context.strokeStyle = textColor === '#ffffff' ? '#000000' : '#ffffff'
  context.lineWidth = 3

  // Handle line wrapping
  const words = text.split(' ')
  const lines: string[] = []
  let currentLine = ''
  const maxWidth = width - (padding * 2)

  for (const word of words) {
    const testLine = currentLine + (currentLine ? ' ' : '') + word
    const metrics = context.measureText(testLine)
    
    if (metrics.width > maxWidth && currentLine) {
      lines.push(currentLine)
      currentLine = word
    } else {
      currentLine = testLine
    }
  }
  if (currentLine) {
    lines.push(currentLine)
  }

  // Draw text lines with stroke and fill
  const lineHeight = fontSize * 1.2
  const totalHeight = lines.length * lineHeight
  const startY = (height - totalHeight) / 2 + fontSize / 2

  lines.forEach((line, index) => {
    const y = startY + (index * lineHeight)
    // Draw stroke first for outline effect
    context.strokeText(line, width / 2, y)
    // Then draw fill
    context.fillText(line, width / 2, y)
  })

  // Create and return texture
  const texture = new THREE.CanvasTexture(canvas)
  texture.needsUpdate = true
  return texture
}

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
  // New props for direct material text application
  materialText?: string
  materialTextOptions?: {
    fontSize?: number
    fontFamily?: string
    textColor?: string
    backgroundColor?: string
    width?: number
    height?: number
    padding?: number
  }
  targetMeshName?: string | null // Specific mesh to apply text to, if null applies to all meshes
  textureRepeat?: { u: number; v: number } // How many times to repeat the texture
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
  materialText = "",
  materialTextOptions = {},
  targetMeshName = null,
  textureRepeat = { u: 1, v: 1 }
}: ModelViewerProps) {
  const groupRef = useRef<THREE.Group>(null)
  const directionalLightRef = useRef<THREE.DirectionalLight>(null)
  const textPlaneRef = useRef<THREE.Mesh>(null)
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

  // Create positioned text plane for material text
  useEffect(() => {
    if (!scene || !materialText) {
      // Remove existing text plane if materialText is empty
      const existingTextPlane = scene.getObjectByName('materialTextPlane')
      if (existingTextPlane) {
        scene.remove(existingTextPlane)
        if (existingTextPlane instanceof THREE.Mesh) {
          if (existingTextPlane.material instanceof THREE.Material) {
            existingTextPlane.material.dispose()
          }
          existingTextPlane.geometry.dispose()
        }
      }
      return;
    }

    console.log('Creating positioned text plane:', materialText)

    // Remove any existing text plane
    const existingTextPlane = scene.getObjectByName('materialTextPlane')
    if (existingTextPlane) {
      scene.remove(existingTextPlane)
      if (existingTextPlane instanceof THREE.Mesh) {
        if (existingTextPlane.material instanceof THREE.Material) {
          existingTextPlane.material.dispose()
        }
        existingTextPlane.geometry.dispose()
      }
    }

    // Create text texture
    const textTexture = createTextTexture(materialText, {
      ...materialTextOptions,
      backgroundColor: 'transparent'
    })

    // Create a plane geometry for the text
    const planeWidth = 2
    const planeHeight = 1
    const planeGeometry = new THREE.PlaneGeometry(planeWidth, planeHeight)
    const planeMaterial = new THREE.MeshBasicMaterial({
      map: textTexture,
      transparent: true,
      alphaTest: 0.1,
      side: THREE.DoubleSide,
      depthWrite: false // Prevents z-fighting
    })

    const textPlane = new THREE.Mesh(planeGeometry, planeMaterial)
    textPlane.name = 'materialTextPlane'
    
    // Position the text plane based on textPosition
    textPlane.position.set(textPosition.x, textPosition.y, textPosition.z)
    
    // Store reference for animation
    textPlaneRef.current = textPlane
    
    scene.add(textPlane)
    
    console.log('Text plane created and positioned at:', textPosition)

    // Cleanup function
    return () => {
      console.log('Cleaning up text plane')
      const textPlaneToRemove = scene.getObjectByName('materialTextPlane')
      if (textPlaneToRemove) {
        scene.remove(textPlaneToRemove)
        if (textPlaneToRemove instanceof THREE.Mesh) {
          if (textPlaneToRemove.material instanceof THREE.Material) {
            textPlaneToRemove.material.dispose()
          }
          textPlaneToRemove.geometry.dispose()
        }
      }
      textPlaneRef.current = null
    }
  }, [scene, materialText, materialTextOptions, textPosition])

  // Animation loop
  useFrame(() => {
    if (groupRef.current && isPreviewMode) {
      groupRef.current.rotation.y += 0.005
    }
    
    // Make text plane always face camera
    if (textPlaneRef.current && camera) {
      textPlaneRef.current.lookAt(camera.position)
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
