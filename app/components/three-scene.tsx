import { Suspense, useMemo, useRef, useEffect, useState } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { OrbitControls, Environment, useGLTF, Html, Text, Center, Text3D, useTexture } from '@react-three/drei';
import { processModel, cleanupModel } from '@/lib/model-utils';

interface MeshData {
  name: string;
  color: string;
  originalMaterial: THREE.Material | THREE.Material[];
}

export interface ModelLoadData {
  meshes: MeshData[];
  bounds: {
    center: THREE.Vector3;
    size: THREE.Vector3;
    scale: number;
  };
}

interface ModelProps {
  url: string;
  modelColor: string;
  textureUrl?: string | null;
  onMeshClick?: (meshName: string, mesh: THREE.Mesh) => void;
  onModelLoad?: (data: ModelLoadData) => void;
}

function Model({ 
  url, 
  modelColor,
  textureUrl,
  onModelLoad,
  onMeshClick,
}: ModelProps) {
  const { scene } = useGLTF(url);
  const [clonedScene, setClonedScene] = useState<THREE.Object3D | null>(null);
  const [originalTextures, setOriginalTextures] = useState<Map<string, THREE.Texture | null>>(new Map());
  
  // Don't use useTexture for dynamic textures - handle them manually
  const textTextureRef = useRef<THREE.Texture | null>(null);

  // Effect for initial model processing (runs once per model)
  useEffect(() => {
    if (!scene) return;
    
    console.log(`🚀 Processing geometry for ${url}`);
    const cloned = scene.clone();
    
    // --- Center and scale logic ---
    const box = new THREE.Box3().setFromObject(cloned);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    const maxDimension = Math.max(size.x, size.y, size.z);
    const scale = 5 / (maxDimension > 0 ? maxDimension : 1);
    
    cloned.scale.set(scale, scale, scale);
    cloned.position.sub(center.multiplyScalar(scale));

    // --- Initial material setup and mesh collection ---
    const foundMeshes: MeshData[] = [];
    const textures = new Map<string, THREE.Texture | null>();
    
    cloned.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        
        // Store original texture if it exists
        const originalMat = child.material as THREE.MeshStandardMaterial;
        if (originalMat && originalMat.map) {
          textures.set(child.name || child.uuid, originalMat.map);
        }
        
        // Create new material but preserve the original UV mapping
        const newMaterial = new THREE.MeshStandardMaterial({
          color: modelColor,
          metalness: 0.2,
          roughness: 0.5,
          map: originalMat?.map || null, // Preserve original texture
        });
        
        child.material = newMaterial;
        
        const meshName = child.name || `mesh_${foundMeshes.length}`;
        child.name = meshName;
        child.userData.clickable = true;
        foundMeshes.push({ name: meshName, color: modelColor, originalMaterial: child.material });
      }
    });

    setOriginalTextures(textures);
    setClonedScene(cloned);
    if (onModelLoad) {
      onModelLoad({ meshes: foundMeshes, bounds: { center, size, scale } });
    }
    
    // --- Cleanup ---
    return () => {
      cleanupModel(cloned);
      textTextureRef.current?.dispose();
    };
  }, [scene, url]); // Intentionally exclude modelColor and onModelLoad to run only once

  // Effect for applying text texture updates
  useEffect(() => {
    if (!clonedScene) return;

    if (!textureUrl) {
      // Restore original materials when no text texture
      console.log(`🔄 Restoring original materials for ${url}`);
      
      clonedScene.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          const originalTexture = originalTextures.get(child.name || child.uuid);
          
          // Create fresh material with original properties
          const newMaterial = new THREE.MeshStandardMaterial({
            color: modelColor,
            metalness: 0.2,
            roughness: 0.5,
            map: originalTexture || null,
          });
          
          child.material = newMaterial;
          child.material.needsUpdate = true;
        }
      });
      return;
    }

    console.log(`🎨 Applying embossed text texture to ${url}`);
    
    // Load the text texture
    const loader = new THREE.TextureLoader();
    loader.load(
      textureUrl,
      (texture) => {
        texture.flipY = false;
        texture.needsUpdate = true;
        textTextureRef.current = texture;
        
        // Apply embossed text effect
        clonedScene.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            const material = child.material as THREE.MeshStandardMaterial;
            const originalTexture = originalTextures.get(child.name || child.uuid);
            
            // Create a new material with embossed effect
            const newMaterial = new THREE.MeshStandardMaterial({
              color: material.color,
              metalness: 0.3,  // Slightly more metallic for embossed look
              roughness: 0.4,  // Slightly smoother for embossed look
              map: originalTexture || null,
              // Use the text texture as bump map for embossed effect
              bumpMap: texture,
              bumpScale: 0.05,  // Adjust for visible embossing
              // Also use as displacement for actual geometry displacement
              displacementMap: texture,
              displacementScale: 0.02,
              displacementBias: -0.01,
            });
            
            // If no original texture, create a combined texture with the base color
            if (!originalTexture) {
              const canvas = document.createElement('canvas');
              canvas.width = 2048;
              canvas.height = 2048;
              const ctx = canvas.getContext('2d');
              
              if (ctx) {
                // Fill with base color
                ctx.fillStyle = `#${material.color.getHexString()}`;
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                
                // Apply text with lighter color for embossed appearance
                ctx.globalCompositeOperation = 'screen';
                ctx.globalAlpha = 0.3;
                ctx.drawImage(texture.image, 0, 0, canvas.width, canvas.height);
                
                // Create texture from canvas
                const combinedTexture = new THREE.CanvasTexture(canvas);
                combinedTexture.needsUpdate = true;
                newMaterial.map = combinedTexture;
              }
            }
            
            child.material = newMaterial;
            child.material.needsUpdate = true;
          }
        });
      },
      undefined,
      (error) => {
        console.error('Error loading text texture:', error);
      }
    );
    
    return () => {
      if (textTextureRef.current) {
        textTextureRef.current.dispose();
        textTextureRef.current = null;
      }
    };
  }, [clonedScene, textureUrl, originalTextures, url]);



  if (!clonedScene) {
    return (
      <Html center>
        <div className="bg-blue-500/95 text-white px-4 py-3 rounded-lg shadow-lg">
          <div className="font-medium text-sm">Processing Model...</div>
        </div>
      </Html>
    );
  }

  return (
    <primitive
      object={clonedScene}
      onClick={(e: any) => {
        e.stopPropagation();
        if (onMeshClick && e.object.userData.clickable) onMeshClick(e.object.name, e.object);
      }}
    />
  );
}

