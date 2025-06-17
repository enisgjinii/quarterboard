"use client"

import { Suspense, useState, useEffect, useCallback } from "react"
import { AppSidebar } from "./components/app-sidebar"
import { Button } from "@/components/ui/button"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { toast } from "sonner"
import { BabylonScene } from "./components/babylon-scene"
import { BabylonModelLoader } from "./components/babylon-model-loader"
import { Scene } from "@babylonjs/core"

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
  
  // 3D Text states
  const [text3D, setText3D] = useState("SAMPLE")
  const [textColor, setTextColor] = useState("#000000")
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

  const [scene, setScene] = useState<Scene | null>(null);

  const handleSceneReady = useCallback((newScene: Scene) => {
    setScene(newScene);
  }, []);

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleModelLoad = (info: any) => {
    setModelLoaded(true)
    setMeshInfo([info])
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

  const handleFontError = useCallback((error: Error) => {
    console.error('Font error:', error);
    if (selectedFont !== 'helvetiker_regular.typeface.json') {
      toast.error('Failed to load selected font. Falling back to default font.');
    }
  }, [selectedFont]);

  if (!mounted) {
    return null
  }

  return (
    <div className="flex h-screen">
      <AppSidebar
        selectedModel={selectedModel}
        setSelectedModel={setSelectedModel}
        modelColor={modelColor}
        setModelColor={setModelColor}
        meshInfo={meshInfo}
        selectedMaterial={selectedMaterial}
        setSelectedMaterial={setSelectedMaterial}
        materialPreview={materialPreview}
        setMaterialPreview={setMaterialPreview}
        isPreviewMode={isPreviewMode}
        setIsPreviewMode={setIsPreviewMode}
        text3D={text3D}
        setText3D={setText3D}
        textColor={textColor}
        setTextColor={setTextColor}
        textPosition={textPosition}
        setTextPosition={setTextPosition}
        textRotation={textRotation}
        setTextRotation={setTextRotation}
        textScale={textScale}
        setTextScale={setTextScale}
        text3DOptions={text3DOptions}
        setText3DOptions={setText3DOptions}
        textMaterial={textMaterial}
        setTextMaterial={setTextMaterial}
        engraveDepth={engraveDepth}
        setEngraveDepth={setEngraveDepth}
        isEngraving={isEngraving}
        setIsEngraving={setIsEngraving}
        selectedFont={selectedFont}
        setSelectedFont={setSelectedFont}
        uvMapTexture={uvMapTexture}
        setUvMapTexture={setUvMapTexture}
        uvMapText={uvMapText}
        setUvMapText={setUvMapText}
        uvMapTextOptions={uvMapTextOptions}
        setUvMapTextOptions={setUvMapTextOptions}
        isRecording={isRecording}
        setIsRecording={setIsRecording}
        recordedVideo={recordedVideo}
        setRecordedVideo={setRecordedVideo}
      />
      <div className="flex-1 relative">
        <div className="absolute top-4 right-4 z-10">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
        </div>
        <div className="w-full h-full">
          <Suspense fallback={<div>Loading...</div>}>
            <BabylonScene
              modelUrl={modelUrl}
              modelColor={modelColor}
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
              uvMapTexture={uvMapTexture}
              uvMapText={uvMapText}
              uvMapTextOptions={uvMapTextOptions}
              onSceneReady={handleSceneReady}
              isRecording={isRecording}
              onRecordingComplete={(blob) => setRecordedVideo(blob)}
            />
          </Suspense>
        </div>
      </div>
    </div>
  )
}