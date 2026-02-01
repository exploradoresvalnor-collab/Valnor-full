/**
 * Engine Store - Estado del motor 3D
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import * as THREE from 'three';

export type QualityLevel = 'low' | 'medium' | 'high' | 'ultra';
export type QualityPreset = QualityLevel; // Alias for compatibility

export interface EngineState {
  // Estado del engine
  isInitialized: boolean;
  isRunning: boolean;
  isPaused: boolean;
  
  // Performance
  fps: number;
  frameTime: number;
  drawCalls: number;
  triangles: number;
  
  // Configuración de calidad
  quality: QualityLevel;
  shadowQuality: number;
  viewDistance: number;
  enablePostProcessing: boolean;
  enableParticles: boolean;
  enableGrass: boolean;
  enableWildlife: boolean;
  
  // Tiempo
  deltaTime: number;
  elapsedTime: number;
  
  // Cámara
  cameraPosition: THREE.Vector3;
  cameraTarget: THREE.Vector3;
  cameraLocked: boolean;
  
  // Debug
  debugMode: boolean;
  showColliders: boolean;
  showStats: boolean;
  
  // Acciones
  initialize: () => void;
  shutdown: () => void;
  pause: () => void;
  resume: () => void;
  setQuality: (quality: QualityLevel) => void;
  setFps: (fps: number) => void;
  setFrameTime: (time: number) => void;
  updateStats: (drawCalls: number, triangles: number) => void;
  updateTime: (deltaTime: number, elapsedTime: number) => void;
  setCameraPosition: (position: THREE.Vector3) => void;
  setCameraTarget: (target: THREE.Vector3) => void;
  toggleCameraLock: () => void;
  toggleDebugMode: () => void;
  toggleColliders: () => void;
  toggleStats: () => void;
}

// Presets de calidad
const QUALITY_PRESETS: Record<QualityLevel, Partial<EngineState>> = {
  low: {
    shadowQuality: 512,
    viewDistance: 100,
    enablePostProcessing: false,
    enableParticles: false,
    enableGrass: false,
    enableWildlife: false,
  },
  medium: {
    shadowQuality: 1024,
    viewDistance: 200,
    enablePostProcessing: true,
    enableParticles: true,
    enableGrass: false,
    enableWildlife: false,
  },
  high: {
    shadowQuality: 2048,
    viewDistance: 400,
    enablePostProcessing: true,
    enableParticles: true,
    enableGrass: true,
    enableWildlife: true,
  },
  ultra: {
    shadowQuality: 4096,
    viewDistance: 800,
    enablePostProcessing: true,
    enableParticles: true,
    enableGrass: true,
    enableWildlife: true,
  },
};

export const useEngineStore = create<EngineState>()(
  devtools(
    (set, _get) => ({
      // Estado inicial
      isInitialized: false,
      isRunning: false,
      isPaused: false,
      
      fps: 0,
      frameTime: 0,
      drawCalls: 0,
      triangles: 0,
      
      quality: 'high',
      shadowQuality: 2048,
      viewDistance: 400,
      enablePostProcessing: true,
      enableParticles: true,
      enableGrass: true,
      enableWildlife: true,
      
      deltaTime: 0,
      elapsedTime: 0,
      
      cameraPosition: new THREE.Vector3(0, 5, 10),
      cameraTarget: new THREE.Vector3(0, 0, 0),
      cameraLocked: false,
      
      debugMode: false,
      showColliders: false,
      showStats: false,

      // Acciones
      initialize: () => set({ isInitialized: true, isRunning: true }),
      shutdown: () => set({ isInitialized: false, isRunning: false }),
      pause: () => set({ isPaused: true }),
      resume: () => set({ isPaused: false }),
      
      setQuality: (quality) => {
        const preset = QUALITY_PRESETS[quality];
        set({ quality, ...preset });
      },
      
      setFps: (fps) => set({ fps }),
      setFrameTime: (frameTime) => set({ frameTime }),
      updateStats: (drawCalls, triangles) => set({ drawCalls, triangles }),
      updateTime: (deltaTime, elapsedTime) => set({ deltaTime, elapsedTime }),
      
      setCameraPosition: (cameraPosition) => set({ cameraPosition }),
      setCameraTarget: (cameraTarget) => set({ cameraTarget }),
      toggleCameraLock: () => set((state) => ({ cameraLocked: !state.cameraLocked })),
      
      toggleDebugMode: () => set((state) => ({ debugMode: !state.debugMode })),
      toggleColliders: () => set((state) => ({ showColliders: !state.showColliders })),
      toggleStats: () => set((state) => ({ showStats: !state.showStats })),
    }),
    { name: 'engine-store' }
  )
);

// Hooks helpers
export const useEngineRunning = () => useEngineStore((s) => s.isRunning && !s.isPaused);
export const useEngineStats = () => useEngineStore((s) => ({
  fps: s.fps,
  frameTime: s.frameTime,
  drawCalls: s.drawCalls,
  triangles: s.triangles,
}));
export const useEngineQuality = () => useEngineStore((s) => ({
  quality: s.quality,
  shadowQuality: s.shadowQuality,
  viewDistance: s.viewDistance,
  enablePostProcessing: s.enablePostProcessing,
  enableParticles: s.enableParticles,
  enableGrass: s.enableGrass,
  enableWildlife: s.enableWildlife,
}));
