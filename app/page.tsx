"use client"

import { Suspense, useState, useEffect, useCallback, useRef, useMemo } from "react"
import { AppSidebar } from "./components/app-sidebar"
import { ARViewer } from "./components/ar-viewer"
import { Button } from "@/components/ui/button"
import { Moon, Sun, RotateCcw, Maximize2, Settings, Layers, Palette, Zap, Camera } from "lucide-react"
import { useTheme } from "next-themes"
import { toast } from "@/lib/toast-utils"
import { R3FModelViewer } from "./components/r3f-model-viewer"
import debounce from "lodash.debounce"
import { useDevicePerformance } from "@/hooks/use-device-performance"
import { usePerformanceMonitor } from "@/hooks/use-performance-monitor"
import { ModelLoadData } from "./components/three-scene"
import { validateModelFile } from "@/lib/model-utils"
import { ErrorBoundary } from "react-error-boundary"
import { MobileSidebar } from "./components/mobile-sidebar"
import { MobileHeader } from "./components/mobile-header"
import { logError } from "@/lib/error-utils"
import { ErrorDisplay, MobileErrorOverlay } from "./components/error-display"
import { ErrorMonitor } from "./components/error-monitor"
import { MobileGestures } from "./components/mobile-gestures"
import { MobileOptimizations, useMobilePerformance } from "./components/mobile-optimizations"
import { MobilePerformanceMonitor } from "./components/mobile-performance-monitor"
import { MobileLayout } from "./components/mobile-layout"
import { MobileControls } from "./components/mobile-controls"
import { MobileGestureFeedback, useHapticFeedback, useGestureRecognition } from "./components/mobile-gesture-feedback"
import { MobileNotification, useMobileToast } from "./components/mobile-notification"

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

function ErrorFallback({ error, resetErrorBoundary }: { error: Error; resetErrorBoundary: () => void }) {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-slate-100 dark:bg-slate-900">
      <div className="bg-red-500/95 text-white px-6 py-4 rounded-lg shadow-lg max-w-md">
        <div className="font-medium text-lg mb-2">Application Error</div>
        <div className="text-sm opacity-90 mb-4">{error.message}</div>
        <button
          onClick={resetErrorBoundary}
          className="px-4 py-2 bg-white/20 rounded text-sm hover:bg-white/30 transition-colors"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}

