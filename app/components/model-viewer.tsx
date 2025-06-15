"use client"

import { useRef, useEffect, useState, useMemo } from "react"
import { useGLTF, OrbitControls, Center, Text3D, Grid, Environment, Html } from "@react-three/drei"
import { useFrame, useThree } from "@react-three/fiber"
import * as THREE from "three"
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js"
import type { GLTF } from "three/examples/jsm/loaders/GLTFLoader.js"
import { FontLoader } from "three/examples/jsm/loaders/FontLoader.js"
import { TTFLoader } from "three/examples/jsm/loaders/TTFLoader.js"
import { TextGeometry } from "three/examples/jsm/geometries/TextGeometry.js"
import { loadFont } from "@/lib/font-converter"

interface ModelViewerProps {
  modelPath: string
  color?: string
  borderColor?: string
  colorMode?: 'solid' | 'textTexture' | 'mixed'
  isPreviewMode?: boolean
  materialText?: string
  materialTextOptions?: {
    fontSize: number
    fontFamily: string
    textColor: string
    backgroundColor: string
    width: number
    height: number
    padding: number
  }
  targetMeshName?: string
  textureRepeat?: {
    u: number
    v: number
  }
  text3D?: string
  textColor?: string
  textPosition?: { x: number; y: number; z: number }
  textRotation?: { x: number; y: number; z: number }
  textScale?: { x: number; y: number; z: number }
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
  selectedFont?: string
  onFontError?: (error: Error) => void
  uvMapTexture?: string
  uvMapText?: string
  uvMapTextOptions?: any
  selectedMaterial?: string | null
  materialPreview?: string | null
  onModelLoad?: (info: any) => void
  overlayText?: string
  fontSize?: number
  isRecording?: boolean
  onRecordingComplete?: (blob: Blob) => void
}

