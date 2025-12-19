// components/FirstPersonControls.jsx
import React, { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

/**
 * Simple first-person keyboard movement:
 * - WASD or arrow keys to move
 * - Click canvas to lock pointer (mouse look). Press Esc to release.
 *
 * Usage: place <FirstPersonControls /> inside <Canvas> (as child).
 */
export default function FirstPersonControls({
  speed = 6,         // units per second
  lookSpeed = 0.002, // multiply mouse movement for look
  enablePointerLock = true
}) {
  const { camera, gl } = useThree();
  const keys = useRef({
    forward: 0,
    backward: 0,
    left: 0,
    right: 0,
    up: 0,
    down: 0
  });

  const velocity = useRef(new THREE.Vector3());
  const direction = useRef(new THREE.Vector3());

  // mouse look state (when pointer locked)
  const yaw = useRef(0);
  const pitch = useRef(0);
  const pointerLocked = useRef(false);

  useEffect(() => {
    const onKeyDown = (e) => {
      switch (e.code) {
        case "KeyW":
        case "ArrowUp":
          keys.current.forward = 1;
          break;
        case "KeyS":
        case "ArrowDown":
          keys.current.backward = 1;
          break;
        case "KeyA":
        case "ArrowLeft":
          keys.current.left = 1;
          break;
        case "KeyD":
        case "ArrowRight":
          keys.current.right = 1;
          break;
        case "Space":
          keys.current.up = 1;
          break;
        case "ShiftLeft":
        case "ShiftRight":
          keys.current.down = 1;
          break;
        default:
          break;
      }
    };

    const onKeyUp = (e) => {
      switch (e.code) {
        case "KeyW":
        case "ArrowUp":
          keys.current.forward = 0;
          break;
        case "KeyS":
        case "ArrowDown":
          keys.current.backward = 0;
          break;
        case "KeyA":
        case "ArrowLeft":
          keys.current.left = 0;
          break;
        case "KeyD":
        case "ArrowRight":
          keys.current.right = 0;
          break;
        case "Space":
          keys.current.up = 0;
          break;
        case "ShiftLeft":
        case "ShiftRight":
          keys.current.down = 0;
          break;
        default:
          break;
      }
    };

    const onPointerMove = (e) => {
      if (!pointerLocked.current) return;
      // movementX / movementY are in pixels; convert to angles
      yaw.current -= e.movementX * lookSpeed;
      pitch.current -= e.movementY * lookSpeed;
      // clamp pitch to avoid flipping
      const maxPitch = Math.PI / 2 - 0.01;
      pitch.current = Math.max(-maxPitch, Math.min(maxPitch, pitch.current));
      // apply to camera
      camera.rotation.set(pitch.current, yaw.current, 0, "ZYX");
    };

    const onClick = (e) => {
      if (!enablePointerLock) return;
      const canvas = gl.domElement;
      if (document.pointerLockElement !== canvas) {
        canvas.requestPointerLock?.();
      }
    };

    const onPointerLockChange = () => {
      const canvas = gl.domElement;
      pointerLocked.current = document.pointerLockElement === canvas;
      // when pointer lock enabled, capture current rotation into yaw/pitch
      if (pointerLocked.current) {
        const euler = new THREE.Euler().copy(camera.rotation);
        pitch.current = euler.x;
        yaw.current = euler.y;
      }
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerlockchange", onPointerLockChange);
    gl.domElement.addEventListener("click", onClick);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerlockchange", onPointerLockChange);
      gl.domElement.removeEventListener("click", onClick);
    };
  }, [camera, gl, lookSpeed, enablePointerLock]);

  useFrame((state, delta) => {
    // compute movement direction (flat plane)
    const k = keys.current;
    direction.current.set(0, 0, 0);

    // forward/back
    const fwd = k.forward - k.backward;
    const strafe = k.right - k.left;

    // camera forward vector
    const camDir = new THREE.Vector3();
    camera.getWorldDirection(camDir);
    camDir.y = 0;
    camDir.normalize();

    // right vector
    const camRight = new THREE.Vector3();
    camRight.crossVectors(camDir, camera.up).normalize();

    direction.current.addScaledVector(camDir, fwd);
    direction.current.addScaledVector(camRight, strafe);

    // vertical movement (space / shift)
    const updown = k.up - k.down;
    direction.current.y += updown;

    if (direction.current.lengthSq() > 0) {
      direction.current.normalize();
      // speed control
      velocity.current.copy(direction.current).multiplyScalar(speed * delta);
      camera.position.add(velocity.current);
    }
  });

  return null;
}
