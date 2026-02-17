/**
 * Player - Componente del jugador con física, controles y Character Tilt
 *
 * Arquitectura:
 * - RigidBody (Rapier) es la fuente de verdad para la posición
 * - meshRef es HIJO del RigidBody → su posición LOCAL es [0,0,0] → pies en base del capsule
 * - NO se hace lerp de posición (rapier ya maneja la interpolación visual)
 * - La rotación se aplica al meshRef (lockRotations impide que el body rote)
 * - Animación basada en VELOCIDAD (spring-smoothed) para estabilidad
 */

import { useRef, useEffect, useState, Suspense } from 'react';
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

// ── Umbrales de velocidad para animación (con histéresis) ──
const SPEED_WALK_START = 0.5;   // empezar Walk cuando speed > 0.5
const SPEED_WALK_STOP  = 0.3;   // volver a Idle cuando speed < 0.3
const SPEED_RUN_START  = 8.0;   // empezar Run cuando speed > 8
const SPEED_RUN_STOP   = 6.0;   // volver a Walk cuando speed < 6

// Temporales reutilizados (evitan allocaciones por frame)
const _tmpQuat = new THREE.Quaternion();
const _tmpEuler = new THREE.Euler();

export function Player({ position = [0, 2, 0], onReady }: PlayerProps) {
  const bodyRef = useRef<RapierRigidBody>(null);
  const meshRef = useRef<THREE.Group>(null);
  const tiltContainerRef = useRef<THREE.Group>(null);

  const { characterId, characterClass, isInCombat, setPosition, setIsGrounded, setIsMoving } = usePlayerStore();

  const camera = useCamera(meshRef, {
    distance: 8,
    height: 3,
    targetOffset: new THREE.Vector3(0, 1.5, 0),
    mouseSensitivity: 0.003,
  });

  // Pointer lock para cámara RPG (registra handlers globales de ratón)
  useInput({ capturePointerLock: true });

  const movement = useMovement(bodyRef, camera, {
    walkSpeed: 4,
    runSpeed: 7,
    sprintSpeed: 12,
    jumpForce: 8,
  });

  // ── Animation state (via useState para triggear re-render en CharacterModel3D) ──
  const [currentAnimation, setCurrentAnimation] = useState('Idle');
  const prevAnimRef = useRef('Idle');

  // ── Refs para throttle de store updates ──
  const prevGroundedRef = useRef<boolean | null>(null);
  const prevMovingRef = useRef<boolean | null>(null);
  const prevPosRef = useRef({ x: 0, y: 0, z: 0 });

  // ── Tilt ──
  const TILT_MULTIPLIER = 2.0;

  // ── Kill zone ──
  const KILL_ZONE_Y = -50;
  const spawnPos = useRef(position);

  useEffect(() => {
    onReady?.();
  }, [onReady]);

  // ────────────────────────────────────────────────────────────
  // Frame loop
  // ────────────────────────────────────────────────────────────
  useFrame((_, delta) => {
    if (!bodyRef.current || !meshRef.current) return;
    const dt = Math.min(delta, 0.05);

    const pos = bodyRef.current.translation();

    // ── Store sync (throttled — solo cuando hay cambios) ──
    const pp = prevPosRef.current;
    if (Math.abs(pos.x - pp.x) > 0.01 ||
        Math.abs(pos.y - pp.y) > 0.01 ||
        Math.abs(pos.z - pp.z) > 0.01) {
      setPosition({ x: pos.x, y: pos.y, z: pos.z });
      prevPosRef.current = { x: pos.x, y: pos.y, z: pos.z };
    }
    if (prevGroundedRef.current !== movement.isGrounded) {
      setIsGrounded(movement.isGrounded);
      prevGroundedRef.current = movement.isGrounded;
    }
    if (prevMovingRef.current !== movement.isMoving) {
      setIsMoving(movement.isMoving);
      prevMovingRef.current = movement.isMoving;
    }

    // ── Kill Zone ──
    if (pos.y < KILL_ZONE_Y) {
      bodyRef.current.setTranslation(
        { x: spawnPos.current[0], y: spawnPos.current[1] + 2, z: spawnPos.current[2] },
        true,
      );
      bodyRef.current.setLinvel({ x: 0, y: 0, z: 0 }, true);
      return;
    }

    // ── Animación basada en VELOCIDAD con histéresis ──
    // Esto evita el flickeo Walk↔Idle que ocurría con isMoving (binario).
    const speed = movement.speed;
    const prev = prevAnimRef.current;
    let anim: string;

    if (prev === 'Idle') {
      anim = speed > SPEED_WALK_START ? 'Walk' : 'Idle';
    } else if (prev === 'Run') {
      if (speed < SPEED_WALK_STOP) anim = 'Idle';
      else if (speed < SPEED_RUN_STOP) anim = 'Walk';
      else anim = 'Run';
    } else {
      // Walk
      if (speed < SPEED_WALK_STOP) anim = 'Idle';
      else if (speed > SPEED_RUN_START) anim = 'Run';
      else anim = 'Walk';
    }

    if (anim !== prev) {
      setCurrentAnimation(anim);
      prevAnimRef.current = anim;
      if (import.meta.env.DEV) {
        console.log(`[Player] animation → "${anim}" speed=${speed.toFixed(2)} grounded=${movement.isGrounded}`);
      }
    }

    // ── Rotación visual suave ──
    // meshRef es hijo del RigidBody con lockRotations → localRot = worldRot.
    // atan2(x,z) apunta +Z del modelo hacia la dirección de movimiento.
    const dir = movement.facingDirection;
    const targetRotation = Math.atan2(dir.x, dir.z);
    _tmpQuat.setFromEuler(_tmpEuler.set(0, targetRotation, 0));
    meshRef.current.quaternion.slerp(_tmpQuat, THREE.MathUtils.clamp(10 * dt, 0, 1));

    // ── Character Tilt (inclinación lateral al girar) ──
    if (tiltContainerRef.current) {
      const tiltAmount = -movement.angularVelocity * TILT_MULTIPLIER * Math.min(speed / 7, 1);
      const clampedTilt = THREE.MathUtils.clamp(tiltAmount, -0.25, 0.25);
      tiltContainerRef.current.rotation.z = THREE.MathUtils.lerp(
        tiltContainerRef.current.rotation.z,
        clampedTilt,
        THREE.MathUtils.clamp(6 * dt, 0, 1),
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
      <CapsuleCollider args={[0.4, 0.3]} position={[0, 0.7, 0]} />

      {/*
        Container visual — pies del modelo deben coincidir con la base del CapsuleCollider.
        CapsuleCollider bottom = 0.7 - 0.4 - 0.3 = 0.0 (local), así que meshRef en Y=0
        alinea los pies exactamente con el contacto físico del suelo.
        Posición MUNDO la maneja Rapier automáticamente. NO lerp manual.
      */}
      <group ref={meshRef} position={[0, 0, 0]}>
        <group ref={tiltContainerRef}>
          <Suspense fallback={<CharacterPlaceholder />}>
            <CharacterModel3D
              personajeId={characterId}
              characterClass={characterClass}
              animation={currentAnimation}
              withWeapon={isInCombat}
            />
          </Suspense>
        </group>
      </group>
    </RigidBody>
  );
}

export default Player;
