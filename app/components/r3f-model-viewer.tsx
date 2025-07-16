import { Suspense, useMemo, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import * as THREE from 'three';
import { ThreeScene, ModelLoadData } from './three-scene';
import { useDevicePerformance } from '@/hooks/use-device-performance';
import { useGLTF } from '@react-three/drei';

interface MeshData {
  name: string;
  color: string;
  originalMaterial: any;
}

interface ModelViewerProps {
  modelUrl: string;
  modelColor: string;
  onModelLoad?: (data: ModelLoadData) => void;
  onModelError?: (error: string) => void;
  textTexture?: string | null;
  onMeshClick?: (meshName: string, mesh: any) => void;
  selectedMesh?: string | null;
  meshColors?: Record<string, string>;
}

export function R3FModelViewer({
  modelUrl,
  modelColor,
  onModelLoad,
  onModelError,
  textTexture,
  onMeshClick,
  selectedMesh,
  meshColors,
}: ModelViewerProps) {
  const { isLowEndDevice } = useDevicePerformance();

  useEffect(() => {
    if (!modelUrl) return

    const loadModel = async () => {
      try {
        console.log('Loading model:', modelUrl)
        const gltf = await useGLTF.preload(modelUrl)
        console.log('Model loaded successfully:', modelUrl)
      } catch (error) {
        console.error('Error loading GLTF:', error)
        // Don't throw here, let the component handle it gracefully
      }
    }

    loadModel()
  }, [modelUrl])

  const pixelRatio = useMemo(() => {
    if (typeof window === 'undefined') return 1;
    return isLowEndDevice ? 
      Math.min(1.5, window.devicePixelRatio) : 
      Math.min(2, window.devicePixelRatio);
  }, [isLowEndDevice]);
  
  const glOptions = useMemo(() => ({
    antialias: !isLowEndDevice,
    alpha: true,
    preserveDrawingBuffer: true,
    toneMapping: THREE.ACESFilmicToneMapping,
    toneMappingExposure: 1.2
  }), [isLowEndDevice]);

  return (
    <div className="relative w-full h-full bg-slate-100 dark:bg-gray-800">
      <Canvas
        shadows
        camera={{ position: [6, 4, 8], fov: 60, near: 0.1, far: 1000 }}
        dpr={pixelRatio}
        gl={glOptions}
      >
        <Suspense fallback={null}>
          <ThreeScene 
            modelUrl={modelUrl}
            modelColor={modelColor}
            onModelLoad={onModelLoad}
            textTexture={textTexture}
            onMeshClick={onMeshClick}
            selectedMesh={selectedMesh}
            meshColors={meshColors}
            performanceMode={isLowEndDevice}
          />
        </Suspense>
      </Canvas>
    </div>
  );
}
