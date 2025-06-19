import { useEffect, useRef } from 'react';
import { 
  Engine, 
  Scene, 
  ArcRotateCamera, 
  HemisphericLight, 
  Vector3, 
  MeshBuilder, 
  StandardMaterial, 
  Color3, 
  Color4, 
  Texture, 
  PointerDragBehavior,
  DirectionalLight,
  ShadowGenerator,
  GlowLayer,
  DefaultRenderingPipeline,
  SSAORenderingPipeline,
  SSAO2RenderingPipeline,
  PostProcessRenderPipeline,
  EnvironmentHelper,
  CubeTexture,
  Animation,
  EasingFunction,
  CubicEase,
  BackEase,
  FresnelParameters,
  ImageProcessingPostProcess,
  VolumetricLightScatteringPostProcess
} from '@babylonjs/core';
import { AdvancedDynamicTexture, Button, Control } from '@babylonjs/gui';
import { BabylonModelLoader } from './babylon-model-loader';
import { optimizeBabylonPerformance } from '@/lib/babylon-optimizer';
import { optimizeMaterials, optimizeMeshes } from '@/lib/model-optimizer';

interface BabylonSceneProps {
  modelUrl: string;
  modelColor: string;
  onModelLoad: (info: any) => void;
  selectedMaterial: string | null;
  materialPreview: string | null;
  isPreviewMode: boolean;
  text3D: string;
  textColor: string;
  textPosition: { x: number; y: number; z: number };
  textRotation: { x: number; y: number; z: number };
  textScale: { x: number; y: number; z: number };
  text3DOptions: any;
  textMaterial: 'standard' | 'emissive' | 'engraved';
  engraveDepth: number;
  isEngraving: boolean;
  selectedFont: string;
  onFontError: (error: Error) => void;
  uvMapTexture: string | null;
  uvMapText: string;
  uvMapTextOptions: any;
  onSceneReady: (scene: Scene) => void;
  isRecording: boolean;
  onRecordingComplete: (blob: Blob) => void;
  performanceMode?: boolean; // Add performance mode prop
}

