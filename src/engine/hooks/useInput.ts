/**
 * useInput - Hook para manejo de input (teclado, mouse, touch)
 * Basado en el Input System de la guía Angular
 */

import { useRef, useEffect, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// Teclas configurables
export interface KeyBindings {
  forward: string;
  backward: string;
  left: string;
  right: string;
  jump: string;
  sprint: string;
  attack: string;
  skill1: string;
  skill2: string;
  skill3: string;
  skill4: string;
  interact: string;
  inventory: string;
  menu: string;
}

const DEFAULT_KEYBINDINGS: KeyBindings = {
  forward: 'KeyW',
  backward: 'KeyS',
  left: 'KeyA',
  right: 'KeyD',
  jump: 'Space',
  sprint: 'ShiftLeft',
  attack: 'Mouse0',
  skill1: 'Digit1',
  skill2: 'Digit2',
  skill3: 'Digit3',
  skill4: 'Digit4',
  interact: 'KeyE',
  inventory: 'KeyI',
  menu: 'Escape',
};

export interface InputState {
  // Movimiento (normalizado -1 a 1)
  moveX: number;
  moveY: number;
  moveVector: THREE.Vector2;
  
  // Mouse
  mouseX: number;
  mouseY: number;
  mouseDeltaX: number;
  mouseDeltaY: number;
  mouseButtons: boolean[];
  
  // Teclas presionadas
  keys: Set<string>;
  keysJustPressed: Set<string>;
  keysJustReleased: Set<string>;
  
  // Estados de acción
  isMoving: boolean;
  isJumping: boolean;
  isSprinting: boolean;
  isAttacking: boolean;
  isInteracting: boolean;
  
  // Touch
  touchActive: boolean;
  touchStartX: number;
  touchStartY: number;
  touchDeltaX: number;
  touchDeltaY: number;
}

interface UseInputOptions {
  keyBindings?: Partial<KeyBindings>;
  enabled?: boolean;
  capturePointerLock?: boolean;
}

export function useInput(options: UseInputOptions = {}) {
  const {
    keyBindings = {},
    enabled = true,
    capturePointerLock = false,
  } = options;
  
  const bindings = { ...DEFAULT_KEYBINDINGS, ...keyBindings };
  
  const state = useRef<InputState>({
    moveX: 0,
    moveY: 0,
    moveVector: new THREE.Vector2(),
    mouseX: 0,
    mouseY: 0,
    mouseDeltaX: 0,
    mouseDeltaY: 0,
    mouseButtons: [false, false, false],
    keys: new Set(),
    keysJustPressed: new Set(),
    keysJustReleased: new Set(),
    isMoving: false,
    isJumping: false,
    isSprinting: false,
    isAttacking: false,
    isInteracting: false,
    touchActive: false,
    touchStartX: 0,
    touchStartY: 0,
    touchDeltaX: 0,
    touchDeltaY: 0,
  });

  // Handlers
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!enabled) return;
    
    const key = event.code;
    if (!state.current.keys.has(key)) {
      state.current.keysJustPressed.add(key);
    }
    state.current.keys.add(key);
    
    // Prevenir comportamiento por defecto para teclas del juego
    if (Object.values(bindings).includes(key)) {
      event.preventDefault();
    }
  }, [enabled, bindings]);

  const handleKeyUp = useCallback((event: KeyboardEvent) => {
    if (!enabled) return;
    
    const key = event.code;
    state.current.keys.delete(key);
    state.current.keysJustReleased.add(key);
  }, [enabled]);

  const handleMouseMove = useCallback((event: MouseEvent) => {
    if (!enabled) return;
    
    state.current.mouseDeltaX = event.movementX;
    state.current.mouseDeltaY = event.movementY;
    state.current.mouseX = event.clientX;
    state.current.mouseY = event.clientY;
  }, [enabled]);

  const handleMouseDown = useCallback((event: MouseEvent) => {
    if (!enabled) return;
    
    state.current.mouseButtons[event.button] = true;
    
    // Registrar como tecla virtual
    const mouseKey = `Mouse${event.button}`;
    if (!state.current.keys.has(mouseKey)) {
      state.current.keysJustPressed.add(mouseKey);
    }
    state.current.keys.add(mouseKey);
    
    // Pointer lock
    if (capturePointerLock && event.button === 0) {
      document.body.requestPointerLock?.();
    }
  }, [enabled, capturePointerLock]);

  const handleMouseUp = useCallback((event: MouseEvent) => {
    if (!enabled) return;
    
    state.current.mouseButtons[event.button] = false;
    
    const mouseKey = `Mouse${event.button}`;
    state.current.keys.delete(mouseKey);
    state.current.keysJustReleased.add(mouseKey);
  }, [enabled]);

  const handleTouchStart = useCallback((event: TouchEvent) => {
    if (!enabled) return;
    
    const touch = event.touches[0];
    state.current.touchActive = true;
    state.current.touchStartX = touch.clientX;
    state.current.touchStartY = touch.clientY;
  }, [enabled]);

  const handleTouchMove = useCallback((event: TouchEvent) => {
    if (!enabled || !state.current.touchActive) return;
    
    const touch = event.touches[0];
    state.current.touchDeltaX = touch.clientX - state.current.touchStartX;
    state.current.touchDeltaY = touch.clientY - state.current.touchStartY;
  }, [enabled]);

  const handleTouchEnd = useCallback(() => {
    if (!enabled) return;
    
    state.current.touchActive = false;
    state.current.touchDeltaX = 0;
    state.current.touchDeltaY = 0;
  }, [enabled]);

  // Setup listeners
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('touchstart', handleTouchStart);
    window.addEventListener('touchmove', handleTouchMove);
    window.addEventListener('touchend', handleTouchEnd);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [
    handleKeyDown, handleKeyUp, handleMouseMove, 
    handleMouseDown, handleMouseUp,
    handleTouchStart, handleTouchMove, handleTouchEnd
  ]);

  // Update cada frame
  useFrame(() => {
    // Calcular vector de movimiento basado en teclas
    let moveX = 0;
    let moveY = 0;
    
    if (state.current.keys.has(bindings.forward)) moveY += 1;
    if (state.current.keys.has(bindings.backward)) moveY -= 1;
    if (state.current.keys.has(bindings.left)) moveX -= 1;
    if (state.current.keys.has(bindings.right)) moveX += 1;
    
    // Normalizar diagonal
    if (moveX !== 0 && moveY !== 0) {
      const length = Math.sqrt(moveX * moveX + moveY * moveY);
      moveX /= length;
      moveY /= length;
    }
    
    state.current.moveX = moveX;
    state.current.moveY = moveY;
    state.current.moveVector.set(moveX, moveY);
    
    // Actualizar estados de acción
    state.current.isMoving = moveX !== 0 || moveY !== 0;
    state.current.isJumping = state.current.keysJustPressed.has(bindings.jump);
    state.current.isSprinting = state.current.keys.has(bindings.sprint);
    state.current.isAttacking = state.current.keysJustPressed.has(bindings.attack);
    state.current.isInteracting = state.current.keysJustPressed.has(bindings.interact);
    
    // Limpiar just pressed/released al final del frame
    // (se limpia en el próximo frame para que otros sistemas puedan leerlo)
  });

  // Limpiar estados "just" después del frame
  useFrame(() => {
    state.current.keysJustPressed.clear();
    state.current.keysJustReleased.clear();
    state.current.mouseDeltaX = 0;
    state.current.mouseDeltaY = 0;
  }, 1000); // Prioridad baja, ejecutar después

  // API pública
  return {
    // Estado actual
    get state() { return state.current; },
    
    // Helpers para consultar teclas
    isKeyDown: (key: string) => state.current.keys.has(key),
    isKeyJustPressed: (key: string) => state.current.keysJustPressed.has(key),
    isKeyJustReleased: (key: string) => state.current.keysJustReleased.has(key),
    
    // Helpers para acciones
    get isMoving() { return state.current.isMoving; },
    get isSprinting() { return state.current.isSprinting; },
    get isJumping() { return state.current.isJumping; },
    get isAttacking() { return state.current.isAttacking; },
    
    // Vector de movimiento
    get moveVector() { return state.current.moveVector; },
    
    // Mouse
    get mousePosition() { 
      return new THREE.Vector2(state.current.mouseX, state.current.mouseY); 
    },
    get mouseDelta() { 
      return new THREE.Vector2(state.current.mouseDeltaX, state.current.mouseDeltaY); 
    },
    isMouseButtonDown: (button: number) => state.current.mouseButtons[button],
  };
}

export default useInput;
