import { useState, useEffect } from 'react';

// Performance metrics thresholds
const LOW_FPS_THRESHOLD = 25;
const FPS_SAMPLE_SIZE = 10;
const RECOMMEND_AFTER_SAMPLES = 5;

/**
 * Hook to monitor performance and suggest optimizations
 */
export function usePerformanceMonitor(
  performanceMode: boolean,
  onRecommendPerformanceMode: () => void
) {
  const [frames, setFrames] = useState<number[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [hasRecommended, setHasRecommended] = useState(false);
  
  useEffect(() => {
    // Skip monitoring if already in performance mode or already recommended
    if (performanceMode || hasRecommended) return;
    
    let frameStart = performance.now();
    let animationFrameId: number;
    let lowFrameCount = 0;
    
    const checkFrame = () => {
      const now = performance.now();
      const frameDuration = now - frameStart;
      const fps = 1000 / frameDuration;
      frameStart = now;
      
      setFrames(prev => {
        // Keep only the most recent samples
        const newFrames = [...prev, fps].slice(-FPS_SAMPLE_SIZE);
        
        // If we have enough samples, check if performance is poor
        if (newFrames.length >= FPS_SAMPLE_SIZE && !hasRecommended) {
          const avgFps = newFrames.reduce((sum, curr) => sum + curr, 0) / newFrames.length;
          
          if (avgFps < LOW_FPS_THRESHOLD) {
            lowFrameCount++;
            
            // If consistently low FPS, recommend performance mode
            if (lowFrameCount >= RECOMMEND_AFTER_SAMPLES) {
              setHasRecommended(true);
              onRecommendPerformanceMode();
            }
          } else {
            // Reset counter if FPS improves
            lowFrameCount = 0;
          }
        }
        
        return newFrames;
      });
      
      animationFrameId = requestAnimationFrame(checkFrame);
    };
    
    // Start monitoring after a short delay to avoid initial loading spikes
    if (isMonitoring) {
      const timeoutId = setTimeout(() => {
        animationFrameId = requestAnimationFrame(checkFrame);
      }, 5000);
      
      return () => {
        clearTimeout(timeoutId);
        cancelAnimationFrame(animationFrameId);
      };
    }
  }, [isMonitoring, performanceMode, hasRecommended, onRecommendPerformanceMode]);
  
  // Start monitoring when the scene has loaded
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setIsMonitoring(true);
    }, 3000);
    
    return () => clearTimeout(timeoutId);
  }, []);
  
  return {
    currentFps: frames.length > 0 ? frames[frames.length - 1] : null,
    averageFps: frames.length > 0 ? frames.reduce((sum, curr) => sum + curr, 0) / frames.length : null
  };
}
