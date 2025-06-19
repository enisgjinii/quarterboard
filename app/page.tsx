"use client"

import { Suspense, useState, useEffect, useCallback, useRef } from "react"
import { AppSidebar } from "./components/app-sidebar"
import { Button } from "@/components/ui/button"
import { Moon, Sun, RotateCcw, Maximize2, Settings } from "lucide-react"
import { useTheme } from "next-themes"
import { toast } from "sonner"
import { R3FModelViewer } from "./components/r3f-model-viewer"
import debounce from "lodash.debounce"
import { useDevicePerformance } from "@/hooks/use-device-performance"
import { usePerformanceMonitor } from "@/hooks/use-performance-monitor"

interface MeshData {
  name: string;
  color: string;
  originalMaterial: any;
}

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
  const [modelColor, setModelColor] = useState("#8B4513")
  const [modelLoaded, setModelLoaded] = useState(false)
  const [meshes, setMeshes] = useState<MeshData[]>([])
  const [selectedMesh, setSelectedMesh] = useState<string | null>(null)
  const [meshColors, setMeshColors] = useState<Record<string, string>>({})
  const [mounted, setMounted] = useState(false)
  const { isLowEndDevice } = useDevicePerformance()
  const [performanceMode, setPerformanceMode] = useState(isLowEndDevice)
  
  // 3D Text states with improved defaults
  const [text3D, setText3D] = useState("YOUR TEXT")
  const [textColor, setTextColor] = useState("#2C1810")
  const [textPosition, setTextPosition] = useState({ x: 0, y: 1.5, z: 0 })
  const [textRotation, setTextRotation] = useState({ x: 0, y: 0, z: 0 })
  const [textScale, setTextScale] = useState({ x: 1, y: 1, z: 1 })
  const [textMaterial, setTextMaterial] = useState<'standard' | 'emissive' | 'engraved'>('standard')
  const [isTextEditing, setIsTextEditing] = useState(false)

  const { theme, setTheme } = useTheme()
  const [selectedFont, setSelectedFont] = useState("helvetiker_regular.typeface.json")
  
  // Enhanced UI states
  const [modelLoading, setModelLoading] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    // Auto-enable performance mode on low-end devices
    if (isLowEndDevice) {
      setPerformanceMode(true);
      toast.info("Performance mode enabled for better experience", {
        duration: 3000,
      });
    }
  }, [isLowEndDevice]);
  
  // Monitor performance and recommend performance mode if needed
  const handleRecommendPerformanceMode = useCallback(() => {
    toast.info(
      "Enable performance mode for smoother experience?",
      {
        duration: 8000,
        action: {
          label: "Enable",
          onClick: () => setPerformanceMode(true)
        }
      }
    );
  }, []);
  
  const { averageFps } = usePerformanceMonitor(performanceMode, handleRecommendPerformanceMode);
  
  const handleModelLoad = (loadedMeshes: MeshData[]) => {
    console.log("Model loaded:", loadedMeshes);
    setModelLoaded(true);
    setMeshes(loadedMeshes);
    
    // Initialize mesh colors
    const initialColors: Record<string, string> = {};
    loadedMeshes.forEach(mesh => {
      initialColors[mesh.name] = modelColor;
    });
    setMeshColors(initialColors);
    
    setModelLoading(false);
  };

  const handleMeshClick = (meshName: string, mesh: any) => {
    setSelectedMesh(meshName);
    toast.success(`Selected: ${meshName}`, { duration: 2000 });
  };
  
  // Update modelUrl when selectedModel changes
  useEffect(() => {
    if (selectedModel) {
      setModelLoading(true);
      setModelLoaded(false);
      setMeshes([]);
      setSelectedMesh(null);
      setMeshColors({});
      
      const encodedModel = encodeURIComponent(selectedModel);
      const fullUrl = `/models/${encodedModel}`;
      setModelUrl(fullUrl);
    }
  }, [selectedModel])

  const handleFontError = useCallback((error: Error) => {
    console.error('Font error:', error);
    if (selectedFont !== 'helvetiker_regular.typeface.json') {
      toast.error('Failed to load font. Using default.');
    }
  }, [selectedFont]);

  const resizeTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    const handleResize = debounce(() => {
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current);
      }
      resizeTimeoutRef.current = window.setTimeout(() => {
        console.log("Window resized");
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

  const resetView = () => {
    const currentModel = selectedModel;
    setSelectedModel("");
    setMeshes([]);
    setSelectedMesh(null);
    setMeshColors({});
    setTimeout(() => setSelectedModel(currentModel), 100);
    toast.success("View reset", { duration: 1500 });
  };

  if (!mounted) {
    return null
  }

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* Performance Monitor */}
      {process.env.NODE_ENV === 'development' && averageFps && (
        <div className="absolute top-4 right-4 z-50 bg-black/80 text-white px-3 py-2 text-xs rounded-lg font-mono backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${averageFps > 50 ? 'bg-green-400' : averageFps > 30 ? 'bg-yellow-400' : 'bg-red-400'}`}></div>
            {averageFps.toFixed(1)} FPS
          </div>
        </div>
      )}
      
      {/* Left Sidebar */}
      <div className={`${sidebarCollapsed ? 'w-16' : 'w-80'} transition-all duration-300 ease-in-out border-r border-slate-200 dark:border-slate-700 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm shadow-xl`}>
        <AppSidebar
          selectedModel={selectedModel}
          setSelectedModel={setSelectedModel}
          modelColor={modelColor}
          setModelColor={setModelColor}
          meshes={meshes}
          selectedMesh={selectedMesh}
          setSelectedMesh={setSelectedMesh}
          meshColors={meshColors}
          setMeshColors={setMeshColors}
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
          textMaterial={textMaterial}
          setTextMaterial={setTextMaterial}
          selectedFont={selectedFont}
          setSelectedFont={setSelectedFont}
          isTextEditing={isTextEditing}
          setIsTextEditing={setIsTextEditing}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
      </div>
      
      {/* Main 3D Viewer Area */}
      <div className="flex-1 relative overflow-hidden">
        {/* Top Control Bar */}
        <div className="absolute top-0 left-0 right-0 z-10 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between px-6 py-3">
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-slate-800 dark:text-slate-200">
                Quarterboard Designer
              </h1>
              <div className="text-sm text-slate-500 dark:text-slate-400">
                {selectedModel.replace('.glb', '').replace(/^The /, '')}
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={resetView}
                className="bg-white/50 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-800 border-slate-300 dark:border-slate-600"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset
              </Button>
              
              <Button
                variant={performanceMode ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  const newMode = !performanceMode;
                  setPerformanceMode(newMode);
                  toast.success(
                    newMode ? "Performance mode enabled" : "Quality mode enabled",
                    { duration: 2000 }
                  );
                }}
                className={`${performanceMode ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-white/50 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-800 border-slate-300 dark:border-slate-600'}`}
              >
                {performanceMode ? "Performance" : "Quality"}
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="bg-white/50 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-800 border-slate-300 dark:border-slate-600"
              >
                {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </div>
        
        {/* Loading Overlay */}
        {modelLoading && (
          <div className="absolute inset-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm flex items-center justify-center z-20">
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-blue-200 dark:border-blue-800 rounded-full"></div>
                <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
              </div>
              <div className="text-center">
                <p className="text-xl font-semibold text-slate-800 dark:text-slate-200 mb-1">
                  Loading Quarterboard
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Preparing your 3D model...
                </p>
              </div>
            </div>
          </div>
        )}
          
        {/* 3D Viewer */}
        <div className="w-full h-full">
          <Suspense fallback={
            <div className="w-full h-full flex items-center justify-center bg-slate-50 dark:bg-slate-900">
              <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-lg font-medium text-slate-600 dark:text-slate-400">Initializing 3D View...</p>
              </div>
            </div>
          }>
            <R3FModelViewer
              modelUrl={modelUrl}
              modelColor={modelColor}
              onModelLoad={handleModelLoad}
              text3D={text3D}
              textColor={textColor}
              textPosition={textPosition}
              textRotation={textRotation}
              textScale={textScale}
              onMeshClick={handleMeshClick}
              selectedMesh={selectedMesh}
              meshColors={meshColors}
              isTextEditing={isTextEditing}
              onTextPositionChange={setTextPosition}
            />
          </Suspense>
        </div>
        
        {/* Bottom Control Bar */}
        <div className="absolute bottom-0 left-0 right-0 z-10 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-t border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-center px-6 py-3">
            <div className="flex items-center gap-3">
              <Button
                variant={isTextEditing ? "default" : "outline"}
                size="sm"
                onClick={() => setIsTextEditing(!isTextEditing)}
                className={`${isTextEditing ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-white/50 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-800 border-slate-300 dark:border-slate-600'}`}
              >
                {isTextEditing ? "Exit Text Edit" : "Edit Text"}
              </Button>
              
              {isTextEditing && (
                <div className="text-sm text-slate-600 dark:text-slate-400 bg-blue-50 dark:bg-blue-900/20 px-3 py-1 rounded-full">
                  Click on the model to place text
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}