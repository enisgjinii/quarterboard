"use client"

import { Suspense, useState, useEffect, useCallback, useRef, useMemo } from "react"
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
  const [modelUrl, setModelUrl] = useState(`/models/${encodeURIComponent(selectedModel)}`);
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
  const [textMaterial, setTextMaterial] = useState<'standard' | 'emissive' | 'engraved'>('engraved')
  const [isTextEditing, setIsTextEditing] = useState(false)

  const { theme, setTheme } = useTheme()
  const [selectedFont, setSelectedFont] = useState("helvetiker_regular.typeface.json")
  
  // Enhanced UI states
  const [modelLoading, setModelLoading] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Memoize callbacks to prevent unnecessary re-renders
  const handleModelLoad = useCallback((loadedMeshes: MeshData[]) => {
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
  }, [modelColor]);

  const handleMeshClick = useCallback((meshName: string, mesh: any) => {
    setSelectedMesh(meshName);
    toast.success(`Selected: ${meshName}`, { duration: 2000 });
  }, []);
  
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
  
  const resetView = useCallback(() => {
    const currentModel = selectedModel;
    setSelectedModel("");
    setMeshes([]);
    setSelectedMesh(null);
    setMeshColors({});
    setTimeout(() => setSelectedModel(currentModel), 100);
    toast.success("View reset", { duration: 1500 });
  }, [selectedModel]);

  // Memoize debounced handlers
  const handleTextChange = useMemo(
    () => debounce((value: string) => {
      setText3D(value);
    }, 300),
    []
  );

  const handleColorChange = useMemo(
    () => debounce((value: string) => {
      setTextColor(value);
    }, 300),
    []
  );

  const handleScaleChange = useMemo(
    () => debounce((value: number) => {
      setTextScale({ x: value, y: value, z: value });
    }, 300),
    []
  );

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
  const { averageFps } = usePerformanceMonitor(performanceMode, handleRecommendPerformanceMode);
  
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

  if (!mounted) {
    return null
  }

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* Left Sidebar - 1/2 width */}
      <div className="w-1/2 border-r border-slate-200 dark:border-slate-700 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm shadow-xl">
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
          averageFps={averageFps || undefined}
          performanceMode={performanceMode}
          setPerformanceMode={setPerformanceMode}
          resetView={resetView}
        />
      </div>
      
      {/* Main 3D Viewer Area - 1/2 width */}
      <div className="w-1/2 flex flex-col overflow-hidden">
        {/* Top Control Bar */}
        <div className="flex-shrink-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between px-4 py-2">
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-slate-800 dark:text-slate-200">
                Quarterboard Designer
              </h1>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                {selectedModel.replace('.glb', '').replace(/^The /, '')}
              </div>
            </div>
            
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="h-8 px-2 bg-white/50 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-800 border-slate-300 dark:border-slate-600"
              >
                {theme === "dark" ? <Sun className="h-3 w-3" /> : <Moon className="h-3 w-3" />}
              </Button>
            </div>
          </div>
        </div>
        
        {/* 3D Viewer - Takes all remaining space */}
        <div className="flex-1 relative">
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
          
          <Suspense fallback={
            <div className="w-full h-full flex items-center justify-center bg-slate-50 dark:bg-slate-900">
              <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-lg font-medium text-slate-600 dark:text-slate-400">Initializing 3D View...</p>
              </div>
            </div>
          }>
            <R3FModelViewer
              key={modelUrl}
              modelUrl={modelUrl}
              modelColor={modelColor}
              onModelLoad={handleModelLoad}
              text3D={text3D}
              textColor={textColor}
              textPosition={textPosition}
              textRotation={textRotation}
              textScale={textScale}
              textMaterial={textMaterial}
              onMeshClick={handleMeshClick}
              selectedMesh={selectedMesh}
              meshColors={meshColors}
              isTextEditing={isTextEditing}
              onTextPositionChange={setTextPosition}
            />
          </Suspense>
        </div>
      </div>
    </div>
  )
}