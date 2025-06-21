import { Suspense, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import * as THREE from 'three';
import { ThreeScene, ModelLoadData } from './three-scene';
import { useDevicePerformance } from '@/hooks/use-device-performance';

interface MeshData {
  name: string;
  color: string;
  originalMaterial: any;
}

interface ModelViewerProps {
  modelUrl: string;
  modelColor: string;
  onModelLoad?: (data: ModelLoadData) => void;
  textTexture?: string | null;
  onMeshClick?: (meshName: string, mesh: any) => void;
  selectedMesh?: string | null;
  meshColors?: Record<string, string>;
}

export function R3FModelViewer({
  modelUrl,
  modelColor,
  onModelLoad,
  textTexture,
  onMeshClick,
  selectedMesh,
  meshColors,
}: ModelViewerProps) {
  const { isLowEndDevice } = useDevicePerformance();

  const pixelRatio = useMemo(() => 
    isLowEndDevice ? 
      Math.min(1.5, window.devicePixelRatio) : 
      Math.min(2, window.devicePixelRatio),
    [isLowEndDevice]
  );
  
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
