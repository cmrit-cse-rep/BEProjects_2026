import React, { useRef, useEffect } from "react";
import { useLoader } from "@react-three/fiber";
import * as THREE from "three";

export default function VRVideoImagePanel({
  imageUrl,
  position = [0, 1.6, -1.5],
  size = [1.4, 1],
}) {
  // Safety guard: do not render if image is missing
  if (!imageUrl) return null;

  const meshRef = useRef();

  // Load image as texture
  const texture = useLoader(THREE.TextureLoader, imageUrl);

  useEffect(() => {
    if (!meshRef.current) return;

    // Ensure correct color rendering
    texture.colorSpace = THREE.SRGBColorSpace;

    meshRef.current.material.map = texture;
    meshRef.current.material.needsUpdate = true;
  }, [texture]);

  return (
    <mesh ref={meshRef} position={position}>
      <planeGeometry args={size} />
      <meshBasicMaterial
        toneMapped={false}
        transparent={true}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}
