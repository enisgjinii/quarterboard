import { useRef, useState, useEffect, useCallback } from 'react';
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
  
  useEffect(() => {
    if (modelRef.current && scene) {
      // Process model with our utility function
      const result = processModel(modelRef.current, {
        color: modelColor,
        roughness: 0.3,
        metalness: 0.2
      });
      
      // Center model
      if (result) {
        modelRef.current.position.sub(result.center);
      }
      
      // Collect mesh information
      const foundMeshes: MeshData[] = [];
      modelRef.current.traverse((child) => {
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
      const initialRotation = modelRef.current.rotation.y;
      modelRef.current.userData.initialRotation = initialRotation;
    }
    
    return () => {
      // Clean up with our utility function
      if (modelRef.current) {
        cleanupModel(modelRef.current);
      }
    };
  }, [url, modelColor, onModelLoad]);
  
  // Update mesh colors when meshColors prop changes
  useEffect(() => {
    if (modelRef.current) {
      modelRef.current.traverse((child) => {
        if (child instanceof THREE.Mesh && child.name && meshColors[child.name]) {
          const material = child.material as THREE.MeshStandardMaterial;
          if (material.color) {
            material.color.set(meshColors[child.name]);
          }
        }
      });
    }
  }, [meshColors]);
  
  // Gentle rotation animation
  useFrame((state) => {
    if (modelRef.current) {
      const time = state.clock.getElapsedTime();
      modelRef.current.rotation.y = modelRef.current.userData.initialRotation + Math.sin(time * 0.2) * 0.05;
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
  
  return (
    <group>
      <primitive 
        ref={modelRef}
        object={scene.clone()} 
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
  
  // Calculate pixel ratio based on performance mode
  const pixelRatio = performanceMode ? 
    Math.min(1.5, window.devicePixelRatio) : 
    Math.min(2, window.devicePixelRatio);
  
  // Handle text click for editing
  const handleTextClick = (event: any) => {
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
  };
  
  return (
    <div className="w-full h-full">
      <Canvas
        shadows
        camera={{ position: [5, 8, 12], fov: 45 }}
        dpr={pixelRatio}
        gl={{ 
          antialias: !performanceMode,
          alpha: true,
          preserveDrawingBuffer: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.2
        }}
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
            ref={textRef}
            position={[textPosition.x, textPosition.y, textPosition.z]}
            rotation={[textRotation.x, textRotation.y, textRotation.z]}
            scale={[textScale.x, textScale.y, textScale.z]}
            onClick={isTextEditing ? handleTextClick : undefined}
          >
            <Center>
              <Text
                color={textColor}
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
                outlineWidth={0.02}
                outlineColor="#ffffff"
              >
                {text3D}
              </Text>
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
