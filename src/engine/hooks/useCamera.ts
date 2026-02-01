/**
 * useCamera - Hook para control de cámara estilo GTA/Third Person
 * Basado en el CameraSystem de la guía Angular
 */

import { useRef, useCallback, useEffect } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useEngineStore } from '../stores/engineStore';

export interface CameraConfig {
  // Distancia de la cámara al objetivo
  distance: number;
  minDistance: number;
  maxDistance: number;
  
  // Altura de la cámara
  height: number;
  minHeight: number;
  maxHeight: number;
  
  // Ángulos de rotación
  angle: number;
  minAngle: number;
  maxAngle: number;
  
  // Suavizado
  smoothing: number;
  rotationSmooting: number;
  
  // Sensibilidad
  mouseSensitivity: number;
  zoomSensitivity: number;
  
  // Offset del objetivo
  targetOffset: THREE.Vector3;
  
  // Colisión con el terreno
  enableCollision: boolean;
  collisionOffset: number;
}

const DEFAULT_CONFIG: CameraConfig = {
  distance: 8,
  minDistance: 3,
  maxDistance: 20,
  height: 3,
  minHeight: 1,
  maxHeight: 10,
  angle: 0,
  minAngle: -Math.PI / 2 + 0.1,
  maxAngle: Math.PI / 2 - 0.1,
  smoothing: 0.1,
  rotationSmooting: 0.15,
  mouseSensitivity: 0.002,
  zoomSensitivity: 1,
  targetOffset: new THREE.Vector3(0, 1.5, 0),
  enableCollision: true,
  collisionOffset: 0.5,
};

interface CameraState {
  // Posición actual
  currentPosition: THREE.Vector3;
  currentTarget: THREE.Vector3;
  
  // Rotación orbital
  theta: number; // Horizontal
  phi: number;   // Vertical
  
  // Zoom
  currentDistance: number;
  
  // Estado
  isLocked: boolean;
  isDragging: boolean;
}

export function useCamera(
  targetRef: React.RefObject<THREE.Object3D | null>,
  config: Partial<CameraConfig> = {}
) {
  const { camera } = useThree();
  const { cameraLocked } = useEngineStore();
  
  const cfg = { ...DEFAULT_CONFIG, ...config };
  
  const state = useRef<CameraState>({
    currentPosition: new THREE.Vector3(0, cfg.height, cfg.distance),
    currentTarget: new THREE.Vector3(),
    theta: 0,
    phi: Math.PI / 6, // 30 grados de inclinación inicial
    currentDistance: cfg.distance,
    isLocked: false,
    isDragging: false,
  });

  // Vectores temporales para cálculos
  const tempVec = useRef(new THREE.Vector3());
  const idealPosition = useRef(new THREE.Vector3());
  const idealTarget = useRef(new THREE.Vector3());

  // Manejar input del mouse
  const handleMouseMove = useCallback((event: MouseEvent) => {
    if (!state.current.isDragging || cameraLocked) return;
    
    const { movementX, movementY } = event;
    
    // Actualizar ángulos
    state.current.theta -= movementX * cfg.mouseSensitivity;
    state.current.phi = THREE.MathUtils.clamp(
      state.current.phi - movementY * cfg.mouseSensitivity,
      cfg.minAngle,
      cfg.maxAngle
    );
  }, [cfg.mouseSensitivity, cfg.minAngle, cfg.maxAngle, cameraLocked]);

  const handleMouseDown = useCallback((event: MouseEvent) => {
    if (event.button === 2) { // Click derecho
      state.current.isDragging = true;
    }
  }, []);

  const handleMouseUp = useCallback((event: MouseEvent) => {
    if (event.button === 2) {
      state.current.isDragging = false;
    }
  }, []);

  const handleWheel = useCallback((event: WheelEvent) => {
    if (cameraLocked) return;
    
    state.current.currentDistance = THREE.MathUtils.clamp(
      state.current.currentDistance + event.deltaY * 0.01 * cfg.zoomSensitivity,
      cfg.minDistance,
      cfg.maxDistance
    );
  }, [cfg.minDistance, cfg.maxDistance, cfg.zoomSensitivity, cameraLocked]);

  // Setup event listeners
  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('wheel', handleWheel, { passive: true });
    
    // Prevenir menú contextual
    const preventContext = (e: Event) => e.preventDefault();
    window.addEventListener('contextmenu', preventContext);
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('contextmenu', preventContext);
    };
  }, [handleMouseMove, handleMouseDown, handleMouseUp, handleWheel]);

  // Update loop
  useFrame(() => {
    if (!targetRef.current) return;
    
    // Obtener posición del objetivo
    targetRef.current.getWorldPosition(tempVec.current);
    idealTarget.current.copy(tempVec.current).add(cfg.targetOffset);
    
    // Calcular posición ideal de la cámara (coordenadas esféricas)
    const { theta, phi, currentDistance } = state.current;
    
    idealPosition.current.set(
      Math.sin(theta) * Math.cos(phi) * currentDistance,
      Math.sin(phi) * currentDistance,
      Math.cos(theta) * Math.cos(phi) * currentDistance
    );
    idealPosition.current.add(idealTarget.current);
    
    // Suavizar movimiento
    state.current.currentPosition.lerp(idealPosition.current, cfg.smoothing);
    state.current.currentTarget.lerp(idealTarget.current, cfg.smoothing);
    
    // Aplicar a la cámara
    camera.position.copy(state.current.currentPosition);
    camera.lookAt(state.current.currentTarget);
  });

  // API pública
  return {
    // Estado
    getState: () => state.current,
    
    // Controles manuales
    setDistance: (distance: number) => {
      state.current.currentDistance = THREE.MathUtils.clamp(
        distance, cfg.minDistance, cfg.maxDistance
      );
    },
    
    setAngle: (theta: number, phi: number) => {
      state.current.theta = theta;
      state.current.phi = THREE.MathUtils.clamp(phi, cfg.minAngle, cfg.maxAngle);
    },
    
    resetCamera: () => {
      state.current.theta = 0;
      state.current.phi = Math.PI / 6;
      state.current.currentDistance = cfg.distance;
    },
    
    // Obtener dirección de la cámara (para movimiento)
    getForwardDirection: () => {
      const dir = new THREE.Vector3();
      camera.getWorldDirection(dir);
      dir.y = 0;
      dir.normalize();
      return dir;
    },
    
    getRightDirection: () => {
      const forward = new THREE.Vector3();
      camera.getWorldDirection(forward);
      const right = new THREE.Vector3();
      right.crossVectors(forward, camera.up).normalize();
      return right;
    },
  };
}

export default useCamera;
