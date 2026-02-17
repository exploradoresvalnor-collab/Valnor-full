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
import { useInput } from '../hooks/useInput';
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
    mouseSensitivity: 0.003, // Slight increase for responsiveness
  });
  
  // Habilitar captura de mouse para control estilo shooter/RPG moderno
  useInput({ capturePointerLock: true });
  
  const movement = useMovement(bodyRef, camera, {
    walkSpeed: 4,
    runSpeed: 7,
    sprintSpeed: 12,
    jumpForce: 8,
  });

  useEffect(() => {
    onReady?.();
  }, [onReady]);

  // Inicializar posición visual del mesh al spawn para evitar 'snap' visual
  useEffect(() => {
    if (bodyRef.current && meshRef.current) {
      const p = bodyRef.current.translation();
      meshRef.current.position.set(p.x, p.y - 0.7, p.z);
      meshRef.current.quaternion.set(0, 0, 0, 1);
    }
  }, []);

  // Constante de tilt (cuánto se inclina lateralmente al girar)
  const TILT_MULTIPLIER = 2.3;
  
  // Kill zone: resetear al spawn si cae demasiado
  const KILL_ZONE_Y = -50;
  const spawnPos = useRef(position);

  useFrame((_, delta) => {
    if (!bodyRef.current || !meshRef.current) return;

    // Clamp delta para lerps frame-independientes
    const dt = Math.min(delta, 0.05);

    // Sincronizar posición con store (fuente de verdad = bodyRef)
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

    // ── Visual interpolation (malla desacoplada del RigidBody) ──
    // targetWorld = physics position + visual Y offset (pies)
    const targetPos = new THREE.Vector3(pos.x, pos.y - 0.7, pos.z);
    // Lerp visual rápido pero suave (factor escalado por dt)
    meshRef.current.position.lerp(targetPos, THREE.MathUtils.clamp(12 * dt, 0, 1));

    // ── Rotación visual suave hacia facingDirection
    const dir = movement.facingDirection;
    const targetRotation = Math.atan2(dir.x, dir.z) + Math.PI; // mantener +PI para el mismatch habitual
    const targetQuat = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, targetRotation, 0));
    meshRef.current.quaternion.slerp(targetQuat, THREE.MathUtils.clamp(12 * dt, 0, 1));

    // ── Character Tilt (inclinación lateral al girar) — aplicado a la malla visual
    if (tiltContainerRef.current) {
      const angVel = movement.angularVelocity;
      const speed = movement.speed;
      const tiltAmount = -angVel * TILT_MULTIPLIER * Math.min(speed / 7, 1);
      const maxTilt = 0.3;
      const clampedTilt = THREE.MathUtils.clamp(tiltAmount, -maxTilt, maxTilt);

      tiltContainerRef.current.rotation.z = THREE.MathUtils.lerp(
        tiltContainerRef.current.rotation.z,
        clampedTilt,
        0.08, // suavizado más agresivo para eliminar vibración
      );
    }
  });

  // Determinar animación
  // Map 'Sprint' to 'Run' if needed, or rely on CharacterModel3D fuzzy match.
  // Pero para evitar flickering si la velocidad fluctúa cerca del umbral de sprint, añadir histéresis o simplificar.
  const animation = movement.isSprinting ? 'Run' : movement.isMoving ? 'Walk' : 'Idle'; // Simplificado a Walk/Run/Idle estandar

  // NOTA: la malla visual está desacoplada del RigidBody — la física es la fuente de verdad
  // y la malla se interpola visualmente para eliminar jitter.

  return (
    <RigidBody
      ref={bodyRef}
      position={position}
      type="dynamic"
      colliders={false}
      mass={1}
      friction={0}
      restitution={0}
      linearDamping={0}
      angularDamping={0}
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
      
      {/* Ajuste de altura del contenedor visual: -0.7 para alinear pies con el fondo del collider */}
      <group ref={meshRef} position={[0, -0.7, 0]}>
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
