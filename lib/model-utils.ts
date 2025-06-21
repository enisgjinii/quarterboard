import { Object3D, Mesh, Material, MeshStandardMaterial, Color, Box3, Vector3 } from 'three';

/**
 * Process a loaded 3D model
 * - Applies materials
 * - Optimizes geometries
 * - Fixes common issues
 * - Preserves original materials for individual coloring
 */
export function processModel(model: Object3D, options: {
  color?: string;
  metalness?: number;
  roughness?: number;
  preserveOriginalMaterials?: boolean;
} = {}) {
  if (!model) {
    console.warn('processModel: No model provided');
    return null;
  }
  
  try {
    console.log('processModel: Starting processing for model:', model);
    
    // Default options
    const materialOptions = {
      color: options.color || '#ffffff',
      metalness: options.metalness ?? 0.2,
      roughness: options.roughness ?? 0.3,
      preserveOriginalMaterials: options.preserveOriginalMaterials ?? true,
    };
    
    console.log('processModel: Using options:', materialOptions);

    // Calculate bounding box and center
    const box = new Box3().setFromObject(model);
    const center = new Vector3();
    const size = new Vector3();
    box.getCenter(center);
    box.getSize(size);

    console.log('processModel: Model bounds calculated:', { center, size });

    // Store original materials and apply new ones
    let meshCount = 0;
    model.traverse((child) => {
      if (child instanceof Mesh) {
        meshCount++;
        // Store original material for restoration if needed
        if (materialOptions.preserveOriginalMaterials && !child.userData.originalMaterial) {
          child.userData.originalMaterial = child.material;
        }
        
        // Apply material if requested
        if (options.color) {
          // Create and apply a standard material that can be individually colored
          const material = new MeshStandardMaterial({
            color: new Color(materialOptions.color),
            metalness: materialOptions.metalness,
            roughness: materialOptions.roughness,
            // Preserve texture maps if they exist
            map: (child.material as MeshStandardMaterial)?.map || null,
            normalMap: (child.material as MeshStandardMaterial)?.normalMap || null,
          });
          
          child.material = material;
        }
        
        // Apply fixes and optimizations
        if (child.geometry) {
          // Ensure geometry has vertex normals for proper lighting
          if (!child.geometry.attributes.normal) {
            child.geometry.computeVertexNormals();
          }
          
          // Set up for better shadows and reflections
          child.castShadow = true;
          child.receiveShadow = true;
        }
        
        // Add interaction capabilities
        child.userData.clickable = true;
        child.userData.hoverable = true;
      }
    });
    
    console.log(`processModel: Processed ${meshCount} meshes successfully`);
    
    return {
      model,
      size,
      center,
      dimensions: {
        width: size.x,
        height: size.y,
        depth: size.z,
        maxDimension: Math.max(size.x, size.y, size.z)
      }
    };
    
  } catch (error) {
    console.error('processModel: Error processing model:', error);
    throw error; // Re-throw to be handled by caller
  }
}

/**
 * Update the color of a specific mesh in the model
 */
export function updateMeshColor(model: Object3D, meshName: string, color: string): boolean {
  let updated = false;
  
  model.traverse((child) => {
    if (child instanceof Mesh && child.name === meshName) {
      const material = child.material as MeshStandardMaterial;
      if (material && material.color) {
        material.color.set(color);
        material.needsUpdate = true;
        updated = true;
      }
    }
  });
  
  return updated;
}

/**
 * Get all meshes from a model with their names and current colors
 */
export function getMeshInfo(model: Object3D): Array<{name: string; color: string; originalMaterial: Material | Material[]}> {
  const meshes: Array<{name: string; color: string; originalMaterial: Material | Material[]}> = [];
  
  model.traverse((child) => {
    if (child instanceof Mesh && child.material) {
      const meshName = child.name || `mesh_${meshes.length}`;
      child.name = meshName; // Ensure mesh has a name
      
      const material = child.material as MeshStandardMaterial;
      const color = material.color ? `#${material.color.getHexString()}` : '#ffffff';
      
      meshes.push({
        name: meshName,
        color: color,
        originalMaterial: child.userData.originalMaterial || child.material
      });
    }
  });
  
  return meshes;
}

/**
 * Cleans up a 3D model by disposing its geometries and materials
 */
export function cleanupModel(model: Object3D): void {
  if (!model) return;
  
  model.traverse((child) => {
    if (child instanceof Mesh) {
      // Dispose geometry
      if (child.geometry) {
        child.geometry.dispose();
      }
      
      // Dispose materials
      if (child.material) {
        if (Array.isArray(child.material)) {
          child.material.forEach(material => {
            if (material.map) material.map.dispose();
            material.dispose();
          });
        } else {
          if (child.material.map) child.material.map.dispose();
          child.material.dispose();
        }
      }
    }
  });
}
