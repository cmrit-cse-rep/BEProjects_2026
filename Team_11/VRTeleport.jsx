// components/VRTeleport.jsx
import { useThree, useFrame } from "@react-three/fiber";
import * as THREE from "three";

export default function VRTeleport({ floorObjects = [] }) {
  const { gl, camera } = useThree();
  const raycaster = new THREE.Raycaster();
  const direction = new THREE.Vector3();
  const pos = new THREE.Vector3();

  useFrame(() => {
    const controller = gl.xr.getController(1);
    if (!controller) return;

    controller.getWorldDirection(direction);
    pos.setFromMatrixPosition(controller.matrixWorld);

    raycaster.set(pos, direction);
    const intersects = raycaster.intersectObjects(floorObjects, true);

    if (intersects.length > 0) {
      const point = intersects[0].point;

      controller.addEventListener("selectstart", () => {
        camera.position.set(point.x, camera.position.y, point.z);
      });
    }
  });

  return null;
}
