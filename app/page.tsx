"use client"

import { Suspense, useState, useEffect } from "react"
import { Canvas } from "@react-three/fiber"
import { OrbitControls, Environment, Html, PerspectiveCamera, Stats } from "@react-three/drei"
import { AppSidebar } from "./components/app-sidebar"
import { Button } from "@/components/ui/button"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { ModelViewer } from "./components/model-viewer"

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
  
  // 3D Text overlay states
  const [overlayText, setOverlayText] = useState("")
  const [textColor, setTextColor] = useState("#ffffff")
  const [fontSize, setFontSize] = useState(1)
  const [textPosition, setTextPosition] = useState({ x: 0, y: 1, z: 0 })

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
    textColor,
    setTextColor,
    fontSize,
    setFontSize,
    textPosition,
    setTextPosition
  }

  return (
    <div className="flex h-screen w-full overflow-hidden">
      <div className="w-80 bg-background border-r flex-shrink-0">
        <AppSidebar {...sidebarProps} />
      </div>
      <div className="flex-1 relative">
        <div className="absolute inset-0">
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
                overlayText={overlayText}
                textColor={textColor}
                fontSize={fontSize}
                textPosition={textPosition}
              />
            </Suspense>
          </Canvas>
        </div>
        <div className="absolute top-4 right-4 z-10">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            {mounted && theme === "dark" ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
