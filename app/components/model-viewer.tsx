"use client"

import { useRef, useEffect, useState, useMemo } from "react"
import { useGLTF, OrbitControls, Center, Text3D, Grid, Environment } from "@react-three/drei"
import { useFrame, useThree } from "@react-three/fiber"
import * as THREE from "three"
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js"
import type { GLTF } from "three/examples/jsm/loaders/GLTFLoader.js"
import { FontLoader } from "three/examples/jsm/loaders/FontLoader.js"
import { TextGeometry } from "three/examples/jsm/geometries/TextGeometry.js"

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
  text3DOptions?: any
  textMaterial?: 'standard' | 'emissive' | 'engraved'
  engraveDepth?: number
  isEngraving?: boolean
  uvMapTexture?: string
  uvMapText?: string
  uvMapTextOptions?: any
  selectedMaterial?: string | null
  materialPreview?: string | null
  onModelLoad?: (info: any) => void
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
  uvMapTexture,
  uvMapText = "",
  uvMapTextOptions,
  selectedMaterial = null,
  materialPreview = null,
  onModelLoad
}: ModelViewerProps) {
  const groupRef = useRef<THREE.Group>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [modelBounds, setModelBounds] = useState<THREE.Box3 | null>(null)
  const { scene: model } = useGLTF(modelPath, true)
  const { camera, scene } = useThree()
  const [textMesh, setTextMesh] = useState<THREE.Mesh | null>(null)

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

  // Clone and prepare the model with materials
  const preparedScene = useMemo(() => {
    const clone = model.clone(true)
    clone.traverse((node) => {
      if (node instanceof THREE.Mesh) {
        if (Array.isArray(node.material)) {
          node.material = node.material.map(mat => 
            new THREE.MeshStandardMaterial({
              ...mat,
              color: new THREE.Color(color)
            })
          )
        } else {
          node.material = new THREE.MeshStandardMaterial({
            ...node.material,
            color: new THREE.Color(color)
          })
        }
      }
    })
    return clone
  }, [model, color])

  useEffect(() => {
    if (model) {
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
  }, [model, color, selectedMaterial, materialPreview]);

  useEffect(() => {
    if (text3D && scene) {
      const loader = new FontLoader();
      loader.load('/fonts/helvetiker_regular.typeface.json', (font) => {
        const geometry = new TextGeometry(text3D, {
          font,
          size: text3DOptions?.size || 0.2,
          depth: text3DOptions?.height || 0.05,
          curveSegments: text3DOptions?.curveSegments || 12,
          bevelEnabled: text3DOptions?.bevelEnabled || false,
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
    scene
  ]);

  useEffect(() => {
    if (uvMapTexture && uvMapText && model) {
      const textureLoader = new THREE.TextureLoader();
      textureLoader.load(uvMapTexture, (texture) => {
        model.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            const material = child.material as THREE.MeshStandardMaterial;
            material.map = texture;
            material.needsUpdate = true;
          }
        });
      });
    }
  }, [uvMapTexture, uvMapText, model]);

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

        {/* Grid Helpers */}
        <gridHelper 
          args={[calculateGridSize(modelBounds), 20]} 
          position={[0, -0.01, 0]}
          rotation={[0, 0, 0]}
        >
          <meshBasicMaterial transparent opacity={0.5} />
        </gridHelper>
        <gridHelper 
          args={[calculateGridSize(modelBounds), 20]} 
          position={[0, -0.01, 0]}
          rotation={[0, Math.PI / 2, 0]}
        >
          <meshBasicMaterial transparent opacity={0.2} />
        </gridHelper>

        {/* Axes Helper */}
        <axesHelper args={[calculateGridSize(modelBounds) / 2]} />

        {/* Model */}
        <Center>
          <primitive object={preparedScene} />
        </Center>

        {/* Optional 3D Text */}
        {text3D && (
          <Text3D
            font="/fonts/helvetiker_regular.typeface.json"
            position={[textPosition.x, textPosition.y, textPosition.z]}
            scale={[textScale.x, textScale.y, textScale.z]}
          >
            {text3D}
            <meshStandardMaterial color={textColor || "#ffffff"} />
          </Text3D>
        )}
      </group>
      {/* Camera Controls - must be direct child of Canvas */}
      <OrbitControls
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
