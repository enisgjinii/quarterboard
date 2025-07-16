"use client"

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { 
  ZoomIn, ZoomOut, RotateCcw, Maximize2, Minimize2, 
  Camera, Share2, Download, Settings, X, Plus, Minus
} from 'lucide-react'

interface MobileControlsProps {
  onZoomIn: () => void
  onZoomOut: () => void
  onResetView: () => void
  onToggleFullscreen: () => void
  onTakeScreenshot: () => void
  onShare: () => void
  onExport: () => void
  onSettings: () => void
  isFullscreen: boolean
  showControls: boolean
  onToggleControls: () => void
}

export function MobileControls({
  onZoomIn,
  onZoomOut,
  onResetView,
  onToggleFullscreen,
  onTakeScreenshot,
  onShare,
  onExport,
  onSettings,
  isFullscreen,
  showControls,
  onToggleControls
}: MobileControlsProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [lastTouch, setLastTouch] = useState(0)

  // Auto-hide controls after inactivity
  useEffect(() => {
    if (showControls && !isExpanded) {
      const timer = setTimeout(() => {
        onToggleControls()
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [showControls, isExpanded, onToggleControls])

  const handleTouch = () => {
    setLastTouch(Date.now())
    if (!showControls) {
      onToggleControls()
    }
  }

  return (
    <div 
      className="fixed inset-0 pointer-events-none z-40"
      onTouchStart={handleTouch}
    >
      {/* Main Floating Action Button */}
      <div className="absolute bottom-24 right-4 pointer-events-auto">
        <Button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-14 h-14 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
        >
          {isExpanded ? <X className="h-6 w-6" /> : <Plus className="h-6 w-6" />}
        </Button>
      </div>

      {/* Expanded Controls */}
      {isExpanded && (
        <div className="absolute bottom-24 right-4 pointer-events-auto">
          <div className="flex flex-col gap-3">
            {/* Zoom Controls */}
            <div className="flex flex-col gap-2 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-2xl p-3 shadow-lg border border-slate-200/50 dark:border-slate-700/50">
              <Button
                onClick={onZoomIn}
                className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300"
              >
                <ZoomIn className="h-5 w-5" />
              </Button>
              <Button
                onClick={onZoomOut}
                className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300"
              >
                <ZoomOut className="h-5 w-5" />
              </Button>
            </div>

            {/* View Controls */}
            <div className="flex flex-col gap-2 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-2xl p-3 shadow-lg border border-slate-200/50 dark:border-slate-700/50">
              <Button
                onClick={onResetView}
                className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300"
              >
                <RotateCcw className="h-5 w-5" />
              </Button>
              <Button
                onClick={onToggleFullscreen}
                className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300"
              >
                {isFullscreen ? <Minimize2 className="h-5 w-5" /> : <Maximize2 className="h-5 w-5" />}
              </Button>
            </div>

            {/* Action Controls */}
            <div className="flex flex-col gap-2 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-2xl p-3 shadow-lg border border-slate-200/50 dark:border-slate-700/50">
              <Button
                onClick={onTakeScreenshot}
                className="w-12 h-12 rounded-full bg-orange-500 hover:bg-orange-600 text-white"
              >
                <Camera className="h-5 w-5" />
              </Button>
              <Button
                onClick={onShare}
                className="w-12 h-12 rounded-full bg-green-500 hover:bg-green-600 text-white"
              >
                <Share2 className="h-5 w-5" />
              </Button>
              <Button
                onClick={onExport}
                className="w-12 h-12 rounded-full bg-purple-500 hover:bg-purple-600 text-white"
              >
                <Download className="h-5 w-5" />
              </Button>
              <Button
                onClick={onSettings}
                className="w-12 h-12 rounded-full bg-slate-500 hover:bg-slate-600 text-white"
              >
                <Settings className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Access Buttons */}
      {showControls && !isExpanded && (
        <div className="absolute bottom-24 left-4 pointer-events-auto">
          <div className="flex flex-col gap-2">
            <Button
              onClick={onTakeScreenshot}
              className="w-12 h-12 rounded-full bg-orange-500 hover:bg-orange-600 text-white shadow-lg"
            >
              <Camera className="h-5 w-5" />
            </Button>
            <Button
              onClick={onResetView}
              className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 shadow-lg"
            >
              <RotateCcw className="h-5 w-5" />
            </Button>
          </div>
        </div>
      )}

      {/* Gesture Hint */}
      {!showControls && (
        <div className="absolute bottom-32 left-1/2 transform -translate-x-1/2 pointer-events-auto">
          <div className="bg-black/50 text-white px-3 py-1 rounded-full text-xs backdrop-blur-sm">
            Tap to show controls
          </div>
        </div>
      )}
    </div>
  )
} 