export function ModelViewer({
  modelPath,
  color = "#ffffff",
  borderColor = "#ffffff",
  colorMode = 'solid',
  isPreviewMode = false,
  materialText = "",
  materialTextOptions = {
    fontSize: 1,
    fontFamily: "helvetiker_regular.typeface.json",
    textColor: "#ffffff",
    backgroundColor: "#000000",
    width: 1,
    height: 1,
    padding: 0
  },
  targetMeshName = "",
  textureRepeat = { u: 1, v: 1 },
  text3D = "",
  textColor = "#ffffff",
  textPosition = { x: 0, y: 0.5, z: 0 },
  textRotation = { x: 0, y: 0, z: 0 },
  textScale = { x: 1.2, y: 1.2, z: 1.2 },
  text3DOptions,
  textMaterial = 'standard',
  engraveDepth = 0.02,
  isEngraving = false,
  selectedFont = "helvetiker_regular.typeface.json",
  onFontError,
  uvMapTexture,
  uvMapText = "",
  uvMapTextOptions,
  selectedMaterial = null,
  materialPreview = null,
  onModelLoad,
  overlayText,
  fontSize,
  isRecording,
  onRecordingComplete
}: ModelViewerProps) {
  const groupRef = useRef<THREE.Group>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isFontLoading, setIsFontLoading] = useState(false)
  const [modelBounds, setModelBounds] = useState<THREE.Box3 | null>(null)
  const { scene: model } = useGLTF(modelPath, true)
  const { camera, scene, gl } = useThree()
  const [textMesh, setTextMesh] = useState<THREE.Mesh | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream | null>(null)
  const controlsRef = useRef<any>(null)

  // Add recording indicator style and badge
  useEffect(() => {
    const canvas = gl.domElement
    const container = canvas.parentElement
    
    if (isRecording) {
      // Enhanced border effect
      canvas.style.border = '2px solid #ef4444'
      canvas.style.borderRadius = '4px'
      canvas.style.transition = 'border 0.2s ease-in-out'
      canvas.style.boxShadow = '0 0 10px rgba(239, 68, 68, 0.3)'

      // Add recording badge
      const badge = document.createElement('div')
      badge.id = 'recording-badge'
      badge.style.cssText = `
        position: absolute;
        top: 12px;
        right: 12px;
        background-color: #ef4444;
        color: white;
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 12px;
        font-weight: 500;
        display: flex;
        align-items: center;
        gap: 4px;
        z-index: 1000;
        animation: pulse 2s infinite;
      `
      
      // Add recording dot
      const dot = document.createElement('div')
      dot.style.cssText = `
        width: 8px;
        height: 8px;
        background-color: white;
        border-radius: 50%;
        animation: blink 1s infinite;
      `
      
      badge.appendChild(dot)
      badge.appendChild(document.createTextNode('REC'))
      container?.appendChild(badge)

      // Add keyframes for animations
      const style = document.createElement('style')
      style.textContent = `
        @keyframes pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.05); }
          100% { transform: scale(1); }
        }
        @keyframes blink {
          0% { opacity: 1; }
          50% { opacity: 0.3; }
          100% { opacity: 1; }
        }
      `
      document.head.appendChild(style)
    } else {
      // Remove recording styles
      canvas.style.border = 'none'
      canvas.style.boxShadow = 'none'
      
      // Remove recording badge
      const badge = document.getElementById('recording-badge')
      badge?.remove()
    }

    // Cleanup
    return () => {
      canvas.style.border = 'none'
      canvas.style.boxShadow = 'none'
      const badge = document.getElementById('recording-badge')
      badge?.remove()
    }
  }, [isRecording, gl])

  // Auto-rotation during recording
  useFrame((state, delta) => {
    if (isRecording && controlsRef.current) {
      // Rotate the camera around the scene
      controlsRef.current.autoRotate = true
      controlsRef.current.autoRotateSpeed = 2.0 // Adjust speed as needed
    } else if (controlsRef.current) {
      controlsRef.current.autoRotate = false
    }
  })

  // Calculate optimal grid size based on model bounds
  const calculateGridSize = (bounds: THREE.Box3 | null) => {
    if (!bounds) return 10
    const size = bounds.getSize(new THREE.Vector3())
    const maxDimension = Math.max(size.x, size.y, size.z)
    return Math.ceil(maxDimension * 2)
  }

  // Re-center and resize the camera when the model changes
  useEffect(() => {
    if (model) {
      const box = new THREE.Box3().setFromObject(model)
      setModelBounds(box)
      
      const size = box.getSize(new THREE.Vector3())
      const center = box.getCenter(new THREE.Vector3())
      
      // Center the model at origin
      model.position.sub(center)
      
      // Update camera position
      const maxDim = Math.max(size.x, size.y, size.z)
      if (camera instanceof THREE.PerspectiveCamera) {
        const fov = camera.fov * (Math.PI / 180)
        const cameraZ = Math.abs(maxDim / Math.tan(fov / 2)) * 2
        camera.position.set(maxDim, maxDim * 0.8, maxDim * 1.5)
        camera.lookAt(0, 0, 0)
        camera.updateProjectionMatrix()
      }
    }
  }, [model, camera])

  // Handle model loading
  useEffect(() => {
    if (model) {
      setIsLoading(false)
      if (onModelLoad) {
        onModelLoad({
          model,
          bounds: modelBounds
        })
      }
    }
  }, [model, modelBounds, onModelLoad])

  // Handle UV texture updates
  useEffect(() => {
    if (uvMapTexture && model) {
      const textureLoader = new THREE.TextureLoader()
      textureLoader.load(uvMapTexture, (texture) => {
        // Configure texture settings
        texture.colorSpace = THREE.SRGBColorSpace
        texture.flipY = false // Important for UV maps
        texture.wrapS = THREE.ClampToEdgeWrapping
        texture.wrapT = THREE.ClampToEdgeWrapping
        texture.needsUpdate = true
        
        model.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            // Create new material with texture
            const material = new THREE.MeshStandardMaterial({
              map: texture,
              metalness: 0.5,
              roughness: 0.5,
              side: THREE.DoubleSide, // Show both sides of the mesh
              transparent: true,
              opacity: 1.0
            })
            
            // Apply material to mesh
            child.material = material
            
            // Ensure UV coordinates are properly set
            if (child.geometry) {
              const uvAttribute = child.geometry.getAttribute('uv')
              if (uvAttribute) {
                // Normalize UV coordinates if needed
                for (let i = 0; i < uvAttribute.count; i++) {
                  const u = uvAttribute.getX(i)
                  const v = uvAttribute.getY(i)
                  uvAttribute.setXY(i, u, 1 - v) // Flip V coordinate if needed
                }
                uvAttribute.needsUpdate = true
              }
            }
          }
        })

        // Force a render update
        if (gl) {
          gl.render(scene, camera)
        }
      }, undefined, (error) => {
        console.error('Error loading texture:', error)
      })
    }
  }, [uvMapTexture, model, scene, camera, gl])

  // Prevent material override when UV texture is present
  useEffect(() => {
    if (model && !uvMapTexture) {
      model.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          if (selectedMaterial && materialPreview) {
            const material = new THREE.MeshStandardMaterial({
              color: materialPreview,
              metalness: 0.5,
              roughness: 0.5
            });
            child.material = material;
          } else {
            const material = new THREE.MeshStandardMaterial({
              color: color,
              metalness: 0.5,
              roughness: 0.5
            });
            child.material = material;
          }
        }
      });
    }
  }, [model, color, selectedMaterial, materialPreview, uvMapTexture]);

  // Clone and prepare the model with materials
  const preparedScene = useMemo(() => {
    const clone = model.clone(true)
    clone.traverse((node) => {
      if (node instanceof THREE.Mesh) {
        // Create new material with proper settings
        const material = new THREE.MeshStandardMaterial({
          color: new THREE.Color(color),
          metalness: 0.5,
          roughness: 0.5,
          side: THREE.DoubleSide
        })

        if (Array.isArray(node.material)) {
          node.material = node.material.map(() => material)
        } else {
          node.material = material
        }

        // Ensure proper UV mapping
        if (node.geometry) {
          const uvAttribute = node.geometry.getAttribute('uv')
          if (uvAttribute) {
            // Normalize UV coordinates if needed
            for (let i = 0; i < uvAttribute.count; i++) {
              const u = uvAttribute.getX(i)
              const v = uvAttribute.getY(i)
              uvAttribute.setXY(i, u, 1 - v) // Flip V coordinate if needed
            }
            uvAttribute.needsUpdate = true
          }
        }
      }
    })
    return clone
  }, [model, color])

  useEffect(() => {
    if (text3D && scene) {
      // Validate selectedFont value
      const fontName = selectedFont || "helvetiker_regular.typeface.json";
      const fontPath = `/fonts/${fontName}`;
      
      console.log(`Loading 3D text with font: ${fontName}`);
      
      // Set loading state
      setIsFontLoading(true);
      
      // Use our custom font loader that handles both .typeface.json and .ttf formats
      loadFont(fontPath)
        .then((font) => {
          setIsFontLoading(false);
          try {
            console.log('Creating TextGeometry with options:', {
              size: text3DOptions?.size || 0.2,
              height: text3DOptions?.height || 0.05,
              curveSegments: text3DOptions?.curveSegments || 12,
              bevelEnabled: Boolean(text3DOptions?.bevelEnabled !== false), // Ensure it's a boolean
              bevelThickness: text3DOptions?.bevelThickness || 0.03,
              bevelSize: text3DOptions?.bevelSize || 0.02,
              bevelOffset: text3DOptions?.bevelOffset || 0,
              bevelSegments: text3DOptions?.bevelSegments || 5
            });
            
            const geometry = new TextGeometry(text3D, {
              font,
              size: text3DOptions?.size || 0.2,
              depth: text3DOptions?.height || 0.05,
              curveSegments: text3DOptions?.curveSegments || 12,
              bevelEnabled: Boolean(text3DOptions?.bevelEnabled !== false), // Ensure it's a boolean
              bevelThickness: text3DOptions?.bevelThickness || 0.03,
              bevelSize: text3DOptions?.bevelSize || 0.02,
              bevelOffset: text3DOptions?.bevelOffset || 0,
              bevelSegments: text3DOptions?.bevelSegments || 5
            });

            let material;
            if (textMaterial === 'emissive') {
              material = new THREE.MeshStandardMaterial({
                color: textColor,
                emissive: textColor,
                emissiveIntensity: 1
              });
            } else if (textMaterial === 'engraved' && isEngraving) {
              material = new THREE.MeshStandardMaterial({
                color: textColor,
                metalness: 0.8,
                roughness: 0.2,
                displacementScale: engraveDepth
              });
            } else {
              material = new THREE.MeshStandardMaterial({
                color: textColor,
                metalness: 0.5,
                roughness: 0.5
              });
            }

            const mesh = new THREE.Mesh(geometry, material);
            mesh.position.set(
              textPosition?.x || 0,
              textPosition?.y || 0,
              textPosition?.z || 0
            );
            mesh.rotation.set(
              textRotation?.x || 0,
              textRotation?.y || 0,
              textRotation?.z || 0
            );
            mesh.scale.set(
              textScale?.x || 1,
              textScale?.y || 1,
              textScale?.z || 1
            );

            if (textMesh) {
              scene.remove(textMesh);
            }
            scene.add(mesh);
            setTextMesh(mesh);
          } catch (error) {
            console.error('Error creating text geometry:', error);
            setIsFontLoading(false);
            
            // Try again with the default font
            if (selectedFont !== 'helvetiker_regular.typeface.json') {
              console.log('Falling back to default font due to geometry creation error');
              onFontError?.(new Error('Failed to create text with selected font. Falling back to default font.'));
            } else {
              onFontError?.(error instanceof Error ? error : new Error('Failed to create text geometry'));
            }
          }
        })
        .catch((error) => {
          setIsFontLoading(false);
          console.error('Error loading font:', error);
          
          // Try again with the default font
          if (selectedFont !== 'helvetiker_regular.typeface.json') {
            console.log('Falling back to default font due to font loading error');
            onFontError?.(new Error('Failed to load selected font. Falling back to default font.'));
          } else {
            onFontError?.(error instanceof Error ? error : new Error('Failed to load font'));
          }
        });
    }
  }, [
    text3D,
    textColor,
    textPosition,
    textRotation,
    textScale,
    text3DOptions,
    textMaterial,
    engraveDepth,
    isEngraving,
    scene,
    selectedFont,
    onFontError
  ]);

  // Handle recording
  useEffect(() => {
    if (isRecording) {
      // Create a canvas stream from the WebGL renderer
      const canvas = gl.domElement
      streamRef.current = canvas.captureStream(30) // 30 FPS
      
      // Create MediaRecorder
      mediaRecorderRef.current = new MediaRecorder(streamRef.current, {
        mimeType: 'video/webm;codecs=vp9',
        videoBitsPerSecond: 5000000 // 5 Mbps
      })

      // Handle data available
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data)
        }
      }

      // Handle recording stop
      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' })
        chunksRef.current = []
        onRecordingComplete?.(blob)
      }

      // Start recording
      mediaRecorderRef.current.start()
    } else if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      // Stop recording
      mediaRecorderRef.current.stop()
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
        streamRef.current = null
      }
    }

    // Cleanup
    return () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop()
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
        streamRef.current = null
      }
    }
  }, [isRecording, gl, onRecordingComplete])

  if (isLoading) {
    return null
  }

  return (
    <>
      <group ref={groupRef}>
        {/* Environment and Lighting */}
        <Environment preset="studio" />
        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 5, 5]} intensity={0.5} castShadow />
        <directionalLight position={[-5, 5, -5]} intensity={0.3} />

        {/* Model */}
        <Center>
          <primitive object={preparedScene} />
        </Center>

        {/* Optional 3D Text */}
        {text3D && (
          <>
            {isFontLoading ? (
              <Html position={[textPosition.x, textPosition.y, textPosition.z]}>
                <div className="text-overlay-3d px-4 py-2 bg-black/70 rounded text-white">
                  Loading Font...
                </div>
              </Html>
            ) : (
              <Text3D
                font={`/fonts/${selectedFont || "helvetiker_regular.typeface.json"}`}
                position={[textPosition.x, textPosition.y, textPosition.z]}
                scale={[textScale.x, textScale.y, textScale.z]}
              >
                {text3D}
                <meshStandardMaterial color={textColor || "#ffffff"} />
              </Text3D>
            )}
          </>
        )}
      </group>
      {/* Camera Controls - must be direct child of Canvas */}
      <OrbitControls
        ref={controlsRef}
        enableDamping={true}
        dampingFactor={0.1}
        enableZoom={true}
        zoomSpeed={0.8}
        enablePan={true}
        panSpeed={0.5}
        enableRotate={true}
        rotateSpeed={0.5}
        minDistance={0.1}
        maxDistance={200}
        target={[0, 0, 0]}
        makeDefault
      />
    </>
  )
}

// Preload the default model
useGLTF.preload("/models/quarterboard_2.glb")
