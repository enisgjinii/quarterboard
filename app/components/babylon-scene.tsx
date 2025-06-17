import { useEffect, useRef } from 'react';
import { Engine, Scene, ArcRotateCamera, HemisphericLight, Vector3, MeshBuilder, StandardMaterial, Color3, Color4, Texture } from '@babylonjs/core';
import { AdvancedDynamicTexture, Button, Control } from '@babylonjs/gui';
import { BabylonModelLoader } from './babylon-model-loader';

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
  onRecordingComplete
}: BabylonSceneProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<Scene | null>(null);
  const engineRef = useRef<Engine | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    // Initialize Babylon.js engine and scene
    const engine = new Engine(canvasRef.current, true);
    engineRef.current = engine;
    const scene = new Scene(engine);
    sceneRef.current = scene;

    // Create camera
    const camera = new ArcRotateCamera(
      "camera",
      0,
      Math.PI / 3,
      10,
      Vector3.Zero(),
      scene
    );
    camera.attachControl(canvasRef.current, true);

    // Create light
    const light = new HemisphericLight(
      "light",
      new Vector3(0, 1, 0),
      scene
    );
    light.intensity = 0.7;

    // Create ground
    const ground = MeshBuilder.CreateGround(
      "ground",
      { width: 50, height: 50 },
      scene
    );
    const groundMaterial = new StandardMaterial("groundMaterial", scene);
    groundMaterial.diffuseColor = new Color3(0.2, 0.2, 0.2);
    ground.material = groundMaterial;

    // Create axes helper
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

    // Create center point marker
    const centerPoint = MeshBuilder.CreateSphere(
      "centerPoint",
      { diameter: 0.1 },
      scene
    );
    const centerMaterial = new StandardMaterial("centerMaterial", scene);
    centerMaterial.diffuseColor = new Color3(1, 0, 0);
    centerPoint.material = centerMaterial;

    // Create GUI
    const advancedTexture = AdvancedDynamicTexture.CreateFullscreenUI("UI");

    // Handle window resize
    const handleResize = () => {
      engine.resize();
    };
    window.addEventListener('resize', handleResize);

    // Start render loop
    engine.runRenderLoop(() => {
      scene.render();
    });

    // Notify parent component that scene is ready
    onSceneReady(scene);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      engine.dispose();
    };
  }, []);

  // Handle model URL changes
  useEffect(() => {
    if (!sceneRef.current || !modelUrl) return;

    // Clear existing meshes except ground, axes helper, and center point
    const scene = sceneRef.current;
    scene.meshes.forEach(mesh => {
      if (mesh.name !== "ground" && mesh.name !== "axesHelper" && mesh.name !== "centerPoint") {
        mesh.dispose();
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
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <canvas
        ref={canvasRef}
        style={{
          width: '100%',
          height: '100%',
          outline: 'none'
        }}
      />
      {sceneRef.current && (
        <BabylonModelLoader
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