"use client"

import { Suspense, useState, useEffect, useCallback, useRef } from "react"
import { AppSidebar } from "./components/app-sidebar"
import { Button } from "@/components/ui/button"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { toast } from "sonner"
import { BabylonScene } from "./components/babylon-scene"
import { BabylonModelLoader } from "./components/babylon-model-loader"
import { Scene } from "@babylonjs/core"
import debounce from "lodash.debounce"
import { useDevicePerformance } from "@/hooks/use-device-performance"
import { usePerformanceMonitor } from "@/hooks/use-performance-monitor"

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

export default function Component() {  const [selectedModel, setSelectedModel] = useState(models[Math.floor(Math.random() * models.length)]);
  const [modelUrl, setModelUrl] = useState(`/models/${selectedModel}`);
  const [textureUrl, setTextureUrl] = useState<string | null>(null)
  const [modelColor, setModelColor] = useState("#ffffff")
  const [modelLoaded, setModelLoaded] = useState(false)
  const [meshInfo, setMeshInfo] = useState<MeshInfo[]>([])
  const [mounted, setMounted] = useState(false)
  const [selectedMaterial, setSelectedMaterial] = useState<string | null>(null)
  const [materialPreview, setMaterialPreview] = useState<string | null>(null)
  const [isPreviewMode, setIsPreviewMode] = useState(false)
  const { isLowEndDevice } = useDevicePerformance()
  const [performanceMode, setPerformanceMode] = useState(isLowEndDevice) // Initialize based on device capability
  
  // 3D Text states with improved defaults
  const [text3D, setText3D] = useState("QUARTERBOARD TEXT")
  const [textColor, setTextColor] = useState("#1a1a1a")
  const [textPosition, setTextPosition] = useState({ x: 0, y: 1.2, z: 0 }) // Higher position by default
  const [textRotation, setTextRotation] = useState({ x: 0, y: 0, z: 0 })
  const [textScale, setTextScale] = useState({ x: 1, y: 1, z: 1 })
  const [text3DOptions, setText3DOptions] = useState({
    size: 0.25,            // Slightly larger
    height: 0.08,          // More depth
    curveSegments: 12,
    bevelEnabled: true,
    bevelThickness: 0.01,
    bevelSize: 0.005,
    bevelOffset: 0,
    bevelSegments: 5
  })
  const [textMaterial, setTextMaterial] = useState<'standard' | 'emissive' | 'engraved'>('standard')
  const [engraveDepth, setEngraveDepth] = useState(0.1)
  const [isEngraving, setIsEngraving] = useState(false)
  const [isTextEditing, setIsTextEditing] = useState(false)
  const [textSnapToModel, setTextSnapToModel] = useState(true)

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
  const [selectedFont, setSelectedFont] = useState("helvetiker_regular.typeface.json")
  const [isRecording, setIsRecording] = useState(false)
  const [recordedVideo, setRecordedVideo] = useState<Blob | null>(null)

  // New state variables for enhanced UI
  const [showTextControls, setShowTextControls] = useState(false);
  const [modelLoading, setModelLoading] = useState(true);
  const [selectedView, setSelectedView] = useState<'top' | 'front' | 'side' | 'full'>('front');
  const [showGrid, setShowGrid] = useState(false);
  
  const handleSceneReady = useCallback((newScene: Scene) => {
    setScene(newScene);
    setModelLoading(false); // Mark as loaded when scene is ready
  }, []);

  useEffect(() => {
    setMounted(true);
    
    // Auto-enable performance mode on low-end devices
    if (isLowEndDevice) {
      setPerformanceMode(true);
      toast.info("Performance mode enabled automatically for better performance on your device.", {
        duration: 5000,
      });
    }
  }, [isLowEndDevice]);
  
  // Monitor performance and recommend performance mode if needed
  const handleRecommendPerformanceMode = useCallback(() => {
    toast.info(
      "We noticed your device might be struggling. Would you like to enable performance mode for smoother experience?",
      {
        duration: 10000,
        action: {
          label: "Enable",
          onClick: () => setPerformanceMode(true)
        }
      }
    );
  }, []);
  
  const { averageFps } = usePerformanceMonitor(performanceMode, handleRecommendPerformanceMode);
  const handleModelLoad = (info: any) => {
    console.log("Model loaded callback triggered", info);
    setModelLoaded(true);
    setMeshInfo([info]);
    setModelLoading(false);
    
    // Reset text position to be centered on top of the model
    if (textSnapToModel) {
      // Position text on top of the model's bounding box
      setTextPosition({ 
        x: 0,
        y: 1.2,  // Position text above the model
        z: 0
      });
    }
  };

  // Handle camera view changes
  const handleViewChange = (view: 'top' | 'front' | 'side' | 'full') => {
    setSelectedView(view);
    // Camera positioning will be handled in the BabylonScene component
  };
  // Update modelUrl when selectedModel changes
  useEffect(() => {
    if (selectedModel) {
      // Make the model loading more reliable by resetting states first
      setModelLoading(true);
      setModelLoaded(false);
      
      // Wait a bit to ensure any previous model loading is canceled
      setTimeout(() => {
        // Make sure the model URL is properly encoded for spaces in filenames
        const encodedModel = encodeURIComponent(selectedModel);
        const fullUrl = `/models/${encodedModel}`;
        setModelUrl(fullUrl);
        console.log("Model URL set to:", fullUrl);
      }, 50);
    }
  }, [selectedModel])

  const handleFontError = useCallback((error: Error) => {
    console.error('Font error:', error);
    if (selectedFont !== 'helvetiker_regular.typeface.json') {
      toast.error('Failed to load selected font. Falling back to default font.');
    }
  }, [selectedFont]);

  const resizeTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    const handleResize = debounce(() => {
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current);
      }
      resizeTimeoutRef.current = window.setTimeout(() => {
        // Perform optimized resize handling
        console.log("Resizing...");
      }, 200);
    }, 300);

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current);
      }
    };
  }, []);

  const handleTextChange = debounce((value: string) => {
    setText3D(value);
  }, 300);

  const handleColorChange = debounce((value: string) => {
    setTextColor(value);
  }, 300);

  const handleScaleChange = debounce((value: number) => {
    setTextScale({ x: value, y: value, z: value });
  }, 300);
  // This was replaced by the earlier useEffect with isLowEndDevice

  if (!mounted) {
    return null
  }

  return (
    <div className="flex h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {process.env.NODE_ENV === 'development' && averageFps && (
        <div className="absolute top-2 right-2 z-50 bg-black/70 text-white px-2 py-1 text-xs rounded font-mono">
          {averageFps.toFixed(1)} FPS | Mode: {performanceMode ? 'Performance' : 'Quality'}
        </div>
      )}
      
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
        isTextEditing={isTextEditing}
        setIsTextEditing={setIsTextEditing}
        textSnapToModel={textSnapToModel}
        setTextSnapToModel={setTextSnapToModel}
      />
      <div className="flex-1 relative">
        {/* Enhanced top controls */}
        <div className="absolute top-4 right-4 z-10 flex space-x-2">
          <div className="flex bg-white dark:bg-slate-800 rounded-lg shadow-lg p-1 mr-4">
            <Button
              variant={selectedView === 'front' ? "default" : "outline"}
              size="sm"
              onClick={() => handleViewChange('front')}
              className="rounded-l-md rounded-r-none"
            >
              Front
            </Button>
            <Button
              variant={selectedView === 'side' ? "default" : "outline"}
              size="sm"
              onClick={() => handleViewChange('side')}
              className="rounded-none"
            >
              Side
            </Button>
            <Button
              variant={selectedView === 'top' ? "default" : "outline"}
              size="sm"
              onClick={() => handleViewChange('top')}
              className="rounded-none"
            >
              Top
            </Button>
            <Button
              variant={selectedView === 'full' ? "default" : "outline"}
              size="sm"
              onClick={() => handleViewChange('full')}
              className="rounded-l-none rounded-r-md"
            >
              3D
            </Button>
          </div>
          
          <Button
            variant="outline"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="bg-white dark:bg-slate-800 shadow-lg"
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
        </div>
        
        {/* Loading overlay */}
        {modelLoading && (
          <div className="absolute inset-0 bg-slate-100/80 dark:bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-20">
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className="text-lg font-medium text-blue-600 dark:text-blue-400">Loading Quarterboard...</p>
            </div>
          </div>
        )}
        
        {/* Main 3D view */}
        <div className="w-full h-full">
          <Suspense fallback={
            <div className="w-full h-full flex items-center justify-center bg-slate-100 dark:bg-slate-900">
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-lg font-medium text-blue-600 dark:text-blue-400">Initializing 3D View...</p>
              </div>
            </div>
          }>
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
              performanceMode={performanceMode} // Pass performance mode to BabylonScene
            />
          </Suspense>
          
          {/* Enhanced controls overlay */}
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-10 flex gap-2">
            <Button
              variant={showGrid ? "default" : "outline"}
              size="sm"
              onClick={() => setShowGrid(!showGrid)}
              className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm shadow-lg"
            >
              Grid
            </Button>
            
            <Button              variant={performanceMode ? "default" : "outline"}
              size="sm"
              onClick={() => {
                const newMode = !performanceMode;
                setPerformanceMode(newMode);
                toast.success(
                  newMode 
                    ? "Performance mode enabled. This reduces graphics quality to improve performance." 
                    : "Quality mode enabled. This may reduce performance on some devices.",
                  { duration: 3000 }
                );
              }}
              className={`bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm shadow-lg ${
                performanceMode ? "border-green-500" : ""
              }`}
              title="Toggle performance mode for better performance on slower devices"
            >
              {performanceMode ? "Performance Mode" : "Quality Mode"}
            </Button>
            
            <Button
              variant="default"
              size="sm"
              onClick={() => {
                // Reset the model URL to force a refresh
                const currentModel = selectedModel;
                setSelectedModel("");
                setTimeout(() => setSelectedModel(currentModel), 100);
                toast.success("Repositioning the model...", { duration: 1500 });
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-700 dark:hover:bg-blue-800 backdrop-blur-sm shadow-lg"
              title="Can't see the model? Click to reposition it"
            >
              Reset View
            </Button>
            
            <Button
              variant={isTextEditing ? "default" : "outline"}
              onClick={() => setIsTextEditing(!isTextEditing)}
              size="sm"
              className="bg-white/80 hover:bg-blue-600 dark:bg-slate-800/80 backdrop-blur-sm shadow-lg"
            >
              {isTextEditing ? "Done Editing" : "Edit Text"}
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm shadow-lg"
              onClick={() => setShowTextControls(!showTextControls)}
            >
              Text Options
            </Button>
          </div>
          
          {/* Text editing tooltip with improved styling */}
          {isTextEditing && (
            <div className="absolute top-4 left-1/2 transform -translate-x-1/2 p-3 bg-black/75 text-white rounded-lg z-20 backdrop-blur-sm shadow-lg animate-fadeIn">
              <div className="flex items-center">
                <span className="inline-block w-2 h-2 bg-blue-500 rounded-full animate-ping mr-2"></span>
                Click on the model to place text. Drag text to reposition.
              </div>
            </div>
          )}
          
          {/* Floating text editor panel */}
          {showTextControls && (
            <div className="absolute right-4 bottom-16 p-4 bg-white/90 dark:bg-slate-800/90 rounded-lg shadow-lg backdrop-blur-sm z-20 w-72 animate-slideIn">
              <h3 className="text-lg font-semibold mb-3">Text Settings</h3>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium" htmlFor="textContent">Text Content</label>
                  <input 
                    id="textContent"
                    type="text" 
                    value={text3D}
                    onChange={(e) => handleTextChange(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md text-sm"
                    placeholder="Enter text content"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium" htmlFor="textColor">Text Color</label>
                  <div className="flex gap-2">
                    <input 
                      id="textColor"
                      type="color" 
                      value={textColor}
                      onChange={(e) => handleColorChange(e.target.value)}
                      className="w-10 h-10 rounded border"
                      title="Select text color"
                    />
                    <input 
                      type="text" 
                      value={textColor}
                      onChange={(e) => handleColorChange(e.target.value)}
                      className="flex-1 px-3 py-2 border rounded-md text-sm"
                      placeholder="Enter color code"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium" htmlFor="textSize">Size</label>
                  <input 
                    id="textSize"
                    type="range" 
                    min="0.5" 
                    max="2" 
                    step="0.1"
                    value={textScale.x}
                    onChange={(e) => handleScaleChange(parseFloat(e.target.value))}
                    className="w-full"
                    title="Adjust text size"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}