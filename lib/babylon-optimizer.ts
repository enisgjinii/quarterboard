import { Engine, Scene, DefaultRenderingPipeline, ShadowGenerator } from '@babylonjs/core';

// Function to optimize Babylon.js performance for different device capabilities
export function optimizeBabylonPerformance(
  scene: Scene,
  engine: Engine,
  pipeline: DefaultRenderingPipeline | null,
  shadowGenerator: ShadowGenerator | null,
  performanceMode: boolean
) {
  // Basic optimizations for all devices
  scene.skipFrustumClipping = true;
  scene.blockMaterialDirtyMechanism = true;
  scene.clearCachedVertexData();
  
  // Set a reasonable target frame rate
  engine.setHardwareScalingLevel(performanceMode ? 1.5 : 1.0);
  
  // Adjust shadow quality based on performance mode
  if (shadowGenerator) {
    if (performanceMode) {
      // Low quality shadows for performance mode
      shadowGenerator.useBlurExponentialShadowMap = false;
      shadowGenerator.useKernelBlur = false;
      shadowGenerator.blurScale = 1;
      shadowGenerator.bias = 0.01;
      shadowGenerator.useContactHardeningShadow = false;
      shadowGenerator.contactHardeningLightSizeUVRatio = 0.05;
      shadowGenerator.transparencyShadow = false;
    } else {
      // Better quality shadows for high performance devices
      shadowGenerator.useBlurExponentialShadowMap = true;
      shadowGenerator.blurScale = 2;
      shadowGenerator.bias = 0.0005;
      shadowGenerator.normalBias = 0.0005;
    }
  }
  
  // Optimize post-processing pipeline
  if (pipeline) {
    if (performanceMode) {
      // Minimal post-processing for performance mode
      pipeline.fxaaEnabled = false;
      pipeline.bloomEnabled = false;
      pipeline.chromaticAberrationEnabled = false;
      pipeline.depthOfFieldEnabled = false;
      pipeline.glowLayerEnabled = false;
      pipeline.imageProcessingEnabled = true;
      pipeline.samples = 1;
      
      // Tone down image processing
      if (pipeline.imageProcessing) {
        pipeline.imageProcessing.vignetteEnabled = false;
        pipeline.imageProcessing.contrast = 1.0;
        pipeline.imageProcessing.exposure = 1.0;
      }
    } else {
      // Enable more features for high-end devices
      pipeline.fxaaEnabled = true;
      pipeline.samples = 4;
    }
  }
  
  // Mobile-specific optimizations
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  if (isMobile) {
    // Further reduce quality on mobile regardless of performance mode
    engine.setHardwareScalingLevel(performanceMode ? 2.0 : 1.5);
    scene.getEngine().disablePerformanceMonitorInBackground = true;
    scene.autoClear = false;
    scene.autoClearDepthAndStencil = false;
      // Limit texture sizes
    scene.getEngine().getCaps().maxTextureSize = 1024;
  }
  
  // Optimize visibility distance for performance mode
  if (performanceMode) {
    // Reduce draw distance    scene.fogMode = Scene.FOGMODE_EXP;
    scene.fogDensity = 0.1;
    // Set fog color from clear color components
    if (scene.clearColor) {
      scene.fogColor.r = scene.clearColor.r;
      scene.fogColor.g = scene.clearColor.g;
      scene.fogColor.b = scene.clearColor.b;
    }
  }
}
