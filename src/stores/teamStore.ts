/**
 * Team Store - Estado del equipo activo del jugador
 * Maneja la lista de personajes del equipo
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { useShallow } from 'zustand/shallow';

// Tipo de personaje del equipo
export interface TeamMember {
  id: string;
  name: string;
  level: number;
  class: 'warrior' | 'mage' | 'archer' | 'paladin' | 'healer' | 'rogue';
  rarity?: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  stats?: {
    attack: number;
    defense: number;
    health: number;
    speed: number;
  };
  isLeader?: boolean;
}

export interface TeamState {
  // Equipo activo (máximo 4)
  activeTeam: TeamMember[];
  maxTeamSize: number;
  
  // Personajes disponibles (todos los que tiene el jugador)
  ownedCharacters: TeamMember[];
  
  // Personaje líder del equipo
  leaderId: string | null;
}

export interface TeamActions {
  // Gestión del equipo
  addToTeam: (character: TeamMember) => boolean;
  removeFromTeam: (characterId: string) => void;
  setTeam: (team: TeamMember[]) => void;
  clearTeam: () => void;
  
  // Personajes propios
  addCharacter: (character: TeamMember) => void;
  removeCharacter: (characterId: string) => void;
  setOwnedCharacters: (characters: TeamMember[]) => void;
  
  // Líder
  setLeader: (characterId: string) => void;
  
  // Utilidades
  isInTeam: (characterId: string) => boolean;
  getTeamPower: () => number;
  
  // Reset
  resetTeam: () => void;
}

// Equipo inicial por defecto (demo)
const defaultTeam: TeamMember[] = [
  { 
    id: 'hero_warrior_1', 
    name: 'Guerrero', 
    level: 5, 
    class: 'warrior',
    rarity: 'rare',
    stats: { attack: 45, defense: 35, health: 120, speed: 10 },
    isLeader: true
  },
  { 
    id: 'hero_mage_1', 
    name: 'Mago', 
    level: 5, 
    class: 'mage',
    rarity: 'uncommon',
    stats: { attack: 55, defense: 15, health: 80, speed: 12 }
  },
  { 
    id: 'hero_archer_1', 
    name: 'Arquero', 
    level: 5, 
    class: 'archer',
    rarity: 'uncommon',
    stats: { attack: 50, defense: 20, health: 90, speed: 18 }
  },
  { 
    id: 'hero_paladin_1', 
    name: 'Paladín', 
    level: 4, 
    class: 'paladin',
    rarity: 'rare',
    stats: { attack: 35, defense: 50, health: 150, speed: 8 }
  },
];

const initialState: TeamState = {
  activeTeam: defaultTeam,
  maxTeamSize: 4,
  ownedCharacters: [...defaultTeam],
  leaderId: 'hero_warrior_1',
};

export const useTeamStore = create<TeamState & TeamActions>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,
        
        // Añadir al equipo activo
        addToTeam: (character) => {
          const state = get();
          if (state.activeTeam.length >= state.maxTeamSize) {
            return false;
          }
          if (state.activeTeam.some(c => c.id === character.id)) {
            return false; // Ya está en el equipo
          }
          set({ activeTeam: [...state.activeTeam, character] });
          return true;
        },
        
        // Quitar del equipo activo
        removeFromTeam: (characterId) => {
          set((state) => ({
            activeTeam: state.activeTeam.filter(c => c.id !== characterId),
            // Si quitamos al líder, el primero se convierte en líder
            leaderId: state.leaderId === characterId 
              ? state.activeTeam.filter(c => c.id !== characterId)[0]?.id || null
              : state.leaderId,
          }));
        },
        
        // Establecer equipo completo
        setTeam: (team) => {
          set({ 
            activeTeam: team.slice(0, get().maxTeamSize),
            leaderId: team[0]?.id || null,
          });
        },
        
        // Limpiar equipo
        clearTeam: () => {
          set({ activeTeam: [], leaderId: null });
        },
        
        // Añadir personaje a los propios
        addCharacter: (character) => {
          set((state) => {
            if (state.ownedCharacters.some(c => c.id === character.id)) {
              return state; // Ya existe
            }
            return { ownedCharacters: [...state.ownedCharacters, character] };
          });
        },
        
        // Quitar personaje de los propios
        removeCharacter: (characterId) => {
          set((state) => ({
            ownedCharacters: state.ownedCharacters.filter(c => c.id !== characterId),
            activeTeam: state.activeTeam.filter(c => c.id !== characterId),
          }));
        },
        
        // Establecer personajes propios
        setOwnedCharacters: (characters) => {
          set({ ownedCharacters: characters });
        },
        
        // Establecer líder
        setLeader: (characterId) => {
          const state = get();
          const character = state.activeTeam.find(c => c.id === characterId);
          if (character) {
            // Actualizar isLeader en el equipo
            const updatedTeam = state.activeTeam.map(c => ({
              ...c,
              isLeader: c.id === characterId,
            }));
            set({ leaderId: characterId, activeTeam: updatedTeam });
          }
        },
        
        // Verificar si está en el equipo
        isInTeam: (characterId) => {
          return get().activeTeam.some(c => c.id === characterId);
        },
        
        // Calcular poder total del equipo
        getTeamPower: () => {
          const state = get();
          return state.activeTeam.reduce((total, char) => {
            if (char.stats) {
              return total + char.stats.attack + char.stats.defense + 
                     Math.floor(char.stats.health / 10) + char.stats.speed;
            }
            return total + (char.level * 20);
          }, 0);
        },
        
        // Reset
        resetTeam: () => set(initialState),
      }),
      {
        name: 'valnor-team-storage',
        partialize: (state) => ({
          activeTeam: state.activeTeam,
          ownedCharacters: state.ownedCharacters,
          leaderId: state.leaderId,
        }),
        // Migración para manejar datos viejos
        merge: (persistedState, currentState) => {
          const persisted = persistedState as Partial<TeamState>;
          
          // Si no hay datos persistidos o están corruptos, usar defaults
          if (!persisted || !Array.isArray(persisted.activeTeam)) {
            return currentState;
          }
          
          // Validar que los miembros del equipo tienen la estructura correcta
          const validTeam = persisted.activeTeam.filter((member: unknown) => {
            if (!member || typeof member !== 'object') return false;
            const m = member as Record<string, unknown>;
            return typeof m.id === 'string' && 
                   typeof m.name === 'string' && 
                   typeof m.level === 'number' && 
                   typeof m.class === 'string';
          }) as TeamMember[];
          
          return {
            ...currentState,
            activeTeam: validTeam.length > 0 ? validTeam : defaultTeam,
            ownedCharacters: persisted.ownedCharacters || [...defaultTeam],
            leaderId: persisted.leaderId || 'hero_warrior_1',
          };
        },
      }
    ),
    { name: 'TeamStore' }
  )
);

// Selectores helper

export const useActiveTeam = () => useTeamStore(
  useShallow((state) => state.activeTeam)
);

export const useOwnedCharacters = () => useTeamStore(
  useShallow((state) => state.ownedCharacters)
);

export const useTeamLeader = () => useTeamStore(
  useShallow((state) => {
    const leader = state.activeTeam.find(c => c.id === state.leaderId);
    return leader || state.activeTeam[0] || null;
  })
);

// Calcula el poder del equipo directamente desde el estado
export const useTeamPower = () => useTeamStore((state) => {
  return state.activeTeam.reduce((total, char) => {
    if (char.stats) {
      return total + char.stats.attack + char.stats.defense + 
             Math.floor(char.stats.health / 10) + char.stats.speed;
    }
    return total + (char.level * 20);
  }, 0);
});

// Alias para useActiveTeam (para compatibilidad con Profile page)
export const useTeamMembers = () => useTeamStore(
  useShallow((state) => state.activeTeam.map((member) => ({
    ...member,
    imageUrl: null as string | null, // Para mostrar avatar
  })))
);
