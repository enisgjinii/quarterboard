"use client"

import { Suspense, useState, useEffect, useCallback } from "react"
import { Canvas, useThree } from "@react-three/fiber"
import { OrbitControls, Environment, Html, PerspectiveCamera, Stats } from "@react-three/drei"
import * as THREE from 'three'
import { AppSidebar } from "./components/app-sidebar"
import { Button } from "@/components/ui/button"
import { Moon, Sun, Type } from "lucide-react"
import { useTheme } from "next-themes"
import { ModelViewer } from "./components/model-viewer"
import { ModelViewerDemo } from "./components/model-viewer-demo"
import { UVMapEditor } from "./components/uv-map-editor"
import { UVMapExtractor } from "./components/uv-map-extractor"
import { toast } from "sonner"
// import { SceneExporterContent } from "./components/scene-exporter"

interface MeshInfo {
  name: string
  vertices: number
  faces: number
  materials: string[]
  uvSets: string[]
  materialData?: Array<{
    color?: string
    roughness?: number
    metalness?: number
    map?: string
  }>
}

const models = [
  "quarterboard.glb",
  "quarterboard_2.glb",
  "The Captain Ahab .glb",
  "The Cisco Beach.glb",
  "The Gaslight.glb",
  "The Hilderbrand.glb",
  "The Landbank.glb",
  "The Madaket Millies.glb",
  "The MarkFlow.glb",
  "The Original.glb",
  "The Sconset.glb",
  "The Shangri-La.glb",
];

interface SceneContentProps {
  modelUrl: string;
  modelColor: string;
  handleModelLoad: (info: any) => void;
  selectedMaterial: string | null;
  materialPreview: string | null;
  isPreviewMode: boolean;
  text3D: string;
  textColor: string;
  textPosition: { x: number; y: number; z: number };
  textRotation: { x: number; y: number; z: number };
  textScale: { x: number; y: number; z: number };
  text3DOptions: any;
  textMaterial: 'standard' | 'emissive' | 'engraved';
  engraveDepth: number;
  isEngraving: boolean;
  selectedFont: string;
  onFontError: (error: Error) => void;
  uvMapTexture: string | null;
  uvMapText: string;
  uvMapTextOptions: any;
  onSceneReady: (scene: THREE.Scene, gl: THREE.WebGLRenderer) => void;
  isRecording: boolean;
  onRecordingComplete: (blob: Blob) => void;
}

// Create a new component that uses useThree
function SceneContent({
  modelUrl,
  modelColor,
  handleModelLoad,
  selectedMaterial,
  materialPreview,
  isPreviewMode,
  text3D,
  textColor,
  textPosition,
  textRotation,
  textScale,
  text3DOptions,
  textMaterial,
  engraveDepth,
  isEngraving,
  selectedFont,
  onFontError,
  uvMapTexture,
  uvMapText,
  uvMapTextOptions,
  onSceneReady,
  isRecording,
  onRecordingComplete
}: SceneContentProps) {
  const { scene, gl } = useThree();
  
  useEffect(() => {
    onSceneReady(scene, gl);
  }, [scene, gl, onSceneReady]);

  const handleFontError = useCallback((error: Error) => {
    console.error('Font error:', error);
    // Fallback to default font
    if (selectedFont !== 'helvetiker_regular.typeface.json') {
      onFontError(new Error('Failed to load selected font. Falling back to default font.'));
    }
  }, [selectedFont, onFontError]);

  return (
    <>
      <mesh>
        <gridHelper args={[50, 50, '#666666', '#444444']} />
      </mesh>
      <axesHelper args={[5]} />
      {/* Center point markers */}
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[0.05, 16, 16]} />
        <meshBasicMaterial color="red" />
      </mesh>
      <mesh position={[0, 0.01, 0]}>
        <boxGeometry args={[0.1, 0.01, 0.1]} />
        <meshBasicMaterial color="yellow" transparent opacity={0.5} />
      </mesh>
      <ModelViewer
        modelPath={modelUrl}
        color={modelColor}
        onModelLoad={handleModelLoad}
        selectedMaterial={selectedMaterial}
        materialPreview={materialPreview}
        isPreviewMode={isPreviewMode}
        text3D={text3D}
        textColor={textColor}
        textPosition={textPosition}
        textRotation={textRotation}
        textScale={textScale}
        text3DOptions={text3DOptions}
        textMaterial={textMaterial}
        engraveDepth={engraveDepth}
        isEngraving={isEngraving}
        selectedFont={selectedFont}
        onFontError={handleFontError}
        uvMapTexture={uvMapTexture || undefined}
        uvMapText={uvMapText}
        uvMapTextOptions={uvMapTextOptions}
        isRecording={isRecording}
        onRecordingComplete={onRecordingComplete}
      />
      {/* <SceneExporterContent />   */}
    </>
  );
}

