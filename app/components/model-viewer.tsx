"use client"

import { useRef, useEffect, useState, useMemo } from "react"
import { useGLTF, OrbitControls, Center, Text3D, Grid, Environment, Html } from "@react-three/drei"
import { useFrame, useThree, ThreeEvent } from "@react-three/fiber"
import * as THREE from "three"
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js"
import type { GLTF } from "three/examples/jsm/loaders/GLTFLoader.js"
import { FontLoader } from "three/examples/jsm/loaders/FontLoader.js"
import { TTFLoader } from "three/examples/jsm/loaders/TTFLoader.js"
import { TextGeometry } from "three/examples/jsm/geometries/TextGeometry.js"
import { DecalGeometry } from 'three/examples/jsm/geometries/DecalGeometry.js'
import { loadFont } from "@/lib/font-converter"
import { EffectComposer, Outline, Selection } from '@react-three/postprocessing'
import { BlendFunction } from 'postprocessing'
import { Canvas } from '@react-three/fiber'

interface DecalSplatter {
  position: THREE.Vector3;
  rotation: THREE.Euler;
  scale: THREE.Vector3;
  color: string;
  size: number;
  texture?: string;
}

interface BaseProps {
  modelPath: string;
  text3D?: string;
  textPosition?: { x: number; y: number; z: number };
  textScale?: { x: number; y: number; z: number };
  textColor?: string;
  selectedFont?: string;
  isFontLoading: boolean;
  onFontError?: (error: Error) => void;
  onAddDecal?: (position: THREE.Vector3, normal: THREE.Vector3) => void;
}

interface ModelViewerProps extends BaseProps {
  decalSplatters?: DecalSplatter[];
}

interface SceneContentProps extends BaseProps {
  decalSplatters: DecalSplatter[];
}

export function ModelViewer(props: ModelViewerProps) {
  const groupRef = useRef<THREE.Group>(null);
  const controlsRef = useRef<any>(null);
  const { scene: model } = useGLTF(props.modelPath, true);
  const { camera, scene, gl } = useThree();
  const [textMesh, setTextMesh] = useState<THREE.Mesh | null>(null);
  const [fontLoading, setFontLoading] = useState(props.isFontLoading);

  useEffect(() => {
    if (props.text3D && scene) {
      const fontName = props.selectedFont || "helvetiker_regular.typeface.json";
      const fontPath = `/fonts/${fontName}`;
      
      console.log(`Loading 3D text with font: ${fontName}`);
      
      loadFont(fontPath)
        .then((font) => {
          setFontLoading(false);
          try {
            console.log('Creating TextGeometry with options:', {
              size: props.textScale?.x || 0.2,
              height: props.textScale?.y || 0.05,
              curveSegments: 12,
              bevelEnabled: false,
              bevelThickness: 0.03,
              bevelSize: 0.02,
              bevelOffset: 0,
              bevelSegments: 5
            });
            
            const geometry = new TextGeometry(props.text3D || "", {
              font,
              size: props.textScale?.x || 0.2,
              depth: props.textScale?.y || 0.05,
              curveSegments: 12,
              bevelEnabled: false,
              bevelThickness: 0.03,
              bevelSize: 0.02,
              bevelOffset: 0,
              bevelSegments: 5
            });

            let material;
            if (props.textColor) {
              material = new THREE.MeshStandardMaterial({
                color: props.textColor,
                metalness: 0.5,
                roughness: 0.5
              });
            } else {
              material = new THREE.MeshStandardMaterial({
                color: "#ffffff",
                metalness: 0.5,
                roughness: 0.5
              });
            }

            const mesh = new THREE.Mesh(geometry, material);
            mesh.position.set(
              props.textPosition?.x || 0,
              props.textPosition?.y || 0,
              props.textPosition?.z || 0
            );

            if (textMesh) {
              scene.remove(textMesh);
            }
            scene.add(mesh);
            setTextMesh(mesh);
          } catch (error) {
            console.error('Error creating text geometry:', error);
            setFontLoading(false);
            
            if (props.selectedFont !== 'helvetiker_regular.typeface.json') {
              console.log('Falling back to default font due to geometry creation error');
              props.onFontError?.(new Error('Failed to create text with selected font. Falling back to default font.'));
            } else {
              props.onFontError?.(error instanceof Error ? error : new Error('Failed to create text geometry'));
            }
          }
        })
        .catch((error) => {
          setFontLoading(false);
          console.error('Error loading font:', error);
          
          if (props.selectedFont !== 'helvetiker_regular.typeface.json') {
            console.log('Falling back to default font due to font loading error');
            props.onFontError?.(new Error('Failed to load selected font. Falling back to default font.'));
          } else {
            props.onFontError?.(error instanceof Error ? error : new Error('Failed to load font'));
          }
        });
    }
  }, [props.text3D, props.textColor, props.textPosition, props.textScale, scene, props.selectedFont, props.onFontError]);

  // Add decal meshes
  useEffect(() => {
    if (!scene || !model) return;

    // Remove existing decals
    scene.children.forEach(child => {
      if (child.userData.isDecal) {
        scene.remove(child);
      }
    });

    // Create new decals
    props.decalSplatters?.forEach(splatter => {
      // Find the closest face to the decal position
      const raycaster = new THREE.Raycaster();
      raycaster.set(splatter.position, new THREE.Vector3(0, 0, 1));
      
      const intersects = raycaster.intersectObjects(model.children, true);
      if (intersects.length === 0) return;

      const intersection = intersects[0];
      const face = intersection.face;
      if (!face) return;

      // Create decal geometry
      const decalGeometry = new DecalGeometry(
        intersection.object as THREE.Mesh,
        intersection.point,
        splatter.rotation,
        splatter.scale
      );

      // Create material
      let material;
      if (splatter.texture) {
        const texture = new THREE.TextureLoader().load(splatter.texture);
        material = new THREE.MeshPhongMaterial({
          map: texture,
          transparent: true,
          depthTest: true,
          depthWrite: false,
          polygonOffset: true,
          polygonOffsetFactor: -4
        });
      } else {
        material = new THREE.MeshPhongMaterial({
          color: splatter.color,
          transparent: true,
          depthTest: true,
          depthWrite: false,
          polygonOffset: true,
          polygonOffsetFactor: -4
        });
      }

      // Create decal mesh
      const decalMesh = new THREE.Mesh(decalGeometry, material);
      decalMesh.userData.isDecal = true;
      scene.add(decalMesh);
    });
  }, [scene, model, props.decalSplatters]);

  // Add click handler for decal placement
  const handleClick = (event: ThreeEvent<PointerEvent>) => {
    if (!model || !props.onAddDecal) return;

    // Get the canvas element
    const canvas = gl.domElement;
    const rect = canvas.getBoundingClientRect();
    const mouse = new THREE.Vector2(
      ((event.clientX - rect.left) / rect.width) * 2 - 1,
      -((event.clientY - rect.top) / rect.height) * 2 + 1
    );

    // Create raycaster
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, camera);

    // Find intersections
    const intersects = raycaster.intersectObjects(model.children, true);
    if (intersects.length === 0) return;

    const intersection = intersects[0];
    props.onAddDecal(intersection.point, intersection.face?.normal || new THREE.Vector3(0, 0, 1));
  };

  return (
    <group ref={groupRef} onClick={handleClick}>
      <primitive object={model} />
    </group>
  );
}

// Preload the default model
useGLTF.preload("/models/quarterboard_2.glb")
