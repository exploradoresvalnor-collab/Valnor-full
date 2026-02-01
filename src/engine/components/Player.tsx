/**
 * Player - Componente del jugador con física y controles
 */

import { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { RigidBody, CapsuleCollider, RapierRigidBody } from '@react-three/rapier';
import * as THREE from 'three';
import { useMovement } from '../hooks/useMovement';
import { useCamera } from '../hooks/useCamera';
import { usePlayerStore } from '../../stores/playerStore';
import { CollisionGroups } from './PhysicsWorld';

interface PlayerProps {
  position?: [number, number, number];
  onReady?: () => void;
}

// Placeholder mesh para el jugador (después será el modelo 3D)
function PlayerMesh() {
  return (
    <group>
      {/* Cuerpo */}
      <mesh castShadow position={[0, 0.5, 0]}>
        <capsuleGeometry args={[0.3, 0.8, 8, 16]} />
        <meshStandardMaterial color="#ffd700" metalness={0.3} roughness={0.7} />
      </mesh>
      
      {/* Cabeza */}
      <mesh castShadow position={[0, 1.3, 0]}>
        <sphereGeometry args={[0.25, 16, 16]} />
        <meshStandardMaterial color="#ffd700" metalness={0.3} roughness={0.7} />
      </mesh>
      
      {/* Indicador de dirección (frente) */}
      <group position={[0, 1.3, 0.3]} rotation={[Math.PI / 2, 0, 0]}>
        <mesh>
          <coneGeometry args={[0.1, 0.2, 8]} />
          <meshBasicMaterial color="#ff6600" />
        </mesh>
      </group>
    </group>
  );
}

export function Player({ position = [0, 2, 0], onReady }: PlayerProps) {
  const bodyRef = useRef<RapierRigidBody>(null);
  const meshRef = useRef<THREE.Group>(null);
  
  // Store del jugador
  const { setPosition, setIsGrounded, setIsMoving } = usePlayerStore();
  
  // Sistema de cámara
  const camera = useCamera(meshRef, {
    distance: 8,
    height: 3,
    targetOffset: new THREE.Vector3(0, 1.5, 0),
  });
  
  // Sistema de movimiento
  const movement = useMovement(bodyRef, camera, {
    walkSpeed: 4,
    runSpeed: 7,
    sprintSpeed: 12,
    jumpForce: 8,
  });

  // Notificar cuando esté listo
  useEffect(() => {
    onReady?.();
  }, [onReady]);

  // Sincronizar estado con store
  useFrame(() => {
    if (!bodyRef.current) return;
    
    // Obtener posición del cuerpo físico
    const pos = bodyRef.current.translation();
    setPosition({ x: pos.x, y: pos.y, z: pos.z });
    
    // Actualizar estados
    setIsGrounded(movement.isGrounded);
    setIsMoving(movement.isMoving);
    
    // Rotar mesh hacia la dirección de movimiento
    if (meshRef.current && movement.isMoving) {
      const dir = movement.facingDirection;
      const targetRotation = Math.atan2(dir.x, dir.z);
      meshRef.current.rotation.y = THREE.MathUtils.lerp(
        meshRef.current.rotation.y,
        targetRotation,
        0.1
      );
    }
  });

  return (
    <RigidBody
      ref={bodyRef}
      position={position}
      type="dynamic"
      colliders={false}
      mass={1}
      friction={0.5}
      restitution={0}
      linearDamping={0}
      angularDamping={1000} // Prevenir rotación
      enabledRotations={[false, false, false]} // Bloquear rotación
      lockRotations
      collisionGroups={
        (CollisionGroups.PLAYER << 16) | 
        (CollisionGroups.ALL & ~CollisionGroups.TRIGGER)
      }
    >
      {/* Collider de cápsula para el jugador */}
      <CapsuleCollider args={[0.4, 0.3]} position={[0, 0.7, 0]} />
      
      {/* Mesh visual */}
      <group ref={meshRef}>
        <PlayerMesh />
      </group>
    </RigidBody>
  );
}

export default Player;
