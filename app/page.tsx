"use client"

import { Suspense, useState } from "react"
import { Canvas } from "@react-three/fiber"
import { OrbitControls, Environment, Html } from "@react-three/drei"
import { AppSidebar } from "./components/app-sidebar"
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import ModelViewer from "./components/model-viewer"
import UVMapExtractor from "./components/uv-map-extractor"

export default function Component() {
  const [modelUrl, setModelUrl] = useState("/models/object.glb")
  const [textureUrl, setTextureUrl] = useState<string | null>(null)
  const [modelColor, setModelColor] = useState("#D4A574")
  const [signStyle, setSignStyle] = useState("Modern")
  const [signName, setSignName] = useState("Custom Sign")
  const [uvMapUrl, setUvMapUrl] = useState<string | null>(null)
  const [modelLoaded, setModelLoaded] = useState(false)

  const { theme, setTheme } = useTheme()

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
  }

  return (
    <>
      <AppSidebar {...sidebarProps} />
      <SidebarInset>
        {/* Header */}
        <header className="flex h-16 shrink-0 items-center gap-2 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <div className="flex flex-1 items-center justify-between">
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-semibold">3D Model Customizer</h1>
              <span className="text-sm text-muted-foreground">
                {signName} - {signStyle}
              </span>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setTheme(theme === "light" ? "dark" : "light")}>
              <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">Toggle theme</span>
            </Button>
          </div>
        </header>

        {/* 3D Viewer */}
        <div className="flex-1 relative bg-gradient-to-br from-background to-muted/20">
          <Canvas
            camera={{
              position: [5, 5, 5],
              fov: 50,
              near: 0.1,
              far: 1000,
            }}
            className="w-full h-full"
          >
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
              <UVMapExtractor modelUrl={modelUrl} onUVMapExtracted={setUvMapUrl} />
              <OrbitControls
                enablePan={true}
                enableZoom={true}
                enableRotate={true}
                maxDistance={20}
                minDistance={1}
                target={[0, 0, 0]}
              />
              <Environment preset="city" />
              <ambientLight intensity={0.6} />
              <directionalLight
                position={[10, 10, 5]}
                intensity={1}
                castShadow
                shadow-mapSize-width={2048}
                shadow-mapSize-height={2048}
              />
              <pointLight position={[-10, -10, -5]} intensity={0.4} />
              <hemisphereLight args={["#ffffff", "#444444"]} intensity={0.8} />
            </Suspense>
          </Canvas>

          {/* Model Status Overlay */}
          <div className="absolute bottom-4 right-4 bg-background/80 backdrop-blur-sm rounded-lg border p-3 shadow-lg">
            <div className="text-xs space-y-1">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${modelLoaded ? "bg-green-500" : "bg-yellow-500"}`} />
                <span className="text-muted-foreground">{modelLoaded ? "Model Loaded" : "Loading Model..."}</span>
              </div>
              <div className="text-muted-foreground">Use mouse to rotate, zoom, and pan</div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </>
  )
}
