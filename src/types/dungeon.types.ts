/**
 * Dungeon Types - Tipos de mazmorras y combate
 */

import type { ItemRarity } from './item.types';
import type { CharacterClass } from './character.types';

// Dificultad de mazmorra
export type DungeonDifficulty = 'easy' | 'normal' | 'hard' | 'nightmare' | 'hell';

// Estado de la mazmorra
export type DungeonStatus = 'available' | 'locked' | 'completed' | 'in_progress';

// Tipo de enemigo
export type EnemyType = 'normal' | 'elite' | 'boss' | 'miniboss';

// Mazmorra
export interface Dungeon {
  id: string;
  name: string;
  description: string;
  difficulty: DungeonDifficulty;
  recommendedLevel: number;
  maxPlayers: number;
  
  // Requisitos
  requiredLevel: number;
  requiredItems?: string[];
  requiredDungeons?: string[]; // IDs de mazmorras previas
  
  // Contenido
  floors: DungeonFloor[];
  totalEnemies: number;
  bosses: string[]; // IDs de bosses
  
  // Recompensas
  rewards: DungeonRewards;
  
  // Visual
  thumbnail: string;
  backgroundImage: string;
  environment: 'cave' | 'castle' | 'forest' | 'ruins' | 'volcano' | 'ice';
  
  // Metadatos
  createdAt: string;
  status: DungeonStatus;
}

// Piso de la mazmorra
export interface DungeonFloor {
  id: string;
  floorNumber: number;
  name: string;
  enemies: DungeonEnemy[];
  boss?: DungeonEnemy;
  traps?: DungeonTrap[];
  treasures?: DungeonTreasure[];
}

// Enemigo de mazmorra
export interface DungeonEnemy {
  id: string;
  name: string;
  type: EnemyType;
  level: number;
  
  // Stats
  health: number;
  attack: number;
  defense: number;
  speed: number;
  
  // Habilidades
  abilities: EnemyAbility[];
  
  // Drops
  dropTable: DropTableEntry[];
  experienceReward: number;
  goldReward: number;
  
  // Visual
  modelPath: string;
  scale: number;
}

export interface EnemyAbility {
  id: string;
  name: string;
  damage: number;
  cooldown: number;
  type: 'physical' | 'magical' | 'heal' | 'buff' | 'debuff';
  targetType: 'single' | 'aoe' | 'self';
}

export interface DropTableEntry {
  itemId: string;
  dropRate: number; // 0-100
  minQuantity: number;
  maxQuantity: number;
}

export interface DungeonTrap {
  id: string;
  type: 'spike' | 'poison' | 'fire' | 'arrow';
  damage: number;
  position: { x: number; y: number; z: number };
}

export interface DungeonTreasure {
  id: string;
  type: 'chest' | 'hidden' | 'locked';
  items: DropTableEntry[];
  position: { x: number; y: number; z: number };
  requiredKey?: string;
}

// Recompensas de mazmorra
export interface DungeonRewards {
  firstClearRewards: RewardItem[];
  repeatRewards: RewardItem[];
  bonusRewards?: RewardItem[]; // Por completar rápido, sin morir, etc.
}

export interface RewardItem {
  type: 'item' | 'gold' | 'gems' | 'experience';
  itemId?: string;
  amount: number;
  rarity?: ItemRarity;
}

// Sesión de mazmorra (run actual)
export interface DungeonRun {
  id: string;
  odungeonId: string;
  odungeonName: string;
  
  // Jugadores
  players: DungeonPlayer[];
  
  // Estado
  currentFloor: number;
  totalFloors: number;
  status: 'in_progress' | 'completed' | 'failed' | 'abandoned';
  
  // Progreso
  enemiesKilled: number;
  totalEnemies: number;
  bossesDefeated: string[];
  
  // Tiempo
  startedAt: string;
  completedAt?: string;
  duration?: number; // en segundos
  
  // Recompensas obtenidas
  rewards: RewardItem[];
}

export interface DungeonPlayer {
  oduserId: string;
  oduserName: string;
  characterId: string;
  class: CharacterClass;
  level: number;
  isLeader: boolean;
  isReady: boolean;
  
  // Stats durante la run
  damageDealt: number;
  damageTaken: number;
  healingDone: number;
  deaths: number;
}

// Acción de combate
export interface CombatAction {
  id: string;
  type: 'attack' | 'skill' | 'item' | 'defend' | 'flee';
  actorId: string;
  targetId?: string;
  skillId?: string;
  itemId?: string;
  
  // Resultado
  damage?: number;
  healing?: number;
  isCritical?: boolean;
  effects?: CombatEffect[];
}

export interface CombatEffect {
  type: 'damage' | 'heal' | 'buff' | 'debuff' | 'dot' | 'hot';
  value: number;
  duration?: number; // en turnos o segundos
  stackable?: boolean;
}

// Resultado del combate
export interface CombatResult {
  won: boolean;
  experienceGained: number;
  goldGained: number;
  itemsDropped: RewardItem[];
  playerStats: DungeonPlayer;
}

// Para crear una nueva run
export interface CreateDungeonRunDTO {
  dungeonId: string;
  difficulty?: DungeonDifficulty;
  partyIds?: string[]; // IDs de otros jugadores
}

// Respuestas del servidor
export interface DungeonResponse {
  success: boolean;
  dungeon?: Dungeon;
  dungeons?: Dungeon[];
  message?: string;
}

export interface DungeonRunResponse {
  success: boolean;
  run?: DungeonRun;
  message?: string;
}