export function BabylonScene({
  modelUrl,
  modelColor,
  onModelLoad,
  selectedMaterial,
  materialPreview,
  isPreviewMode,
  text3D,
  textColor,
  textPosition,
  textRotation,
  textScale,
  text3DOptions,
  textMaterial,
  engraveDepth,
  isEngraving,
  selectedFont,
  onFontError,
  uvMapTexture,
  uvMapText,
  uvMapTextOptions,
  onSceneReady,
  isRecording,
  onRecordingComplete,
  performanceMode = false // Default to high quality if not specified
}: BabylonSceneProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<Scene | null>(null);
  const engineRef = useRef<Engine | null>(null);
  const renderingPipelineRef = useRef<DefaultRenderingPipeline | null>(null);
  const shadowGeneratorRef = useRef<ShadowGenerator | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;    // Initialize Babylon.js engine with dynamic settings based on performance mode
    const engine = new Engine(canvasRef.current, true, { 
      preserveDrawingBuffer: true, 
      stencil: true,
      antialias: !performanceMode && window.innerWidth > 1024, // Only enable antialiasing when not in performance mode and on larger screens
      adaptToDeviceRatio: true,
      powerPreference: performanceMode ? 'low-power' : 'high-performance',
      doNotHandleContextLost: performanceMode // Avoid handling context loss in performance mode to save resources
    });
    engineRef.current = engine;
    
    // Create scene with enhanced features
    const scene = new Scene(engine);
    sceneRef.current = scene;
    
    // Add fog effect for depth perception
    scene.fogMode = Scene.FOGMODE_EXP;
    scene.fogDensity = 0.001;
    scene.fogColor = new Color3(0.9, 0.9, 0.9);
    
    // Set scene clear color based on light/dark mode
    const isDarkMode = document.body.classList.contains('dark');
    scene.clearColor = isDarkMode 
      ? new Color4(0.05, 0.05, 0.05, 1.0)
      : new Color4(0.96, 0.96, 0.96, 1.0);    // Create camera with better positioning to view models
    const camera = new ArcRotateCamera(
      "mainCamera",
      Math.PI / 2,        // Alpha - horizontal rotation (side view)
      Math.PI / 3,        // Beta - vertical rotation (45 degrees view)
      15,                 // Radius - further away to see the whole model
      new Vector3(0, 2, 0), // Target - higher up to focus on the model center
      scene
    );
    
    // Add smooth camera controls
    camera.lowerBetaLimit = 0.1;
    camera.upperBetaLimit = Math.PI / 1.5;
    camera.lowerRadiusLimit = 5;
    camera.upperRadiusLimit = 50;
    
    // Improve camera settings for better control
    camera.attachControl(canvasRef.current, true);
    camera.lowerBetaLimit = 0.1;
    camera.upperBetaLimit = Math.PI / 2;
    camera.lowerRadiusLimit = 2;
    camera.upperRadiusLimit = 25;
    camera.wheelPrecision = 50;
    camera.panningSensibility = 50;  
    camera.useBouncingBehavior = true;  // Bounce when hitting limits
    camera.useFramingBehavior = true;  // Better object framing
    camera.useAutoRotationBehavior = true; // Subtle auto-rotation for showcase
    camera.autoRotationBehavior!.idleRotationSpeed = 0.1; // Slow rotation speed
    camera.autoRotationBehavior!.idleRotationWaitTime = 5000; // Wait 5 seconds before starting rotation
    camera.autoRotationBehavior!.idleRotationSpinupTime = 2000; // 2 seconds to reach full speed
    camera.autoRotationBehavior!.zoomStopsAnimation = true; // Stop rotating when user zooms
    
    // Better inertia for smoother camera movement
    camera.inertia = 0.8;
    camera.panningInertia = 0.8;
    camera.angularSensibilityX = 500;
    camera.angularSensibilityY = 500;
    
    // Create enhanced lighting system
    
    // Primary hemisphere light (ambient light)
    const mainLight = new HemisphericLight(
      "mainLight",
      new Vector3(0, 1, 0),
      scene
    );
    mainLight.intensity = 0.7;
    mainLight.diffuse = new Color3(1, 1, 1);
    mainLight.specular = new Color3(1, 1, 1);
    mainLight.groundColor = new Color3(0.5, 0.5, 0.6); // Bluish ground reflection
      // Main directional light with stronger intensity to better illuminate models
    const directionalLight = new DirectionalLight(
      "directionalLight",
      new Vector3(-0.5, -1.5, -0.5),
      scene
    );
    directionalLight.intensity = 1.2; // Brighter light
    directionalLight.diffuse = new Color3(1, 1, 1); // Pure white light for better visibility
    directionalLight.specular = new Color3(1, 1, 1);
    
    // Shadow generator for realistic shadows
    const shadowGenerator = new ShadowGenerator(1024, directionalLight);
    shadowGenerator.useBlurExponentialShadowMap = true;
    shadowGenerator.blurKernel = 32;
    shadowGenerator.depthScale = 100;
    shadowGenerator.bias = 0.00001;
    shadowGeneratorRef.current = shadowGenerator;
    
    // Accent light for dramatic effect
    const accentLight = new DirectionalLight(
      "accentLight",
      new Vector3(1, -0.5, 1),
      scene
    );
    accentLight.intensity = 0.3;
    accentLight.diffuse = new Color3(0.85, 0.9, 1.0); // Slightly cool light
    accentLight.specular = new Color3(0.2, 0.2, 0.3);
    
    // Create stylish ground
    const ground = MeshBuilder.CreateGround(
      "ground",
      { width: 50, height: 50 },
      scene
    );
    const groundMaterial = new StandardMaterial("groundMaterial", scene);
    groundMaterial.diffuseColor = new Color3(0.22, 0.22, 0.25);
    groundMaterial.alpha = 0.7; // Semi-transparent
    groundMaterial.specularColor = new Color3(0.02, 0.02, 0.02);
    
    // Add subtle ground texture
    const groundTexture = new Texture("/placeholder-texture.png", scene);
    groundTexture.uScale = 10;
    groundTexture.vScale = 10;
    groundMaterial.diffuseTexture = groundTexture;
    groundMaterial.bumpTexture = groundTexture;
    groundMaterial.bumpTexture.level = 0.2;
    
    ground.material = groundMaterial;
    ground.position.y = -0.01;
    ground.receiveShadows = true;    // Add reflection to ground with simpler settings
    groundMaterial.reflectionTexture = new CubeTexture("", scene);
    
    // Apply simple reflection settings
    groundMaterial.specularPower = 1;
    groundMaterial.specularColor = new Color3(0.2, 0.2, 0.2);
    
    // Hide the diagnostic markers by default
    const axesHelper = MeshBuilder.CreateLines(
      "axesHelper",
      {
        points: [
          new Vector3(0, 0, 0),
          new Vector3(5, 0, 0),
          new Vector3(0, 0, 0),
          new Vector3(0, 5, 0),
          new Vector3(0, 0, 0),
          new Vector3(0, 0, 5)
        ],
        colors: [
          new Color4(1, 0, 0, 1),
          new Color4(1, 0, 0, 1),
          new Color4(0, 1, 0, 1),
          new Color4(0, 1, 0, 1),
          new Color4(0, 0, 1, 1),
          new Color4(0, 0, 1, 1)
        ]
      },
      scene
    );
    axesHelper.isVisible = false;

    const centerPoint = MeshBuilder.CreateSphere(
      "centerPoint",
      { diameter: 0.1 },
      scene
    );
    const centerMaterial = new StandardMaterial("centerMaterial", scene);
    centerMaterial.diffuseColor = new Color3(1, 0, 0);
    centerPoint.material = centerMaterial;
    centerPoint.isVisible = false;
    
    // Add environment effects
    const environmentHelper = new EnvironmentHelper({
      skyboxTexture: "placeholder-texture.png",
      createGround: false
    }, scene);
    if (environmentHelper.skybox) {
      environmentHelper.skybox.visibility = 0.2; // Subtle skybox
    }
    
    // Add glow layer for highlights
    const glowLayer = new GlowLayer("glowLayer", scene);
    glowLayer.intensity = 0.5;
    
    // Add post-processing effects for visual quality
    const pipeline = new DefaultRenderingPipeline(
      "defaultPipeline",
      true,
      scene,
      [camera]
    );
    renderingPipelineRef.current = pipeline;
    
    // Configure quality post-processing
    pipeline.imageProcessingEnabled = true;
    pipeline.imageProcessing.contrast = 1.1;
    pipeline.imageProcessing.exposure = 1.0;
    
    // Enable and configure antialiasing
    pipeline.samples = 4;
    pipeline.fxaaEnabled = true;
    
    // Bloom effect for highlights
    pipeline.bloomEnabled = true;
    pipeline.bloomThreshold = 0.3;
    pipeline.bloomWeight = 0.4;
    pipeline.bloomKernel = 64;
    pipeline.bloomScale = 0.5;
    
    // Depth of field effect (subtle)
    pipeline.depthOfFieldEnabled = true;
    pipeline.depthOfFieldBlurLevel = 0; // Just enables the effect, will animate on model load
    pipeline.depthOfField.focalLength = 150;
    pipeline.depthOfField.fStop = 1.4;
    pipeline.depthOfField.focusDistance = 2000;
    
    // Chromatic aberration (very subtle)
    pipeline.chromaticAberrationEnabled = true;
    pipeline.chromaticAberration.aberrationAmount = 0.3;
    pipeline.chromaticAberration.radialIntensity = 0.3;
    
    // Grain effect (subtle)
    pipeline.grainEnabled = true;
    pipeline.grain.intensity = 5;
    pipeline.grain.animated = true;
      // Add custom post-processing for vignette effect
    const mainCamera = scene.activeCamera as ArcRotateCamera;
    if (mainCamera) {      // Using volumetric light scattering for a subtle vignette-like effect
      const vlsPostProcess = new VolumetricLightScatteringPostProcess(
        "vls", 1.0, mainCamera, undefined, 100, Texture.BILINEAR_SAMPLINGMODE, engine, false
      );
      vlsPostProcess.exposure = 0.15;
      vlsPostProcess.decay = 0.95;
      vlsPostProcess.weight = 0.3;
      vlsPostProcess.density = 0.5;
    }
    
    // Animation for DoF effect when model loads
    const animateDepthOfField = () => {
      const dofAnimation = new Animation(
        "dofAnimation", 
        "depthOfFieldBlurLevel", 
        30, 
        Animation.ANIMATIONTYPE_FLOAT, 
        Animation.ANIMATIONLOOPMODE_CONSTANT
      );
      
      const keyframes = [
        { frame: 0, value: 5 },  // Start with blur
        { frame: 30, value: 0 }  // End with no blur
      ];
      
      dofAnimation.setKeys(keyframes);
      
      const easingFunction = new BackEase();
      easingFunction.setEasingMode(EasingFunction.EASINGMODE_EASEOUT);
      dofAnimation.setEasingFunction(easingFunction);
      
      pipeline.animations = [dofAnimation];
      scene.beginAnimation(pipeline, 0, 30, false);
    };

    // Create GUI
    const advancedTexture = AdvancedDynamicTexture.CreateFullscreenUI("UI");
    
    // Handle window resize with better throttling for performance
    let resizeTimeout: number;
    const handleResize = () => {
      if (resizeTimeout) {
        clearTimeout(resizeTimeout);
      }
      
      resizeTimeout = window.setTimeout(() => {
        engine.resize();
      }, 100); // Throttle to 100ms
    };
    window.addEventListener('resize', handleResize);
    
    // Add smooth camera animation on scene load
    const cameraStartAlpha = camera.alpha;
    const cameraStartBeta = camera.beta;
    const cameraStartRadius = 20;
    
    camera.alpha = cameraStartAlpha + Math.PI / 2;
    camera.beta = cameraStartBeta - 0.2;
    camera.radius = cameraStartRadius;
    
    const cameraAnimation = new Animation(
      "cameraAnimation", 
      "alpha", 
      30, 
      Animation.ANIMATIONTYPE_FLOAT, 
      Animation.ANIMATIONLOOPMODE_CONSTANT
    );
    
    const alphaKeys = [
      { frame: 0, value: camera.alpha },
      { frame: 60, value: cameraStartAlpha }
    ];
    
    cameraAnimation.setKeys(alphaKeys);
    
    const betaAnimation = new Animation(
      "betaAnimation", 
      "beta", 
      30, 
      Animation.ANIMATIONTYPE_FLOAT, 
      Animation.ANIMATIONLOOPMODE_CONSTANT
    );
    
    const betaKeys = [
      { frame: 0, value: camera.beta },
      { frame: 60, value: cameraStartBeta }
    ];
    
    betaAnimation.setKeys(betaKeys);
    
    const radiusAnimation = new Animation(
      "radiusAnimation", 
      "radius", 
      30, 
      Animation.ANIMATIONTYPE_FLOAT, 
      Animation.ANIMATIONLOOPMODE_CONSTANT
    );
    
    const radiusKeys = [
      { frame: 0, value: camera.radius },
      { frame: 60, value: 12 }
    ];
    
    radiusAnimation.setKeys(radiusKeys);
    
    const easingFunction = new CubicEase();
    easingFunction.setEasingMode(EasingFunction.EASINGMODE_EASEINOUT);
    cameraAnimation.setEasingFunction(easingFunction);
    betaAnimation.setEasingFunction(easingFunction);
    radiusAnimation.setEasingFunction(easingFunction);
    
    camera.animations = [cameraAnimation, betaAnimation, radiusAnimation];
    scene.beginAnimation(camera, 0, 60, false, 1, () => {
      // After camera animation completes, animate DoF
      setTimeout(animateDepthOfField, 500);
    });
    
    // Start render loop with better performance    // Optimize the render loop based on performance needs
    const renderFrameRate = performanceMode ? 30 : 60; // Limit frame rate in performance mode
    const renderInterval = 1000 / renderFrameRate;
    let lastRenderTime = 0;
    
    engine.runRenderLoop(() => {
      // Only render when the tab is visible
      if (document.visibilityState === 'visible') {
        const currentTime = performance.now();
        
        // In performance mode, limit the frame rate
        if (!performanceMode || (currentTime - lastRenderTime) >= renderInterval) {
          // Check for invalid meshes before rendering to prevent the boundingSphere error
          let invalidMeshes = scene.meshes.filter(mesh => 
            !mesh || 
            !mesh.isEnabled() || 
            (mesh.subMeshes && mesh.subMeshes.some(subMesh => !subMesh || !subMesh.getBoundingInfo() || !subMesh.getBoundingInfo().boundingSphere))
          );
          
          if (invalidMeshes.length > 0) {
            console.warn("Found invalid meshes that could cause rendering issues:", invalidMeshes.map(m => m.name));
            // Remove or disable problematic meshes
            invalidMeshes.forEach(mesh => {
              if (mesh && mesh.name !== "ground" && mesh.name !== "axesHelper" && mesh.name !== "centerPoint") {
                mesh.setEnabled(false);
              }
            });
          }
          
          try {
            scene.render();
          } catch (error) {
            console.error("Render error:", error);
          }
          lastRenderTime = currentTime;
        }
      }
    });
    
    // Apply performance optimizations based on device capability and user preference
    shadowGeneratorRef.current = shadowGenerator; 
    optimizeBabylonPerformance(
      scene, 
      engine, 
      renderingPipelineRef.current, 
      shadowGenerator, 
      performanceMode
    );
    
    // Set up scene optimization for idle state
    let lastInteractionTime = performance.now();
    let isSceneIdle = false;
    const IDLE_TIMEOUT = performanceMode ? 2000 : 5000; // Shorter idle timeout in performance mode
    
    // Track user interaction with the scene
    scene.onPointerObservable.add(() => {
      lastInteractionTime = performance.now();
      
      // If coming out of idle state, restore quality
      if (isSceneIdle) {
        isSceneIdle = false;
        if (renderingPipelineRef.current) {
          renderingPipelineRef.current.samples = performanceMode ? 1 : 4;
          if (!performanceMode) {
            renderingPipelineRef.current.fxaaEnabled = true;
          }
        }
        scene.getEngine().setHardwareScalingLevel(performanceMode ? 1.5 : 1.0);
      }
    });
    
    // Check for idle state periodically
    const idleCheckInterval = setInterval(() => {
      const now = performance.now();
      if (!isSceneIdle && now - lastInteractionTime > IDLE_TIMEOUT) {
        isSceneIdle = true;
        
        // Reduce quality during idle to save power
        if (renderingPipelineRef.current) {
          renderingPipelineRef.current.samples = 1;
          renderingPipelineRef.current.fxaaEnabled = false;
        }
        scene.getEngine().setHardwareScalingLevel(performanceMode ? 2.0 : 1.5);
      }
    }, 1000);
    
    // Apply model-specific optimizations
    scene.executeWhenReady(() => {
      // Optimize materials and meshes based on performance mode
      optimizeMaterials(scene, performanceMode);
      optimizeMeshes(scene, performanceMode);
    });

    // Notify parent component that scene is ready
    onSceneReady(scene);

    // Listen for visibility changes to manage rendering performance
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        engine.runRenderLoop(() => {
          scene.render();
        });
      } else {
        engine.stopRenderLoop();
      }
    });    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('visibilitychange', () => {});
      clearInterval(idleCheckInterval);
      scene.dispose();
      engine.dispose();
    };
  }, []);

  // Handle model URL changes
  useEffect(() => {
    if (!sceneRef.current || !modelUrl) return;    // Clear existing meshes except ground, axes helper, and center point
    const scene = sceneRef.current;
    const meshesToDispose: import('@babylonjs/core').AbstractMesh[] = [];
    
    // First collect meshes for disposal to avoid modifying the collection during iteration
    scene.meshes.forEach(mesh => {
      if (mesh.name !== "ground" && mesh.name !== "axesHelper" && mesh.name !== "centerPoint") {
        meshesToDispose.push(mesh);
      }
    });
    
    // Then dispose them
    meshesToDispose.forEach(mesh => {
      try {
        mesh.dispose();
      } catch (e) {
        console.warn("Failed to dispose mesh:", mesh.name, e);
      }
    });

    // Reset camera position
    const camera = scene.activeCamera as ArcRotateCamera;
    if (camera) {
      camera.setTarget(Vector3.Zero());
      camera.alpha = 0;
      camera.beta = Math.PI / 3;
      camera.radius = 10;
    }
  }, [modelUrl]);
  return (
    <div className="w-full h-full relative">
      <canvas
        ref={canvasRef}
        className="w-full h-full outline-none"
      />
      {sceneRef.current && modelUrl && (
        <BabylonModelLoader
          key={modelUrl} // Force remount when model URL changes
          modelUrl={modelUrl}
          modelColor={modelColor}
          onModelLoad={onModelLoad}
          selectedMaterial={selectedMaterial}
          materialPreview={materialPreview}
          isPreviewMode={isPreviewMode}
          text3D={text3D}
          textColor={textColor}
          textPosition={textPosition}
          textRotation={textRotation}
          textScale={textScale}
          text3DOptions={text3DOptions}
          textMaterial={textMaterial}
          engraveDepth={engraveDepth}
          isEngraving={isEngraving}
          selectedFont={selectedFont}
          onFontError={onFontError}
          uvMapTexture={uvMapTexture}
          uvMapText={uvMapText}
          uvMapTextOptions={uvMapTextOptions}
          scene={sceneRef.current}
        />
      )}
    </div>
  );
}