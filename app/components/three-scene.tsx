import { useRef, useEffect, useState } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { OrbitControls, Environment, useGLTF, Html } from '@react-three/drei';
import { cleanupModel } from '@/lib/model-utils';
import { ModelErrorBoundary, ModelErrorFallback } from './model-error-boundary';

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
  onModelError?: (error: string) => void;
  meshColors?: Record<string, string>;
}

function Model({
  url,
  modelColor,
  textureUrl,
  onModelLoad,
  onModelError,
  onMeshClick,
  meshColors,
}: ModelProps) {
  const [clonedScene, setClonedScene] = useState<THREE.Object3D | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Don't use useTexture for dynamic textures - handle them manually
  const textTextureRef = useRef<THREE.Texture | null>(null);
  const originalTexturesRef = useRef<Map<string, THREE.Texture | null>>(new Map());

  // Load the model - useGLTF must be called unconditionally
  let gltfResult;
  let scene;
  
  try {
    gltfResult = useGLTF(url);
    scene = gltfResult?.scene;
  } catch (error) {
    console.error('Error loading GLTF:', error);
    const errorMessage = `Failed to load model: ${error instanceof Error ? error.message : 'Unknown error'}`;
    setLoadError(errorMessage);
    if (onModelError) {
      onModelError(errorMessage);
    }
    return null;
  }

  // Handle loading errors with a timeout
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    if (!scene && !loadError) {
      // Set a timeout to detect loading failures
      timeoutId = setTimeout(() => {
        const errorMessage = 'Model loading timeout - please try a different model';
        console.error('Model loading timeout for:', url);
        setLoadError(errorMessage);
        if (onModelError) {
          onModelError(errorMessage);
        }
      }, 5000); // 5 second timeout
    } else if (scene && loadError) {
      // Clear error if model loads successfully
      setLoadError(null);
    }

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [url, scene, loadError, onModelError]);

  // Effect for initial model processing (runs once per model)
  useEffect(() => {
    if (!scene) return;

    let cloned: THREE.Object3D | null = null;

    try {
      console.log(`🚀 Processing geometry for ${url}`);
      cloned = scene.clone();

      // Check if the model has any geometry
      let hasGeometry = false;
      cloned.traverse((child) => {
        if (child instanceof THREE.Mesh && child.geometry) {
          hasGeometry = true;
        }
      });

      if (!hasGeometry) {
        throw new Error('Model contains no valid geometry');
      }

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
          try {
            child.castShadow = true;
            child.receiveShadow = true;

            // Safely handle materials - some models might not have proper materials
            let originalTexture: THREE.Texture | null = null;
            let originalMaterial: THREE.Material | THREE.Material[] | null = null;

            try {
              if (child.material) {
                originalMaterial = child.material;

                // Handle both single materials and material arrays
                if (Array.isArray(child.material)) {
                  // For material arrays, check the first material
                  const firstMat = child.material[0] as THREE.MeshStandardMaterial;
                  if (firstMat && firstMat.map) {
                    originalTexture = firstMat.map;
                  }
                } else {
                  // For single materials
                  const mat = child.material as THREE.MeshStandardMaterial;
                  if (mat && mat.map) {
                    originalTexture = mat.map;
                  }
                }
              }
            } catch (error) {
              console.warn(`Warning: Could not process material for mesh ${child.name}:`, error);
            }

            // Store original texture if it exists
            if (originalTexture) {
              textures.set(child.name || child.uuid, originalTexture);
            }

            // Create new material - don't rely on original material properties
            const newMaterial = new THREE.MeshStandardMaterial({
              color: modelColor,
              metalness: 0.2,
              roughness: 0.5,
              map: originalTexture, // Use extracted texture
              // Ensure the material works without UV maps
              transparent: false,
              alphaTest: 0,
            });

            child.material = newMaterial;

            const meshName = child.name || `mesh_${foundMeshes.length}`;
            child.name = meshName;
            child.userData.clickable = true;
            foundMeshes.push({
              name: meshName,
              color: modelColor,
              originalMaterial: originalMaterial || newMaterial
            });
          } catch (meshError) {
            console.warn(`Warning: Could not process mesh ${child.name}:`, meshError);
          }
        }
      });

      originalTexturesRef.current = textures;
      setClonedScene(cloned);
      if (onModelLoad) {
        onModelLoad({ meshes: foundMeshes, bounds: { center, size, scale } });
      }
    } catch (error) {
      console.error('Error processing model:', error);
      const errorMessage = `Model processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
      setLoadError(errorMessage);

      // Call the error callback if provided
      if (onModelError) {
        onModelError(errorMessage);
      }
    }

    // --- Cleanup ---
    return () => {
      if (cloned) {
        try {
          cleanupModel(cloned);
        } catch (cleanupError) {
          console.warn('Error during model cleanup:', cleanupError);
        }
      }
      if (textTextureRef.current) {
        try {
          textTextureRef.current.dispose();
        } catch (disposeError) {
          console.warn('Error disposing texture:', disposeError);
        }
      }
    };
  }, [scene, url]); // Intentionally exclude modelColor and onModelLoad to run only once

  // Effect for applying color changes to individual meshes
  useEffect(() => {
    if (!clonedScene) return;

    console.log(`🎨 Applying mesh colors for ${url}`);

    try {
      clonedScene.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          try {
            const meshName = child.name || child.uuid;
            const meshColor = meshColors?.[meshName] || modelColor;
            const originalTexture = originalTexturesRef.current.get(meshName);

            // Create fresh material with mesh-specific color
            const newMaterial = new THREE.MeshStandardMaterial({
              color: meshColor,
              metalness: 0.2,
              roughness: 0.5,
              map: originalTexture || null,
            });

            child.material = newMaterial;
            child.material.needsUpdate = true;
          } catch (meshError) {
            console.warn(`Warning: Could not update material for mesh ${child.name}:`, meshError);
          }
        }
      });
    } catch (error) {
      console.error('Error applying mesh colors:', error);
    }
  }, [clonedScene, meshColors, modelColor, url]);

  // Effect for applying text texture updates
  useEffect(() => {
    if (!clonedScene) return;

    try {
      if (!textureUrl) {
        // When no text texture, just apply the current colors without texture effects
        console.log(`🔄 Restoring materials without text texture for ${url}`);

        clonedScene.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            try {
              const meshName = child.name || child.uuid;
              const meshColor = meshColors?.[meshName] || modelColor;
              const originalTexture = originalTexturesRef.current.get(meshName);

              // Create fresh material with current colors
              const newMaterial = new THREE.MeshStandardMaterial({
                color: meshColor,
                metalness: 0.2,
                roughness: 0.5,
                map: originalTexture || null,
              });

              child.material = newMaterial;
              child.material.needsUpdate = true;
            } catch (meshError) {
              console.warn(`Warning: Could not update material for mesh ${child.name}:`, meshError);
            }
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
          try {
            texture.flipY = false;
            texture.needsUpdate = true;
            textTextureRef.current = texture;

            // Apply embossed text effect
            clonedScene.traverse((child) => {
              if (child instanceof THREE.Mesh) {
                try {
                  const meshName = child.name || child.uuid;
                  const meshColor = meshColors?.[meshName] || modelColor;
                  const originalTexture = originalTexturesRef.current.get(meshName);

                  // Create a new material with embossed effect using the correct mesh color
                  const newMaterial = new THREE.MeshStandardMaterial({
                    color: meshColor,  // Use the specific mesh color
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
                    try {
                      const canvas = document.createElement('canvas');
                      canvas.width = 2048;
                      canvas.height = 2048;
                      const ctx = canvas.getContext('2d');

                      if (ctx) {
                        // Fill with mesh-specific color
                        ctx.fillStyle = meshColor;
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
                    } catch (canvasError) {
                      console.warn('Error creating canvas texture:', canvasError);
                    }
                  }

                  child.material = newMaterial;
                  child.material.needsUpdate = true;
                } catch (meshError) {
                  console.warn(`Warning: Could not apply texture to mesh ${child.name}:`, meshError);
                }
              }
            });
          } catch (textureError) {
            console.error('Error applying texture:', textureError);
          }
        },
        undefined,
        (error) => {
          console.error('Error loading text texture:', error);
        }
      );

      return () => {
        if (textTextureRef.current) {
          try {
            textTextureRef.current.dispose();
            textTextureRef.current = null;
          } catch (disposeError) {
            console.warn('Error disposing texture:', disposeError);
          }
        }
      };
    } catch (error) {
      console.error('Error in texture effect:', error);
    }
  }, [clonedScene, textureUrl, url, meshColors, modelColor]);



  if (loadError) {
    return (
      <Html center>
        <div className="bg-red-500/95 text-white px-4 py-3 rounded-lg shadow-lg max-w-md">
          <div className="font-medium text-sm mb-2">Model Loading Error</div>
          <div className="text-xs opacity-90">{loadError}</div>
          <div className="text-xs opacity-75 mt-2">Please try refreshing the page or selecting a different model.</div>
        </div>
      </Html>
    );
  }

  if (!scene || !clonedScene) {
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
  onModelError?: (error: string) => void;
  textTexture?: string | null;
  onMeshClick?: (meshName: string, mesh: any) => void;
  selectedMesh?: string | null;
  meshColors?: Record<string, string>;
  performanceMode?: boolean;
}

export function ThreeScene({
  modelUrl,
  modelColor,
  onModelLoad,
  onModelError,
  textTexture,
  onMeshClick,
  selectedMesh,
  meshColors,
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

    try {
      gl.domElement.addEventListener('webglcontextlost', handleContextLost, false);
      gl.domElement.addEventListener('webglcontextrestored', handleContextRestored, false);

      return () => {
        try {
          gl.domElement.removeEventListener('webglcontextlost', handleContextLost);
          gl.domElement.removeEventListener('webglcontextrestored', handleContextRestored);
        } catch (error) {
          console.warn('Error removing WebGL event listeners:', error);
        }
      };
    } catch (error) {
      console.warn('Error setting up WebGL event listeners:', error);
    }
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
        <ModelErrorBoundary fallback={ModelErrorFallback}>
          <Model
            key={modelUrl}
            url={modelUrl}
            modelColor={modelColor}
            onModelLoad={onModelLoad}
            onModelError={onModelError}
            onMeshClick={onMeshClick}
            textureUrl={textTexture}
            meshColors={meshColors}
          />
        </ModelErrorBoundary>
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
