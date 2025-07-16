"use client"

import React, { useState, useEffect } from 'react'

interface GestureFeedbackProps {
  gestureType: 'pinch' | 'pan' | 'rotate' | 'swipe' | 'longPress' | 'tap' | null
  position?: { x: number; y: number }
  scale?: number
  rotation?: number
}

export function MobileGestureFeedback({
  gestureType,
  position,
  scale,
  rotation
}: GestureFeedbackProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [feedbackData, setFeedbackData] = useState<{
    type: string
    icon: string
    color: string
    message: string
  } | null>(null)

  useEffect(() => {
    if (gestureType) {
      const feedback = getGestureFeedback(gestureType, scale, rotation)
      setFeedbackData(feedback)
      setIsVisible(true)
      
      const timer = setTimeout(() => {
        setIsVisible(false)
      }, 1000)
      
      return () => clearTimeout(timer)
    }
  }, [gestureType, scale, rotation])

  const getGestureFeedback = (type: string, scale?: number, rotation?: number) => {
    switch (type) {
      case 'pinch':
        return {
          type: 'pinch',
          icon: '🔍',
          color: 'bg-purple-500',
          message: scale && scale > 1 ? `Zoomed in ${Math.round(scale * 100)}%` : `Zoomed out ${Math.round((1/scale!) * 100)}%`
        }
      case 'pan':
        return {
          type: 'pan',
          icon: '✋',
          color: 'bg-blue-500',
          message: 'Panning view'
        }
      case 'rotate':
        return {
          type: 'rotate',
          icon: '🔄',
          color: 'bg-green-500',
          message: rotation ? `Rotated ${Math.round(rotation * 180 / Math.PI)}°` : 'Rotating view'
        }
      case 'swipe':
        return {
          type: 'swipe',
          icon: '👆',
          color: 'bg-orange-500',
          message: 'Swiped'
        }
      case 'longPress':
        return {
          type: 'longPress',
          icon: '⏰',
          color: 'bg-red-500',
          message: 'Long press detected'
        }
      case 'tap':
        return {
          type: 'tap',
          icon: '👆',
          color: 'bg-slate-500',
          message: 'Tapped'
        }
      default:
        return null
    }
  }

  if (!isVisible || !feedbackData) return null

  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      {/* Central Feedback */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
        <div className={`${feedbackData.color} text-white px-4 py-2 rounded-full shadow-lg backdrop-blur-sm flex items-center gap-2`}>
          <span className="text-lg">{feedbackData.icon}</span>
          <span className="text-sm font-medium">{feedbackData.message}</span>
        </div>
      </div>

      {/* Position-based Feedback */}
      {position && (
        <div 
          className="absolute w-8 h-8 rounded-full bg-white/20 border-2 border-white/40 pointer-events-none animate-pulse"
          style={{
            left: position.x - 16,
            top: position.y - 16
          }}
        />
      )}

      {/* Scale Indicator */}
      {scale && scale !== 1 && (
        <div className="absolute top-4 right-4 bg-black/50 text-white px-3 py-1 rounded-full text-sm backdrop-blur-sm">
          {scale > 1 ? '🔍' : '🔍'} {Math.round(scale * 100)}%
        </div>
      )}

      {/* Rotation Indicator */}
      {rotation && Math.abs(rotation) > 0.1 && (
        <div className="absolute top-4 left-4 bg-black/50 text-white px-3 py-1 rounded-full text-sm backdrop-blur-sm">
          🔄 {Math.round(rotation * 180 / Math.PI)}°
        </div>
      )}
    </div>
  )
}

// Haptic feedback simulation
export function useHapticFeedback() {
  const triggerHaptic = (intensity: 'light' | 'medium' | 'heavy' = 'medium') => {
    // Simulate haptic feedback with CSS animations
    const element = document.createElement('div')
    element.className = `mobile-haptic-${intensity}`
    element.style.position = 'fixed'
    element.style.top = '0'
    element.style.left = '0'
    element.style.width = '100%'
    element.style.height = '100%'
    element.style.pointerEvents = 'none'
    element.style.zIndex = '9999'
    
    document.body.appendChild(element)
    
    setTimeout(() => {
      document.body.removeChild(element)
    }, 200)
  }

  return { triggerHaptic }
}

// Gesture recognition hook
export function useGestureRecognition() {
  const [currentGesture, setCurrentGesture] = useState<string | null>(null)
  const [gestureData, setGestureData] = useState<any>(null)

  const recognizeGesture = (type: string, data?: any) => {
    setCurrentGesture(type)
    setGestureData(data)
    
    // Clear gesture after a short delay
    setTimeout(() => {
      setCurrentGesture(null)
      setGestureData(null)
    }, 1000)
  }

  return {
    currentGesture,
    gestureData,
    recognizeGesture
  }
} 