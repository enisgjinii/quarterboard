"use client"

import React, { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { 
  Moon, Sun, RotateCcw, Maximize2, Settings, Info, 
  Smartphone, Tablet, Monitor, Wifi, WifiOff, Battery,
  Signal, SignalHigh, SignalMedium, SignalLow, ChevronDown, ChevronUp
} from 'lucide-react'
import { useTheme } from "next-themes"
import { toast } from '@/lib/toast-utils'

interface MobileHeaderProps {
  selectedModel: string
  appStatus: 'loading' | 'ready' | 'error'
  statusMessage: string
  arMode: boolean
  onRetry: () => void
  onToggleTheme: () => void
  onToggleFullscreen: () => void
  isFullscreen: boolean
}

export function MobileHeader({
  selectedModel,
  appStatus,
  statusMessage,
  arMode,
  onRetry,
  onToggleTheme,
  onToggleFullscreen,
  isFullscreen
}: MobileHeaderProps) {
  const { theme } = useTheme()
  const [showStatusDetails, setShowStatusDetails] = useState(false)
  const [networkStatus, setNetworkStatus] = useState<'online' | 'offline'>('online')
  const [batteryLevel, setBatteryLevel] = useState<number | null>(null)
  const [signalStrength, setSignalStrength] = useState<'high' | 'medium' | 'low'>('high')
  const [isCollapsed, setIsCollapsed] = useState(false)

  // Monitor network status
  useEffect(() => {
    const handleOnline = () => setNetworkStatus('online')
    const handleOffline = () => setNetworkStatus('offline')

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Monitor battery level (if supported)
  useEffect(() => {
    if ('getBattery' in navigator) {
      (navigator as any).getBattery().then((battery: any) => {
        setBatteryLevel(battery.level * 100)
        
        battery.addEventListener('levelchange', () => {
          setBatteryLevel(battery.level * 100)
        })
      })
    }
  }, [])

  // Simulate signal strength changes
  useEffect(() => {
    const interval = setInterval(() => {
      const random = Math.random()
      if (random < 0.7) setSignalStrength('high')
      else if (random < 0.9) setSignalStrength('medium')
      else setSignalStrength('low')
    }, 10000)

    return () => clearInterval(interval)
  }, [])

  const getSignalIcon = () => {
    switch (signalStrength) {
      case 'high': return <SignalHigh className="h-3 w-3" />
      case 'medium': return <SignalMedium className="h-3 w-3" />
      case 'low': return <SignalLow className="h-3 w-3" />
      default: return <Signal className="h-3 w-3" />
    }
  }

  const getBatteryIcon = () => {
    if (batteryLevel === null) return <Battery className="h-3 w-3" />
    if (batteryLevel > 50) return <Battery className="h-3 w-3" />
    if (batteryLevel > 20) return <Battery className="h-3 w-3" />
    return <Battery className="h-3 w-3" />
  }

  return (
    <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border-b border-slate-200 dark:border-slate-700">
      {/* Status Bar */}
      <div className="flex items-center justify-between px-3 py-1 text-xs">
        <div className="flex items-center gap-1">
          <Smartphone className="h-3 w-3 text-slate-600" />
          <span className="text-slate-600 dark:text-slate-400">Quarterboard</span>
        </div>
        
        <div className="flex items-center gap-1">
          {networkStatus === 'online' ? (
            <Wifi className="h-3 w-3 text-green-600" />
          ) : (
            <WifiOff className="h-3 w-3 text-red-600" />
          )}
          {getSignalIcon()}
          {getBatteryIcon()}
          {batteryLevel !== null && (
            <span className="text-xs text-slate-600 dark:text-slate-400">
              {Math.round(batteryLevel)}%
            </span>
          )}
        </div>
      </div>

      {/* Main Header */}
      <div className="px-3 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <h1 className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate">
                Quarterboard Designer
              </h1>
              <div className="text-xs text-slate-500 dark:text-slate-400 px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded truncate">
                {selectedModel.replace('.glb', '').replace(/^The /, '')}
              </div>
            </div>
          </div>

          {/* Status Indicators */}
          <div className="flex items-center gap-1">
            {appStatus === 'loading' && (
              <div className="text-xs text-blue-600 dark:text-blue-400 px-2 py-1 bg-blue-100 dark:bg-blue-900/30 rounded flex items-center gap-1">
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
                <span className="hidden sm:inline">Loading</span>
              </div>
            )}
            
            {appStatus === 'error' && (
              <button
                onClick={() => setShowStatusDetails(!showStatusDetails)}
                className="text-xs text-red-600 dark:text-red-400 px-2 py-1 bg-red-100 dark:bg-red-900/30 rounded flex items-center gap-1"
              >
                <div className="w-2 h-2 bg-red-600 rounded-full"></div>
                <span className="hidden sm:inline">Error</span>
              </button>
            )}
            
            {arMode && (
              <div className="text-xs text-purple-600 dark:text-purple-400 px-2 py-1 bg-purple-100 dark:bg-purple-900/30 rounded flex items-center gap-1">
                <div className="w-2 h-2 bg-purple-600 rounded-full animate-pulse"></div>
                <span className="hidden sm:inline">AR</span>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1">
            {appStatus === 'error' && (
              <Button
                variant="outline"
                size="sm"
                onClick={onRetry}
                className="h-7 w-7 p-0 bg-red-50 dark:bg-red-900/30 hover:bg-red-100 dark:hover:bg-red-900/50 border-red-300 dark:border-red-600 text-red-700 dark:text-red-300"
              >
                <RotateCcw className="h-3 w-3" />
              </Button>
            )}
            
            <Button
              variant="outline"
              size="sm"
              onClick={onToggleTheme}
              className="h-7 w-7 p-0 bg-white/50 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-800 border-slate-300 dark:border-slate-600"
            >
              {theme === "dark" ? <Sun className="h-3 w-3" /> : <Moon className="h-3 w-3" />}
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={onToggleFullscreen}
              className="h-7 w-7 p-0 bg-white/50 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-800 border-slate-300 dark:border-slate-600"
            >
              {isFullscreen ? <Maximize2 className="h-3 w-3" /> : <Maximize2 className="h-3 w-3" />}
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="h-7 w-7 p-0 bg-white/50 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-800 border-slate-300 dark:border-slate-600"
            >
              {isCollapsed ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Expandable Status Details */}
      {!isCollapsed && (
        <div className="px-3 pb-2">
          {/* Status Details Overlay */}
          {showStatusDetails && (
            <div className="mb-2">
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Info className="h-4 w-4 text-red-600" />
                  <span className="text-sm font-medium text-red-800 dark:text-red-200">Error Details</span>
                </div>
                <p className="text-xs text-red-700 dark:text-red-300">{statusMessage}</p>
                <div className="mt-2 flex items-center gap-2">
                  <Button
                    size="sm"
                    onClick={onRetry}
                    className="h-6 px-2 text-xs bg-red-600 hover:bg-red-700 text-white"
                  >
                    Retry
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowStatusDetails(false)}
                    className="h-6 px-2 text-xs"
                  >
                    Close
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Network Status Warning */}
          {networkStatus === 'offline' && (
            <div className="mb-2">
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-2">
                <div className="flex items-center gap-2">
                  <WifiOff className="h-4 w-4 text-yellow-600" />
                  <span className="text-xs text-yellow-800 dark:text-yellow-200">You're offline</span>
                </div>
              </div>
            </div>
          )}

          {/* Low Battery Warning */}
          {batteryLevel !== null && batteryLevel < 20 && (
            <div className="mb-2">
              <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-2">
                <div className="flex items-center gap-2">
                  <Battery className="h-4 w-4 text-orange-600" />
                  <span className="text-xs text-orange-800 dark:text-orange-200">
                    Low battery: {Math.round(batteryLevel)}%
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Performance Status */}
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-2 text-center">
              <div className="font-medium text-slate-800 dark:text-slate-200">Network</div>
              <div className={`${networkStatus === 'online' ? 'text-green-600' : 'text-red-600'}`}>
                {networkStatus}
              </div>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-2 text-center">
              <div className="font-medium text-slate-800 dark:text-slate-200">Signal</div>
              <div className="text-slate-600 dark:text-slate-400 capitalize">
                {signalStrength}
              </div>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-2 text-center">
              <div className="font-medium text-slate-800 dark:text-slate-200">Battery</div>
              <div className="text-slate-600 dark:text-slate-400">
                {batteryLevel ? `${Math.round(batteryLevel)}%` : 'N/A'}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 