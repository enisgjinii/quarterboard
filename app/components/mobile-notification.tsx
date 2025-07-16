"use client"

import React, { useState, useEffect } from 'react'
import { X, CheckCircle, AlertCircle, Info, XCircle } from 'lucide-react'

interface MobileNotificationProps {
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message?: string
  duration?: number
  onClose?: () => void
  show?: boolean
}

export function MobileNotification({
  type = 'info',
  title,
  message,
  duration = 4000,
  onClose,
  show = true
}: MobileNotificationProps) {
  const [isVisible, setIsVisible] = useState(show)
  const [isAnimating, setIsAnimating] = useState(false)

  useEffect(() => {
    setIsVisible(show)
  }, [show])

  useEffect(() => {
    if (isVisible && duration > 0) {
      const timer = setTimeout(() => {
        handleClose()
      }, duration)
      return () => clearTimeout(timer)
    }
  }, [isVisible, duration])

  const handleClose = () => {
    setIsAnimating(true)
    setTimeout(() => {
      setIsVisible(false)
      setIsAnimating(false)
      onClose?.()
    }, 200)
  }

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />
      case 'info':
        return <Info className="h-5 w-5 text-blue-500" />
      default:
        return <Info className="h-5 w-5 text-blue-500" />
    }
  }

  const getBackgroundColor = () => {
    switch (type) {
      case 'success':
        return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
      case 'error':
        return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
      case 'warning':
        return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
      case 'info':
        return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
      default:
        return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
    }
  }

  const getTextColor = () => {
    switch (type) {
      case 'success':
        return 'text-green-800 dark:text-green-200'
      case 'error':
        return 'text-red-800 dark:text-red-200'
      case 'warning':
        return 'text-yellow-800 dark:text-yellow-200'
      case 'info':
        return 'text-blue-800 dark:text-blue-200'
      default:
        return 'text-blue-800 dark:text-blue-200'
    }
  }

  if (!isVisible) return null

  return (
    <div className="fixed top-4 left-4 right-4 z-50 pointer-events-auto">
      <div 
        className={`${getBackgroundColor()} ${getTextColor()} border rounded-xl p-4 shadow-lg backdrop-blur-sm transition-all duration-200 ${
          isAnimating ? 'opacity-0 transform -translate-y-2' : 'opacity-100 transform translate-y-0'
        }`}
      >
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-0.5">
            {getIcon()}
          </div>
          
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-semibold mb-1">{title}</h4>
            {message && (
              <p className="text-xs opacity-90">{message}</p>
            )}
          </div>
          
          <button
            onClick={handleClose}
            className="flex-shrink-0 p-1 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors mobile-touch-feedback"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

// Toast notification system
interface Toast {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message?: string
  duration?: number
}

export function useMobileToast() {
  const [toasts, setToasts] = useState<Toast[]>([])

  const addToast = (toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9)
    const newToast = { ...toast, id }
    setToasts(prev => [...prev, newToast])
  }

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }

  const success = (title: string, message?: string) => {
    addToast({ type: 'success', title, message })
  }

  const error = (title: string, message?: string) => {
    addToast({ type: 'error', title, message })
  }

  const warning = (title: string, message?: string) => {
    addToast({ type: 'warning', title, message })
  }

  const info = (title: string, message?: string) => {
    addToast({ type: 'info', title, message })
  }

  return {
    toasts,
    removeToast,
    success,
    error,
    warning,
    info
  }
}

export function MobileToastContainer() {
  const { toasts, removeToast } = useMobileToast()

  return (
    <div className="fixed top-4 left-4 right-4 z-50 space-y-2">
      {toasts.map((toast) => (
        <MobileNotification
          key={toast.id}
          type={toast.type}
          title={toast.title}
          message={toast.message}
          duration={toast.duration}
          onClose={() => removeToast(toast.id)}
          show={true}
        />
      ))}
    </div>
  )
} 