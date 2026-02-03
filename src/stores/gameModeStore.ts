/**
 * Game Mode Store - Gestiona la preferencia de modo RPG/Survival
 * 
 * El modo se almacena en localStorage para persistencia
 * El backend NO necesita conocer el modo - es solo preferencia de UI
 */

import { create } from 'zustand';

// Tipos
export type GameMode = 'rpg' | 'survival';

interface GameModeState {
  // Estado
  mode: GameMode | null;
  isLoaded: boolean;
  
  // Acciones
  loadMode: () => void;
  setMode: (mode: GameMode) => void;
  clearMode: () => void;
  hasSelectedMode: () => boolean;
}

// Clave de localStorage
const STORAGE_KEY = 'valgame_preferredMode';

export const useGameModeStore = create<GameModeState>((set, get) => ({
  mode: null,
  isLoaded: false,
  
  // Cargar modo desde localStorage
  loadMode: () => {
    const stored = localStorage.getItem(STORAGE_KEY) as GameMode | null;
    set({ 
      mode: stored,
      isLoaded: true 
    });
  },
  
  // Guardar modo seleccionado
  setMode: (mode: GameMode) => {
    localStorage.setItem(STORAGE_KEY, mode);
    set({ mode });
  },
  
  // Limpiar modo (para volver a seleccionar)
  clearMode: () => {
    localStorage.removeItem(STORAGE_KEY);
    set({ mode: null });
  },
  
  // Verificar si hay modo seleccionado
  hasSelectedMode: () => {
    return get().mode !== null;
  },
}));

// Hooks de conveniencia
export const useGameMode = () => useGameModeStore((state) => state.mode);
export const useIsRPGMode = () => useGameModeStore((state) => state.mode === 'rpg');
export const useIsSurvivalMode = () => useGameModeStore((state) => state.mode === 'survival');
