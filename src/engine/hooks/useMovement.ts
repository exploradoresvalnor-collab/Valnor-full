/**
 * useMovement - Hook para control de movimiento del jugador
 * Spring-based movement system adaptado de Sketchbook (MIT License)
 * 
 * Características:
 * - VectorSpringSimulator para velocidad (inercia real, overshoot, damping)
 * - RelativeSpringSimulator para rotación (giro suave con angular velocity)
 * - Arcade Velocity Mixing (mezcla velocidad arcade controlada con física real)
 * - Raycast real para ground detection (via Rapier)
 * - Coyote Time + Double Jump
 * - Angular velocity expuesta para Character Tilt
 * - maxFallSpeed con clamp aplicado
 */

import { useRef, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import { RapierRigidBody, useRapier } from '@react-three/rapier';
import * as THREE from 'three';
import { useInput } from './useInput';
import { VectorSpringSimulator, RelativeSpringSimulator } from '../utils/SpringSimulator';

export interface MovementConfig {
  // Velocidades
  walkSpeed: number;
  runSpeed: number;
  sprintSpeed: number;
  
  // Spring de velocidad (mass mayor = más inercia, damping 0-1 = fricción)
  velocitySpringMass: number;
  velocitySpringDamping: number;
  
  // Spring de rotación
  rotationSpringMass: number;
  rotationSpringDamping: number;
  
  // Arcade velocity influence (0 = solo física, 1 = solo arcade)
  arcadeVelocityInfluence: number;
  
  // Control aéreo
  airControl: number;
  
  // Salto
  jumpForce: number;
  jumpCooldown: number;
  maxJumps: number;
  coyoteTime: number;
  
  // Física
  maxFallSpeed: number;
  
  // Raycast ground detection
  groundRayLength: number;
  groundRayOffset: number;
}

const DEFAULT_CONFIG: MovementConfig = {
  walkSpeed: 4,
  runSpeed: 7,
  sprintSpeed: 12,
  
  // Spring de velocidad: mass=50 → aceleración suave, damp=0.82 → frenado con inercia
  velocitySpringMass: 50,
  velocitySpringDamping: 0.82,
  
  // Spring de rotación: mass=10 → giro rápido pero suave, damp=0.5 → sin oscilación excesiva
  rotationSpringMass: 10,
  rotationSpringDamping: 0.5,
  
  // Arcade: 1 = control total arcade (overwrite physics), 0.5 = mitad y mitad
  arcadeVelocityInfluence: 1.0,
  
  airControl: 0.3,
  jumpForce: 8,
  jumpCooldown: 0.2,
  maxJumps: 2,
  coyoteTime: 0.15,
  maxFallSpeed: 50,
  
  // Raycast: rayo corto hacia abajo desde la base de la cápsula
  groundRayLength: 0.3,
  groundRayOffset: 0.35, // Offset Y desde el centro del body (base de la cápsula)
};

interface MovementState {
  // Velocidades
  velocity: THREE.Vector3;
  horizontalVelocity: THREE.Vector3;
  verticalVelocity: number;
  
  // Estado de suelo
  isGrounded: boolean;
  groundNormal: THREE.Vector3;
  timeSinceGrounded: number;
  
  // Salto
  jumpCount: number;
  timeSinceJump: number;
  
  // Movimiento
  isMoving: boolean;
  isSprinting: boolean;
  currentSpeed: number;
  targetSpeed: number;
  
  // Dirección & rotación
  moveDirection: THREE.Vector3;
  facingDirection: THREE.Vector3;
  orientation: THREE.Vector3;       // Dirección actual suavizada por spring
  orientationTarget: THREE.Vector3; // Dirección deseada
  angularVelocity: number;          // Velocidad angular del spring (para tilt)
}

export function useMovement(
  bodyRef: React.RefObject<RapierRigidBody | null>,
  cameraRef?: { getForwardDirection: () => THREE.Vector3; getRightDirection: () => THREE.Vector3 },
  config: Partial<MovementConfig> = {}
) {
  const cfg = { ...DEFAULT_CONFIG, ...config };
  const input = useInput();

  // ── Spring Simulators ──────────────────────────────────────
  const velocitySpring = useRef(
    new VectorSpringSimulator(60, cfg.velocitySpringMass, cfg.velocitySpringDamping)
  );
  const rotationSpring = useRef(
    new RelativeSpringSimulator(60, cfg.rotationSpringMass, cfg.rotationSpringDamping)
  );

  const state = useRef<MovementState>({
    velocity: new THREE.Vector3(),
    horizontalVelocity: new THREE.Vector3(),
    verticalVelocity: 0,
    isGrounded: false,
    groundNormal: new THREE.Vector3(0, 1, 0),
    timeSinceGrounded: 0,
    jumpCount: 0,
    timeSinceJump: 999,
    isMoving: false,
    isSprinting: false,
    currentSpeed: 0,
    targetSpeed: 0,
    moveDirection: new THREE.Vector3(),
    facingDirection: new THREE.Vector3(0, 0, 1),
    orientation: new THREE.Vector3(0, 0, 1),
    orientationTarget: new THREE.Vector3(0, 0, 1),
    angularVelocity: 0,
  });

  // Vectores temporales (reutilizados para evitar allocaciones por frame)
  const _moveInput = useRef(new THREE.Vector3());
  const _velocityTarget = useRef(new THREE.Vector3());
  const _arcadeVel = useRef(new THREE.Vector3());
  const _rayOrigin = useRef(new THREE.Vector3());
  const _rayDir = useRef(new THREE.Vector3(0, -1, 0));
  const _upAxis = useRef(new THREE.Vector3(0, 1, 0));
  
  // Rapier world para raycast de grounding
  const { world, rapier } = useRapier();

  // ────────────────────────────────────────────────────────────
  // Calcular dirección de movimiento relativa a la cámara
  // ────────────────────────────────────────────────────────────
  const calculateMoveDirection = useCallback(() => {
    const { moveX, moveY } = input.state;

    if (moveX === 0 && moveY === 0) {
      _moveInput.current.set(0, 0, 0);
      return _moveInput.current;
    }

    if (cameraRef) {
      const forward = cameraRef.getForwardDirection();
      const right = cameraRef.getRightDirection();
      _moveInput.current.set(0, 0, 0);
      _moveInput.current.addScaledVector(forward, moveY);
      _moveInput.current.addScaledVector(right, moveX);
      _moveInput.current.normalize();
    } else {
      _moveInput.current.set(moveX, 0, -moveY).normalize();
    }

    return _moveInput.current;
  }, [input, cameraRef]);

  // ────────────────────────────────────────────────────────────
  // Grounding check con raycast real de Rapier
  // Lanza un rayo corto hacia abajo desde la base de la cápsula
  // ────────────────────────────────────────────────────────────
  const checkGrounding = useCallback(() => {
    if (!bodyRef.current) return;
    
    const pos = bodyRef.current.translation();
    
    // Origen del rayo: base de la cápsula (centro - offset)
    _rayOrigin.current.set(pos.x, pos.y - cfg.groundRayOffset, pos.z);
    _rayDir.current.set(0, -1, 0);
    
    const ray = new rapier.Ray(
      { x: _rayOrigin.current.x, y: _rayOrigin.current.y, z: _rayOrigin.current.z },
      { x: 0, y: -1, z: 0 }
    );
    
    const hit = world.castRay(ray, cfg.groundRayLength, true);
    
    if (hit && hit.timeOfImpact < cfg.groundRayLength) {
      // Obtener normal real de la superficie
      const collider = hit.collider;
      if (collider) {
        const normal = hit.normal;
        if (normal) {
          state.current.groundNormal.set(normal.x, normal.y, normal.z);
        }
      }
      
      if (!state.current.isGrounded) {
        // Acabamos de aterrizar
        state.current.jumpCount = 0;
      }
      state.current.isGrounded = true;
      state.current.timeSinceGrounded = 0;
    } else {
      state.current.isGrounded = false;
    }
  }, [bodyRef, world, rapier, cfg.groundRayLength, cfg.groundRayOffset]);

  // ────────────────────────────────────────────────────────────
  // Calcular ángulo con signo entre dos vectores (en plano XZ)
  // ────────────────────────────────────────────────────────────
  const getSignedAngle = useCallback((from: THREE.Vector3, to: THREE.Vector3): number => {
    const cross = from.x * to.z - from.z * to.x;
    const dot = from.x * to.x + from.z * to.z;
    return Math.atan2(cross, dot);
  }, []);

  // ────────────────────────────────────────────────────────────
  // Aplicar movimiento con SPRING SIMULATORS
  // ────────────────────────────────────────────────────────────
  const applyMovement = useCallback((delta: number) => {
    if (!bodyRef.current) return;

    const body = bodyRef.current;
    const s = state.current;
    const vSpring = velocitySpring.current;
    const rSpring = rotationSpring.current;

    // 1. Calcular dirección de movimiento
    const moveDir = calculateMoveDirection();
    s.moveDirection.copy(moveDir);
    s.isMoving = moveDir.lengthSq() > 0.01;

    // 2. Determinar velocidad objetivo
    s.isSprinting = input.isSprinting && s.isMoving;
    s.targetSpeed = s.isMoving
      ? (s.isSprinting ? cfg.sprintSpeed : cfg.runSpeed)
      : 0;

    // 3. Actualizar orientación target (hacia dónde mira)
    if (s.isMoving) {
      s.orientationTarget.copy(moveDir);
    }

    // 4. Calcular rotación con Spring
    const angle = getSignedAngle(s.orientation, s.orientationTarget);
    rSpring.target = angle;
    rSpring.simulate(delta);

    // Aplicar delta de rotación al vector orientation
    s.angularVelocity = rSpring.velocity;
    if (Math.abs(rSpring.position) > 0.001) {
      s.orientation.applyAxisAngle(_upAxis.current, rSpring.position);
      s.orientation.normalize();
    }
    s.facingDirection.copy(s.orientation);

    // 5. Calcular velocity target (dirección * velocidad)
    const controlFactor = s.isGrounded ? 1 : cfg.airControl;
    _velocityTarget.current.copy(moveDir).multiplyScalar(s.targetSpeed * controlFactor);

    // 6. Simular velocity con Spring (produce aceleración/deceleración suave)
    vSpring.target.copy(_velocityTarget.current);
    vSpring.simulate(delta);

    // 7. Arcade Velocity Mixing
    // Combinar el resultado del spring con la velocidad física real
    const currentVel = body.linvel();
    const influence = cfg.arcadeVelocityInfluence;

    _arcadeVel.current.set(
      THREE.MathUtils.lerp(currentVel.x, vSpring.position.x, influence),
      currentVel.y, // Mantener velocidad vertical de la física
      THREE.MathUtils.lerp(currentVel.z, vSpring.position.z, influence),
    );

    // 8. Clamp velocidad de caída (maxFallSpeed)
    if (_arcadeVel.current.y < -cfg.maxFallSpeed) {
      _arcadeVel.current.y = -cfg.maxFallSpeed;
    }

    // 9. Aplicar velocidad al cuerpo
    body.setLinvel(
      { x: _arcadeVel.current.x, y: _arcadeVel.current.y, z: _arcadeVel.current.z },
      true,
    );

    // 10. Actualizar estado
    s.horizontalVelocity.set(_arcadeVel.current.x, 0, _arcadeVel.current.z);
    s.verticalVelocity = _arcadeVel.current.y;
    s.currentSpeed = s.horizontalVelocity.length();
    s.velocity.copy(_arcadeVel.current);
  }, [bodyRef, input, cfg, calculateMoveDirection, getSignedAngle]);

  // ────────────────────────────────────────────────────────────
  // Manejar salto
  // ────────────────────────────────────────────────────────────
  const handleJump = useCallback(() => {
    if (!bodyRef.current) return;

    const s = state.current;
    const canCoyoteJump = s.timeSinceGrounded < cfg.coyoteTime;
    const canDoubleJump = s.jumpCount < cfg.maxJumps;
    const jumpCooldownOver = s.timeSinceJump > cfg.jumpCooldown;

    if ((s.isGrounded || canCoyoteJump || canDoubleJump) && jumpCooldownOver) {
      const currentVel = bodyRef.current.linvel();
      bodyRef.current.setLinvel(
        { x: currentVel.x, y: cfg.jumpForce, z: currentVel.z },
        true,
      );
      s.jumpCount++;
      s.timeSinceJump = 0;
      s.isGrounded = false;
    }
  }, [bodyRef, cfg]);

  // ────────────────────────────────────────────────────────────
  // Update loop
  // ────────────────────────────────────────────────────────────
  useFrame((_, delta) => {
    if (!bodyRef.current) return;

    // Clamp delta para evitar saltos grandes
    const dt = Math.min(delta, 0.05);

    // Timers
    state.current.timeSinceGrounded += dt;
    state.current.timeSinceJump += dt;

    // Check grounding
    checkGrounding();

    // Movimiento (spring-based)
    applyMovement(dt);

    // Salto
    if (input.isJumping) {
      handleJump();
    }
  });

  // ────────────────────────────────────────────────────────────
  // API pública
  // ────────────────────────────────────────────────────────────
  return {
    get state() { return state.current; },
    get isGrounded() { return state.current.isGrounded; },
    get isMoving() { return state.current.isMoving; },
    get isSprinting() { return state.current.isSprinting; },
    get velocity() { return state.current.velocity; },
    get speed() { return state.current.currentSpeed; },
    get facingDirection() { return state.current.facingDirection; },
    get angularVelocity() { return state.current.angularVelocity; },

    jump: handleJump,

    applyImpulse: (impulse: THREE.Vector3) => {
      if (bodyRef.current) {
        bodyRef.current.applyImpulse(
          { x: impulse.x, y: impulse.y, z: impulse.z },
          true,
        );
      }
    },

    teleport: (position: THREE.Vector3) => {
      if (bodyRef.current) {
        bodyRef.current.setTranslation(
          { x: position.x, y: position.y, z: position.z },
          true,
        );
        bodyRef.current.setLinvel({ x: 0, y: 0, z: 0 }, true);
        // Reset springs al teleportarse
        velocitySpring.current.init();
      }
    },
  };
}

export default useMovement;