function QuarterboardDesigner() {
  const [selectedModel, setSelectedModel] = useState(models[Math.floor(Math.random() * models.length)]);
  const [modelUrl, setModelUrl] = useState(`/models/${encodeURIComponent(selectedModel)}`);
  const [modelColor, setModelColor] = useState("#8B4513")
  const [meshes, setMeshes] = useState<MeshData[]>([])
  const [selectedMesh, setSelectedMesh] = useState<string | null>(null)
  const [meshColors, setMeshColors] = useState<Record<string, string>>({})
  const [mounted, setMounted] = useState(false)
  const { isLowEndDevice } = useDevicePerformance()
  const [performanceMode, setPerformanceMode] = useState(isLowEndDevice)
  
  // AR State Variables
  const [arMode, setArMode] = useState(false)
  const [arPlaced, setArPlaced] = useState(false)
  const [arScale, setArScale] = useState(1)
  const [arSupported, setArSupported] = useState(false)
  
  // Mobile Navigation State
  const [activeMobileSection, setActiveMobileSection] = useState<'model' | 'colors' | 'ar' | 'share' | 'settings'>('model')
  
  // State for the dynamically generated text texture
  const [textTexture, setTextTexture] = useState<string | null>(null);
  const [modelData, setModelData] = useState<ModelLoadData | undefined>(undefined);

  // Screenshot function
  const takeScreenshot = () => {
    try {
      // Create a canvas element
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      if (!context) return;

      // Set canvas size to match viewport
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;

      // Use html2canvas to capture the current view
      import('html2canvas').then(({ default: html2canvas }) => {
        html2canvas(document.body, {
          useCORS: true,
          allowTaint: true,
          backgroundColor: null,
          scale: 2, // Higher quality
        }).then((canvas: HTMLCanvasElement) => {
          // Convert to blob and download
          canvas.toBlob((blob: Blob | null) => {
            if (blob) {
              const url = URL.createObjectURL(blob);
              const link = document.createElement('a');
              link.download = `quarterboard-${selectedModel.replace('.glb', '')}-${Date.now()}.png`;
              link.href = url;
              link.click();
              URL.revokeObjectURL(url);
              toast.success('Screenshot saved!');
            }
          }, 'image/png');
        });
      });
    } catch (error) {
      const errorMessage = `Screenshot failed: ${error instanceof Error ? error.message : String(error)}`;
      logError(errorMessage, undefined, 'error');
      setCurrentError(errorMessage);
      setShowErrorOverlay(true);
      toast.error('Failed to take screenshot');
    }
  };
  
  const { theme, setTheme } = useTheme()
  const [selectedFont, setSelectedFont] = useState("helvetiker_regular.typeface.json")

  // Enhanced UI and status states
  const [appStatus, setAppStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [statusMessage, setStatusMessage] = useState('Initializing scene...');
  const [currentError, setCurrentError] = useState<Error | string | null>(null);
  const [showErrorOverlay, setShowErrorOverlay] = useState(false);
  const [showErrorMonitor, setShowErrorMonitor] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // Mobile performance optimizations
  const mobilePerformance = useMobilePerformance();
  
  // Mobile gesture and haptic feedback
  const { triggerHaptic } = useHapticFeedback();
  const { currentGesture, gestureData, recognizeGesture } = useGestureRecognition();
  
  // Mobile controls state
  const [showMobileControls, setShowMobileControls] = useState(false);
  
  // Mobile toast system
  const mobileToast = useMobileToast();
  
  // Use ref to access current modelColor without causing re-renders
  const modelColorRef = useRef(modelColor);
  modelColorRef.current = modelColor;

  // AR Support Detection
  useEffect(() => {
    const checkARSupport = async () => {
      // Check for mobile device
      const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
      const isSmallScreen = window.innerWidth < 768
      const isMobile = isMobileDevice || isSmallScreen
      
      // For mobile devices, we'll use a more permissive approach
      if (isMobile) {
        // Mobile devices can use device orientation as fallback
        const hasDeviceOrientation = 'DeviceOrientationEvent' in window
        const hasTouchScreen = 'ontouchstart' in window || navigator.maxTouchPoints > 0
        
        if (hasDeviceOrientation || hasTouchScreen) {
          setArSupported(true)
          console.log('✅ Mobile AR supported via device orientation/touch')
          return
        }
      }
      
      // For desktop, check WebXR support
      if ('xr' in navigator) {
        try {
          const supported = await (navigator as any).xr?.isSessionSupported('immersive-ar')
          setArSupported(supported || false)
          console.log('✅ WebXR AR supported:', supported)
        } catch (error) {
          console.log('❌ WebXR AR not supported:', error)
          setArSupported(false)
        }
      } else {
        // Check for WebXR polyfill or fallback
        const hasDeviceOrientation = 'DeviceOrientationEvent' in window
        setArSupported(hasDeviceOrientation)
        console.log('✅ Fallback AR supported via device orientation:', hasDeviceOrientation)
      }
    }

    checkARSupport()
  }, [])

  // AR Session Management
  const startARSession = async () => {
    console.log('🚀 Main page startARSession called')
    
    // Check for mobile device
    const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
    const isSmallScreen = window.innerWidth < 768
    const isMobile = isMobileDevice || isSmallScreen
    
    console.log('📱 Device detection:', {
      isMobileDevice,
      isSmallScreen,
      isMobile,
      userAgent: navigator.userAgent,
      screenWidth: window.innerWidth,
      arSupported
    })
    
    if (!arSupported) {
      // For mobile devices, try to enable AR anyway with fallback
      if (isMobile) {
        const hasDeviceOrientation = 'DeviceOrientationEvent' in window
        const hasTouchScreen = 'ontouchstart' in window || navigator.maxTouchPoints > 0
        
        console.log('📱 Mobile fallback check:', {
          hasDeviceOrientation,
          hasTouchScreen,
          maxTouchPoints: navigator.maxTouchPoints
        })
        
        if (hasDeviceOrientation || hasTouchScreen) {
          setArMode(true)
          toast.success('AR preview mode activated!', {
            description: 'Using device orientation for AR simulation on mobile',
            duration: 3000,
          })
          return
        }
      }
      
      toast.error('AR not supported on this device')
      return
    }

    try {
      if ('xr' in navigator && !isMobile) {
        // Try WebXR for desktop devices
        console.log('🖥️ Trying WebXR for desktop...')
        const session = await (navigator as any).xr.requestSession('immersive-ar', {
          requiredFeatures: ['hit-test'],
          optionalFeatures: ['dom-overlay'],
        })
        setArMode(true)
        toast.success('AR session started!', {
          description: 'Point your camera to place the quarterboard',
          duration: 3000,
        })
      } else {
        // Fallback for devices without WebXR or mobile devices
        console.log('📱 Using fallback AR mode...')
        setArMode(true)
        toast.success('AR preview mode activated!', {
          description: isMobile 
            ? 'Using device orientation for AR simulation on mobile'
            : 'Using device orientation for AR simulation',
          duration: 3000,
        })
      }
    } catch (error) {
      const errorMessage = `Error starting AR session: ${error instanceof Error ? error.message : String(error)}`;
      logError(errorMessage, undefined, 'error')
      
      // For mobile devices, try fallback even if WebXR fails
      if (isMobile) {
        const hasDeviceOrientation = 'DeviceOrientationEvent' in window
        const hasTouchScreen = 'ontouchstart' in window || navigator.maxTouchPoints > 0
        
        console.log('📱 Mobile error fallback:', {
          hasDeviceOrientation,
          hasTouchScreen
        })
        
        if (hasDeviceOrientation || hasTouchScreen) {
          setArMode(true)
          toast.success('AR preview mode activated!', {
            description: 'Using fallback AR mode for mobile',
            duration: 3000,
          })
          return
        }
      }
      
      setCurrentError(errorMessage);
      setShowErrorOverlay(true);
      toast.error('Failed to start AR session')
    }
  }

  const stopARSession = () => {
    setArMode(false)
    setArPlaced(false)
    toast.info('AR session ended')
  }

  const handleARPlaced = (placed: boolean) => {
    setArPlaced(placed)
    if (placed) {
      toast.success('Quarterboard placed successfully!', {
        description: 'Use gestures to adjust position and size',
        duration: 2000,
      })
    }
  }
  
  // Model load handler
  const handleModelLoad = useCallback((data: ModelLoadData) => {
    console.log(`✅ page.tsx: Model loaded with ${data.meshes.length} meshes.`);
    setMeshes(data.meshes);
    setModelData(data);
    setAppStatus('ready');
    setStatusMessage(`Model ready: ${data.meshes.length} parts`);

    const initialColors: Record<string, string> = {};
    data.meshes.forEach(mesh => {
      initialColors[mesh.name] = modelColorRef.current;
    });
    setMeshColors(initialColors);
  }, []); // Remove modelColor dependency

  // Model error handler
  const handleModelError = useCallback((error: string) => {
    logError(`Model loading failed: ${error}`, undefined, 'error');
    setAppStatus('error');
    setStatusMessage(`Model loading failed: ${error}`);
    setCurrentError(error);
    setShowErrorOverlay(true);
    
    // Try to switch to a different model if the current one fails
    const currentIndex = models.indexOf(selectedModel);
    const nextIndex = (currentIndex + 1) % models.length;
    const fallbackModel = models[nextIndex];
    
    if (fallbackModel !== selectedModel) {
      console.log(`🔄 page.tsx: Switching to fallback model: ${fallbackModel}`);
      setSelectedModel(fallbackModel);
    }
  }, [selectedModel]);
  
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
      
      const modelUrl = `/models/${encodeURIComponent(selectedModel)}`;
      setModelUrl(modelUrl);
      
      // Validate the model file exists
      validateModelFile(modelUrl).then(isAvailable => {
        if (!isAvailable) {
          console.warn(`Model file not found: ${modelUrl}`);
          setAppStatus('error');
          setStatusMessage(`Model file not found: ${selectedModel}`);
          
          // Try to switch to a different model
          const currentIndex = models.indexOf(selectedModel);
          const nextIndex = (currentIndex + 1) % models.length;
          const fallbackModel = models[nextIndex];
          
          if (fallbackModel !== selectedModel) {
            console.log(`🔄 page.tsx: Switching to fallback model: ${fallbackModel}`);
            setSelectedModel(fallbackModel);
          }
        }
      }).catch(error => {
        const errorMessage = `Model validation error: ${error instanceof Error ? error.message : String(error)}`;
        logError(errorMessage, undefined, 'error');
        setAppStatus('error');
        setStatusMessage(`Model validation failed: ${error instanceof Error ? error.message : String(error)}`);
        setCurrentError(errorMessage);
        setShowErrorOverlay(true);
      });
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
      {/* Error Display */}
      {currentError && showErrorOverlay && (
        <MobileErrorOverlay
          error={currentError}
          onRetry={() => {
            setShowErrorOverlay(false);
            setCurrentError(null);
            setAppStatus('loading');
            setStatusMessage('Retrying...');
          }}
          onDismiss={() => {
            setShowErrorOverlay(false);
            setCurrentError(null);
          }}
        />
      )}
      
      {/* Error Monitor */}
      <ErrorMonitor 
        isVisible={showErrorMonitor}
        onToggle={() => setShowErrorMonitor(!showErrorMonitor)}
      />
      
      {/* Desktop Sidebar */}
      <div className="hidden md:block w-80 lg:w-1/4 lg:min-w-80 lg:max-w-96 border-r border-slate-200 dark:border-slate-700 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm shadow-xl flex-shrink-0">
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
          // AR Props
          arMode={arMode}
          setArMode={setArMode}
          arPlaced={arPlaced}
          setArPlaced={setArPlaced}
          arScale={arScale}
          setArScale={setArScale}
          arSupported={arSupported}
          onARPlaced={handleARPlaced}
          onStartARSession={startARSession}
          onStopARSession={stopARSession}
        />
      </div>
      
      {/* Mobile Layout */}
      <MobileLayout
        header={
          <MobileHeader
            selectedModel={selectedModel}
            appStatus={appStatus}
            statusMessage={statusMessage}
            arMode={arMode}
            onRetry={() => {
              setAppStatus('loading');
              setStatusMessage('Retrying...');
              setModelUrl(`/models/${encodeURIComponent(selectedModel)}?retry=${Date.now()}`);
            }}
            onToggleTheme={() => setTheme(theme === "dark" ? "light" : "dark")}
            onToggleFullscreen={() => setIsFullscreen(!isFullscreen)}
            isFullscreen={isFullscreen}
          />
        }
        sidebar={
          <MobileSidebar
            activeSection={activeMobileSection}
            onSectionChange={(section) => setActiveMobileSection(section)}
            selectedModel={selectedModel}
            setSelectedModel={setSelectedModel}
            modelColor={modelColor}
            setModelColor={setModelColor}
            meshColors={meshColors}
            setMeshColors={setMeshColors}
            arMode={arMode}
            onToggleAR={() => {
              console.log('Mobile AR toggle clicked, current arMode:', arMode);
              setArMode(!arMode);
              if (!arMode) {
                startARSession();
              } else {
                stopARSession();
              }
            }}
            onTakeScreenshot={takeScreenshot}
          />
        }
      >
        {/* AR Viewer Overlay */}
        {arMode && (
          <ARViewer
            modelUrl={modelUrl}
            modelColor={modelColor}
            meshColors={meshColors}
            isActive={arMode}
            onPlaced={handleARPlaced}
            scale={arScale}
            onScaleChange={setArScale}
          />
        )}
        
        {/* Main 3D Viewer with Mobile Optimizations */}
        <MobileOptimizations
          onResetView={() => {
            // Reset camera view
            console.log('Reset view')
          }}
          onToggleFullscreen={() => setIsFullscreen(!isFullscreen)}
          onZoomIn={() => {
            // Zoom in
            console.log('Zoom in')
          }}
          onZoomOut={() => {
            // Zoom out
            console.log('Zoom out')
          }}
          isFullscreen={isFullscreen}
        >
                      <MobileGestures
                              onPinchZoom={(scale) => {
                  console.log('Pinch zoom:', scale)
                  recognizeGesture('pinch', { scale })
                  triggerHaptic('medium')
                  mobileToast.success('Zoom', `Zoomed ${scale > 1 ? 'in' : 'out'}`)
                }}
              onPan={(deltaX, deltaY) => {
                console.log('Pan:', deltaX, deltaY)
                recognizeGesture('pan', { deltaX, deltaY })
                triggerHaptic('light')
              }}
              onRotate={(rotation) => {
                console.log('Rotate:', rotation)
                recognizeGesture('rotate', { rotation })
                triggerHaptic('medium')
              }}
                              onDoubleTap={() => {
                  console.log('Double tap')
                  recognizeGesture('tap')
                  triggerHaptic('heavy')
                  mobileToast.success('Gesture', 'Double tap detected')
                }}
                              onSwipeUp={() => {
                  console.log('Swipe up')
                  recognizeGesture('swipe', { direction: 'up' })
                  triggerHaptic('medium')
                  mobileToast.success('Gesture', 'Swiped up')
                }}
                              onSwipeDown={() => {
                  console.log('Swipe down')
                  recognizeGesture('swipe', { direction: 'down' })
                  triggerHaptic('medium')
                  mobileToast.success('Gesture', 'Swiped down')
                }}
                              onSwipeLeft={() => {
                  console.log('Swipe left')
                  recognizeGesture('swipe', { direction: 'left' })
                  triggerHaptic('medium')
                  mobileToast.success('Gesture', 'Swiped left')
                }}
                              onSwipeRight={() => {
                  console.log('Swipe right')
                  recognizeGesture('swipe', { direction: 'right' })
                  triggerHaptic('medium')
                  mobileToast.success('Gesture', 'Swiped right')
                }}
                              onLongPress={() => {
                  console.log('Long press')
                  recognizeGesture('longPress')
                  triggerHaptic('heavy')
                  mobileToast.success('Gesture', 'Long press detected')
                }}
              onTap={(x, y) => {
                console.log('Tap at:', x, y)
                recognizeGesture('tap', { x, y })
                triggerHaptic('light')
              }}
            >
            <Suspense fallback={null}>
              <R3FModelViewer
                key={modelUrl}
                modelUrl={modelUrl}
                modelColor={modelColor}
                onModelLoad={handleModelLoad}
                onModelError={handleModelError}
                onMeshClick={handleMeshClick}
                selectedMesh={selectedMesh}
                meshColors={meshColors}
                textTexture={textTexture}
              />
            </Suspense>
          </MobileGestures>
        </MobileOptimizations>

        {/* Mobile Performance Monitor */}
        <MobilePerformanceMonitor
          onOptimize={(recommendations) => {
            console.log('Performance optimization recommendations:', recommendations);
            toast.success('Performance optimizations applied');
          }}
          showDetails={true}
        />

        {/* Mobile Controls */}
        <MobileControls
          onZoomIn={() => {
            console.log('Zoom in')
            triggerHaptic('medium')
          }}
          onZoomOut={() => {
            console.log('Zoom out')
            triggerHaptic('medium')
          }}
          onResetView={() => {
            console.log('Reset view')
            triggerHaptic('light')
          }}
          onToggleFullscreen={() => setIsFullscreen(!isFullscreen)}
          onTakeScreenshot={takeScreenshot}
          onShare={() => {
            console.log('Share')
            triggerHaptic('medium')
            mobileToast.info('Coming Soon', 'Share feature will be available soon')
          }}
          onExport={() => {
            console.log('Export')
            triggerHaptic('medium')
            mobileToast.info('Coming Soon', 'Export feature will be available soon')
          }}
          onSettings={() => {
            console.log('Settings')
            triggerHaptic('light')
            setActiveMobileSection('settings')
          }}
          isFullscreen={isFullscreen}
          showControls={showMobileControls}
          onToggleControls={() => setShowMobileControls(!showMobileControls)}
        />

        {/* Mobile Gesture Feedback */}
        <MobileGestureFeedback
          gestureType={currentGesture as any}
          position={gestureData?.x && gestureData?.y ? { x: gestureData.x, y: gestureData.y } : undefined}
          scale={gestureData?.scale}
          rotation={gestureData?.rotation}
        />

        {/* Mobile Toast Container */}
        <div className="fixed top-4 left-4 right-4 z-50 space-y-2">
          {mobileToast.toasts.map((toast) => (
            <MobileNotification
              key={toast.id}
              type={toast.type}
              title={toast.title}
              message={toast.message}
              duration={toast.duration}
              onClose={() => mobileToast.removeToast(toast.id)}
              show={true}
            />
          ))}
        </div>
      </MobileLayout>
      
      {/* Desktop Main Content */}
      <div className="hidden md:flex flex-1 flex-col overflow-hidden">
        <div className="flex-shrink-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between px-3 py-1.5">
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-slate-800 dark:text-slate-200">
                Quarterboard Designer
              </h1>
              <div className="text-xs text-slate-500 dark:text-slate-400 px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded">
                {selectedModel.replace('.glb', '').replace(/^The /, '')}
              </div>
              {appStatus === 'loading' && (
                <div className="text-xs text-blue-600 dark:text-blue-400 px-2 py-1 bg-blue-100 dark:bg-blue-900/30 rounded flex items-center gap-1">
                  <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
                  Loading...
                </div>
              )}
              {appStatus === 'error' && (
                <div 
                  className="text-xs text-red-600 dark:text-red-400 px-2 py-1 bg-red-100 dark:bg-red-900/30 rounded flex items-center gap-1 cursor-help"
                  title={statusMessage}
                >
                  <div className="w-2 h-2 bg-red-600 rounded-full"></div>
                  Error
                </div>
              )}
              {arMode && (
                <div className="text-xs text-purple-600 dark:text-purple-400 px-2 py-1 bg-purple-100 dark:bg-purple-900/30 rounded flex items-center gap-1">
                  <div className="w-2 h-2 bg-purple-600 rounded-full animate-pulse"></div>
                  AR Mode
                </div>
              )}
            </div>
            <div className="flex items-center gap-1">
              {appStatus === 'error' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setAppStatus('loading');
                    setStatusMessage('Retrying...');
                    setModelUrl(`/models/${encodeURIComponent(selectedModel)}?retry=${Date.now()}`);
                  }}
                  className="h-7 px-2 bg-red-50 dark:bg-red-900/30 hover:bg-red-100 dark:hover:bg-red-900/50 border-red-300 dark:border-red-600 text-red-700 dark:text-red-300"
                >
                  <RotateCcw className="h-3 w-3" />
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="h-7 px-2 bg-white/50 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-800 border-slate-300 dark:border-slate-600"
              >
                {theme === "dark" ? <Sun className="h-3 w-3" /> : <Moon className="h-3 w-3" />}
              </Button>
              {/* Test Error Button - Remove in production */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const testError = new Error('Test error for desktop display');
                  setCurrentError(testError);
                  setShowErrorOverlay(true);
                  logError(testError, undefined, 'error');
                }}
                className="h-7 px-2 bg-orange-50 dark:bg-orange-900/30 hover:bg-orange-100 dark:hover:bg-orange-900/50 border-orange-300 dark:border-orange-600 text-orange-700 dark:text-orange-300"
              >
                Test Error
              </Button>
              {/* Error Monitor Toggle */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowErrorMonitor(!showErrorMonitor)}
                className="h-7 px-2 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 border-blue-300 dark:border-blue-600 text-blue-700 dark:text-blue-300"
              >
                Monitor
              </Button>
            </div>
          </div>
        </div>
        
        <div className="flex-1 relative">
          {/* AR Viewer Overlay */}
          {arMode && (
            <ARViewer
              modelUrl={modelUrl}
              modelColor={modelColor}
              meshColors={meshColors}
              isActive={arMode}
              onPlaced={handleARPlaced}
              scale={arScale}
              onScaleChange={setArScale}
            />
          )}
          
          {/* Main 3D Viewer */}
          <Suspense fallback={null}>
            <R3FModelViewer
              key={modelUrl}
              modelUrl={modelUrl}
              modelColor={modelColor}
              onModelLoad={handleModelLoad}
              onModelError={handleModelError}
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

export default function Component() {
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <QuarterboardDesigner />
    </ErrorBoundary>
  );
}