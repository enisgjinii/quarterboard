import { useState, useEffect } from 'react';

// Utility hook to determine if the current device is likely to be low performance
export function useDevicePerformance() {
  const [isLowEndDevice, setIsLowEndDevice] = useState(false);
  
  useEffect(() => {
    // Function to detect if this is likely a low-end device
    const detectLowEndDevice = () => {
      // Check for various indicators of a low-end device
      
      // 1. Check device memory (if available)
      const memory = (navigator as any).deviceMemory;
      if (memory && memory < 4) {
        return true;
      }
      
      // 2. Check logical processors (if available)
      const processors = navigator.hardwareConcurrency;
      if (processors && processors < 4) {
        return true;
      }
      
      // 3. Check if device is mobile
      const userAgent = navigator.userAgent;
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
      
      // 4. Check screen resolution
      const isLowResolution = window.screen.width * window.screen.height < 1280 * 720;
      
      // Mobile + low resolution is likely a low-end device
      if (isMobile && isLowResolution) {
        return true;
      }
      
      // 5. Check for other performance indicators
      const isLowEndBrowser = 
        !window.requestAnimationFrame || 
        !window.WebGLRenderingContext;
      
      return isLowEndBrowser;
    };
    
    // Only run detection on client side
    if (typeof window !== 'undefined') {
      setIsLowEndDevice(detectLowEndDevice());
    }
  }, []);
  
  return { isLowEndDevice };
}