export default function Component() {
  const [selectedModel, setSelectedModel] = useState(models[Math.floor(Math.random() * models.length)]);
  const [modelUrl, setModelUrl] = useState(`/models/${selectedModel}`);
  const [textureUrl, setTextureUrl] = useState<string | null>(null)
  const [modelColor, setModelColor] = useState("#ffffff")
  const [modelLoaded, setModelLoaded] = useState(false)
  const [meshInfo, setMeshInfo] = useState<MeshInfo[]>([])
  const [mounted, setMounted] = useState(false)
  const [selectedMaterial, setSelectedMaterial] = useState<string | null>(null)
  const [materialPreview, setMaterialPreview] = useState<string | null>(null)
  const [isPreviewMode, setIsPreviewMode] = useState(false)
  
  // 3D Text states - Centered at origin by default
  const [overlayText, setOverlayText] = useState("")
  const [materialText, setMaterialText] = useState("")
  const [text3D, setText3D] = useState("SAMPLE")
  const [textColor, setTextColor] = useState("#000000")
  const [fontSize, setFontSize] = useState(1)
  const [textPosition, setTextPosition] = useState({ x: 0, y: 0, z: 0 })
  const [textRotation, setTextRotation] = useState({ x: 0, y: 0, z: 0 })
  const [textScale, setTextScale] = useState({ x: 1, y: 1, z: 1 })
  const [text3DOptions, setText3DOptions] = useState({
    size: 0.2,
    height: 0.05,
    curveSegments: 12,
    bevelEnabled: true,
    bevelThickness: 0.005,
    bevelSize: 0.002,
    bevelOffset: 0,
    bevelSegments: 3
  })
  const [textMaterial, setTextMaterial] = useState<'standard' | 'emissive' | 'engraved'>('standard')
  const [engraveDepth, setEngraveDepth] = useState(0.1)
  const [isEngraving, setIsEngraving] = useState(false)

  const [uvMapTexture, setUvMapTexture] = useState<string | null>(null)
  const [uvMapText, setUvMapText] = useState("")
  const [uvMapTextOptions, setUvMapTextOptions] = useState({
    fontSize: 48,
    fontFamily: "Arial",
    textColor: "#000000",
    backgroundColor: "transparent",
    position: { x: 0.5, y: 0.5 },
    rotation: 0,
    scale: 1
  })

  const { theme, setTheme } = useTheme()

  const [scene, setScene] = useState<THREE.Scene | null>(null);
  const [gl, setGl] = useState<THREE.WebGLRenderer | null>(null);

  const handleSceneReady = useCallback((newScene: THREE.Scene, newGl: THREE.WebGLRenderer) => {
    setScene(newScene);
    setGl(newGl);
  }, []);

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleModelLoad = (info: any) => {
    setModelLoaded(true)
  }

  // Update modelUrl when selectedModel changes
  useEffect(() => {
    if (selectedModel) {
      setModelUrl(`/models/${selectedModel}`)
    }
  }, [selectedModel])

  const [selectedFont, setSelectedFont] = useState("helvetiker_regular.typeface.json")

  const [isRecording, setIsRecording] = useState(false)
  const [recordedVideo, setRecordedVideo] = useState<Blob | null>(null)

  // Handle recording start
  const handleRecordingStart = useCallback(() => {
    try {
      setIsRecording(true)
      toast.info('Recording started')
    } catch (error) {
      console.error('Error starting recording:', error)
      toast.error('Failed to start recording')
      setIsRecording(false)
    }
  }, [])

  // Handle recording stop
  const handleRecordingStop = useCallback(() => {
    try {
      setIsRecording(false)
      toast.info('Recording stopped')
    } catch (error) {
      console.error('Error stopping recording:', error)
      toast.error('Failed to stop recording')
    }
  }, [])

  // Handle recording complete
  const handleRecordingComplete = useCallback((blob: Blob) => {
    try {
      setRecordedVideo(blob)
      // Create download link
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `quarterboard-recording-${new Date().toISOString()}.webm`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      toast.success('Recording saved successfully!')
    } catch (error) {
      console.error('Error saving recording:', error)
      toast.error('Failed to save recording')
    }
  }, [])

  // Cleanup recording state on unmount
  useEffect(() => {
    return () => {
      if (isRecording) {
        setIsRecording(false)
      }
    }
  }, [isRecording])

  const sidebarProps = {
    modelUrl,
    setModelUrl,
    modelColor,
    setModelColor,
    text3D,
    setText3D,
    textColor,
    setTextColor,
    textPosition,
    setTextPosition,
    textRotation,
    setTextRotation,
    textScale,
    setTextScale,
    textMaterial,
    setTextMaterial,
    engraveDepth,
    setEngraveDepth,
    isEngraving,
    setIsEngraving,
    selectedFont,
    setSelectedFont,
    scene,
    gl,
    onExport: (data: any) => {
      console.log('Scene exported:', data);
    },
    isRecording,
    onRecordingStart: handleRecordingStart,
    onRecordingStop: handleRecordingStop
  };

  const handleUVTextUpdate = (text: string, options: any) => {
    setUvMapText(text)
    setUvMapTextOptions(options)
  }

  const handleFontError = useCallback((error: Error) => {
    console.error('Font error:', error);
    // Fallback to default font
    if (selectedFont !== 'helvetiker_regular.typeface.json') {
      setSelectedFont('helvetiker_regular.typeface.json');
      toast.error('Failed to load selected font. Falling back to default font.');
    }
  }, [selectedFont]);

  if (!mounted) {
    return null
  }

  return (
    <div className="h-screen w-screen flex overflow-hidden">
      {/* Left Sidebar */}
      <div className="w-72 border-r bg-background flex-shrink-0">
        <AppSidebar {...sidebarProps} />
      </div>

      {/* Main Content */}
      <div className="flex-1 relative">
        <Canvas 
          camera={{ 
            position: [0, 2, 6],
            fov: 45,
            near: 0.1,
            far: 1000
          }}
          gl={{ 
            antialias: true,
            alpha: true
          }}
          onCreated={({ gl }) => {
            gl.setClearColor('#000000', 0);
          }}
        >
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
          />
          <Suspense fallback={
            <Html center>
              <div className="text-white">Loading model...</div>
            </Html>
          }>
            <SceneContent
              modelUrl={modelUrl}
              modelColor={modelColor}
              handleModelLoad={handleModelLoad}
              selectedMaterial={selectedMaterial}
              materialPreview={materialPreview}
              isPreviewMode={isPreviewMode}
              text3D={text3D}
              textColor={textColor}
              textPosition={textPosition}
              textRotation={textRotation}
              textScale={textScale}
              text3DOptions={text3DOptions}
              textMaterial={textMaterial}
              engraveDepth={engraveDepth}
              isEngraving={isEngraving}
              selectedFont={selectedFont}
              onFontError={handleFontError}
              uvMapTexture={uvMapTexture}
              uvMapText={uvMapText}
              uvMapTextOptions={uvMapTextOptions}
              onSceneReady={handleSceneReady}
              isRecording={isRecording}
              onRecordingComplete={handleRecordingComplete}
            />
          </Suspense>
        </Canvas>
      </div>

      {/* UV Map Extractor */}
      <div className="absolute bottom-4 right-4 w-80">
        <UVMapExtractor
          scene={scene}
          onExtract={(uvMap) => {
            setUvMapTexture(uvMap)
          }}
          onTextureUpdate={(texture) => {
            setUvMapTexture(texture)
          }}
        />
      </div>
    </div>
  )
}