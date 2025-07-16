"use client"

import React, { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { 
  Activity, Battery, Wifi, WifiOff, Signal, SignalHigh, SignalMedium, SignalLow,
  Smartphone, Tablet, Monitor, Zap, Settings, Info, AlertTriangle, CheckCircle
} from 'lucide-react'

interface PerformanceMetrics {
  fps: number
  memory: number
  battery: number | null
  network: 'online' | 'offline'
  signal: 'high' | 'medium' | 'low'
  deviceType: 'mobile' | 'tablet' | 'desktop'
  isLowEnd: boolean
  recommendations: string[]
}

interface MobilePerformanceMonitorProps {
  onOptimize?: (recommendations: string[]) => void
  showDetails?: boolean
}

export function MobilePerformanceMonitor({
  onOptimize,
  showDetails = false
}: MobilePerformanceMonitorProps) {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    fps: 60,
    memory: 0,
    battery: null,
    network: 'online',
    signal: 'high',
    deviceType: 'mobile',
    isLowEnd: false,
    recommendations: []
  })
  const [isVisible, setIsVisible] = useState(false)
  const [lastUpdate, setLastUpdate] = useState(Date.now())

  // Detect device type
  const detectDeviceType = useCallback(() => {
    const userAgent = navigator.userAgent.toLowerCase()
    const isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent)
    const isTablet = /ipad|android(?=.*\b(?!.*\bmobile\b))/.test(userAgent)
    
    if (isTablet) return 'tablet'
    if (isMobile) return 'mobile'
    return 'desktop'
  }, [])

  // Check device performance
  const checkPerformance = useCallback(() => {
    const memory = (navigator as any).deviceMemory || 4
    const cores = (navigator as any).hardwareConcurrency || 4
    const isLowEnd = memory < 4 || cores < 4
    
    return { memory, cores, isLowEnd }
  }, [])

  // Monitor FPS
  const monitorFPS = useCallback(() => {
    let frameCount = 0
    let lastTime = performance.now()
    
    const countFPS = () => {
      frameCount++
      const currentTime = performance.now()
      
      if (currentTime - lastTime >= 1000) {
        const fps = Math.round((frameCount * 1000) / (currentTime - lastTime))
        setMetrics(prev => ({ ...prev, fps }))
        frameCount = 0
        lastTime = currentTime
      }
      
      requestAnimationFrame(countFPS)
    }
    
    requestAnimationFrame(countFPS)
  }, [])

  // Monitor battery
  const monitorBattery = useCallback(() => {
    if ('getBattery' in navigator) {
      (navigator as any).getBattery().then((battery: any) => {
        setMetrics(prev => ({ ...prev, battery: battery.level * 100 }))
        
        battery.addEventListener('levelchange', () => {
          setMetrics(prev => ({ ...prev, battery: battery.level * 100 }))
        })
      })
    }
  }, [])

  // Monitor network
  const monitorNetwork = useCallback(() => {
    const handleOnline = () => setMetrics(prev => ({ ...prev, network: 'online' }))
    const handleOffline = () => setMetrics(prev => ({ ...prev, network: 'offline' }))
    
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Simulate signal strength changes
  const simulateSignal = useCallback(() => {
    const interval = setInterval(() => {
      const random = Math.random()
      let signal: 'high' | 'medium' | 'low' = 'high'
      
      if (random < 0.7) signal = 'high'
      else if (random < 0.9) signal = 'medium'
      else signal = 'low'
      
      setMetrics(prev => ({ ...prev, signal }))
    }, 15000)

    return () => clearInterval(interval)
  }, [])

  // Generate recommendations
  const generateRecommendations = useCallback((metrics: PerformanceMetrics) => {
    const recommendations: string[] = []
    
    if (metrics.fps < 30) {
      recommendations.push('Reduce 3D quality for better performance')
    }
    
    if (metrics.battery && metrics.battery < 20) {
      recommendations.push('Low battery - consider reducing animations')
    }
    
    if (metrics.network === 'offline') {
      recommendations.push('You\'re offline - some features may be limited')
    }
    
    if (metrics.signal === 'low') {
      recommendations.push('Poor signal - consider downloading models for offline use')
    }
    
    if (metrics.isLowEnd) {
      recommendations.push('Low-end device detected - enabling performance mode')
    }
    
    return recommendations
  }, [])

  // Initialize monitoring
  useEffect(() => {
    const deviceType = detectDeviceType()
    const { memory, cores, isLowEnd } = checkPerformance()
    
    setMetrics(prev => ({
      ...prev,
      deviceType,
      memory,
      isLowEnd
    }))
    
    monitorFPS()
    monitorBattery()
    const networkCleanup = monitorNetwork()
    const signalCleanup = simulateSignal()
    
    return () => {
      networkCleanup()
      signalCleanup()
    }
  }, [detectDeviceType, checkPerformance, monitorFPS, monitorBattery, monitorNetwork, simulateSignal])

  // Update recommendations
  useEffect(() => {
    const recommendations = generateRecommendations(metrics)
    setMetrics(prev => ({ ...prev, recommendations }))
    setLastUpdate(Date.now())
  }, [metrics.fps, metrics.battery, metrics.network, metrics.signal, generateRecommendations])

  const getSignalIcon = () => {
    switch (metrics.signal) {
      case 'high': return <SignalHigh className="h-4 w-4" />
      case 'medium': return <SignalMedium className="h-4 w-4" />
      case 'low': return <SignalLow className="h-4 w-4" />
      default: return <Signal className="h-4 w-4" />
    }
  }

  const getDeviceIcon = () => {
    switch (metrics.deviceType) {
      case 'mobile': return <Smartphone className="h-4 w-4" />
      case 'tablet': return <Tablet className="h-4 w-4" />
      case 'desktop': return <Monitor className="h-4 w-4" />
      default: return <Smartphone className="h-4 w-4" />
    }
  }

  const getPerformanceColor = () => {
    if (metrics.fps >= 50) return 'text-green-600'
    if (metrics.fps >= 30) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getBatteryColor = () => {
    if (!metrics.battery) return 'text-gray-600'
    if (metrics.battery > 50) return 'text-green-600'
    if (metrics.battery > 20) return 'text-yellow-600'
    return 'text-red-600'
  }

  return (
    <div className="fixed top-4 right-4 z-50">
      {/* Performance Toggle Button */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsVisible(!isVisible)}
        className="h-8 w-8 p-0 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm border border-slate-200 dark:border-slate-700 shadow-lg"
      >
        <Activity className="h-4 w-4" />
      </Button>

      {/* Performance Panel */}
      {isVisible && (
        <div className="absolute top-12 right-0 w-80 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-800 dark:text-slate-200">Performance Monitor</h3>
            <div className="flex items-center gap-2">
              {getDeviceIcon()}
              <span className="text-xs text-slate-500 dark:text-slate-400 capitalize">
                {metrics.deviceType}
              </span>
            </div>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <Activity className="h-3 w-3" />
                <span className="text-xs text-slate-600 dark:text-slate-400">FPS</span>
              </div>
              <div className={`text-lg font-bold ${getPerformanceColor()}`}>
                {metrics.fps}
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <Battery className="h-3 w-3" />
                <span className="text-xs text-slate-600 dark:text-slate-400">Battery</span>
              </div>
              <div className={`text-lg font-bold ${getBatteryColor()}`}>
                {metrics.battery ? `${Math.round(metrics.battery)}%` : 'N/A'}
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                {metrics.network === 'online' ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
                <span className="text-xs text-slate-600 dark:text-slate-400">Network</span>
              </div>
              <div className={`text-lg font-bold ${metrics.network === 'online' ? 'text-green-600' : 'text-red-600'}`}>
                {metrics.network}
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                {getSignalIcon()}
                <span className="text-xs text-slate-600 dark:text-slate-400">Signal</span>
              </div>
              <div className="text-lg font-bold text-slate-800 dark:text-slate-200 capitalize">
                {metrics.signal}
              </div>
            </div>
          </div>

          {/* Recommendations */}
          {metrics.recommendations.length > 0 && (
            <div className="mb-4">
              <h4 className="text-sm font-medium text-slate-800 dark:text-slate-200 mb-2">Recommendations</h4>
              <div className="space-y-2">
                {metrics.recommendations.map((rec, index) => (
                  <div key={index} className="flex items-start gap-2 text-xs">
                    <AlertTriangle className="h-3 w-3 text-yellow-600 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-700 dark:text-slate-300">{rec}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Device Info */}
          {showDetails && (
            <div className="border-t border-slate-200 dark:border-slate-700 pt-3">
              <h4 className="text-sm font-medium text-slate-800 dark:text-slate-200 mb-2">Device Info</h4>
              <div className="text-xs text-slate-600 dark:text-slate-400 space-y-1">
                <div>Memory: {metrics.memory}GB</div>
                <div>Low-end: {metrics.isLowEnd ? 'Yes' : 'No'}</div>
                <div>Last update: {new Date(lastUpdate).toLocaleTimeString()}</div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-2 mt-4">
            <Button
              size="sm"
              onClick={() => onOptimize?.(metrics.recommendations)}
              className="flex-1 h-8 text-xs"
            >
              <Zap className="mr-1 h-3 w-3" />
              Optimize
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsVisible(false)}
              className="h-8 px-2 text-xs"
            >
              Close
            </Button>
          </div>
        </div>
      )}
    </div>
  )
} 