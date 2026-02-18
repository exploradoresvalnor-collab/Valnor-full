import { useRef, useEffect, useState, Suspense, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import { RigidBody, CapsuleCollider, RapierRigidBody } from '@react-three/rapier';
import * as THREE from 'three';
import { useMovement } from '../hooks/useMovement';
import { useCamera } from '../hooks/useCamera';
import { useInput } from '../hooks/useInput';
import { usePlayerStore } from '../../stores/playerStore';
import { CollisionGroups } from './PhysicsWorld';
import { CharacterModel3D, CharacterPlaceholder } from './CharacterModel3D';
import { useAnimationSystem, type AnimationState } from '../systems/AnimationSystem';

interface PlayerProps {
  position?: [number, number, number];
  onReady?: () => void;
}

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

  // Input
  const input = useInput({ capturePointerLock: true });

  const movement = useMovement(bodyRef, camera, {
    walkSpeed: 4,
    runSpeed: 7,
    sprintSpeed: 12,
    jumpForce: 8,
  });

  // --- Animation System ---
  const [animationData, setAnimationData] = useState<{
    mixer: THREE.AnimationMixer;
    animations: Map<AnimationState, THREE.AnimationClip>;
  } | null>(null);

  const animationSystem = useAnimationSystem({
    mixer: animationData?.mixer,
    animations: animationData?.animations || new Map(),
  });

  const handleAnimationsReady = useCallback(
    (mixer: THREE.AnimationMixer, animations: Map<AnimationState, THREE.AnimationClip>) => {
      setAnimationData({ mixer, animations });
    },
    [],
  );
  // ---

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
    if (!bodyRef.current || !meshRef.current || !animationSystem) return;
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
      movement.teleport(new THREE.Vector3(
        spawnPos.current[0],
        spawnPos.current[1] + 2,
        spawnPos.current[2]
      ));
      return;
    }

    // ── Animation Control ──
    // Delegar al sistema de animación para que decida el estado correcto
    animationSystem.updateFromMovement(
      movement.isMoving,
      movement.isSprinting,
      movement.isGrounded,
      movement.velocity.y
    );

    // Trigger de ataque
    if (input.isAttacking) {
      animationSystem.play('attack1', { force: true });
    }

    // ── Rotación visual suave ──
    const dir = movement.facingDirection;
    const targetRotation = Math.atan2(dir.x, dir.z);
    _tmpQuat.setFromEuler(_tmpEuler.set(0, targetRotation, 0));
    meshRef.current.quaternion.slerp(_tmpQuat, THREE.MathUtils.clamp(10 * dt, 0, 1));

    // ── Character Tilt (inclinación lateral al girar) ──
    if (tiltContainerRef.current) {
      const tiltAmount = -movement.angularVelocity * TILT_MULTIPLIER * Math.min(movement.speed / 7, 1);
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
      
      <group ref={meshRef} position={[0, 0, 0]}>
        <group ref={tiltContainerRef}>
          <Suspense fallback={<CharacterPlaceholder />}>
            <CharacterModel3D
              personajeId={characterId}
              characterClass={characterClass}
              withWeapon={isInCombat}
              onAnimationsReady={handleAnimationsReady}
            />
          </Suspense>
        </group>
      </group>
    </RigidBody>
  );
}

export default Player;
