import { useEffect, useRef } from 'react';
import { 
  Scene, 
  SceneLoader, 
  StandardMaterial, 
  Color3, 
  Vector3, 
  TransformNode, 
  MeshBuilder, 
  Mesh, 
  PointerDragBehavior, 
  HighlightLayer,
  ActionManager,
  ExecuteCodeAction,
  PickingInfo,
  Animation,
  EasingFunction,
  CubicEase,
  PBRMaterial,
  Texture,
  ArcRotateCamera,
  CSG
} from '@babylonjs/core';
import '@babylonjs/loaders/glTF';
import '@babylonjs/loaders/OBJ';
import '@babylonjs/loaders/STL';
import '@babylonjs/core/Loading/loadingScreen';
import { AdvancedDynamicTexture, TextBlock } from '@babylonjs/gui';

interface BabylonModelLoaderProps {
  modelUrl: string;
  modelColor: string;
  onModelLoad: (info: any) => void;
  selectedMaterial: string | null;
  materialPreview: string | null;
  isPreviewMode: boolean;
  text3D: string;
  textColor: string;
  textPosition: { x: number; y: number; z: number };
  textRotation: { x: number; y: number; z: number };
  textScale: { x: number; y: number; z: number };
  text3DOptions: any;
  textMaterial: 'standard' | 'emissive' | 'engraved';
  engraveDepth: number;
  isEngraving: boolean;
  selectedFont: string;
  onFontError: (error: Error) => void;
  uvMapTexture: string | null;
  uvMapText: string;
  uvMapTextOptions: any;
  scene: Scene | null;
}

