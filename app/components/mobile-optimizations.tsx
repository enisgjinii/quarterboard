"use client"

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Maximize2, Minimize2, RotateCcw, ZoomIn, ZoomOut } from 'lucide-react'

interface MobileOptimizationsProps {
  onResetView: () => void
  onToggleFullscreen: () => void
  onZoomIn: () => void
  onZoomOut: () => void
  isFullscreen: boolean
  children: React.ReactNode
}

export function MobileOptimizations({
  onResetView,
  onToggleFullscreen,
  onZoomIn,
  onZoomOut,
  isFullscreen,
  children
}: MobileOptimizationsProps) {
  const [showControls, setShowControls] = useState(false)
  const [isLowPerformance, setIsLowPerformance] = useState(false)

  // Detect low performance devices
  useEffect(() => {
    const checkPerformance = () => {
      const memory = (navigator as any).deviceMemory || 4
      const cores = (navigator as any).hardwareConcurrency || 4
      const isLowEnd = memory < 4 || cores < 4
      setIsLowPerformance(isLowEnd)
    }

    checkPerformance()
  }, [])

  // Auto-hide controls after inactivity
  useEffect(() => {
    if (showControls) {
      const timer = setTimeout(() => {
        setShowControls(false)
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [showControls])

  const handleTouchStart = () => {
    setShowControls(true)
  }

  return (
    <div 
      className="relative w-full h-full"
      onTouchStart={handleTouchStart}
    >
      {children}
      
      {/* Mobile Controls Overlay */}
      {showControls && (
        <div className="absolute top-4 right-4 flex flex-col gap-2 z-10">
          <Button
            size="sm"
            variant="secondary"
            onClick={onResetView}
            className="w-10 h-10 p-0 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm border border-slate-200 dark:border-slate-700 shadow-lg"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
          
          <Button
            size="sm"
            variant="secondary"
            onClick={onZoomIn}
            className="w-10 h-10 p-0 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm border border-slate-200 dark:border-slate-700 shadow-lg"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
          
          <Button
            size="sm"
            variant="secondary"
            onClick={onZoomOut}
            className="w-10 h-10 p-0 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm border border-slate-200 dark:border-slate-700 shadow-lg"
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          
          <Button
            size="sm"
            variant="secondary"
            onClick={onToggleFullscreen}
            className="w-10 h-10 p-0 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm border border-slate-200 dark:border-slate-700 shadow-lg"
          >
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>
        </div>
      )}

      {/* Performance Indicator */}
      {isLowPerformance && (
        <div className="absolute bottom-4 left-4 bg-yellow-500/90 text-white px-3 py-1 rounded-full text-xs backdrop-blur-sm">
          ⚡ Low Performance Mode
        </div>
      )}

      {/* Touch Hint */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/50 text-white px-3 py-1 rounded-full text-xs backdrop-blur-sm">
        Tap to show controls
      </div>
    </div>
  )
}

// Mobile-specific performance hooks
export function useMobilePerformance() {
  const [isLowEndDevice, setIsLowEndDevice] = useState(false)
  const [isLandscape, setIsLandscape] = useState(false)

  useEffect(() => {
    const checkDevice = () => {
      // Check device memory and CPU cores
      const memory = (navigator as any).deviceMemory || 4
      const cores = (navigator as any).hardwareConcurrency || 4
      const isLowEnd = memory < 4 || cores < 4
      setIsLowEndDevice(isLowEnd)
    }

    const checkOrientation = () => {
      setIsLandscape(window.innerWidth > window.innerHeight)
    }

    checkDevice()
    checkOrientation()

    window.addEventListener('resize', checkOrientation)
    window.addEventListener('orientationchange', checkOrientation)

    return () => {
      window.removeEventListener('resize', checkOrientation)
      window.removeEventListener('orientationchange', checkOrientation)
    }
  }, [])

  return {
    isLowEndDevice,
    isLandscape,
    // Performance recommendations
    shouldReduceQuality: isLowEndDevice,
    shouldReduceFPS: isLowEndDevice,
    shouldDisableShadows: isLowEndDevice,
    shouldUseLowResTextures: isLowEndDevice,
    // Orientation recommendations
    shouldAdjustCamera: isLandscape,
    shouldAdjustUI: isLandscape
  }
} 