/**
 * GameCamera - Cámara de tercera persona
 */

import React, { useRef, useEffect } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';

interface GameCameraProps {
  target?: React.RefObject<THREE.Object3D>;
  distance?: number;
  height?: number;
  smoothing?: number;
}

export function GameCamera({
  target,
  distance = 10,
  height = 5,
  smoothing = 0.1,
}: GameCameraProps) {
  const cameraRef = useRef<THREE.PerspectiveCamera>(null);
  const { set } = useThree();
  
  const currentPosition = useRef(new THREE.Vector3(0, height, distance));
  const currentTarget = useRef(new THREE.Vector3());
  const idealPosition = useRef(new THREE.Vector3());

  // Set como cámara principal
  useEffect(() => {
    if (cameraRef.current) {
      set({ camera: cameraRef.current });
    }
  }, [set]);

  useFrame(() => {
    if (!cameraRef.current || !target?.current) return;
    
    // Obtener posición del objetivo
    target.current.getWorldPosition(currentTarget.current);
    currentTarget.current.y += 1.5; // Offset hacia arriba
    
    // Calcular posición ideal de la cámara
    idealPosition.current.copy(currentTarget.current);
    idealPosition.current.z += distance;
    idealPosition.current.y += height;
    
    // Suavizar movimiento
    currentPosition.current.lerp(idealPosition.current, smoothing);
    
    // Aplicar
    cameraRef.current.position.copy(currentPosition.current);
    cameraRef.current.lookAt(currentTarget.current);
  });

  return (
    <PerspectiveCamera
      ref={cameraRef}
      makeDefault
      fov={60}
      near={0.1}
      far={1000}
      position={[0, height, distance]}
    />
  );
}

export default GameCamera;
