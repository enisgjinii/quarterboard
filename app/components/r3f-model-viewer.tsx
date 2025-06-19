import { useState, useEffect } from 'react';
import { ThreeScene } from './three-scene';
import { useDevicePerformance } from '@/hooks/use-device-performance';
import { Suspense } from 'react';

interface MeshData {
  name: string;
  color: string;
  originalMaterial: any;
}

interface ModelViewerProps {
  modelUrl: string;
  modelColor: string;
  onModelLoad?: (meshes: MeshData[]) => void;
  text3D?: string;
  textColor?: string;
  textPosition?: { x: number; y: number; z: number };
  textRotation?: { x: number; y: number; z: number };
  textScale?: { x: number; y: number; z: number };
  onMeshClick?: (meshName: string, mesh: any) => void;
  selectedMesh?: string | null;
  meshColors?: Record<string, string>;
  isTextEditing?: boolean;
  onTextPositionChange?: (position: { x: number; y: number; z: number }) => void;
}

export function R3FModelViewer({
  modelUrl,
  modelColor,
  onModelLoad,
  text3D,
  textColor,
  textPosition,
  textRotation,
  textScale,
  onMeshClick,
  selectedMesh,
  meshColors,
  isTextEditing,
  onTextPositionChange,
}: ModelViewerProps) {  const [isLoading, setIsLoading] = useState(true);
  const { isLowEndDevice } = useDevicePerformance();
  
  // Handle loading state
  useEffect(() => {
    if (modelUrl) {
      setIsLoading(true);
    }
  }, [modelUrl]);
  
  const handleModelLoad = (meshes: MeshData[]) => {
    setIsLoading(false);
    if (onModelLoad) {
      onModelLoad(meshes);
    }
  };
  
  return (
    <div className="relative w-full h-full">
      {/* Loading indicator */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
          <div className="flex flex-col items-center gap-2">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            <p className="text-sm text-muted-foreground">Loading 3D model...</p>
          </div>
        </div>
      )}
      
      {/* Three.js scene */}
      <Suspense fallback={null}>
        <ThreeScene 
          modelUrl={modelUrl}
          modelColor={modelColor}
          onModelLoad={handleModelLoad}
          text3D={text3D}
          textColor={textColor}
          textPosition={textPosition}
          textRotation={textRotation}
          textScale={textScale}
          onMeshClick={onMeshClick}
          selectedMesh={selectedMesh}
          meshColors={meshColors}
          isTextEditing={isTextEditing}
          onTextPositionChange={onTextPositionChange}
          performanceMode={isLowEndDevice}
        />
      </Suspense>
    </div>
  );
}
