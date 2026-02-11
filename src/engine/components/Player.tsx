/**
 * Player - Componente del jugador con física, controles y Character Tilt
 * Rotación suave via spring (useMovement) + tilt lateral proporcional a giro×velocidad
 */

import { useRef, useEffect, Suspense } from 'react';
import { useFrame } from '@react-three/fiber';
import { RigidBody, CapsuleCollider, RapierRigidBody } from '@react-three/rapier';
import * as THREE from 'three';
import { useMovement } from '../hooks/useMovement';
import { useCamera } from '../hooks/useCamera';
import { usePlayerStore } from '../../stores/playerStore';
import { CollisionGroups } from './PhysicsWorld';
import { CharacterModel3D, CharacterPlaceholder } from './CharacterModel3D';

interface PlayerProps {
  position?: [number, number, number];
  onReady?: () => void;
}

export function Player({ position = [0, 2, 0], onReady }: PlayerProps) {
  const bodyRef = useRef<RapierRigidBody>(null);
  const meshRef = useRef<THREE.Group>(null);
  const tiltContainerRef = useRef<THREE.Group>(null);
  
  const { characterId, characterClass, isInCombat, setPosition, setIsGrounded, setIsMoving } = usePlayerStore();
  
  const camera = useCamera(meshRef, {
    distance: 8,
    height: 3,
    targetOffset: new THREE.Vector3(0, 1.5, 0),
  });
  
  const movement = useMovement(bodyRef, camera, {
    walkSpeed: 4,
    runSpeed: 7,
    sprintSpeed: 12,
    jumpForce: 8,
  });

  useEffect(() => {
    onReady?.();
  }, [onReady]);

  // Constante de tilt (cuánto se inclina lateralmente al girar)
  const TILT_MULTIPLIER = 2.3;
  
  // Kill zone: resetear al spawn si cae demasiado
  const KILL_ZONE_Y = -50;
  const spawnPos = useRef(position);

  useFrame((_, delta) => {
    if (!bodyRef.current) return;
    
    // Clamp delta para lerps frame-independientes
    const dt = Math.min(delta, 0.05);
    
    // Sincronizar posición con store
    const pos = bodyRef.current.translation();
    setPosition({ x: pos.x, y: pos.y, z: pos.z });
    setIsGrounded(movement.isGrounded);
    setIsMoving(movement.isMoving);
    
    // ── Kill Zone: resetear jugador si cae al vacío ──
    if (pos.y < KILL_ZONE_Y) {
      bodyRef.current.setTranslation(
        { x: spawnPos.current[0], y: spawnPos.current[1] + 2, z: spawnPos.current[2] },
        true,
      );
      bodyRef.current.setLinvel({ x: 0, y: 0, z: 0 }, true);
      return;
    }
    
    // ── Rotación del mesh (spring-driven via facingDirection) ──
    if (meshRef.current) {
      const dir = movement.facingDirection;
      const targetRotation = Math.atan2(dir.x, dir.z);
      
      // Suavizar la rotación final del mesh (frame-independent)
      let currentY = meshRef.current.rotation.y;
      let diff = targetRotation - currentY;
      // Normalizar a [-PI, PI]
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      const rotLerp = 1 - Math.pow(0.001, dt); // ~0.15 a 60fps, adaptativo
      meshRef.current.rotation.y = currentY + diff * rotLerp;
    }
    
    // ── Character Tilt (inclinación lateral al girar) ──
    if (tiltContainerRef.current) {
      const angVel = movement.angularVelocity;
      const speed = movement.speed;
      
      // Tilt Z proporcional a velocidad angular × velocidad lineal
      const tiltAmount = -angVel * TILT_MULTIPLIER * Math.min(speed / 7, 1);
      const maxTilt = 0.3; // ~17 grados máximo
      const clampedTilt = THREE.MathUtils.clamp(tiltAmount, -maxTilt, maxTilt);
      
      // Suavizar el tilt (frame-independent)
      const tiltLerp = 1 - Math.pow(0.001, dt);
      tiltContainerRef.current.rotation.z = THREE.MathUtils.lerp(
        tiltContainerRef.current.rotation.z,
        clampedTilt,
        tiltLerp,
      );
      
      // Compensar altura al inclinar (mantener pies en el suelo)
      const absT = Math.abs(tiltContainerRef.current.rotation.z);
      tiltContainerRef.current.position.y = (Math.cos(absT) / 2) - 0.5;
    }
  });

  // Determinar animación
  const animation = movement.isSprinting ? 'Sprint' : movement.isMoving ? 'Run' : 'Idle';

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
      angularDamping={1000}
      enabledRotations={[false, false, false]}
      lockRotations
      ccd
      collisionGroups={
        (CollisionGroups.PLAYER << 16) | 
        (CollisionGroups.ALL & ~CollisionGroups.TRIGGER)
      }
    >
      {/* Collider de cápsula para el jugador */}
      <CapsuleCollider args={[0.4, 0.3]} position={[0, 0.7, 0]} />
      
      {/* Modelo 3D del personaje con tilt container */}
      <group ref={meshRef}>
        <group ref={tiltContainerRef}>
          <Suspense fallback={<CharacterPlaceholder />}>
            <CharacterModel3D
              personajeId={characterId}
              characterClass={characterClass}
              animation={animation}
              withWeapon={isInCombat}
            />
          </Suspense>
        </group>
      </group>
    </RigidBody>
  );
}

export default Player;
