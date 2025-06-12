"use client"

import { Suspense, useState, useEffect } from "react"
import { Canvas } from "@react-three/fiber"
import { OrbitControls, Environment, Html, PerspectiveCamera, Stats } from "@react-three/drei"
import { AppSidebar } from "./components/app-sidebar"
import { Button } from "@/components/ui/button"
import { Moon, Sun, Type } from "lucide-react"
import { useTheme } from "next-themes"
import { ModelViewer } from "./components/model-viewer"
import { ModelViewerDemo } from "./components/model-viewer-demo"

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

export default function Component() {
  const [modelUrl, setModelUrl] = useState("/models/quarterboard.glb")
  const [textureUrl, setTextureUrl] = useState<string | null>(null)
  const [modelColor, setModelColor] = useState("#D4A574")
  const [modelLoaded, setModelLoaded] = useState(false)
  const [meshInfo, setMeshInfo] = useState<MeshInfo[]>([])
  const [mounted, setMounted] = useState(false)
  const [selectedMaterial, setSelectedMaterial] = useState<string | null>(null)
  const [materialPreview, setMaterialPreview] = useState<string | null>(null)
  const [isPreviewMode, setIsPreviewMode] = useState(false)
  const [showTextDemo, setShowTextDemo] = useState(false)
  
  // 3D Text states - Centered at origin by default
  const [overlayText, setOverlayText] = useState("")
  const [materialText, setMaterialText] = useState("")
  const [text3D, setText3D] = useState("SAMPLE")
  const [textColor, setTextColor] = useState("#ff0000")
  const [fontSize, setFontSize] = useState(1)
  const [textPosition, setTextPosition] = useState({ x: 0, y: 0, z: 0.2 }) // Slightly above the model surface
  const [textRotation, setTextRotation] = useState({ x: 0, y: 0, z: 0 })
  const [textScale, setTextScale] = useState({ x: 1, y: 1, z: 1 })
  const [text3DOptions, setText3DOptions] = useState({
    size: 0.15,
    height: 0.03,
    curveSegments: 12,
    bevelEnabled: true,
    bevelThickness: 0.005,
    bevelSize: 0.002,
    bevelOffset: 0,
    bevelSegments: 3
  })
  const [textMaterial, setTextMaterial] = useState<'standard' | 'emissive' | 'engraved'>('standard')
  const [engraveDepth, setEngraveDepth] = useState(0.01)
  const [isEngraving, setIsEngraving] = useState(false)

  const { theme, setTheme } = useTheme()

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleModelLoad = (info: any) => {
    setModelLoaded(true)
  }

  const sidebarProps = {
    modelUrl,
    setModelUrl,
    textureUrl,
    setTextureUrl,
    modelColor,
    setModelColor,
    uvMapUrl: null,
    modelLoaded,
    meshInfo,
    selectedMaterial,
    setSelectedMaterial,
    materialPreview,
    setMaterialPreview,
    isPreviewMode,
    setIsPreviewMode,
    overlayText,
    setOverlayText,
    materialText,
    setMaterialText,
    text3D,
    setText3D,
    textColor,
    setTextColor,
    fontSize,
    setFontSize,
    textPosition,
    setTextPosition,
    textRotation,
    setTextRotation,
    textScale,
    setTextScale,
    text3DOptions,
    setText3DOptions,
    textMaterial,
    setTextMaterial,
    engraveDepth,
    setEngraveDepth,
    isEngraving,
    setIsEngraving
  }

  if (!mounted) {
    return null
  }

  return (    <div className="h-screen w-screen flex overflow-hidden">
      {/* Left Sidebar */}
      <div className="w-80 border-r bg-background flex-shrink-0">
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Type className="w-4 h-4 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-semibold text-sm">3D Editor</h1>
              <p className="text-xs text-muted-foreground">Model Customization</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "light" ? "dark" : "light")}
          >
            <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
          </Button>
        </div>
        <AppSidebar {...sidebarProps} />
      </div>      {/* Main Viewport */}
      <div className="flex-1 relative w-full h-full">
        {showTextDemo && (
          <div className="absolute top-4 right-4 z-10">
            <Button
              variant="outline"
              onClick={() => setShowTextDemo(false)}
              className="text-xs"
            >
              Close Demo
            </Button>
          </div>
        )}

        {showTextDemo ? (
          <ModelViewerDemo />
        ) : (
          <Canvas 
            className="w-full h-full"
            style={{ width: '100%', height: '100%' }}
            camera={{ 
              position: [0, 0, 5],
              fov: 50
            }}
            gl={{ 
              antialias: true,
              alpha: true,
              preserveDrawingBuffer: true
            }}
          >
            <Suspense fallback={
              <Html center>
                <div className="text-white">Loading model...</div>
              </Html>
            }>
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
              />
            </Suspense>
          </Canvas>
        )}
      </div>
    </div>
  )
}