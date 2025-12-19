// components/VRPointer.jsx
import React, { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

export default function VRPointer({ onSelect }) {
  const rayRef = useRef();
  const tmpVec = new THREE.Vector3();

  useFrame(({ gl, scene }) => {
    const controller = gl.xr.getController(0);
    if (!controller) return;

    controller.getWorldDirection(tmpVec);
    const origin = controller.position.clone();

    const raycaster = new THREE.Raycaster(origin, tmpVec);
    const hits = raycaster.intersectObjects(scene.children, true);

    if (hits.length > 0) {
      const hit = hits[0].object;

      if (hit.userData?.plantMeta) {
        if (rayRef.current) {
          rayRef.current.material.color.set("yellow");
        }
      } else {
        if (rayRef.current) {
          rayRef.current.material.color.set("white");
        }
      }
    }
  });

  return (
    <mesh ref={rayRef}>
      <cylinderGeometry args={[0.005, 0.005, 1.5]} />
      <meshBasicMaterial color="white" />
    </mesh>
  );
}
