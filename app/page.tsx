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
import { UVMapEditor } from "./components/uv-map-editor"

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
  const [modelUrl, setModelUrl] = useState("/models/quarterboard_2.glb")
  const [textureUrl, setTextureUrl] = useState<string | null>(null)
  const [modelColor, setModelColor] = useState("#ffffff")
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
  const [textColor, setTextColor] = useState("#000000")
  const [fontSize, setFontSize] = useState(1)
  const [textPosition, setTextPosition] = useState({ x: 0, y: 0.5, z: 0 })
  const [textRotation, setTextRotation] = useState({ x: 0, y: 0, z: 0 })
  const [textScale, setTextScale] = useState({ x: 1.2, y: 1.2, z: 1.2 })
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
  const [engraveDepth, setEngraveDepth] = useState(0.02)
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
    setIsEngraving,
    uvMapTexture,
    setUvMapTexture
  }

  const handleUVTextUpdate = (text: string, options: any) => {
    setUvMapText(text)
    setUvMapTextOptions(options)
  }

  if (!mounted) {
    return null
  }

  return (
    <div className="h-screen w-screen flex overflow-hidden">
      {/* Left Sidebar */}
      <div className="w-96 border-r bg-background flex-shrink-0">
        <AppSidebar {...sidebarProps} />
      </div>

      {/* Main Content */}
      <div className="flex-1 relative">
        {showTextDemo ? (
          <ModelViewerDemo />
        ) : (
          <Canvas 
            camera={{ 
              position: [0, 0, 5],
              fov: 50
            }}
            gl={{ 
              antialias: true,
              alpha: true
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
                uvMapTexture={uvMapTexture || undefined}
                uvMapText={uvMapText}
                uvMapTextOptions={uvMapTextOptions}
              />
            </Suspense>
          </Canvas>
        )}
      </div>
    </div>
  )
}