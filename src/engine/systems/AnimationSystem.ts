/**
 * Animation System - Sistema de animaciones para personajes
 * Gestiona transiciones y blending de animaciones
 */

import { useRef, useEffect, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export type AnimationState = 
  | 'idle'
  | 'walk'
  | 'run'
  | 'sprint'
  | 'jump'
  | 'fall'
  | 'land'
  | 'attack1'
  | 'attack2'
  | 'attack3'
  | 'skill'
  | 'hurt'
  | 'death'
  | 'dodge'
  | 'block';

interface AnimationConfig {
  name: string;
  loop: boolean;
  clampWhenFinished: boolean;
  fadeInTime: number;
  fadeOutTime: number;
  timeScale: number;
  weight: number;
  priority: number;
}

const DEFAULT_ANIMATIONS: Record<AnimationState, Partial<AnimationConfig>> = {
  idle: { loop: true, priority: 0, fadeInTime: 0.2 },
  walk: { loop: true, priority: 1, fadeInTime: 0.15 },
  run: { loop: true, priority: 1, fadeInTime: 0.15 },
  sprint: { loop: true, priority: 1, fadeInTime: 0.1 },
  jump: { loop: false, priority: 2, fadeInTime: 0.1, clampWhenFinished: true },
  fall: { loop: true, priority: 2, fadeInTime: 0.2 },
  land: { loop: false, priority: 2, fadeInTime: 0.1 },
  attack1: { loop: false, priority: 3, fadeInTime: 0.05, timeScale: 1.2 },
  attack2: { loop: false, priority: 3, fadeInTime: 0.05, timeScale: 1.2 },
  attack3: { loop: false, priority: 3, fadeInTime: 0.05, timeScale: 1.1 },
  skill: { loop: false, priority: 4, fadeInTime: 0.1 },
  hurt: { loop: false, priority: 5, fadeInTime: 0.05 },
  death: { loop: false, priority: 10, fadeInTime: 0.2, clampWhenFinished: true },
  dodge: { loop: false, priority: 3, fadeInTime: 0.05, timeScale: 1.3 },
  block: { loop: true, priority: 2, fadeInTime: 0.1 },
};

interface AnimationSystemState {
  currentState: AnimationState;
  previousState: AnimationState;
  isTransitioning: boolean;
  currentAction: THREE.AnimationAction | null;
  queuedState: AnimationState | null;
  lockedUntil: number;
  transitionEndTime: number;
}

interface UseAnimationSystemOptions {
  mixer: THREE.AnimationMixer | null;
  animations: Map<AnimationState, THREE.AnimationClip>;
  defaultState?: AnimationState;
  onAnimationComplete?: (state: AnimationState) => void;
}

export function useAnimationSystem({
  mixer,
  animations,
  defaultState = 'idle',
  onAnimationComplete,
}: UseAnimationSystemOptions) {
  const state = useRef<AnimationSystemState>({
    currentState: defaultState,
    previousState: defaultState,
    isTransitioning: false,
    currentAction: null,
    queuedState: null,
    lockedUntil: 0,
    transitionEndTime: 0,
  });

  const actions = useRef<Map<AnimationState, THREE.AnimationAction>>(new Map());

  // Inicializar acciones
  useEffect(() => {
    if (!mixer) return;

    animations.forEach((clip, animState) => {
      const action = mixer.clipAction(clip);
      const config = DEFAULT_ANIMATIONS[animState];
      
      action.loop = config.loop ? THREE.LoopRepeat : THREE.LoopOnce;
      action.clampWhenFinished = config.clampWhenFinished ?? false;
      action.timeScale = config.timeScale ?? 1;
      
      actions.current.set(animState, action);
    });

    // Reproducir animación por defecto
    const defaultAction = actions.current.get(defaultState);
    if (defaultAction) {
      defaultAction.play();
      state.current.currentAction = defaultAction;
    }

    // Listener para cuando termina una animación
    const handleFinished = (e: { action: THREE.AnimationAction }) => {
      const finishedState = Array.from(actions.current.entries())
        .find(([_, action]) => action === e.action)?.[0];
      
      if (finishedState) {
        onAnimationComplete?.(finishedState);
        
        // Si hay animación en cola, reproducirla
        if (state.current.queuedState) {
          playAnimation(state.current.queuedState);
          state.current.queuedState = null;
        } else {
          // Volver a idle si no está en loop
          const config = DEFAULT_ANIMATIONS[finishedState];
          if (!config.loop) {
            playAnimation('idle');
          }
        }
      }
    };

    mixer.addEventListener('finished', handleFinished);
    
    return () => {
      mixer.removeEventListener('finished', handleFinished);
      actions.current.forEach(action => action.stop());
      actions.current.clear();
    };
  }, [mixer, animations, defaultState, onAnimationComplete]);

  // Reproducir una animación
  const playAnimation = useCallback((
    newState: AnimationState,
    options?: { force?: boolean; queue?: boolean }
  ) => {
    if (!mixer) return;
    
    const { force = false, queue = false } = options ?? {};
    const currentTime = performance.now();
    
    // Verificar si está bloqueado
    if (!force && currentTime < state.current.lockedUntil) {
      if (queue) {
        state.current.queuedState = newState;
      }
      return;
    }
    
    // No cambiar si es el mismo estado (a menos que sea forzado)
    if (!force && newState === state.current.currentState) {
      return;
    }
    
    const newAction = actions.current.get(newState);
    const currentAction = state.current.currentAction;
    const newConfig = DEFAULT_ANIMATIONS[newState];
    
    if (!newAction) {
      console.warn(`Animation not found: ${newState}`);
      return;
    }
    
    // Verificar prioridad
    if (!force && currentAction) {
      const currentConfig = DEFAULT_ANIMATIONS[state.current.currentState];
      if (currentConfig.priority && newConfig.priority) {
        if (newConfig.priority < currentConfig.priority) {
          if (queue) state.current.queuedState = newState;
          return;
        }
      }
    }
    
    // Crossfade
    const fadeTime = newConfig.fadeInTime ?? 0.2;
    
    if (currentAction && currentAction !== newAction) {
      newAction.reset();
      newAction.setEffectiveTimeScale(newConfig.timeScale ?? 1);
      newAction.setEffectiveWeight(1);
      newAction.crossFadeFrom(currentAction, fadeTime, true);
    }
    
    newAction.play();
    
    // Actualizar estado
    state.current.previousState = state.current.currentState;
    state.current.currentState = newState;
    state.current.currentAction = newAction;
    state.current.isTransitioning = true;
    
    // Bloquear durante animaciones importantes
    if (!newConfig.loop) {
      const clip = animations.get(newState);
      if (clip) {
        const timeScale = newConfig.timeScale ?? 1;
        state.current.lockedUntil = currentTime + (clip.duration * 1000 * 0.8 / timeScale);
      }
    }
    
    // Marcar fin de transición usando duración real del fade
    state.current.transitionEndTime = performance.now() + fadeTime * 1000;
    
  }, [mixer, animations]);

  // Stop all
  const stopAll = useCallback(() => {
    actions.current.forEach(action => action.stop());
    state.current.currentAction = null;
  }, []);

  // Pause/Resume
  const pause = useCallback(() => {
    if (mixer) mixer.timeScale = 0;
  }, [mixer]);

  const resume = useCallback(() => {
    if (mixer) mixer.timeScale = 1;
  }, [mixer]);

  // Set time scale for current animation
  const setTimeScale = useCallback((scale: number) => {
    if (state.current.currentAction) {
      state.current.currentAction.setEffectiveTimeScale(scale);
    }
  }, []);

  // Update mixer + check transition end (reemplaza setTimeout)
  useFrame((_, delta) => {
    if (mixer) {
      mixer.update(delta);
    }
    // Verificar fin de transición sin setTimeout
    if (state.current.isTransitioning && performance.now() >= state.current.transitionEndTime) {
      state.current.isTransitioning = false;
    }
  });

  return {
    // Estado
    get currentState() { return state.current.currentState; },
    get previousState() { return state.current.previousState; },
    get isTransitioning() { return state.current.isTransitioning; },
    
    // Acciones
    play: playAnimation,
    stop: stopAll,
    pause,
    resume,
    setTimeScale,
    
    // Helper para determinar animación basada en movimiento
    updateFromMovement: useCallback((
      isMoving: boolean,
      isSprinting: boolean,
      isGrounded: boolean,
      verticalVelocity: number
    ) => {
      if (!isGrounded) {
        if (verticalVelocity > 0.5) {
          playAnimation('jump');
        } else if (verticalVelocity < -1) {
          playAnimation('fall');
        }
      } else if (isMoving) {
        if (isSprinting) {
          playAnimation('sprint');
        } else {
          playAnimation('run');
        }
      } else {
        playAnimation('idle');
      }
    }, [playAnimation]),
  };
}

export default useAnimationSystem;
