import { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Environment, useGLTF, Text, Center, PresentationControls, Html, Grid } from '@react-three/drei';
import * as THREE from 'three';
import { processModel, cleanupModel } from '@/lib/model-utils';

interface MeshData {
  name: string;
  color: string;
  originalMaterial: THREE.Material | THREE.Material[];
}

interface ModelProps {
  url: string;
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
  modelColor: string;
  onMeshClick?: (meshName: string, mesh: THREE.Mesh) => void;
  selectedMesh?: string | null;
  meshColors?: Record<string, string>;
  onModelLoad?: (meshes: MeshData[]) => void;
}

function Model({ 
  url, 
  position = [0, 0, 0], 
  rotation = [0, 0, 0], 
  scale = 1, 
  modelColor,
  onMeshClick,
  selectedMesh,
  meshColors = {},
  onModelLoad
}: ModelProps) {
  const { scene } = useGLTF(url);
  const modelRef = useRef<THREE.Group>(null!);
  const [meshes, setMeshes] = useState<MeshData[]>([]);
  const [hoveredMesh, setHoveredMesh] = useState<string | null>(null);
  const [clonedScene, setClonedScene] = useState<THREE.Object3D | null>(null);
  
  useEffect(() => {
    if (scene) {
      // Clone the scene
      const cloned = scene.clone();
      setClonedScene(cloned);
      
      // Process the cloned model
      const result = processModel(cloned, {
        color: modelColor,
        roughness: 0.3,
        metalness: 0.2
      });
      
      // Center model
      if (result) {
        cloned.position.sub(result.center);
      }
      
      // Collect mesh information
      const foundMeshes: MeshData[] = [];
      cloned.traverse((child) => {
        if (child instanceof THREE.Mesh && child.material) {
          const meshName = child.name || `mesh_${foundMeshes.length}`;
          child.name = meshName; // Ensure mesh has a name
          
          foundMeshes.push({
            name: meshName,
            color: modelColor,
            originalMaterial: child.material
          });
          
          // Add click handler
          child.addEventListener = child.addEventListener || (() => {});
          child.userData.clickable = true;
        }
      });
      
      setMeshes(foundMeshes);
      if (onModelLoad) {
        onModelLoad(foundMeshes);
      }
      
      // Add slight rotation animation
      cloned.userData.initialRotation = 0;
    }
    
    return () => {
      // Clean up with our utility function
      if (clonedScene) {
        cleanupModel(clonedScene);
      }
    };
  }, [scene, modelColor, onModelLoad]);
  
  // Update mesh colors when meshColors prop changes - optimized to prevent unnecessary updates
  useEffect(() => {
    if (clonedScene) {
      clonedScene.traverse((child) => {
        if (child instanceof THREE.Mesh && child.name && meshColors[child.name]) {
          const material = child.material as THREE.MeshStandardMaterial;
          if (material.color && material.color.getHexString() !== meshColors[child.name].replace('#', '')) {
            material.color.set(meshColors[child.name]);
            material.needsUpdate = true;
          }
        }
      });
    }
  }, [meshColors, clonedScene]);
  
  // Gentle rotation animation - optimized to prevent conflicts
  useFrame((state) => {
    if (modelRef.current) {
      const time = state.clock.getElapsedTime();
      const targetRotation = Math.sin(time * 0.2) * 0.05;
      
      // Smooth interpolation to prevent jerky movement
      modelRef.current.rotation.y += (targetRotation - modelRef.current.rotation.y) * 0.1;
    }
  });
  
  const handleMeshClick = (event: any) => {
    event.stopPropagation();
    const mesh = event.object as THREE.Mesh;
    if (mesh.name && onMeshClick) {
      onMeshClick(mesh.name, mesh);
    }
  };
  
  const handleMeshHover = (event: any, hovered: boolean) => {
    const mesh = event.object as THREE.Mesh;
    if (mesh.name) {
      setHoveredMesh(hovered ? mesh.name : null);
      document.body.style.cursor = hovered ? 'pointer' : 'default';
      
      // Highlight effect
      if (mesh.material instanceof THREE.MeshStandardMaterial) {
        mesh.material.emissive.setHex(hovered ? 0x444444 : 0x000000);
      }
    }
  };
  
  if (!clonedScene) {
    return null; // Don't render until scene is cloned and processed
  }
  
  return (
    <group ref={modelRef}>
      <primitive 
        object={clonedScene} 
        position={position} 
        rotation={rotation}
        scale={[scale, scale, scale]}
        onClick={handleMeshClick}
        onPointerOver={(e: any) => handleMeshHover(e, true)}
        onPointerOut={(e: any) => handleMeshHover(e, false)}
      />
      
      {/* Show mesh name on hover */}
      {hoveredMesh && (
        <Html>
          <div className="bg-black/75 text-white px-2 py-1 rounded text-sm pointer-events-none">
            {hoveredMesh}
          </div>
        </Html>
      )}
    </group>
  );
}

