// components/GardenScene.jsx
import React, { Suspense, useMemo, useState, useRef, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Sky, Preload, useTexture } from "@react-three/drei";
import * as THREE from "three";

import { XR } from "@react-three/xr"; // XR v3

import Plant from "./Plant";
import UIOverlay from "./UIOverlay";
import plants from "../data/plantData";
import FirstPersonControls from "./FirstPersonControls";

/*
  Guarded imports:
  If any helper export is not a function (component), we skip rendering it and log a message.
  This avoids "Element type is invalid: got object" crashes and tells you which file to fix.
*/
import * as VRGrabModule from "./VRGrab";
import * as VRPointerModule from "./VRPointer";
import * as VRTeleportModule from "./VRTeleport";
import * as VRVideoImagePanelModule from "./VRVideoImagePanel";

const VRGrab = VRGrabModule?.default ?? VRGrabModule;
const VRPointer = VRPointerModule?.default ?? VRPointerModule;
const VRTeleport = VRTeleportModule?.default ?? VRTeleportModule;
const VRVideoImagePanel = VRVideoImagePanelModule?.default ?? VRVideoImagePanelModule;

/* ------------------ Ground ------------------ */
const Ground = React.forwardRef(function Ground(_, ref) {
  const [colorMap, normalMap] = useTexture([
    "/textures/grass.png",
    "/textures/grass_normal.png",
  ]);

  if (colorMap) {
    colorMap.wrapS = colorMap.wrapT = THREE.RepeatWrapping;
    colorMap.repeat.set(24, 24);
  }

  if (normalMap) {
    normalMap.wrapS = normalMap.wrapT = THREE.RepeatWrapping;
    normalMap.repeat.set(24, 24);
  }

  return (
    <mesh ref={ref} rotation-x={-Math.PI / 2} receiveShadow name="ground">
      <planeGeometry args={[200, 200]} />
      <meshStandardMaterial map={colorMap} normalMap={normalMap} roughness={0.9} />
    </mesh>
  );
});

/* ------------------ Main Scene ------------------ */
export default function GardenScene() {
  const positions = useMemo(() => {
    return Array.from({ length: 12 }, () => {
      const x = (Math.random() - 0.5) * 30;
      const z = (Math.random() - 0.5) * 30;
      const s = 0.6 + Math.random() * 0.9;
      return [x, 0, z, s];
    });
  }, []);

  const [selected, setSelected] = useState(null);
  const groundRef = useRef();

  // development video path (you uploaded this file earlier)
  //const VIDEO_URL = "/mnt/data/AYUR-VANA _ A Virtual Herbal Garden by ETHERJACK.mp4";

  // Log types on mount so you can spot which one is wrong
  useEffect(() => {
    console.group("GardenScene - imported helper types");
    console.log("VRGrab:", typeof VRGrab, VRGrab);
    console.log("VRPointer:", typeof VRPointer, VRPointer);
    console.log("VRTeleport:", typeof VRTeleport, VRTeleport);
    console.log("VRVideoImagePanel:", typeof VRVideoImagePanel, VRVideoImagePanel);
    console.groupEnd();
  }, []);

  // helpers: only render if the import is a function (React component)
  const renderIfComponent = (Comp, props = {}) => {
    if (typeof Comp === "function" || (Comp && Comp.$$typeof)) {
      // classic function component or React element-like
      return <Comp {...props} />;
    } else {
      // not a component — skip and warn
      console.warn("Skipping render of helper (not a component):", Comp);
      return null;
    }
  };

  return (
    <>
      <Canvas shadows camera={{ position: [0, 6, 12], fov: 50 }}>
        <XR>
          <ambientLight intensity={0.45} />
          <directionalLight
            castShadow
            position={[10, 20, 10]}
            intensity={1.0}
            shadow-mapSize-width={2048}
            shadow-mapSize-height={2048}
          />

          <Suspense fallback={null}>
            <Sky sunPosition={[100, 20, 100]} />

            <Ground ref={groundRef} />

            {positions.map((p, i) => {
              const plantMeta = plants[i % plants.length];
              return (
                <Plant
                  key={i}
                  modelPath={plantMeta.modelPath}
                  position={[p[0], 0, p[2]]}
                  scale={p[3]}
                  onSelect={() => setSelected(plantMeta)}
                  meta={plantMeta}
                />
              );
            })}

            {/* in-VR video panel when a plant is selected */}
{/* in-VR image panel when a plant is selected */}
{selected &&
  renderIfComponent(VRVideoImagePanel, { imageUrl: selected.image, position: [0, 1.6, -1.5], size: [1.4, 1]})}
            <Preload all />
          </Suspense>

          {/* VR helpers (guarded) */}
          {renderIfComponent(VRGrab)}
          {renderIfComponent(VRPointer, { onSelect: (meta) => setSelected(meta) })}
          {renderIfComponent(VRTeleport, { floorObjects: groundRef.current ? [groundRef.current] : [] })}

          {/* Desktop movement remains */}
          <FirstPersonControls speed={6} lookSpeed={0.002} />
        </XR>

        <OrbitControls enablePan={true} />
      </Canvas>

      <UIOverlay selected={selected} onClose={() => setSelected(null)} />
    </>
  );
}
