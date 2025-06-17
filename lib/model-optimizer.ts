// Utility functions for model simplification and optimization
import { Scene, Mesh, VertexData, Material, StandardMaterial, Color3, Texture, PBRMaterial } from '@babylonjs/core';

/**
 * Optimizes materials by reducing texture sizes and complexity
 */
export function optimizeMaterials(scene: Scene, performanceMode: boolean) {
  scene.materials.forEach(material => {
    if (material instanceof StandardMaterial) {
      // Reduce texture quality in performance mode
      if (performanceMode) {
        // Lower texture quality
        if (material.diffuseTexture) {
          material.diffuseTexture.level = 0.5;  // Reduce texture sharpness
          material.diffuseTexture.anisotropicFilteringLevel = 1; // Lowest anisotropic filtering
        }
        
        // Disable expensive reflections
        material.reflectionTexture = null;
        material.specularTexture = null;
        
        // Simplify material settings
        material.useSpecularOverAlpha = false;
        material.useReflectionOverAlpha = false;
        material.useReflectionFresnelFromSpecular = false;
        material.disableLighting = false;
      }
    } 
    else if (material instanceof PBRMaterial) {
      if (performanceMode) {
        // Simplify PBR materials in performance mode
        material.forceIrradianceInFragment = false;
        material.realTimeFiltering = false;
        material.realTimeFilteringQuality = 1;
        
        // Lower texture quality
        if (material.albedoTexture) {
          material.albedoTexture.level = 0.5;
          material.albedoTexture.anisotropicFilteringLevel = 1;
        }
          // Disable advanced textures
        material.environmentBRDFTexture = null;
        material.reflectivityTexture = null;
        material.microSurfaceTexture = null;
        material.metallicTexture = null;
        
        // Disable advanced features
        material.enableSpecularAntiAliasing = false;
        material.useRadianceOcclusion = false;
        material.useHorizonOcclusion = false;        // Simplify rendering
        material.realTimeFiltering = false;
        material.useHorizonOcclusion = false;
      }
    }
  });
}

/**
 * Simplifies meshes by reducing vertex count for better performance
 */
export function optimizeMeshes(scene: Scene, performanceMode: boolean) {
  const meshes = scene.meshes.filter(mesh => mesh instanceof Mesh) as Mesh[];
  
  if (!performanceMode) return; // Only apply in performance mode
  
  meshes.forEach(mesh => {
    // Skip small meshes or those with few vertices
    if (!mesh.geometry || mesh.geometry.getTotalVertices() < 1000) return;
    
    // Apply level-of-detail (LOD) for distant objects
    if (!mesh.getLODLevels || mesh.getLODLevels().length === 0) {      // Remove unused vertex data to save memory
      if (mesh.geometry) {
        if (!mesh.geometry.isVerticesDataPresent('normal')) {
          mesh.forceSharedVertices();
        }
      }
      
      // Optimize mesh instances
      mesh.freezeWorldMatrix();
      
      // Disable expensive computations if not needed
      mesh.doNotSyncBoundingInfo = true;
    }
  });
  
  // Force garbage collection to free memory
  if (window.gc) {
    window.gc();
  }
}