interface ThreeSceneProps {
  modelUrl: string;
  modelColor: string;
  onModelLoad?: (meshes: MeshData[]) => void;
  text3D?: string;
  textColor?: string;
  textPosition?: { x: number; y: number; z: number };
  textRotation?: { x: number; y: number; z: number };
  textScale?: { x: number; y: number; z: number };
  textMaterial?: 'standard' | 'emissive' | 'engraved';
  performanceMode?: boolean;
  onMeshClick?: (meshName: string, mesh: THREE.Mesh) => void;
  selectedMesh?: string | null;
  meshColors?: Record<string, string>;
  isTextEditing?: boolean;
  onTextPositionChange?: (position: { x: number; y: number; z: number }) => void;
}

export function ThreeScene({
  modelUrl,
  modelColor,
  onModelLoad,
  text3D,
  textColor = '#ffffff',
  textPosition = { x: 0, y: 2, z: 0 },
  textRotation = { x: 0, y: 0, z: 0 },
  textScale = { x: 1, y: 1, z: 1 },
  textMaterial = 'standard',
  performanceMode = false,
  onMeshClick,
  selectedMesh,
  meshColors = {},
  isTextEditing = false,
  onTextPositionChange
}: ThreeSceneProps) {
  const [loaded, setLoaded] = useState(false);
  const textRef = useRef<THREE.Group>(null);
  
  // Handle model load
  const handleModelLoad = useCallback((meshes: MeshData[]) => {
    setLoaded(true);
    if (onModelLoad) {
      onModelLoad(meshes);
    }
  }, [onModelLoad]);
  
  // Memoize pixel ratio to prevent unnecessary re-renders
  const pixelRatio = useMemo(() => 
    performanceMode ? 
      Math.min(1.5, window.devicePixelRatio) : 
      Math.min(2, window.devicePixelRatio),
    [performanceMode]
  );
  
  // Memoize GL context options
  const glOptions = useMemo(() => ({
    antialias: !performanceMode,
    alpha: true,
    preserveDrawingBuffer: true,
    toneMapping: THREE.ACESFilmicToneMapping,
    toneMappingExposure: 1.2
  }), [performanceMode]);
  
  // Handle text click for editing
  const handleTextClick = useCallback((event: any) => {
    if (isTextEditing && onTextPositionChange) {
      const point = event.point;
      if (point) {
        onTextPositionChange({
          x: point.x,
          y: point.y + 1, // Offset above the click point
          z: point.z
        });
      }
    }
  }, [isTextEditing, onTextPositionChange]);
  
  return (
    <div className="w-full h-full">
      <Canvas
        shadows
        camera={{ position: [5, 8, 12], fov: 45 }}
        dpr={pixelRatio}
        gl={glOptions}
        onCreated={() => setLoaded(true)}
      >
        {/* Environment and lighting */}
        <color attach="background" args={['#f8fafc']} />
        <fog attach="fog" args={['#f8fafc', 15, 60]} />
        
        <ambientLight intensity={0.4} />
        <directionalLight 
          position={[10, 10, 10]} 
          intensity={1.5} 
          castShadow 
          shadow-mapSize={[4096, 4096]}
          shadow-bias={-0.0001}
        />
        <directionalLight position={[-10, -10, -5]} intensity={0.4} />
        <spotLight 
          position={[0, 15, 0]} 
          intensity={0.8} 
          angle={Math.PI / 4}
          penumbra={0.5}
          castShadow
        />
        
        {/* Controls */}
        <OrbitControls
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          minDistance={3}
          maxDistance={30}
          maxPolarAngle={Math.PI / 1.5}
        />
        
        {/* Main model */}
        <group position={[0, -0.5, 0]}>
          <Model 
            key={modelUrl}
            url={modelUrl} 
            modelColor={modelColor} 
            scale={4}
            onMeshClick={onMeshClick}
            selectedMesh={selectedMesh}
            meshColors={meshColors}
            onModelLoad={handleModelLoad}
          />
        </group>
          
        {/* Enhanced 3D Text */}
        {text3D && (
          <group
            key={`text-${text3D}-${textColor}-${textMaterial}`}
            ref={textRef}
            position={[textPosition.x, textPosition.y, textPosition.z]}
            rotation={[textRotation.x, textRotation.y, textRotation.z]}
            scale={[textScale.x, textScale.y, textScale.z]}
            onClick={isTextEditing ? handleTextClick : undefined}
          >
            <Center>
              <Text
                key={`text-content-${text3D}`}
                fontSize={0.6}
                maxWidth={12}
                lineHeight={1.1}
                letterSpacing={0.03}
                textAlign="center"
                font="/fonts/EBGaramond-Bold.ttf"
                anchorX="center"
                anchorY="middle"
                castShadow
                receiveShadow
              >
                {text3D}
                {textMaterial === 'engraved' ? (
                  <meshStandardMaterial
                    attach="material"
                    color={textColor}
                    roughness={0.8}
                    metalness={0.1}
                    envMapIntensity={0.3}
                    emissive={new THREE.Color(textColor).multiplyScalar(0.1)}
                    emissiveIntensity={0.5}
                  />
                ) : textMaterial === 'emissive' ? (
                  <meshBasicMaterial 
                    attach="material" 
                    color={textColor} 
                    toneMapped={false} 
                  />
                ) : (
                  <meshStandardMaterial 
                    attach="material" 
                    color={textColor} 
                  />
                )}
              </Text>
              
              {/* Add depth effect for engraved text */}
              {textMaterial === 'engraved' && (
                <>
                  {/* Shadow layer for depth */}
                  <Text
                    position={[0, 0, -0.02]}
                    fontSize={0.6}
                    maxWidth={12}
                    lineHeight={1.1}
                    letterSpacing={0.03}
                    textAlign="center"
                    font="/fonts/EBGaramond-Bold.ttf"
                    anchorX="center"
                    anchorY="middle"
                  >
                    {text3D}
                    <meshBasicMaterial 
                      attach="material" 
                      color="#000000" 
                      opacity={0.3}
                      transparent
                    />
                  </Text>
                  
                  {/* Highlight layer for carved effect */}
                  <Text
                    position={[0.005, -0.005, 0.01]}
                    fontSize={0.6}
                    maxWidth={12}
                    lineHeight={1.1}
                    letterSpacing={0.03}
                    textAlign="center"
                    font="/fonts/EBGaramond-Bold.ttf"
                    anchorX="center"
                    anchorY="middle"
                  >
                    {text3D}
                    <meshBasicMaterial 
                      attach="material" 
                      color="#ffffff" 
                      opacity={0.2}
                      transparent
                    />
                  </Text>
                </>
              )}
            </Center>
            
            {/* Text editing helpers */}
            {isTextEditing && (
              <mesh>
                <boxGeometry args={[0.1, 0.1, 0.1]} />
                <meshBasicMaterial color="orange" transparent opacity={0.5} />
              </mesh>
            )}
          </group>
        )}
        
        {/* Click plane for text positioning when editing */}
        {isTextEditing && (
          <mesh
            key="text-edit-plane"
            position={[0, 0, 0]}
            rotation={[-Math.PI / 2, 0, 0]}
            onClick={handleTextClick}
            visible={false}
          >
            <planeGeometry args={[50, 50]} />
            <meshBasicMaterial transparent opacity={0} />
          </mesh>
        )}
          
        {/* Environment map for reflections */}
        <Environment preset="city" />
        
        {/* Enhanced floor with grid */}
        <Grid position={[0, -2.5, 0]} args={[100, 100]} infiniteGrid fadeDistance={25} fadeStrength={4} />
      </Canvas>
    </div>
  );
}

// Preload models to avoid flickering during transitions
useGLTF.preload('/models/quarterboard.glb');
useGLTF.preload('/models/quarterboard_2.glb');