export function BabylonModelLoader({
  modelUrl,
  modelColor,
  onModelLoad,
  selectedMaterial,
  materialPreview,
  isPreviewMode,
  text3D,
  textColor,
  textPosition,
  textRotation,
  textScale,
  text3DOptions,
  textMaterial,
  engraveDepth,
  isEngraving,
  selectedFont,
  onFontError,
  uvMapTexture,
  uvMapText,
  uvMapTextOptions,
  scene
}: BabylonModelLoaderProps) {
  const modelRef = useRef<TransformNode | null>(null);
  const textMeshRef = useRef<Mesh | null>(null);
  useEffect(() => {
    if (!modelUrl || !scene) return;
    
    // Add a cleanup flag to prevent multiple loads/renders
    let isActive = true;
    
    const loadModel = async () => {
      try {
        console.log("Attempting to load model from URL:", modelUrl);
        const lastSlashIndex = modelUrl.lastIndexOf('/');
        const directory = modelUrl.substring(0, lastSlashIndex + 1);
        // Decode the filename in case it was URL encoded
        const filename = decodeURIComponent(modelUrl.substring(lastSlashIndex + 1));
        console.log("Parsed model path - Directory:", directory, "Filename:", filename);

        if (modelRef.current) {
          modelRef.current.dispose();
          modelRef.current = null;
        }        console.log("Loading model:", directory, filename);
        const result = await SceneLoader.ImportMeshAsync(
          "", 
          directory, 
          filename, 
          scene
        );
        console.log("Model loaded successfully:", result.meshes.length, "meshes");        // Check if the component is still mounted
        if (!isActive) return;
        
        // Get the root mesh or the first mesh if it's the only one
        const rootMesh = result.meshes.find(m => m.name === "__root__") || result.meshes[0];
        console.log("Root mesh found:", rootMesh.name, "with", rootMesh.getChildMeshes().length, "child meshes");
          // Store reference to the model
        const model = rootMesh;
        modelRef.current = model;
          // Apply more visible material to model
        const material = new StandardMaterial("modelMaterial", scene);
        material.diffuseColor = Color3.FromHexString(modelColor);
        material.specularColor = new Color3(0.3, 0.3, 0.3);
        material.emissiveColor = new Color3(0.1, 0.1, 0.1);
        material.alpha = 1.0;
        
        // Apply material to all meshes in the model
        const allMeshes = model.getChildMeshes(false);
        console.log("Processing", allMeshes.length, "meshes");
        
        if (allMeshes.length > 0) {
          allMeshes.forEach(mesh => {
            if (mesh.material) {
              mesh.material.dispose();
            }
            mesh.material = material.clone(mesh.name + "_material");
            mesh.visibility = 1.0; // Ensure mesh is visible
          });
        } else {
          // If no child meshes, apply material to the root mesh itself
          if (model.material) {
            model.material.dispose();
          }
          model.material = material;
          model.visibility = 1.0;
        }
        
        console.log("Materials applied to model");        const boundingInfo = model.getHierarchyBoundingVectors();
        const min = boundingInfo.min;
        const max = boundingInfo.max;
        const center = min.add(max).scale(0.5);
        const size = max.subtract(min);
        const maxDimension = Math.max(size.x, size.y, size.z);
        
        console.log("Model bounds:", {
          min: { x: min.x, y: min.y, z: min.z },
          max: { x: max.x, y: max.y, z: max.z },
          center: { x: center.x, y: center.y, z: center.z },
          size: { x: size.x, y: size.y, z: size.z },
          maxDimension
        });

        // Reset the model position and rotation first
        model.position = Vector3.Zero();
        model.rotation = Vector3.Zero();
        
        // Scale and position the model
        let scale = 5 / maxDimension; // Use a larger scale factor
        model.scaling = new Vector3(scale, scale, scale);
        model.position = new Vector3(-center.x * scale, -center.y * scale, -center.z * scale);
        
        // Ensure model is visible above the ground
        const minY = min.y * scale;
        if (minY < 0) {
          model.position.y -= minY;
        }
        
        // Ensure the model is visible by moving it up slightly
        model.position.y += 0.1;
        
        console.log("Model positioned at:", {
          position: { x: model.position.x, y: model.position.y, z: model.position.z },
          scaling: { x: model.scaling.x, y: model.scaling.y, z: model.scaling.z }
        });

        const highlightLayer = new HighlightLayer("highlightLayer", scene);

        const createEngravedText = (position: Vector3, targetMesh: Mesh) => {
          if (!text3D || text3D.trim() === '') {
            return;
          }

          try {
            const textMesh = MeshBuilder.CreateBox(
              "engravedText", 
              { width: text3D.length * 0.2, height: 0.2, depth: engraveDepth }, 
              scene
            );
            textMesh.position = position;

            const textMaterial = new StandardMaterial("textMaterial", scene);
            textMaterial.diffuseColor = Color3.FromHexString(textColor);
            textMesh.material = textMaterial;

            const targetCSG = CSG.FromMesh(targetMesh);
            const textCSG = CSG.FromMesh(textMesh);
            const engravedCSG = targetCSG.subtract(textCSG);

            const engravedMesh = engravedCSG.toMesh("engravedMesh", targetMesh.material as StandardMaterial, scene);
            engravedMesh.position = targetMesh.position.clone();
            engravedMesh.scaling = targetMesh.scaling.clone();

            targetMesh.dispose();
            textMesh.dispose();

            highlightLayer.addMesh(engravedMesh, Color3.Red());
          } catch (error) {
            console.error('Error creating engraved text:', error);
            onFontError(error as Error);
          }
        };

        model.getChildMeshes().forEach(mesh => {
          mesh.isPickable = true;
          const am = new ActionManager(scene);
          mesh.actionManager = am;

          am.registerAction(
            new ExecuteCodeAction(
              ActionManager.OnPointerOverTrigger,
              () => {
                highlightLayer.addMesh(mesh as Mesh, Color3.Green());
                document.body.style.cursor = 'pointer';
              }
            )
          );

          am.registerAction(
            new ExecuteCodeAction(
              ActionManager.OnPointerOutTrigger,
              () => {
                highlightLayer.removeMesh(mesh as Mesh);
                document.body.style.cursor = 'default';
              }
            )
          );

          am.registerAction(
            new ExecuteCodeAction(
              ActionManager.OnPickTrigger,
              (evt) => {
                if (evt.source && evt.source.getClassName() === "Mesh") {
                  const mesh = evt.source as Mesh;
                  const pickInfo = scene?.pick(scene.pointerX, scene.pointerY);
                  if (pickInfo?.hit && pickInfo?.pickedPoint) {
                    createEngravedText(pickInfo.pickedPoint, mesh);
                  }
                }
              }
            )
          );
        });

        onModelLoad({
          name: model.name,
          vertices: model.getTotalVertices(),
          faces: model.getTotalIndices() / 3,
          materials: [material.name],
          uvSets: model.getVerticesData("uv") ? ["uv0"] : []
        });

      } catch (error) {
        console.error('Error loading model:', error);
      }    };

    loadModel();
    
    // Add mesh validation to ensure all meshes have proper bounding info
    const validateMeshes = () => {
      if (!scene || !modelRef.current) return;
      
      const allMeshes = [...scene.meshes];
      allMeshes.forEach(mesh => {
        try {
          // Regenerate bounding info if missing or invalid
          if (!mesh.getBoundingInfo() || 
              !mesh.getBoundingInfo().boundingBox || 
              !mesh.getBoundingInfo().boundingSphere) {
            console.log("Regenerating bounding info for mesh:", mesh.name);
            mesh.refreshBoundingInfo();
          }
          
          // Also check submeshes
          if (mesh.subMeshes) {
            mesh.subMeshes.forEach(subMesh => {
              if (!subMesh.getBoundingInfo() || 
                  !subMesh.getBoundingInfo().boundingSphere ||
                  !subMesh.getBoundingInfo().boundingBox) {
                console.log("Fixing submesh bounding info for:", mesh.name);
                subMesh.refreshBoundingInfo();
              }
            });
          }
        } catch (e) {
          console.warn("Could not validate mesh", mesh.name, e);
          // Disable problematic meshes that can't be fixed
          mesh.setEnabled(false);
        }
      });
    };
    
    // Run validation after a short delay to ensure model is fully loaded
    const validationTimeout = setTimeout(validateMeshes, 1000);
    
    // Cleanup function to prevent memory leaks and multiple loads
    return () => {
      isActive = false;
      clearTimeout(validationTimeout);
      if (modelRef.current) {
        // Don't dispose the model here, it will be handled on the next load
      }
    };
  }, [modelUrl, modelColor, onModelLoad, scene, text3D, textColor, engraveDepth]);

  return null;
}