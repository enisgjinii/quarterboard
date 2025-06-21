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
import { ModelLoadData } from "./components/three-scene"

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
  const [meshes, setMeshes] = useState<MeshData[]>([])
  const [selectedMesh, setSelectedMesh] = useState<string | null>(null)
  const [meshColors, setMeshColors] = useState<Record<string, string>>({})
  const [mounted, setMounted] = useState(false)
  const { isLowEndDevice } = useDevicePerformance()
  const [performanceMode, setPerformanceMode] = useState(isLowEndDevice)
  
  // State for the dynamically generated text texture
  const [textTexture, setTextTexture] = useState<string | null>(null);
  const [modelData, setModelData] = useState<ModelLoadData | undefined>(undefined);
  
  const { theme, setTheme } = useTheme()
  const [selectedFont, setSelectedFont] = useState("helvetiker_regular.typeface.json")

  // Enhanced UI and status states
  const [appStatus, setAppStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [statusMessage, setStatusMessage] = useState('Initializing scene...');
  
  // Model load handler
  const handleModelLoad = useCallback((data: ModelLoadData) => {
    console.log(`✅ page.tsx: Model loaded with ${data.meshes.length} meshes.`);
    setMeshes(data.meshes);
    setModelData(data);
    setAppStatus('ready');
    setStatusMessage(`Model ready: ${data.meshes.length} parts`);

    const initialColors: Record<string, string> = {};
    data.meshes.forEach(mesh => {
      initialColors[mesh.name] = modelColor;
    });
    setMeshColors(initialColors);
  }, [modelColor]);
  
  // Mesh click handler
  const handleMeshClick = useCallback((meshName: string, mesh: any) => {
    console.log(`🖱️ page.tsx: Mesh selected: ${meshName}`);
    setSelectedMesh(meshName);
    toast.success(`Selected: ${meshName}`, { 
      description: `You can now customize the color of this part.`,
      duration: 3000,
    });
  }, []);

  // Update modelUrl when selectedModel changes
  useEffect(() => {
    if (selectedModel) {
      console.log(`🔄 page.tsx: Switching to model: ${selectedModel}`);
      setAppStatus('loading');
      setStatusMessage(`Loading ${selectedModel.replace('.glb', '')}...`);
      setMeshes([]);
      setSelectedMesh(null);
      setMeshColors({});
      setModelUrl(`/models/${encodeURIComponent(selectedModel)}`);
    }
  }, [selectedModel]);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-100 dark:bg-slate-900">
        <div className="flex items-center gap-3 text-lg font-medium text-slate-600 dark:text-slate-300">
          <div className="w-6 h-6 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          Initializing Designer...
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-100 via-slate-50 to-white dark:from-slate-900 dark:via-slate-800 dark:to-gray-900">
      <div className="w-80 lg:w-1/4 lg:min-w-80 lg:max-w-96 md:w-72 sm:w-64 border-r border-slate-200 dark:border-slate-700 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm shadow-xl flex-shrink-0">
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
          onTextTextureUpdate={setTextTexture}
          modelData={modelData}
        />
      </div>
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-shrink-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between px-3 py-1.5">
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-slate-800 dark:text-slate-200">
                Quarterboard Designer
              </h1>
              <div className="text-xs text-slate-500 dark:text-slate-400 px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded">
                {selectedModel.replace('.glb', '').replace(/^The /, '')}
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="h-7 px-2 bg-white/50 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-800 border-slate-300 dark:border-slate-600"
              >
                {theme === "dark" ? <Sun className="h-3 w-3" /> : <Moon className="h-3 w-3" />}
              </Button>
            </div>
          </div>
        </div>
        
        <div className="flex-1 relative">
          <Suspense fallback={null}>
            <R3FModelViewer
              key={modelUrl}
              modelUrl={modelUrl}
              modelColor={modelColor}
              onModelLoad={handleModelLoad}
              onMeshClick={handleMeshClick}
              selectedMesh={selectedMesh}
              meshColors={meshColors}
              textTexture={textTexture}
            />
          </Suspense>
        </div>
      </div>
    </div>
  )
}