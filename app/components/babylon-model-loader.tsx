import { useEffect, useRef } from 'react';
import { Scene, SceneLoader, StandardMaterial, Color3, Vector3, TransformNode } from '@babylonjs/core';
import '@babylonjs/loaders/glTF';

interface BabylonModelLoaderProps {
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
  scene: Scene | null;
}

export function BabylonModelLoader({
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
  scene
}: BabylonModelLoaderProps) {
  const modelRef = useRef<TransformNode | null>(null);

  useEffect(() => {
    if (!modelUrl || !scene) return;

    const loadModel = async () => {
      try {
        // Extract the directory path and filename from modelUrl
        const lastSlashIndex = modelUrl.lastIndexOf('/');
        const directory = modelUrl.substring(0, lastSlashIndex + 1);
        const filename = modelUrl.substring(lastSlashIndex + 1);

        // Dispose of the previous model if it exists
        if (modelRef.current) {
          modelRef.current.dispose();
          modelRef.current = null;
        }

        const result = await SceneLoader.ImportMeshAsync(
          "", // meshNames (empty string means load all meshes)
          directory, // directory path
          filename, // filename
          scene // scene
        );

        const model = result.meshes[0];
        modelRef.current = model;

        // Apply material
        const material = new StandardMaterial("modelMaterial", scene);
        material.diffuseColor = Color3.FromHexString(modelColor);
        model.material = material;

        // Center the model
        const boundingInfo = model.getHierarchyBoundingVectors();
        const min = boundingInfo.min;
        const max = boundingInfo.max;
        const center = min.add(max).scale(0.5);
        model.position = new Vector3(-center.x, -center.y, -center.z);

        // Scale the model to a reasonable size
        const size = max.subtract(min);
        const maxDimension = Math.max(size.x, size.y, size.z);
        const scale = 5 / maxDimension;
        model.scaling = new Vector3(scale, scale, scale);

        // Notify parent component that model is loaded
        onModelLoad({
          name: model.name,
          vertices: model.getTotalVertices(),
          faces: model.getTotalIndices() / 3,
          materials: [material.name],
          uvSets: model.getVerticesData("uv") ? ["uv0"] : []
        });
      } catch (error) {
        console.error('Error loading model:', error);
      }
    };

    loadModel();
  }, [modelUrl, modelColor, onModelLoad, scene]);

  return null;
} 