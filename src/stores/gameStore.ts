/**
 * Game Store - Estado global del juego
 * Usa Zustand para gestión de estado
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { QualityPreset } from '../config/game.config';

// Tipos del estado
export interface GameState {
  // Estado del juego
  isPlaying: boolean;
  isPaused: boolean;
  currentLevel: string | null;
  gameMode: 'STORY' | 'SURVIVAL' | 'DUNGEON' | null;
  
  // Configuración de calidad
  quality: QualityPreset;
  shadows: boolean;
  vsync: boolean;
  showFps: boolean;
  
  // Volumen
  masterVolume: number;
  musicVolume: number;
  sfxVolume: number;
  volume: number;
  isMuted: boolean;
  
  // Debug
  debugMode: boolean;
}

export interface GameActions {
  // Control de juego
  startGame: (level: string, mode: GameState['gameMode']) => void;
  stopGame: () => void;
  pauseGame: () => void;
  resumeGame: () => void;
  
  // Cambio de nivel
  setLevel: (level: string) => void;
  
  // Configuración
  setQuality: (quality: QualityPreset) => void;
  setShadows: (enabled: boolean) => void;
  setVsync: (enabled: boolean) => void;
  setShowFps: (enabled: boolean) => void;
  
  // Volumen
  setMasterVolume: (volume: number) => void;
  setMusicVolume: (volume: number) => void;
  setSfxVolume: (volume: number) => void;
  setVolume: (volume: number) => void;
  setMuted: (muted: boolean) => void;
  toggleMute: () => void;
  
  // Debug
  toggleDebug: () => void;
  
  // Reset
  resetSettings: () => void;
}

const initialState: GameState = {
  isPlaying: false,
  isPaused: false,
  currentLevel: null,
  gameMode: null,
  
  quality: 'high',
  shadows: true,
  vsync: true,
  showFps: false,
  
  masterVolume: 0.8,
  musicVolume: 0.6,
  sfxVolume: 0.8,
  volume: 0.8,
  isMuted: false,
  
  debugMode: false,
};

export const useGameStore = create<GameState & GameActions>()(
  devtools(
    persist(
      (set) => ({
        ...initialState,
        
        // Control de juego
        startGame: (level, mode) => set({
          isPlaying: true,
          isPaused: false,
          currentLevel: level,
          gameMode: mode,
        }),
        
        stopGame: () => set({
          isPlaying: false,
          isPaused: false,
          currentLevel: null,
          gameMode: null,
        }),
        
        pauseGame: () => set({ isPaused: true }),
        
        resumeGame: () => set({ isPaused: false }),
        
        setLevel: (level) => set({ currentLevel: level }),
        
        // Configuración
        setQuality: (quality) => set({ quality }),
        setShadows: (shadows) => set({ shadows }),
        setVsync: (vsync) => set({ vsync }),
        setShowFps: (showFps) => set({ showFps }),
        
        // Volumen
        setMasterVolume: (masterVolume) => set({ masterVolume }),
        setMusicVolume: (musicVolume) => set({ musicVolume }),
        setSfxVolume: (sfxVolume) => set({ sfxVolume }),
        setVolume: (volume) => set({ volume }),
        setMuted: (isMuted) => set({ isMuted }),
        toggleMute: () => set((state) => ({ isMuted: !state.isMuted })),
        
        // Debug
        toggleDebug: () => set((state) => ({ debugMode: !state.debugMode })),
        
        // Reset
        resetSettings: () => set(initialState),
      }),
      {
        name: 'valnor-game-storage',
        partialize: (state) => ({
          quality: state.quality,
          shadows: state.shadows,
          vsync: state.vsync,
          showFps: state.showFps,
          masterVolume: state.masterVolume,
          musicVolume: state.musicVolume,
          sfxVolume: state.sfxVolume,
          volume: state.volume,
          isMuted: state.isMuted,
        }),
      }
    ),
    { name: 'GameStore' }
  )
);
