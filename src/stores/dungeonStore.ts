/**
 * Dungeon Store - Gestiona la lista de mazmorras y selección
 * 
 * Conecta con playerStore para verificar requisitos (nivel, energía)
 * Conecta con teamStore para validar equipo seleccionado
 */

import { create } from 'zustand';

// Tipos
export interface DungeonReward {
  gold: { min: number; max: number };
  exp: { min: number; max: number };
  items?: string[];
  rareDropChance?: number;
}

export interface Dungeon {
  id: string;
  name: string;
  description: string;
  difficulty: 'easy' | 'normal' | 'hard' | 'expert' | 'legendary';
  requiredLevel: number;
  energyCost: number;
  ticketCost: number;
  estimatedTime: string; // "2-3 min"
  rewards: DungeonReward;
  backgroundImage?: string;
  bossName?: string;
  waves: number;
  unlocked?: boolean;
}

interface DungeonState {
  // Estado
  dungeons: Dungeon[];
  selectedDungeon: Dungeon | null;
  isLoading: boolean;
  
  // Acciones
  loadDungeons: () => void;
  selectDungeon: (dungeonId: string) => void;
  clearSelection: () => void;
  canEnterDungeon: (dungeonId: string, playerLevel: number, tickets: number) => { canEnter: boolean; reason?: string };
}

// Datos de mazmorras (en producción vendrían del backend)
const DUNGEONS_DATA: Dungeon[] = [
  {
    id: 'forest-ruins',
    name: 'Ruinas del Bosque',
    description: 'Antiguas ruinas cubiertas de vegetación. Hogar de criaturas salvajes y tesoros olvidados.',
    difficulty: 'easy',
    requiredLevel: 1,
    energyCost: 0,
    ticketCost: 1,
    estimatedTime: '2-3 min',
    waves: 3,
    bossName: 'Guardián de las Ruinas',
    rewards: {
      gold: { min: 50, max: 150 },
      exp: { min: 100, max: 200 },
      items: ['poción pequeña', 'espada oxidada'],
      rareDropChance: 0.05,
    },
    unlocked: true,
  },
  {
    id: 'crystal-cave',
    name: 'Caverna de Cristales',
    description: 'Una cueva llena de cristales brillantes y peligros ocultos en la oscuridad.',
    difficulty: 'normal',
    requiredLevel: 5,
    energyCost: 0,
    ticketCost: 1,
    estimatedTime: '3-5 min',
    waves: 5,
    bossName: 'Golem de Cristal',
    rewards: {
      gold: { min: 150, max: 350 },
      exp: { min: 250, max: 400 },
      items: ['fragmento de cristal', 'armadura de escamas'],
      rareDropChance: 0.10,
    },
    unlocked: true,
  },
  {
    id: 'shadow-temple',
    name: 'Templo de las Sombras',
    description: 'Un templo maldito donde la oscuridad cobra vida. Solo los valientes sobreviven.',
    difficulty: 'hard',
    requiredLevel: 10,
    energyCost: 0,
    ticketCost: 2,
    estimatedTime: '5-8 min',
    waves: 7,
    bossName: 'Sacerdote Oscuro',
    rewards: {
      gold: { min: 400, max: 800 },
      exp: { min: 500, max: 750 },
      items: ['tomo oscuro', 'capa de sombras'],
      rareDropChance: 0.15,
    },
    unlocked: true,
  },
  {
    id: 'dragon-lair',
    name: 'Guarida del Dragón',
    description: 'El hogar del temido Dragón Ancestral. Riquezas inimaginables aguardan... si sobrevives.',
    difficulty: 'expert',
    requiredLevel: 20,
    energyCost: 0,
    ticketCost: 3,
    estimatedTime: '8-12 min',
    waves: 10,
    bossName: 'Dragón Ancestral',
    rewards: {
      gold: { min: 1000, max: 2500 },
      exp: { min: 1000, max: 1500 },
      items: ['escama de dragón', 'espada de fuego'],
      rareDropChance: 0.20,
    },
    unlocked: true,
  },
  {
    id: 'void-dimension',
    name: 'Dimensión del Vacío',
    description: 'Un plano de existencia donde las leyes de la realidad no aplican. El desafío definitivo.',
    difficulty: 'legendary',
    requiredLevel: 35,
    energyCost: 0,
    ticketCost: 5,
    estimatedTime: '15-20 min',
    waves: 15,
    bossName: 'Entidad del Vacío',
    rewards: {
      gold: { min: 5000, max: 10000 },
      exp: { min: 3000, max: 5000 },
      items: ['esencia del vacío', 'armadura legendaria'],
      rareDropChance: 0.30,
    },
    unlocked: true,
  },
];

export const useDungeonStore = create<DungeonState>((set, get) => ({
  dungeons: [],
  selectedDungeon: null,
  isLoading: false,
  
  loadDungeons: () => {
    set({ isLoading: true });
    // Simular carga desde backend
    setTimeout(() => {
      set({ 
        dungeons: DUNGEONS_DATA,
        isLoading: false 
      });
    }, 300);
  },
  
  selectDungeon: (dungeonId: string) => {
    const dungeon = get().dungeons.find(d => d.id === dungeonId);
    set({ selectedDungeon: dungeon || null });
  },
  
  clearSelection: () => {
    set({ selectedDungeon: null });
  },
  
  canEnterDungeon: (dungeonId: string, playerLevel: number, tickets: number) => {
    const dungeon = get().dungeons.find(d => d.id === dungeonId);
    
    if (!dungeon) {
      return { canEnter: false, reason: 'Mazmorra no encontrada' };
    }
    
    if (playerLevel < dungeon.requiredLevel) {
      return { 
        canEnter: false, 
        reason: `Requiere nivel ${dungeon.requiredLevel} (tienes nivel ${playerLevel})` 
      };
    }
    
    if (tickets < dungeon.ticketCost) {
      return { 
        canEnter: false, 
        reason: `Necesitas ${dungeon.ticketCost} boleto(s) (tienes ${tickets})` 
      };
    }
    
    return { canEnter: true };
  },
}));

// Hooks de conveniencia
export const useDungeons = () => useDungeonStore((state) => state.dungeons);
export const useSelectedDungeon = () => useDungeonStore((state) => state.selectedDungeon);
