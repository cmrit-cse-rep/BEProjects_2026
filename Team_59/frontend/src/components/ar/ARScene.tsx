import React, { Suspense, useRef, useEffect, useMemo, useImperativeHandle, forwardRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Html, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';

// 1. Define Props Interface
export interface ARSceneProps {
  modelPath: string;
  className?: string;
  enableControls?: boolean;
  annotationLevel?: 'basic' | 'intermediate' | 'advanced';
  isolateParts?: string[];
  transparencyToggled?: string[];
  showAllLabels?: boolean;
  sliceValue?: number; 
  opacityValue?: number;
  onAnnotationVisited?: (id: string) => void;
}

// 2. Define Ref Interface (Methods callable from parent)
export interface ARSceneRef {
  resetCamera: () => void;
  moveCamera: (direction: 'up' | 'down' | 'left' | 'right') => void;
}

// 3. Inner Scene (Handles Model Logic)
const InnerScene: React.FC<ARSceneProps> = ({
  modelPath,
  isolateParts = [],
  transparencyToggled = [],
  sliceValue = 0,
  opacityValue = 100
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const { scene } = useGLTF(modelPath);

  const clipPlane = useMemo(() => {
    return new THREE.Plane(new THREE.Vector3(0, -1, 0), 0);
  }, []);

  useFrame(() => {
    const val = sliceValue ?? 0;
    const mappedSlice = (val / 100) * 5 - 2.5; 
    clipPlane.constant = mappedSlice;
  });

  useEffect(() => {
    if (!scene) return;
    scene.traverse((child: THREE.Object3D) => {
      if (!(child instanceof THREE.Mesh)) return;
      const partId = child.userData.partId || child.name;
      const isIsolated = isolateParts.length > 0 && !isolateParts.includes(partId);
      child.visible = !isIsolated;

      if (child.material) {
        const materials = Array.isArray(child.material) ? child.material : [child.material];
        materials.forEach((mat: any) => {
          const safeSlice = sliceValue ?? 0;
          mat.clippingPlanes = safeSlice > 0 ? [clipPlane] : [];
          mat.clipShadows = true;

          const isToggledTransparent = transparencyToggled.includes(partId);
          const safeOpacity = opacityValue ?? 100;
          const globalOpacity = safeOpacity / 100;
          
          if (isToggledTransparent || globalOpacity < 1) {
            mat.transparent = true;
            mat.opacity = isToggledTransparent ? 0.3 : globalOpacity;
            mat.depthWrite = false; 
          } else {
            mat.transparent = false;
            mat.opacity = 1.0;
            mat.depthWrite = true;
          }
          mat.needsUpdate = true;
        });
      }
    });
  }, [scene, isolateParts, transparencyToggled, sliceValue, clipPlane, opacityValue]);

  if (!scene) return <Html center><div className="text-white font-bold">Loading 3D model...</div></Html>;

  return (
    <group ref={groupRef} dispose={null}>
      <primitive object={scene.clone()} />
    </group>
  );
};

// 4. Camera Controller (Handles Panning Logic)
const CameraController = forwardRef<ARSceneRef, {}>((_, ref) => {
  const { camera } = useThree();
  const controlsRef = useRef<OrbitControlsImpl>(null);

  useImperativeHandle(ref, () => ({
    resetCamera: () => {
      if (controlsRef.current) {
        controlsRef.current.reset();
      }
    },
    moveCamera: (direction) => {
      if (!controlsRef.current) return;
      
      // Calculate offset based on camera distance
      const distance = camera.position.distanceTo(controlsRef.current.target);
      const step = distance * 0.1; 

      const offset = new THREE.Vector3();
      const cameraDirection = new THREE.Vector3();
      camera.getWorldDirection(cameraDirection);
      
      const right = new THREE.Vector3().crossVectors(cameraDirection, camera.up).normalize();
      const up = new THREE.Vector3().crossVectors(right, cameraDirection).normalize();

      switch (direction) {
        case 'left': offset.addScaledVector(right, step); break; 
        case 'right': offset.addScaledVector(right, -step); break;
        case 'up': offset.addScaledVector(up, -step); break;
        case 'down': offset.addScaledVector(up, step); break;
      }

      camera.position.add(offset);
      controlsRef.current.target.add(offset);
      controlsRef.current.update();
    }
  }));

  return (
    <OrbitControls
      ref={controlsRef}
      makeDefault
      enablePan={true}
      enableZoom={true}
      enableRotate={true}
      enableDamping={true}
      dampingFactor={0.05}
      minDistance={0.5}
      maxDistance={25}
      target={[0, 0, 0]}
    />
  );
});

// 5. Main Component with ForwardRef
export const ARScene = forwardRef<ARSceneRef, ARSceneProps>((props, ref) => {
  return (
    <Canvas
      camera={{ position: [0, 2, 6], fov: 45, near: 0.1, far: 1000 }}
      shadows
      gl={{ antialias: true, alpha: true, localClippingEnabled: true }}
      className={`w-full h-full ${props.className || ''}`}
    >
      <Suspense fallback={<Html center><div className="text-white">Loading...</div></Html>}>
        <ambientLight intensity={0.8} />
        <directionalLight position={[10, 10, 5]} intensity={1.5} castShadow shadow-mapSize-width={1024} />
        <directionalLight position={[-10, -5, -10]} intensity={0.5} color="#b0c4de" />
        <spotLight position={[0, 10, -5]} intensity={1} angle={0.5} penumbra={1} />

        <InnerScene {...props} />
        <CameraController ref={ref} />
      </Suspense>
    </Canvas>
  );
});

// Preload models
useGLTF.preload('https://sniqhfp9xi52lvz6.public.blob.vercel-storage.com/heart.glb');
useGLTF.preload('https://sniqhfp9xi52lvz6.public.blob.vercel-storage.com/human-brain.glb');
useGLTF.preload('https://sniqhfp9xi52lvz6.public.blob.vercel-storage.com/kidney.glb');
useGLTF.preload('https://sniqhfp9xi52lvz6.public.blob.vercel-storage.com/realistic_human_lungs.glb');
useGLTF.preload('https://sniqhfp9xi52lvz6.public.blob.vercel-storage.com/small_and_large_intestine.glb');