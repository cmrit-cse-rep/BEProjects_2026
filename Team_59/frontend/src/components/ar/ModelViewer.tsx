import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF, Center, Bounds } from '@react-three/drei';
import * as THREE from 'three';
import type { ModelInfo } from '../../types';  // Import shared type

interface ModelViewerProps {
  modelPath: string;
  onModelLoaded?: (loaded: boolean, modelInfo?: ModelInfo) => void;
  onError?: (error: string) => void;
  scale?: number;
  position?: [number, number, number];
  rotation?: [number, number, number];
  autoRotate?: boolean;
  enableAutoCenter?: boolean;
  enableAutoScale?: boolean;
  showWireframe?: boolean;
  materialOverride?: {
    color?: string;
    metalness?: number;
    roughness?: number;
  };
}

export const ModelViewer: React.FC<ModelViewerProps> = ({
  modelPath,
  onModelLoaded,
  onError,
  scale = 1,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  autoRotate = false,
  enableAutoCenter = true,
  enableAutoScale = true,
  showWireframe = false,
  materialOverride
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const [modelLoaded, setModelLoaded] = useState(false);
  const [loadingError, setLoadingError] = useState<string | null>(null);

  // Load GLTF model (useGLTF returns scene and animations only)
  const { scene, animations } = useGLTF(modelPath, true);

  const calculateModelInfo = useCallback((modelScene: THREE.Group): ModelInfo => {
    const boundingBox = new THREE.Box3().setFromObject(modelScene);
    let meshCount = 0;
    let vertexCount = 0;
    let triangleCount = 0;
    const materialSet = new Set<string>();

    modelScene.traverse((child: any) => {
      if (child instanceof THREE.Mesh) {
        meshCount++;
        if (child.geometry) {
          const positionAttribute = child.geometry.getAttribute('position');
          if (positionAttribute) {
            vertexCount += positionAttribute.count;
            triangleCount += positionAttribute.count / 3;
          }
        }
        if (child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach((mat: any) => materialSet.add(mat.uuid));
          } else {
            materialSet.add(child.material.uuid);
          }
        }
      }
    });

    return {
      boundingBox,
      meshCount,
      vertexCount: Math.floor(vertexCount),
      triangleCount: Math.floor(triangleCount),
      materialCount: materialSet.size,
      hasAnimations: !!animations && animations.length > 0,
      animationNames: animations ? animations.map((anim: any) => anim.name) : []
    };
  }, [animations]);

  useEffect(() => {
    if (scene) {
      try {
        const info = calculateModelInfo(scene);
        scene.traverse((child: any) => {
          if (child instanceof THREE.Mesh) {
            child.castShadow = true;
            child.receiveShadow = true;
            if (child.material) {
              const materials = Array.isArray(child.material) ? child.material : [child.material];
              materials.forEach((material: any) => {
                if (materialOverride && 'color' in material) {
                  if (materialOverride.color) material.color = new THREE.Color(materialOverride.color);
                  if (materialOverride.metalness !== undefined && 'metalness' in material) material.metalness = materialOverride.metalness;
                  if (materialOverride.roughness !== undefined && 'roughness' in material) material.roughness = materialOverride.roughness;
                }
                if (showWireframe && 'wireframe' in material) material.wireframe = showWireframe;
                material.needsUpdate = true;
                if ('transparent' in material && 'opacity' in material && material.opacity < 1.0) {
                  material.transparent = true;
                }
              });
            }
          }
        });
        setModelLoaded(true);
        setLoadingError(null);
        onModelLoaded?.(true, info);
      } catch (processingError: any) {
        const errorMessage = processingError?.message ?? 'Failed to process model';
        setLoadingError(errorMessage);
        onError?.(errorMessage);
      }
    }
  }, [scene, modelPath, onModelLoaded, onError, calculateModelInfo, showWireframe, materialOverride]);

  useFrame((_, delta) => {
    if (groupRef.current && modelLoaded && autoRotate) {
      groupRef.current.rotation.y += delta * 0.2;
    }
  });

  useEffect(() => {
    if (groupRef.current) {
      groupRef.current.scale.setScalar(scale);
      groupRef.current.position.set(...position);
      groupRef.current.rotation.set(...rotation);
    }
  }, [scale, position, rotation]);

  const renderModel = () => {
    if (!scene) return null;
    const modelElement = <primitive object={scene.clone()} />;
    if (enableAutoCenter && enableAutoScale) {
      return (
        <Bounds fit clip observe margin={1.2}>
          <Center>{modelElement}</Center>
        </Bounds>
      );
    } else if (enableAutoCenter) {
      return <Center>{modelElement}</Center>;
    }
    return modelElement;
  };

  if (loadingError || !scene) {
    return (
      <group ref={groupRef}>
        {/* Heart fallback shape */}
        <group position={[0, 0, 0]}>
          <mesh position={[-0.6, 0.8, 0]}>
            <sphereGeometry args={[0.5, 16, 16]} />
            <meshStandardMaterial color="#e74c3c" />
          </mesh>
          <mesh position={[0.6, 0.8, 0]}>
            <sphereGeometry args={[0.5, 16, 16]} />
            <meshStandardMaterial color="#e74c3c" />
          </mesh>
          <mesh position={[0, -0.2, 0]} rotation={[0, 0, Math.PI]}>
            <coneGeometry args={[0.8, 1.5, 8]} />
            <meshStandardMaterial color="#c0392b" />
          </mesh>
          <mesh position={[0, 2.5, 0]}>
            <sphereGeometry args={[0.1, 8, 8]} />
            <meshBasicMaterial color="#f39c12" />
          </mesh>
        </group>

        {import.meta.env.MODE === 'development' && (
          <group position={[0, -2, 0]}>
            <mesh>
              <boxGeometry args={[4, 0.5, 0.1]} />
              <meshBasicMaterial color="#34495e" transparent opacity={0.8} />
            </mesh>
          </group>
        )}
      </group>
    );
  }

  return (
    <group ref={groupRef} dispose={null}>
      {renderModel()}
    </group>
  );
};

// Utility functions
export const ModelUtils = {
  preloadModel: (path: string) => {
    return useGLTF.preload(path);
  },

  getModelInfo: async (path: string): Promise<ModelInfo | null> => {
    try {
      const { scene, animations } = useGLTF(path, true);
      const boundingBox = new THREE.Box3().setFromObject(scene);
      let meshCount = 0;
      let vertexCount = 0;
      const materialSet = new Set<string>();
      scene.traverse((child: any) => {
        if (child instanceof THREE.Mesh) {
          meshCount++;
          if (child.geometry) {
            const positionAttribute = child.geometry.getAttribute('position');
            if (positionAttribute) vertexCount += positionAttribute.count;
          }
          if (child.material) {
            if (Array.isArray(child.material)) {
              child.material.forEach((mat: any) => materialSet.add(mat.uuid));
            } else {
              materialSet.add(child.material.uuid);
            }
          }
        }
      });
      return {
        boundingBox,
        meshCount,
        vertexCount,
        triangleCount: Math.floor(vertexCount / 3),
        materialCount: materialSet.size,
        hasAnimations: animations?.length > 0,
        animationNames: animations?.map((anim: any) => anim.name) ?? []
      };
    } catch (error) {
      console.error('Failed to get model info:', error);
      return null;
    }
  },

  clearCache: (path: string) => {
    useGLTF.clear(path);
  },
};

export type { ModelInfo };
