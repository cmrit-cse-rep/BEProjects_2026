// components/Plant.jsx
import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";

/*
  Robust Plant component (dynamic GLTFLoader) with traversal metadata:
  - modelPath: "/models/Name.glb" (will be encodeURI'd to handle spaces)
  - position: [x,y,z]
  - scale: number | [x,y,z]
  - onSelect(meta): called when user clicks/taps the model
  - meta: plant metadata object (attached to mesh.userData.plantMeta)
*/
export default function Plant({
  modelPath,
  position = [0, 0, 0],
  scale = 1,
  onSelect,
  meta = null,
}) {
  const groupRef = useRef();
  const [model, setModel] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    if (!modelPath) return;

    const safePath = typeof modelPath === "string" ? encodeURI(modelPath) : modelPath;

    (async () => {
      try {
        // dynamic import avoids SSR/build-time problems with three/examples
        const { GLTFLoader } = await import("three/examples/jsm/loaders/GLTFLoader");
        const loader = new GLTFLoader();

        loader.load(
          safePath,
          (gltf) => {
            if (!mounted) return;

            // clone scene so we don't mutate shared cache
            const sceneClone = gltf.scene.clone(true);
            sceneClone.updateMatrixWorld(true);

            // Traverse and set mesh flags and userData (grabbable, plantMeta, callbacks)
            sceneClone.traverse((child) => {
              if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;

                // mark as grabbable (VRGrab will look for this)
                child.userData.grabbable = true;

                // attach plant metadata for pointer/overlay
                if (meta) child.userData.plantMeta = meta;

                // optional callbacks to be invoked by VRGrab if present
                child.userData.onGrab = (controller) => {
                  // Example: hide overlay or pause animations while grabbed
                  // console.log("Plant grabbed:", meta?.displayName || meta?.id, controller);
                };

                child.userData.onRelease = ({ velocity } = {}) => {
                  // Example: log throw velocity or resume any paused actions
                  // console.log("Plant released with velocity", velocity);
                };
              }
            });

            setModel(sceneClone);
          },
          undefined,
          (err) => {
            console.error("[Plant] GLTFLoader load error:", safePath, err);
            if (mounted) setError(err);
          }
        );
      } catch (e) {
        console.error("[Plant] dynamic import/load failed:", e);
        if (mounted) setError(e);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [modelPath, meta]);

  const handleClick = (e) => {
    e.stopPropagation();
    if (onSelect) onSelect(meta);
  };

  if (error) {
    // Optionally render a debug box to mark a missing model
    // return (<mesh position={position}><boxGeometry args={[0.5,0.5,0.5]} /><meshStandardMaterial color="red" /></mesh>);
    return null;
  }

  return (
    <group ref={groupRef} position={position} scale={scale}>
      {model ? (
        <primitive
          object={model}
          dispose={null}
          onClick={handleClick}
          onPointerDown={(e) => e.stopPropagation()}
        />
      ) : null}
    </group>
  );
}
