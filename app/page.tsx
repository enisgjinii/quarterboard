"use client"

import { Suspense, useState, useEffect } from "react"
import { Canvas } from "@react-three/fiber"
import { OrbitControls, Environment, Html, PerspectiveCamera } from "@react-three/drei"
import { AppSidebar } from "./components/app-sidebar"
import { Button } from "@/components/ui/button"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import ModelViewer from "./components/model-viewer"
import UVMapExtractor from "./components/uv-map-extractor"
import TextTextureGenerator from "./components/text-texture-generator"

interface MeshInfo {
  name: string
  vertices: number
  faces: number
  materials: string[]
  uvSets: string[]
}

export default function Component() {
  const [modelUrl, setModelUrl] = useState("/models/object.glb")
  const [textureUrl, setTextureUrl] = useState<string | null>(null)
  const [modelColor, setModelColor] = useState("#D4A574")
  const [signStyle, setSignStyle] = useState("Modern")
  const [signName, setSignName] = useState("Custom Sign")
  const [uvMapUrl, setUvMapUrl] = useState<string | null>(null)
  const [modelLoaded, setModelLoaded] = useState(false)
  const [meshInfo, setMeshInfo] = useState<MeshInfo[]>([])
  const [mounted, setMounted] = useState(false)
  const [uvMapSettings, setUvMapSettings] = useState({
    resolution: 2048,
    showWireframe: true,
    showTexture: true,
    backgroundColor: "#ffffff",
    lineColor: "#000000",
  })

  // Panel dimensions
  const panelWidth = 1024
  const panelHeight = 1024

  const { theme, setTheme } = useTheme()

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleTextTextureGenerated = (textureUrl: string) => {
    setTextureUrl(textureUrl)
  }

  const sidebarProps = {
    modelUrl,
    setModelUrl,
    textureUrl,
    setTextureUrl,
    modelColor,
    setModelColor,
    signStyle,
    setSignStyle,
    signName,
    setSignName,
    uvMapUrl,
    modelLoaded,
    uvMapSettings,
    setUvMapSettings,
    meshInfo,
    onTextTextureGenerated: handleTextTextureGenerated,
    panelWidth,
    panelHeight,
  }

  return (
    <div className="flex h-screen w-full overflow-hidden">
      <div className="w-64 bg-background border-r flex-shrink-0">
        <AppSidebar {...sidebarProps} />
      </div>
      <div className="flex-1 relative bg-gradient-to-br from-background to-muted/20 w-full overflow-hidden">
        <Canvas
          className="w-full h-full"
          style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0, right: 0 }}
          dpr={[1, 2]}
          shadows
        >
          <PerspectiveCamera
            makeDefault
            position={[0, 0, 5]}
            fov={45}
            near={0.1}
            far={1000}
          />
          <Suspense
            fallback={
              <Html center>
                <div className="flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm rounded-lg border shadow-lg">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mr-3"></div>
                  <span className="text-foreground font-medium">Loading 3D model...</span>
                </div>
              </Html>
            }
          >
            <ModelViewer
              modelUrl={modelUrl}
              textureUrl={textureUrl}
              color={modelColor}
              onModelLoaded={setModelLoaded}
            />
            <UVMapExtractor
              modelUrl={modelUrl}
              onUVMapExtracted={setUvMapUrl}
              resolution={uvMapSettings.resolution}
              showWireframe={uvMapSettings.showWireframe}
              showTexture={uvMapSettings.showTexture}
              backgroundColor={uvMapSettings.backgroundColor}
              lineColor={uvMapSettings.lineColor}
              onMeshInfoExtracted={setMeshInfo}
            />
            <OrbitControls
              enablePan={true}
              enableZoom={true}
              enableRotate={true}
              maxDistance={10}
              minDistance={2}
              target={[0, 0, 0]}
              makeDefault
            />
            <Environment preset="studio" />
            
            <directionalLight
              position={[5, 5, 5]}
              intensity={1}
              castShadow
              shadow-mapSize-width={2048}
              shadow-mapSize-height={2048}
            />
            <directionalLight
              position={[-5, 5, -5]}
              intensity={0.5}
              castShadow
            />
            <pointLight position={[0, 5, 0]} intensity={0.5} />
            <ambientLight intensity={0.5} />
          </Suspense>
        </Canvas>

        {/* Theme Toggle */}
        <div className="absolute top-4 right-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            {mounted && theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
          </Button>
        </div>
      </div>
    </div>
  )
}
