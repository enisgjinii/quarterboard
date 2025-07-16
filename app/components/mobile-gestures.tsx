"use client"

import { useEffect, useRef, useState } from 'react'

interface MobileGesturesProps {
  onPinchZoom?: (scale: number) => void
  onPan?: (deltaX: number, deltaY: number) => void
  onRotate?: (rotation: number) => void
  onDoubleTap?: () => void
  onSwipeUp?: () => void
  onSwipeDown?: () => void
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
  onLongPress?: () => void
  onTap?: (x: number, y: number) => void
  children: React.ReactNode
}

export function MobileGestures({
  onPinchZoom,
  onPan,
  onRotate,
  onDoubleTap,
  onSwipeUp,
  onSwipeDown,
  onSwipeLeft,
  onSwipeRight,
  onLongPress,
  onTap,
  children
}: MobileGesturesProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const touchStartRef = useRef<{ x: number; y: number; distance: number; angle: number; time: number } | null>(null)
  const lastTapRef = useRef(0)
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null)
  const [isLongPressing, setIsLongPressing] = useState(false)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const handleTouchStart = (e: TouchEvent) => {
      e.preventDefault()
      
      const touch = e.touches[0]
      const time = Date.now()
      
      if (e.touches.length === 1) {
        touchStartRef.current = {
          x: touch.clientX,
          y: touch.clientY,
          distance: 0,
          angle: 0,
          time
        }

        // Start long press timer
        if (onLongPress) {
          longPressTimerRef.current = setTimeout(() => {
            setIsLongPressing(true)
            onLongPress()
          }, 500)
        }
      } else if (e.touches.length === 2) {
        const touch1 = e.touches[0]
        const touch2 = e.touches[1]
        const distance = Math.sqrt(
          Math.pow(touch2.clientX - touch1.clientX, 2) +
          Math.pow(touch2.clientY - touch1.clientY, 2)
        )
        const angle = Math.atan2(
          touch2.clientY - touch1.clientY,
          touch2.clientX - touch1.clientX
        )
        touchStartRef.current = {
          x: (touch1.clientX + touch2.clientX) / 2,
          y: (touch1.clientY + touch2.clientY) / 2,
          distance,
          angle,
          time
        }
      }
    }

    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault()
      
      if (!touchStartRef.current) return

      // Cancel long press if user moves finger
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current)
        longPressTimerRef.current = null
      }

      if (e.touches.length === 1 && onPan) {
        const touch = e.touches[0]
        const deltaX = touch.clientX - touchStartRef.current.x
        const deltaY = touch.clientY - touchStartRef.current.y
        
        // Only trigger pan if movement is significant
        if (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5) {
          onPan(deltaX, deltaY)
          touchStartRef.current = {
            x: touch.clientX,
            y: touch.clientY,
            distance: 0,
            angle: 0,
            time: Date.now()
          }
        }
      } else if (e.touches.length === 2) {
        const touch1 = e.touches[0]
        const touch2 = e.touches[1]
        const currentDistance = Math.sqrt(
          Math.pow(touch2.clientX - touch1.clientX, 2) +
          Math.pow(touch2.clientY - touch1.clientY, 2)
        )
        const currentAngle = Math.atan2(
          touch2.clientY - touch1.clientY,
          touch2.clientX - touch1.clientX
        )

        if (onPinchZoom && touchStartRef.current.distance > 0) {
          const scale = currentDistance / touchStartRef.current.distance
          onPinchZoom(scale)
        }

        if (onRotate && touchStartRef.current.distance > 0) {
          const rotation = currentAngle - touchStartRef.current.angle
          onRotate(rotation)
        }

        touchStartRef.current = {
          x: (touch1.clientX + touch2.clientX) / 2,
          y: (touch1.clientY + touch2.clientY) / 2,
          distance: currentDistance,
          angle: currentAngle,
          time: Date.now()
        }
      }
    }

    const handleTouchEnd = (e: TouchEvent) => {
      if (e.touches.length === 0) {
        // Cancel long press timer
        if (longPressTimerRef.current) {
          clearTimeout(longPressTimerRef.current)
          longPressTimerRef.current = null
        }

        if (touchStartRef.current) {
          const timeDiff = Date.now() - touchStartRef.current.time
          const distance = Math.sqrt(
            Math.pow(e.changedTouches[0].clientX - touchStartRef.current.x, 2) +
            Math.pow(e.changedTouches[0].clientY - touchStartRef.current.y, 2)
          )

          // Detect swipe gestures
          if (distance > 50 && timeDiff < 300) {
            const deltaX = e.changedTouches[0].clientX - touchStartRef.current.x
            const deltaY = e.changedTouches[0].clientY - touchStartRef.current.y
            
            if (Math.abs(deltaX) > Math.abs(deltaY)) {
              // Horizontal swipe
              if (deltaX > 0 && onSwipeRight) {
                onSwipeRight()
              } else if (deltaX < 0 && onSwipeLeft) {
                onSwipeLeft()
              }
            } else {
              // Vertical swipe
              if (deltaY > 0 && onSwipeDown) {
                onSwipeDown()
              } else if (deltaY < 0 && onSwipeUp) {
                onSwipeUp()
              }
            }
          }

          // Detect tap
          if (distance < 10 && timeDiff < 200 && onTap) {
            onTap(e.changedTouches[0].clientX, e.changedTouches[0].clientY)
          }

          // Detect double tap
          const now = Date.now()
          const timeSinceLastTap = now - lastTapRef.current
          
          if (timeSinceLastTap < 300 && timeSinceLastTap > 0 && distance < 10) {
            e.preventDefault()
            onDoubleTap?.()
          }
          
          lastTapRef.current = now
        }

        touchStartRef.current = null
        setIsLongPressing(false)
      }
    }

    const handleTouchCancel = () => {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current)
        longPressTimerRef.current = null
      }
      touchStartRef.current = null
      setIsLongPressing(false)
    }

    container.addEventListener('touchstart', handleTouchStart, { passive: false })
    container.addEventListener('touchmove', handleTouchMove, { passive: false })
    container.addEventListener('touchend', handleTouchEnd, { passive: false })
    container.addEventListener('touchcancel', handleTouchCancel, { passive: false })

    return () => {
      container.removeEventListener('touchstart', handleTouchStart)
      container.removeEventListener('touchmove', handleTouchMove)
      container.removeEventListener('touchend', handleTouchEnd)
      container.removeEventListener('touchcancel', handleTouchCancel)
      
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current)
      }
    }
  }, [onPinchZoom, onPan, onRotate, onDoubleTap, onSwipeUp, onSwipeDown, onSwipeLeft, onSwipeRight, onLongPress, onTap])

  return (
    <div 
      ref={containerRef}
      className={`w-full h-full touch-none ${isLongPressing ? 'scale-95' : ''}`}
      style={{ touchAction: 'none' }}
    >
      {children}
      
      {/* Long Press Indicator */}
      {isLongPressing && (
        <div className="absolute inset-0 bg-black/20 flex items-center justify-center pointer-events-none">
          <div className="bg-white/90 dark:bg-slate-800/90 rounded-lg px-4 py-2 shadow-lg">
            <div className="text-sm font-medium text-slate-800 dark:text-slate-200">
              Long Press Active
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 