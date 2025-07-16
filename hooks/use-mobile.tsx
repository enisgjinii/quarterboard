import * as React from "react"

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return;
    
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }
    mql.addEventListener("change", onChange)
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    return () => mql.removeEventListener("change", onChange)
  }, [])

  return !!isMobile
}

// Enhanced mobile detection with AR-specific features
export function useMobileAR() {
  const [isMobile, setIsMobile] = React.useState(false)
  const [isTablet, setIsTablet] = React.useState(false)
  const [hasTouchScreen, setHasTouchScreen] = React.useState(false)
  const [hasDeviceOrientation, setHasDeviceOrientation] = React.useState(false)
  const [hasWebXR, setHasWebXR] = React.useState(false)
  const [deviceMemory, setDeviceMemory] = React.useState<number | undefined>(undefined)
  const [hardwareConcurrency, setHardwareConcurrency] = React.useState<number | undefined>(undefined)

  React.useEffect(() => {
    if (typeof window === 'undefined') return;

    const checkDeviceCapabilities = () => {
      // Screen size detection
      const width = window.innerWidth
      const height = window.innerHeight
      setIsMobile(width < 768)
      setIsTablet(width >= 768 && width < 1024)

      // Touch screen detection
      setHasTouchScreen('ontouchstart' in window || navigator.maxTouchPoints > 0)

      // Device orientation support
      setHasDeviceOrientation('DeviceOrientationEvent' in window)

      // WebXR support
      setHasWebXR('xr' in navigator)

      // Device capabilities
      setDeviceMemory((navigator as any).deviceMemory)
      setHardwareConcurrency(navigator.hardwareConcurrency)
    }

    checkDeviceCapabilities()
    window.addEventListener('resize', checkDeviceCapabilities)
    return () => window.removeEventListener('resize', checkDeviceCapabilities)
  }, [])

  // AR-specific optimizations based on device capabilities
  const getAROptimizations = () => {
    const isLowEndDevice = deviceMemory && deviceMemory < 4 || hardwareConcurrency && hardwareConcurrency < 4
    
    return {
      // Device type
      isMobile,
      isTablet,
      
      // Performance settings
      antialias: !isMobile && !isLowEndDevice,
      shadowQuality: isMobile || isLowEndDevice ? 'low' : 'high',
      textureQuality: isMobile || isLowEndDevice ? 'medium' : 'high',
      animationSpeed: isMobile ? 0.003 : 0.005,
      floatAmplitude: isMobile ? 0.05 : 0.1,
      
      // Camera settings
      fov: isMobile ? 60 : 75,
      minDistance: isMobile ? 0.5 : 1,
      maxDistance: isMobile ? 5 : 10,
      
      // UI settings
      controlSize: isMobile ? 'large' : 'normal',
      instructionText: isMobile ? 'mobile' : 'desktop',
      
      // Device-specific features
      supportsTouch: hasTouchScreen,
      supportsOrientation: hasDeviceOrientation,
      supportsWebXR: hasWebXR,
      isLowEndDevice
    }
  }

  return {
    isMobile,
    isTablet,
    hasTouchScreen,
    hasDeviceOrientation,
    hasWebXR,
    deviceMemory,
    hardwareConcurrency,
    getAROptimizations
  }
}
