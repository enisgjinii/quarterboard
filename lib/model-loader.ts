// Utility function to improve model loading performance
import { SceneLoader, Scene, AbstractMesh, Material, ISceneLoaderProgressEvent } from '@babylonjs/core';

// Cache for models that have already been loaded
const modelCache = new Map<string, { meshes: AbstractMesh[], materials: Material[] }>();

/**
 * Load a model with caching for improved performance
 * @param scene The Babylon.js scene
 * @param url The URL of the model to load
 * @param onProgress Progress callback
 * @param onComplete Completion callback
 * @returns Promise that resolves when the model is loaded
 */
export async function loadModelWithCache(
  scene: Scene, 
  url: string,
  onProgress?: (event: ISceneLoaderProgressEvent) => void,
  onComplete?: (meshes: AbstractMesh[]) => void
): Promise<AbstractMesh[]> {
  // Check if we have this model in cache
  if (modelCache.has(url)) {
    console.log(`[Model Loader] Using cached model: ${url}`);
    const cached = modelCache.get(url)!;
    
    // Clone the cached meshes
    const clonedMeshes = cached.meshes.map(mesh => mesh.clone(mesh.name, null)!);
    
    // Call the completion callback if provided
    if (onComplete) {
      onComplete(clonedMeshes);
    }
    
    return clonedMeshes;
  }
  
  // If not in cache, load it normally
  console.log(`[Model Loader] Loading model: ${url}`);
  
  try {
    // Extract file extension to determine loader
    const fileExt = url.split('.').pop()?.toLowerCase();
    const result = await SceneLoader.ImportMeshAsync("", url, "", scene, onProgress);
      // Store in cache for future use
    modelCache.set(url, {
      meshes: [...result.meshes],
      materials: scene.materials.filter(m => m.id.includes(result.meshes[0]?.id || ''))
    });
    
    // Call the completion callback if provided
    if (onComplete) {
      onComplete(result.meshes);
    }
    
    return result.meshes;
  } catch (error) {
    console.error(`[Model Loader] Failed to load model: ${url}`, error);
    throw error;
  }
}

/**
 * Preload common models to improve user experience
 * @param scene The Babylon.js scene
 * @param urls The URLs of models to preload
 */
export async function preloadCommonModels(scene: Scene, urls: string[]): Promise<void> {
  // Use low priority and load in background
  const loadPromises = urls.map(url => {
    return new Promise<void>((resolve) => {
      // Only preload if not already cached
      if (!modelCache.has(url)) {
        console.log(`[Model Preloader] Preloading: ${url}`);
        loadModelWithCache(scene, url)
          .then(() => {
            console.log(`[Model Preloader] Preloaded: ${url}`);
            resolve();
          })
          .catch(() => {
            console.warn(`[Model Preloader] Failed to preload: ${url}`);
            resolve(); // Resolve anyway to not block other loads
          });
      } else {
        resolve();
      }
    });
  });
  
  // Wait for all preloads to complete
  await Promise.all(loadPromises);
}

/**
 * Clear the model cache to free memory
 */
export function clearModelCache() {
  modelCache.clear();
}
