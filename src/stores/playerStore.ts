/**
 * Player Store - Estado del jugador en el juego
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { useShallow } from 'zustand/shallow';
import type { CharacterClass, CharacterStats } from '../types';

// Mapper para transformar datos del backend (ES) a PlayerState (EN)
export const mapBackendPlayerData = (backendData: any): Partial<PlayerState> => {
  if (!backendData) return {};

  return {
    characterId: backendData._id || backendData.id || null,
    characterName: backendData.username || backendData.nombre || 'Adventurer',
    characterClass: backendData.clase || backendData.characterClass || 'warrior',
    level: backendData.nivel || backendData.level || 1,
    gold: backendData.val ?? backendData.gold ?? 0,
    gems: backendData.evo ?? backendData.gems ?? 0,
    energy: backendData.energia ?? 50,
    maxEnergy: backendData.energiaMaxima ?? 50,
    tickets: backendData.boletos ?? 10,
    // Stats de progreso
    battlesWon: backendData.estadisticas?.batallasGanadas ?? backendData.battlesWon ?? 0,
    battlesLost: backendData.estadisticas?.batallasPerdidas ?? backendData.battlesLost ?? 0,
    dungeonsCompleted: backendData.estadisticas?.mazmorrasCompletadas ?? backendData.dungeonsCompleted ?? 0,
    maxSurvivalWave: backendData.estadisticas?.oleadaMaxima ?? backendData.maxSurvivalWave ?? 0,
    charactersOwned: backendData.personajes?.length || 0,
  };
};

export interface PlayerState {
  // Información básica
  characterId: string | null;
  characterName: string;
  characterClass: CharacterClass | null;
  level: number;
  experience: number;
  experienceToNextLevel: number;
  
  // Stats actuales (in-game)
  currentHealth: number;
  maxHealth: number;
  currentMana: number;
  maxMana: number;
  currentStamina: number;
  maxStamina: number;
  
  // Stats base
  stats: CharacterStats;
  
  // Posición en el mundo
  position: { x: number; y: number; z: number };
  rotation: { x: number; y: number; z: number };
  
  // Estado de movimiento
  isGrounded: boolean;
  isMoving: boolean;
  
  // Estado de combate
  isInCombat: boolean;
  targetId: string | null;
  
  // Inventario equipado (IDs)
  equippedWeapon: string | null;
  equippedArmor: string | null;
  equippedAccessory: string | null;
  
  // Recursos
  gold: number;
  gems: number;
  tickets: number; // boletos para mazmorras
  energy: number;
  maxEnergy: number;
  lastEnergyUpdate: number; // timestamp de última actualización
  energyRegenMinutes: number; // minutos para regenerar 1 energía

  // Stats de progreso (del backend)
  battlesWon: number;
  battlesLost: number;
  dungeonsCompleted: number;
  maxSurvivalWave: number;
  charactersOwned: number;

  // Stats reales del personaje activo (backend: atk, vida, defensa)
  realStats: { atk: number; vida: number; defensa: number };
}

export interface PlayerActions {
  // Inicialización
  initPlayer: (data: Partial<PlayerState>) => void;
  resetPlayer: () => void;
  
  // Stats
  setHealth: (current: number, max?: number) => void;
  setMana: (current: number, max?: number) => void;
  setStamina: (current: number, max?: number) => void;
  heal: (amount: number) => void;
  takeDamage: (amount: number) => void;
  useMana: (amount: number) => boolean;
  useStamina: (amount: number) => boolean;
  
  // Experiencia y nivel
  addExperience: (amount: number) => void;
  levelUp: () => void;
  
  // Posición
  setPosition: (pos: { x: number; y: number; z: number }) => void;
  setRotation: (rot: { x: number; y: number; z: number }) => void;
  
  // Estado de movimiento
  setIsGrounded: (grounded: boolean) => void;
  setIsMoving: (moving: boolean) => void;
  
  // Combate
  enterCombat: (targetId?: string) => void;
  exitCombat: () => void;
  setTarget: (targetId: string | null) => void;
  
  // Equipamiento
  equipWeapon: (itemId: string | null) => void;
  equipArmor: (itemId: string | null) => void;
  equipAccessory: (itemId: string | null) => void;
  
  // Recursos
  addGold: (amount: number) => void;
  removeGold: (amount: number) => boolean;
  addGems: (amount: number) => void;
  removeGems: (amount: number) => boolean;
  addTickets: (amount: number) => void;
  useTickets: (amount: number) => boolean;
  addEnergy: (amount: number) => void;
  useEnergy: (amount: number) => boolean;
  updateEnergyRegen: () => void; // calcula y aplica regeneración
  
  // Salud (para actualizaciones en tiempo real)
  setCurrentHealth: (health: number) => void;
}

const defaultStats: CharacterStats = {
  strength: 10,
  dexterity: 10,
  intelligence: 10,
  vitality: 10,
  luck: 10,
  attack: 15,
  defense: 10,
  magicAttack: 10,
  magicDefense: 10,
  speed: 10,
  critRate: 5,
  critDamage: 150,
};

const initialState: PlayerState = {
  characterId: null,
  characterName: 'Adventurer',
  characterClass: null,
  level: 1,
  experience: 0,
  experienceToNextLevel: 100,
  
  currentHealth: 100,
  maxHealth: 100,
  currentMana: 50,
  maxMana: 50,
  currentStamina: 100,
  maxStamina: 100,
  
  stats: defaultStats,
  
  position: { x: 0, y: 0, z: 0 },
  rotation: { x: 0, y: 0, z: 0 },
  
  isGrounded: true,
  isMoving: false,
  
  isInCombat: false,
  targetId: null,
  
  equippedWeapon: null,
  equippedArmor: null,
  equippedAccessory: null,
  
  gold: 0,
  gems: 0,
  tickets: 10, // boletos iniciales
  energy: 50,
  maxEnergy: 50,
  lastEnergyUpdate: Date.now(),
  energyRegenMinutes: 5, // 1 energía cada 5 minutos

  // Stats de progreso
  battlesWon: 0,
  battlesLost: 0,
  dungeonsCompleted: 0,
  maxSurvivalWave: 0,
  charactersOwned: 0,

  // Stats reales del personaje activo
  realStats: { atk: 0, vida: 0, defensa: 0 },
};

// Función para calcular XP requerido
const calculateExpRequired = (level: number): number => {
  return Math.floor(100 * Math.pow(1.15, level - 1));
};

export const usePlayerStore = create<PlayerState & PlayerActions>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,
        
        // Inicialización
        initPlayer: (data) => set((state) => {
          // Si los datos parecen del backend (tienen campos ES), mapearlos
          const mappedData = data.val !== undefined || data.evo !== undefined || data.boletos !== undefined 
            ? mapBackendPlayerData(data) 
            : data;
          
          return {
            ...state,
            ...mappedData,
          };
        }),
        
        resetPlayer: () => set(initialState),
        
        // Stats
        setHealth: (current, max) => set((state) => ({
          currentHealth: Math.max(0, Math.min(current, max ?? state.maxHealth)),
          ...(max !== undefined && { maxHealth: max }),
        })),
        
        setMana: (current, max) => set((state) => ({
          currentMana: Math.max(0, Math.min(current, max ?? state.maxMana)),
          ...(max !== undefined && { maxMana: max }),
        })),
        
        setStamina: (current, max) => set((state) => ({
          currentStamina: Math.max(0, Math.min(current, max ?? state.maxStamina)),
          ...(max !== undefined && { maxStamina: max }),
        })),
        
        heal: (amount) => set((state) => ({
          currentHealth: Math.min(state.currentHealth + amount, state.maxHealth),
        })),
        
        takeDamage: (amount) => set((state) => ({
          currentHealth: Math.max(0, state.currentHealth - amount),
        })),
        
        useMana: (amount) => {
          const state = get();
          if (state.currentMana >= amount) {
            set({ currentMana: state.currentMana - amount });
            return true;
          }
          return false;
        },
        
        useStamina: (amount) => {
          const state = get();
          if (state.currentStamina >= amount) {
            set({ currentStamina: state.currentStamina - amount });
            return true;
          }
          return false;
        },
        
        // Experiencia y nivel
        addExperience: (amount) => {
          const state = get();
          let newExp = state.experience + amount;
          let newLevel = state.level;
          let expRequired = state.experienceToNextLevel;
          
          // Level up loop
          while (newExp >= expRequired) {
            newExp -= expRequired;
            newLevel++;
            expRequired = calculateExpRequired(newLevel);
          }
          
          set({
            experience: newExp,
            level: newLevel,
            experienceToNextLevel: expRequired,
          });
          
          // Si subió de nivel, actualizar stats
          if (newLevel > state.level) {
            get().levelUp();
          }
        },
        
        levelUp: () => set((state) => {
          const multiplier = 1.1;
          return {
            maxHealth: Math.floor(state.maxHealth * multiplier),
            currentHealth: Math.floor(state.maxHealth * multiplier), // Full heal on level up
            maxMana: Math.floor(state.maxMana * multiplier),
            currentMana: Math.floor(state.maxMana * multiplier),
            stats: {
              ...state.stats,
              strength: Math.floor(state.stats.strength * 1.05),
              dexterity: Math.floor(state.stats.dexterity * 1.05),
              intelligence: Math.floor(state.stats.intelligence * 1.05),
              vitality: Math.floor(state.stats.vitality * 1.05),
              attack: Math.floor(state.stats.attack * 1.08),
              defense: Math.floor(state.stats.defense * 1.08),
            },
          };
        }),
        
        // Posición
        setPosition: (position) => set({ position }),
        setRotation: (rotation) => set({ rotation }),
        
        // Estado de movimiento
        setIsGrounded: (isGrounded) => set({ isGrounded }),
        setIsMoving: (isMoving) => set({ isMoving }),
        
        // Combate
        enterCombat: (targetId = undefined) => set({
          isInCombat: true,
          targetId,
        }),
        
        exitCombat: () => set({
          isInCombat: false,
          targetId: null,
        }),
        
        setTarget: (targetId) => set({ targetId }),
        
        // Equipamiento
        equipWeapon: (itemId) => set({ equippedWeapon: itemId }),
        equipArmor: (itemId) => set({ equippedArmor: itemId }),
        equipAccessory: (itemId) => set({ equippedAccessory: itemId }),
        
        // Recursos
        addGold: (amount) => set((state) => ({
          gold: state.gold + amount,
        })),
        
        removeGold: (amount) => {
          const state = get();
          if (state.gold >= amount) {
            set({ gold: state.gold - amount });
            return true;
          }
          return false;
        },
        
        addGems: (amount) => set((state) => ({
          gems: state.gems + amount,
        })),
        
        removeGems: (amount) => {
          const state = get();
          if (state.gems >= amount) {
            set({ gems: state.gems - amount });
            return true;
          }
          return false;
        },
        
        addTickets: (amount) => set((state) => ({
          tickets: state.tickets + amount,
        })),
        
        useTickets: (amount) => {
          const state = get();
          if (state.tickets >= amount) {
            set({ tickets: state.tickets - amount });
            return true;
          }
          return false;
        },
        
        addEnergy: (amount) => set((state) => ({
          energy: Math.min(state.energy + amount, state.maxEnergy),
        })),
        
        useEnergy: (amount) => {
          const state = get();
          if (state.energy >= amount) {
            set({ energy: state.energy - amount, lastEnergyUpdate: Date.now() });
            return true;
          }
          return false;
        },
        
        updateEnergyRegen: () => {
          const state = get();
          if (state.energy >= state.maxEnergy) {
            // Ya está llena, actualizar timestamp
            set({ lastEnergyUpdate: Date.now() });
            return;
          }
          
          const now = Date.now();
          const elapsed = now - state.lastEnergyUpdate;
          const regenInterval = state.energyRegenMinutes * 60 * 1000; // en ms
          const energyToAdd = Math.floor(elapsed / regenInterval);
          
          if (energyToAdd > 0) {
            const newEnergy = Math.min(state.energy + energyToAdd, state.maxEnergy);
            const remainder = elapsed % regenInterval;
            set({ 
              energy: newEnergy, 
              lastEnergyUpdate: now - remainder // mantener el tiempo sobrante
            });
          }
        },
        
        // Salud (para actualizaciones en tiempo real)
        setCurrentHealth: (health) => set((state) => ({
          currentHealth: Math.max(0, Math.min(health, state.maxHealth)),
        })),
      }),
      {
        name: 'valnor-player-storage',
        partialize: (state) => ({
          characterId: state.characterId,
          level: state.level,
          experience: state.experience,
          gold: state.gold,
          gems: state.gems,
          energy: state.energy,
          maxEnergy: state.maxEnergy,
          lastEnergyUpdate: state.lastEnergyUpdate,
          energyRegenMinutes: state.energyRegenMinutes,
        }),
      }
    ),
    { name: 'PlayerStore' }
  )
);

// Selectores helper - usando shallow para evitar re-renders infinitos

export const usePlayerHealth = () => usePlayerStore(
  useShallow((state) => ({
    current: state.currentHealth,
    max: state.maxHealth,
    percentage: (state.currentHealth / state.maxHealth) * 100,
  }))
);

export const usePlayerMana = () => usePlayerStore(
  useShallow((state) => ({
    current: state.currentMana,
    max: state.maxMana,
    percentage: (state.currentMana / state.maxMana) * 100,
  }))
);

export const usePlayerLevel = () => usePlayerStore(
  useShallow((state) => ({
    level: state.level,
    exp: state.experience,
    expRequired: state.experienceToNextLevel,
    percentage: (state.experience / state.experienceToNextLevel) * 100,
  }))
);

export const usePlayerResources = () => usePlayerStore(
  useShallow((state) => ({
    gold: state.gold,
    gems: state.gems,
  }))
);

// Selectores para Profile page — lee datos reales del backend
export const usePlayerStats = () => usePlayerStore(
  useShallow((state) => ({
    battlesWon: state.battlesWon,
    battlesLost: state.battlesLost,
    dungeonsCompleted: state.dungeonsCompleted,
    maxSurvivalWave: state.maxSurvivalWave,
    charactersOwned: state.charactersOwned,
    level: state.level,
  }))
);

export const usePlayerWallet = () => usePlayerStore(
  useShallow((state) => ({
    gold: state.gold,
    gems: state.gems,
    tickets: state.tickets,
  }))
);
