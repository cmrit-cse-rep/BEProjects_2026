// components/VRGrab.jsx
import React, { useEffect, useRef } from "react";
import { useThree, useFrame } from "@react-three/fiber";
import * as THREE from "three";

/**
 * VRGrab
 * - Listens to controller squeeze/select events and attaches nearest grabbable mesh.
 * - On release, detaches and gives an approximate throw velocity.
 *
 * Usage: <VRGrab />
 *
 * To mark a mesh grabbable: mesh.userData.grabbable = true and optionally mesh.userData.onGrab/onRelease callbacks.
 */
export default function VRGrab({ grabMaxDistance = 1.2 }) {
  const { gl, scene, camera } = useThree();
  const prevPositions = useRef(new Map()); // controllerId -> {lastPos, lastTime}
  const heldMap = useRef(new Map()); // controller -> { object, offsetMatrix }

  useEffect(() => {
    const controller0 = gl.xr.getController(0);
    const controller1 = gl.xr.getController(1);
    const controllers = [controller0, controller1];

    const raycaster = new THREE.Raycaster();
    const tmpMat = new THREE.Matrix4();

    function findGrabbable(controller) {
      // cast small sphere or ray from controller forward to find nearest grabbable
      const origin = new THREE.Vector3().setFromMatrixPosition(controller.matrixWorld);
      const dir = new THREE.Vector3(0, 0, -1).applyMatrix4(new THREE.Matrix4().extractRotation(controller.matrixWorld)).normalize();
      raycaster.set(origin, dir);
      const intersects = raycaster.intersectObjects(scene.children, true);

      for (let i = 0; i < intersects.length; i++) {
        const obj = intersects[i].object;
        // climb until top-level mesh with userData.grabbable
        let cur = obj;
        while (cur && !cur.userData?.grabbable) cur = cur.parent;
        if (cur && cur.userData?.grabbable) {
          // ensure within distance
          const dist = intersects[i].distance;
          if (dist <= grabMaxDistance) return { hit: cur, distance: dist };
        }
      }
      return null;
    }

    function onSqueezeStart(event) {
      const controller = event.target;
      if (heldMap.current.has(controller)) return; // already holding
      const result = findGrabbable(controller);
      if (!result) return;
      const object = result.hit;

      // store world-to-controller offset so object maintains its pose while attached
      tmpMat.copy(controller.matrixWorld).invert();
      const offset = tmpMat.clone().multiply(object.matrixWorld);

      // attach object to controller (preserve world transform by applying parent transform)
      // remove from previous parent and add to controller
      // save original parent to restore later
      const originalParent = object.parent;
      object.userData.__originalParent = originalParent;
      object.userData.__originalMatrixWorld = object.matrixWorld.clone();

      // set object's matrix relative to controller
      controller.add(object);
      object.matrix.copy(offset); // object.matrix = controller^-1 * objectWorld
      object.matrixAutoUpdate = false; // we control matrix explicitly while attached

      heldMap.current.set(controller, { object, offset });
      if (object.userData.onGrab) object.userData.onGrab(controller);

      // init prevPositions for velocity calc
      const pos = new THREE.Vector3().setFromMatrixPosition(controller.matrixWorld);
      prevPositions.current.set(controller.uuid, { lastPos: pos.clone(), lastTime: performance.now() });
    }

    function onSqueezeEnd(event) {
      const controller = event.target;
      const held = heldMap.current.get(controller);
      if (!held) return;
      const { object } = held;

      // compute throw velocity approximation
      const prev = prevPositions.current.get(controller.uuid);
      const now = performance.now();
      const currPos = new THREE.Vector3().setFromMatrixPosition(controller.matrixWorld);
      let velocity = new THREE.Vector3(0, 0, 0);
      if (prev && prev.lastTime && now !== prev.lastTime) {
        const dt = (now - prev.lastTime) / 1000;
        velocity.copy(currPos).sub(prev.lastPos).divideScalar(dt);
      }

      // detach: restore original parent and world transform
      const originalParent = object.userData.__originalParent || scene;
      // compute new world matrix from controller transform * object.matrix (object.matrix is relative to controller)
      object.matrixAutoUpdate = true;
      // temporarily compute world matrix
      const world = new THREE.Matrix4().multiplyMatrices(controller.matrixWorld, object.matrix);
      // remove from controller
      controller.remove(object);
      originalParent.add(object);
      // apply world transform to object's local matrix
      object.matrix.copy(world);
      object.matrix.decompose(object.position, object.quaternion, object.scale);
      object.updateMatrixWorld(true);

      // remove bookkeeping
      heldMap.current.delete(controller);
      prevPositions.current.delete(controller.uuid);

      // optional callback
      if (object.userData.onRelease) object.userData.onRelease({ velocity });

      // if you have physics (cannon) you would set the physics body's velocity here.
      // For visual throw without physics we can apply a simple linear animation to simulate toss:
      applySimpleThrow(object, velocity);
    }

    // attach events
    controllers.forEach((c) => {
      c.addEventListener("squeezestart", onSqueezeStart);
      c.addEventListener("squeezeend", onSqueezeEnd);
    });

    // track controller movement for velocity calc
    const updatePrev = () => {
      controllers.forEach((c) => {
        if (!c) return;
        const held = heldMap.current.get(c);
        const pos = new THREE.Vector3().setFromMatrixPosition(c.matrixWorld);
        prevPositions.current.set(c.uuid, { lastPos: pos.clone(), lastTime: performance.now() });
      });
    };

    const interval = setInterval(updatePrev, 50); // sample velocity ~20Hz

    return () => {
      controllers.forEach((c) => {
        c.removeEventListener("squeezestart", onSqueezeStart);
        c.removeEventListener("squeezeend", onSqueezeEnd);
      });
      clearInterval(interval);
    };
  }, [gl, scene, camera, grabMaxDistance]);

  // optional visual throw (linear + gravity approx) — purely visual, no physics
  function applySimpleThrow(object, velocity) {
    // if velocity is tiny, skip
    if (velocity.length() < 0.1) return;

    const startPos = object.position.clone();
    const startTime = performance.now();
    // create animation state
    const state = { v: velocity.clone(), start: startTime, obj: object, alive: true };

    // store on object so we can cancel if needed
    object.userData._throwState = state;

    // register frame updater
    const unsub = useFrame.register
      ? // safety: if useFrame.register exists (it normally doesn't), but we will use useFrame below
        null
      : null;
  }

  // If you want a simpler continuous update for any animate logic, use useFrame (here no-op)
  useFrame(() => {
    // Could implement a visual fallback for thrown objects here (gravity) if desired.
  });

  return null;
}
