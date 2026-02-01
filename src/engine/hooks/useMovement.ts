/**
 * useMovement - Hook para control de movimiento del jugador
 * Basado en el MovementSystem de la guía Angular
 */

import { useRef, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import { RapierRigidBody } from '@react-three/rapier';
import * as THREE from 'three';
import { useInput } from './useInput';

export interface MovementConfig {
  // Velocidades
  walkSpeed: number;
  runSpeed: number;
  sprintSpeed: number;
  
  // Aceleración
  acceleration: number;
  deceleration: number;
  airControl: number;
  
  // Salto
  jumpForce: number;
  jumpCooldown: number;
  maxJumps: number;
  coyoteTime: number;
  
  // Física
  gravity: number;
  maxFallSpeed: number;
  slopeLimit: number;
  stepHeight: number;
}

const DEFAULT_CONFIG: MovementConfig = {
  walkSpeed: 4,
  runSpeed: 7,
  sprintSpeed: 12,
  acceleration: 50,
  deceleration: 30,
  airControl: 0.3,
  jumpForce: 8,
  jumpCooldown: 0.2,
  maxJumps: 2, // Double jump
  coyoteTime: 0.15,
  gravity: 20,
  maxFallSpeed: 50,
  slopeLimit: 45,
  stepHeight: 0.3,
};

interface MovementState {
  // Velocidad actual
  velocity: THREE.Vector3;
  horizontalVelocity: THREE.Vector3;
  verticalVelocity: number;
  
  // Estado de suelo
  isGrounded: boolean;
  groundNormal: THREE.Vector3;
  groundAngle: number;
  timeSinceGrounded: number;
  
  // Salto
  jumpCount: number;
  timeSinceJump: number;
  canJump: boolean;
  
  // Movimiento
  isMoving: boolean;
  isSprinting: boolean;
  currentSpeed: number;
  targetSpeed: number;
  
  // Dirección
  moveDirection: THREE.Vector3;
  facingDirection: THREE.Vector3;
}

export function useMovement(
  bodyRef: React.RefObject<RapierRigidBody | null>,
  cameraRef?: { getForwardDirection: () => THREE.Vector3; getRightDirection: () => THREE.Vector3 },
  config: Partial<MovementConfig> = {}
) {
  const cfg = { ...DEFAULT_CONFIG, ...config };
  const input = useInput();
  
  const state = useRef<MovementState>({
    velocity: new THREE.Vector3(),
    horizontalVelocity: new THREE.Vector3(),
    verticalVelocity: 0,
    isGrounded: false,
    groundNormal: new THREE.Vector3(0, 1, 0),
    groundAngle: 0,
    timeSinceGrounded: 0,
    jumpCount: 0,
    timeSinceJump: 999,
    canJump: true,
    isMoving: false,
    isSprinting: false,
    currentSpeed: 0,
    targetSpeed: 0,
    moveDirection: new THREE.Vector3(),
    facingDirection: new THREE.Vector3(0, 0, 1),
  });

  // Vectores temporales
  const moveInput = useRef(new THREE.Vector3());

  // Calcular dirección de movimiento relativa a la cámara
  const calculateMoveDirection = useCallback(() => {
    const { moveX, moveY } = input.state;
    
    if (moveX === 0 && moveY === 0) {
      moveInput.current.set(0, 0, 0);
      return moveInput.current;
    }
    
    if (cameraRef) {
      // Movimiento relativo a la cámara
      const forward = cameraRef.getForwardDirection();
      const right = cameraRef.getRightDirection();
      
      moveInput.current.set(0, 0, 0);
      moveInput.current.addScaledVector(forward, moveY);
      moveInput.current.addScaledVector(right, moveX);
      moveInput.current.normalize();
    } else {
      // Movimiento en espacio mundo
      moveInput.current.set(moveX, 0, -moveY).normalize();
    }
    
    return moveInput.current;
  }, [input, cameraRef]);

  // Check grounding (simplificado - en producción usaría raycast)
  const checkGrounding = useCallback(() => {
    if (!bodyRef.current) return;
    
    const velocity = bodyRef.current.linvel();
    
    // Simple check: si la velocidad vertical es muy baja, estamos en el suelo
    // En producción esto sería un raycast hacia abajo
    if (Math.abs(velocity.y) < 0.1) {
      state.current.isGrounded = true;
      state.current.timeSinceGrounded = 0;
      state.current.jumpCount = 0;
    } else {
      state.current.isGrounded = false;
    }
  }, [bodyRef]);

  // Aplicar movimiento
  const applyMovement = useCallback((delta: number) => {
    if (!bodyRef.current) return;
    
    const body = bodyRef.current;
    const s = state.current;
    
    // Calcular dirección de movimiento
    const moveDir = calculateMoveDirection();
    s.moveDirection.copy(moveDir);
    s.isMoving = moveDir.lengthSq() > 0;
    
    // Determinar velocidad objetivo
    s.isSprinting = input.isSprinting && s.isMoving;
    s.targetSpeed = s.isMoving
      ? (s.isSprinting ? cfg.sprintSpeed : cfg.runSpeed)
      : 0;
    
    // Interpolar velocidad actual
    const accel = s.isMoving ? cfg.acceleration : cfg.deceleration;
    const controlFactor = s.isGrounded ? 1 : cfg.airControl;
    s.currentSpeed = THREE.MathUtils.lerp(
      s.currentSpeed,
      s.targetSpeed,
      accel * controlFactor * delta
    );
    
    // Calcular velocidad horizontal
    s.horizontalVelocity.copy(moveDir).multiplyScalar(s.currentSpeed);
    
    // Actualizar facing direction cuando nos movemos
    if (s.isMoving && s.horizontalVelocity.lengthSq() > 0.1) {
      s.facingDirection.copy(s.horizontalVelocity).normalize();
    }
    
    // Obtener velocidad vertical actual
    const currentVel = body.linvel();
    s.verticalVelocity = currentVel.y;
    
    // Aplicar velocidad al cuerpo
    body.setLinvel({
      x: s.horizontalVelocity.x,
      y: s.verticalVelocity,
      z: s.horizontalVelocity.z,
    }, true);
    
    // Actualizar velocidad total
    s.velocity.set(
      s.horizontalVelocity.x,
      s.verticalVelocity,
      s.horizontalVelocity.z
    );
  }, [bodyRef, input, cfg, calculateMoveDirection]);

  // Manejar salto
  const handleJump = useCallback(() => {
    if (!bodyRef.current) return;
    
    const s = state.current;
    
    // Verificar si puede saltar
    const canCoyoteJump = s.timeSinceGrounded < cfg.coyoteTime;
    const canDoubleJump = s.jumpCount < cfg.maxJumps;
    const jumpCooldownOver = s.timeSinceJump > cfg.jumpCooldown;
    
    if ((s.isGrounded || canCoyoteJump || canDoubleJump) && jumpCooldownOver) {
      // Aplicar impulso de salto
      const currentVel = bodyRef.current.linvel();
      bodyRef.current.setLinvel({
        x: currentVel.x,
        y: cfg.jumpForce,
        z: currentVel.z,
      }, true);
      
      s.jumpCount++;
      s.timeSinceJump = 0;
      s.isGrounded = false;
    }
  }, [bodyRef, cfg]);

  // Update loop
  useFrame((_, delta) => {
    if (!bodyRef.current) return;
    
    // Actualizar timers
    state.current.timeSinceGrounded += delta;
    state.current.timeSinceJump += delta;
    
    // Check grounding
    checkGrounding();
    
    // Aplicar movimiento
    applyMovement(delta);
    
    // Manejar salto
    if (input.isJumping) {
      handleJump();
    }
  });

  // API pública
  return {
    // Estado actual
    get state() { return state.current; },
    
    // Helpers de estado
    get isGrounded() { return state.current.isGrounded; },
    get isMoving() { return state.current.isMoving; },
    get isSprinting() { return state.current.isSprinting; },
    get velocity() { return state.current.velocity; },
    get speed() { return state.current.currentSpeed; },
    get facingDirection() { return state.current.facingDirection; },
    
    // Acciones manuales
    jump: handleJump,
    
    // Aplicar impulso externo (ej: knockback)
    applyImpulse: (impulse: THREE.Vector3) => {
      if (bodyRef.current) {
        bodyRef.current.applyImpulse(
          { x: impulse.x, y: impulse.y, z: impulse.z },
          true
        );
      }
    },
    
    // Teleport
    teleport: (position: THREE.Vector3) => {
      if (bodyRef.current) {
        bodyRef.current.setTranslation(
          { x: position.x, y: position.y, z: position.z },
          true
        );
        bodyRef.current.setLinvel({ x: 0, y: 0, z: 0 }, true);
      }
    },
  };
}

export default useMovement;