interface ThreeSceneProps {
  modelUrl: string;
  modelColor: string;
  onModelLoad?: (data: ModelLoadData) => void;
  textTexture?: string | null;
  onMeshClick?: (meshName: string, mesh: any) => void;
  performanceMode?: boolean;
}

export function ThreeScene({
  modelUrl,
  modelColor,
  onModelLoad,
  textTexture,
  onMeshClick,
  performanceMode = false,
}: ThreeSceneProps) {
  const { gl } = useThree();
  
  useEffect(() => {
    const handleContextLost = (event: Event) => {
      console.warn('😱 WebGL context lost!');
      event.preventDefault();
    };
    const handleContextRestored = () => {
      console.log('✅ WebGL context restored!');
    };
    
    gl.domElement.addEventListener('webglcontextlost', handleContextLost, false);
    gl.domElement.addEventListener('webglcontextrestored', handleContextRestored, false);
    
    return () => {
      gl.domElement.removeEventListener('webglcontextlost', handleContextLost);
      gl.domElement.removeEventListener('webglcontextrestored', handleContextRestored);
    };
  }, [gl]);

  return (
    <>
      <color attach="background" args={['#f0f4f8']} />
      <fog attach="fog" args={['#f0f4f8', 10, 40]} />
      <ambientLight intensity={0.7} />
      <directionalLight 
        position={[10, 10, 5]} 
        intensity={3} 
        castShadow 
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0002}
      />
      <directionalLight position={[-10, 10, -5]} intensity={0.8} color="#e0faff" />
      
      <OrbitControls
        minDistance={2}
        maxDistance={25}
        enableDamping={true}
        dampingFactor={0.05}
      />
      
      <group position={[0, -1.5, 0]}>
        <Model 
          key={modelUrl}
          url={modelUrl} 
          modelColor={modelColor}
          onModelLoad={onModelLoad}
          onMeshClick={onMeshClick}
          textureUrl={textTexture}
        />
      </group>
        
      <Environment preset="apartment" />
      
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2.5, 0]} receiveShadow>
        <planeGeometry args={[100, 100]} />
        <meshStandardMaterial color="#ffffff" roughness={0.1} metalness={0.1} />
      </mesh>
    </>
  );
}

// Preload models for faster switching
useGLTF.preload('/models/quarterboard.glb');
useGLTF.preload('/models/quarterboard_2.glb');
useGLTF.preload('/models/The Hilderbrand.glb');
