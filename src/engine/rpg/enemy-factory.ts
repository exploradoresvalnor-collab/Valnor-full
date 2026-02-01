/**
 * Enemy Factory - Fábrica de enemigos con generación procedural
 */

import * as THREE from 'three';
import type { CharacterStats } from '../../types';
import type { DamageType } from './rpg-calculator';

// ============================================================
// TIPOS DE ENEMIGOS
// ============================================================

export type EnemyType = 
  | 'goblin'
  | 'skeleton'
  | 'orc'
  | 'wolf'
  | 'spider'
  | 'bat'
  | 'slime'
  | 'bandit'
  | 'golem'
  | 'dragon'
  | 'demon'
  | 'undead_knight'
  | 'elemental_fire'
  | 'elemental_ice'
  | 'elemental_lightning'
  | 'troll'
  | 'ghost'
  | 'boss_goblin_king'
  | 'boss_dragon'
  | 'boss_lich';

export type EnemyTier = 'minion' | 'normal' | 'elite' | 'champion' | 'boss' | 'raid_boss';

export type EnemyBehavior = 'aggressive' | 'defensive' | 'ranged' | 'support' | 'patrol' | 'ambush';

// ============================================================
// INTERFACES
// ============================================================

export interface EnemyConfig {
  type: EnemyType;
  name: string;
  tier: EnemyTier;
  level: number;
  baseStats: CharacterStats;
  element?: DamageType;
  behavior: EnemyBehavior;
  abilities: string[];
  lootTable: string;
  experienceValue: number;
  goldValue: number;
  
  // Visual
  modelId?: string;
  scale?: number;
  color?: string;
  
  // AI
  aggroRange: number;
  attackRange: number;
  moveSpeed: number;
  attackSpeed: number;
}

export interface SpawnedEnemy extends EnemyConfig {
  id: string;
  position: THREE.Vector3;
  rotation: THREE.Euler;
  currentHealth: number;
  maxHealth: number;
  currentMana: number;
  maxMana: number;
  isAlive: boolean;
  targetId: string | null;
  state: 'idle' | 'patrol' | 'chase' | 'attack' | 'flee' | 'dead';
  lastAttackTime: number;
  spawnTime: number;
}

// ============================================================
// TEMPLATES DE ENEMIGOS
// ============================================================

const ENEMY_TEMPLATES: Record<EnemyType, Omit<EnemyConfig, 'level'>> = {
  goblin: {
    type: 'goblin',
    name: 'Goblin',
    tier: 'minion',
    baseStats: {
      strength: 8, dexterity: 12, intelligence: 5, vitality: 8, luck: 10,
      attack: 10, defense: 5, magicAttack: 3, magicDefense: 3, speed: 15,
      critRate: 5, critDamage: 130,
    },
    behavior: 'aggressive',
    abilities: ['basic_attack', 'dodge'],
    lootTable: 'loot_goblin',
    experienceValue: 15,
    goldValue: 5,
    scale: 0.8,
    color: '#4a7c23',
    aggroRange: 12,
    attackRange: 2,
    moveSpeed: 5,
    attackSpeed: 1.2,
  },
  
  skeleton: {
    type: 'skeleton',
    name: 'Skeleton',
    tier: 'normal',
    baseStats: {
      strength: 10, dexterity: 8, intelligence: 3, vitality: 6, luck: 5,
      attack: 12, defense: 8, magicAttack: 2, magicDefense: 5, speed: 8,
      critRate: 8, critDamage: 140,
    },
    element: 'dark',
    behavior: 'aggressive',
    abilities: ['basic_attack', 'bone_throw'],
    lootTable: 'loot_undead',
    experienceValue: 20,
    goldValue: 8,
    scale: 1.0,
    color: '#e8e8dc',
    aggroRange: 15,
    attackRange: 2,
    moveSpeed: 4,
    attackSpeed: 1.0,
  },
  
  orc: {
    type: 'orc',
    name: 'Orc Warrior',
    tier: 'normal',
    baseStats: {
      strength: 18, dexterity: 6, intelligence: 4, vitality: 15, luck: 5,
      attack: 20, defense: 15, magicAttack: 3, magicDefense: 8, speed: 6,
      critRate: 10, critDamage: 160,
    },
    behavior: 'aggressive',
    abilities: ['basic_attack', 'heavy_strike', 'war_cry'],
    lootTable: 'loot_orc',
    experienceValue: 35,
    goldValue: 15,
    scale: 1.4,
    color: '#3a5c1a',
    aggroRange: 18,
    attackRange: 3,
    moveSpeed: 4,
    attackSpeed: 0.8,
  },
  
  wolf: {
    type: 'wolf',
    name: 'Wild Wolf',
    tier: 'minion',
    baseStats: {
      strength: 10, dexterity: 15, intelligence: 3, vitality: 8, luck: 8,
      attack: 12, defense: 6, magicAttack: 0, magicDefense: 4, speed: 20,
      critRate: 12, critDamage: 140,
    },
    behavior: 'aggressive',
    abilities: ['bite', 'pounce'],
    lootTable: 'loot_beast',
    experienceValue: 12,
    goldValue: 3,
    scale: 1.0,
    color: '#5c5c5c',
    aggroRange: 20,
    attackRange: 2,
    moveSpeed: 8,
    attackSpeed: 1.5,
  },
  
  spider: {
    type: 'spider',
    name: 'Giant Spider',
    tier: 'normal',
    baseStats: {
      strength: 8, dexterity: 14, intelligence: 6, vitality: 10, luck: 6,
      attack: 10, defense: 8, magicAttack: 8, magicDefense: 6, speed: 12,
      critRate: 8, critDamage: 130,
    },
    element: 'poison',
    behavior: 'ambush',
    abilities: ['bite', 'web_shot', 'poison_spray'],
    lootTable: 'loot_spider',
    experienceValue: 25,
    goldValue: 10,
    scale: 1.2,
    color: '#2a2a2a',
    aggroRange: 10,
    attackRange: 4,
    moveSpeed: 6,
    attackSpeed: 1.0,
  },
  
  bat: {
    type: 'bat',
    name: 'Cave Bat',
    tier: 'minion',
    baseStats: {
      strength: 4, dexterity: 18, intelligence: 3, vitality: 4, luck: 12,
      attack: 6, defense: 2, magicAttack: 2, magicDefense: 5, speed: 25,
      critRate: 15, critDamage: 120,
    },
    behavior: 'aggressive',
    abilities: ['bite', 'screech'],
    lootTable: 'loot_bat',
    experienceValue: 8,
    goldValue: 2,
    scale: 0.5,
    color: '#3a3a3a',
    aggroRange: 15,
    attackRange: 1,
    moveSpeed: 10,
    attackSpeed: 2.0,
  },
  
  slime: {
    type: 'slime',
    name: 'Slime',
    tier: 'minion',
    baseStats: {
      strength: 5, dexterity: 3, intelligence: 1, vitality: 12, luck: 5,
      attack: 5, defense: 3, magicAttack: 5, magicDefense: 8, speed: 3,
      critRate: 2, critDamage: 110,
    },
    behavior: 'patrol',
    abilities: ['engulf', 'acid_splash'],
    lootTable: 'loot_slime',
    experienceValue: 10,
    goldValue: 2,
    scale: 0.6,
    color: '#44aa44',
    aggroRange: 8,
    attackRange: 2,
    moveSpeed: 2,
    attackSpeed: 0.8,
  },
  
  bandit: {
    type: 'bandit',
    name: 'Bandit',
    tier: 'normal',
    baseStats: {
      strength: 12, dexterity: 14, intelligence: 8, vitality: 10, luck: 12,
      attack: 15, defense: 10, magicAttack: 5, magicDefense: 8, speed: 12,
      critRate: 15, critDamage: 150,
    },
    behavior: 'ambush',
    abilities: ['basic_attack', 'backstab', 'smoke_bomb'],
    lootTable: 'loot_bandit',
    experienceValue: 30,
    goldValue: 25,
    scale: 1.0,
    color: '#4a3c2a',
    aggroRange: 15,
    attackRange: 2,
    moveSpeed: 6,
    attackSpeed: 1.2,
  },
  
  golem: {
    type: 'golem',
    name: 'Stone Golem',
    tier: 'elite',
    baseStats: {
      strength: 25, dexterity: 3, intelligence: 2, vitality: 30, luck: 3,
      attack: 25, defense: 30, magicAttack: 5, magicDefense: 20, speed: 2,
      critRate: 5, critDamage: 200,
    },
    behavior: 'defensive',
    abilities: ['slam', 'rock_throw', 'earthquake'],
    lootTable: 'loot_golem',
    experienceValue: 80,
    goldValue: 40,
    scale: 2.0,
    color: '#6a6a6a',
    aggroRange: 12,
    attackRange: 3,
    moveSpeed: 2,
    attackSpeed: 0.5,
  },
  
  dragon: {
    type: 'dragon',
    name: 'Young Dragon',
    tier: 'champion',
    baseStats: {
      strength: 30, dexterity: 15, intelligence: 20, vitality: 35, luck: 10,
      attack: 35, defense: 25, magicAttack: 30, magicDefense: 25, speed: 10,
      critRate: 12, critDamage: 180,
    },
    element: 'fire',
    behavior: 'aggressive',
    abilities: ['claw_attack', 'fire_breath', 'tail_swipe', 'fly'],
    lootTable: 'loot_dragon',
    experienceValue: 200,
    goldValue: 150,
    scale: 2.5,
    color: '#aa2222',
    aggroRange: 25,
    attackRange: 5,
    moveSpeed: 8,
    attackSpeed: 0.7,
  },
  
  demon: {
    type: 'demon',
    name: 'Lesser Demon',
    tier: 'elite',
    baseStats: {
      strength: 20, dexterity: 12, intelligence: 18, vitality: 20, luck: 8,
      attack: 22, defense: 15, magicAttack: 25, magicDefense: 20, speed: 10,
      critRate: 10, critDamage: 160,
    },
    element: 'dark',
    behavior: 'aggressive',
    abilities: ['claw_attack', 'dark_bolt', 'life_drain', 'teleport'],
    lootTable: 'loot_demon',
    experienceValue: 100,
    goldValue: 60,
    scale: 1.6,
    color: '#5a1a1a',
    aggroRange: 20,
    attackRange: 4,
    moveSpeed: 7,
    attackSpeed: 1.0,
  },
  
  undead_knight: {
    type: 'undead_knight',
    name: 'Undead Knight',
    tier: 'elite',
    baseStats: {
      strength: 22, dexterity: 8, intelligence: 5, vitality: 25, luck: 5,
      attack: 25, defense: 28, magicAttack: 8, magicDefense: 15, speed: 6,
      critRate: 8, critDamage: 150,
    },
    element: 'dark',
    behavior: 'aggressive',
    abilities: ['sword_slash', 'shield_bash', 'undying_will'],
    lootTable: 'loot_undead_elite',
    experienceValue: 90,
    goldValue: 50,
    scale: 1.3,
    color: '#2a2a4a',
    aggroRange: 15,
    attackRange: 3,
    moveSpeed: 4,
    attackSpeed: 0.9,
  },
  
  elemental_fire: {
    type: 'elemental_fire',
    name: 'Fire Elemental',
    tier: 'elite',
    baseStats: {
      strength: 15, dexterity: 12, intelligence: 22, vitality: 18, luck: 8,
      attack: 15, defense: 10, magicAttack: 28, magicDefense: 22, speed: 12,
      critRate: 10, critDamage: 160,
    },
    element: 'fire',
    behavior: 'aggressive',
    abilities: ['flame_touch', 'fireball', 'immolate', 'fire_nova'],
    lootTable: 'loot_elemental',
    experienceValue: 85,
    goldValue: 45,
    scale: 1.4,
    color: '#ff4400',
    aggroRange: 18,
    attackRange: 6,
    moveSpeed: 6,
    attackSpeed: 1.1,
  },
  
  elemental_ice: {
    type: 'elemental_ice',
    name: 'Frost Elemental',
    tier: 'elite',
    baseStats: {
      strength: 12, dexterity: 10, intelligence: 24, vitality: 20, luck: 8,
      attack: 12, defense: 15, magicAttack: 30, magicDefense: 25, speed: 8,
      critRate: 8, critDamage: 150,
    },
    element: 'ice',
    behavior: 'defensive',
    abilities: ['frost_touch', 'ice_spike', 'freeze', 'blizzard'],
    lootTable: 'loot_elemental',
    experienceValue: 85,
    goldValue: 45,
    scale: 1.4,
    color: '#44aaff',
    aggroRange: 15,
    attackRange: 6,
    moveSpeed: 5,
    attackSpeed: 0.9,
  },
  
  elemental_lightning: {
    type: 'elemental_lightning',
    name: 'Storm Elemental',
    tier: 'elite',
    baseStats: {
      strength: 14, dexterity: 18, intelligence: 20, vitality: 16, luck: 12,
      attack: 14, defense: 8, magicAttack: 26, magicDefense: 18, speed: 18,
      critRate: 15, critDamage: 170,
    },
    element: 'lightning',
    behavior: 'aggressive',
    abilities: ['shock', 'chain_lightning', 'thunder_strike', 'static_field'],
    lootTable: 'loot_elemental',
    experienceValue: 85,
    goldValue: 45,
    scale: 1.4,
    color: '#ffff44',
    aggroRange: 20,
    attackRange: 8,
    moveSpeed: 10,
    attackSpeed: 1.5,
  },
  
  troll: {
    type: 'troll',
    name: 'Cave Troll',
    tier: 'elite',
    baseStats: {
      strength: 28, dexterity: 5, intelligence: 3, vitality: 35, luck: 4,
      attack: 30, defense: 20, magicAttack: 3, magicDefense: 10, speed: 4,
      critRate: 8, critDamage: 180,
    },
    behavior: 'aggressive',
    abilities: ['club_smash', 'throw_rock', 'regenerate'],
    lootTable: 'loot_troll',
    experienceValue: 95,
    goldValue: 35,
    scale: 2.2,
    color: '#4a5a3a',
    aggroRange: 15,
    attackRange: 4,
    moveSpeed: 3,
    attackSpeed: 0.6,
  },
  
  ghost: {
    type: 'ghost',
    name: 'Vengeful Spirit',
    tier: 'normal',
    baseStats: {
      strength: 5, dexterity: 15, intelligence: 18, vitality: 12, luck: 15,
      attack: 8, defense: 5, magicAttack: 20, magicDefense: 20, speed: 12,
      critRate: 12, critDamage: 140,
    },
    element: 'dark',
    behavior: 'patrol',
    abilities: ['spectral_touch', 'wail', 'phase_shift', 'possess'],
    lootTable: 'loot_ghost',
    experienceValue: 40,
    goldValue: 20,
    scale: 1.0,
    color: '#aaccff',
    aggroRange: 12,
    attackRange: 3,
    moveSpeed: 6,
    attackSpeed: 1.0,
  },
  
  // BOSSES
  boss_goblin_king: {
    type: 'boss_goblin_king',
    name: 'Goblin King',
    tier: 'boss',
    baseStats: {
      strength: 25, dexterity: 18, intelligence: 15, vitality: 40, luck: 15,
      attack: 30, defense: 20, magicAttack: 15, magicDefense: 15, speed: 12,
      critRate: 15, critDamage: 160,
    },
    behavior: 'aggressive',
    abilities: ['royal_slash', 'summon_goblins', 'war_cry', 'enrage', 'treasure_throw'],
    lootTable: 'loot_boss_goblin',
    experienceValue: 500,
    goldValue: 200,
    scale: 1.6,
    color: '#6a9c33',
    aggroRange: 25,
    attackRange: 4,
    moveSpeed: 6,
    attackSpeed: 1.0,
  },
  
  boss_dragon: {
    type: 'boss_dragon',
    name: 'Ancient Dragon',
    tier: 'raid_boss',
    baseStats: {
      strength: 50, dexterity: 20, intelligence: 35, vitality: 80, luck: 15,
      attack: 55, defense: 45, magicAttack: 50, magicDefense: 40, speed: 12,
      critRate: 15, critDamage: 200,
    },
    element: 'fire',
    behavior: 'aggressive',
    abilities: ['claw_attack', 'fire_breath', 'tail_swipe', 'fly', 'meteor_strike', 'fear_roar', 'enrage'],
    lootTable: 'loot_boss_dragon',
    experienceValue: 2000,
    goldValue: 1000,
    scale: 4.0,
    color: '#cc1111',
    aggroRange: 40,
    attackRange: 8,
    moveSpeed: 10,
    attackSpeed: 0.8,
  },
  
  boss_lich: {
    type: 'boss_lich',
    name: 'Lich Lord',
    tier: 'raid_boss',
    baseStats: {
      strength: 15, dexterity: 15, intelligence: 60, vitality: 60, luck: 20,
      attack: 20, defense: 25, magicAttack: 65, magicDefense: 50, speed: 8,
      critRate: 20, critDamage: 180,
    },
    element: 'dark',
    behavior: 'ranged',
    abilities: ['death_bolt', 'summon_undead', 'soul_drain', 'frost_nova', 'phylactery_shield', 'dark_ritual'],
    lootTable: 'loot_boss_lich',
    experienceValue: 2500,
    goldValue: 1200,
    scale: 1.8,
    color: '#3a1a5a',
    aggroRange: 35,
    attackRange: 12,
    moveSpeed: 5,
    attackSpeed: 0.7,
  },
};

// ============================================================
// MULTIPLICADORES POR TIER
// ============================================================

const TIER_MULTIPLIERS: Record<EnemyTier, {
  health: number;
  damage: number;
  defense: number;
  experience: number;
  gold: number;
}> = {
  minion: { health: 0.6, damage: 0.7, defense: 0.6, experience: 0.5, gold: 0.5 },
  normal: { health: 1.0, damage: 1.0, defense: 1.0, experience: 1.0, gold: 1.0 },
  elite: { health: 1.8, damage: 1.4, defense: 1.5, experience: 2.0, gold: 2.0 },
  champion: { health: 3.0, damage: 1.8, defense: 2.0, experience: 4.0, gold: 4.0 },
  boss: { health: 5.0, damage: 2.0, defense: 2.5, experience: 10.0, gold: 10.0 },
  raid_boss: { health: 20.0, damage: 2.5, defense: 3.0, experience: 50.0, gold: 50.0 },
};

// ============================================================
// ENEMY FACTORY
// ============================================================

let enemyIdCounter = 0;

/**
 * Escala stats según nivel
 */
function scaleStatsByLevel(baseStats: CharacterStats, level: number): CharacterStats {
  const multiplier = 1 + (level - 1) * 0.12; // 12% por nivel
  
  return {
    strength: Math.floor(baseStats.strength * multiplier),
    dexterity: Math.floor(baseStats.dexterity * multiplier),
    intelligence: Math.floor(baseStats.intelligence * multiplier),
    vitality: Math.floor(baseStats.vitality * multiplier),
    luck: Math.floor(baseStats.luck * multiplier),
    attack: Math.floor(baseStats.attack * multiplier),
    defense: Math.floor(baseStats.defense * multiplier),
    magicAttack: Math.floor(baseStats.magicAttack * multiplier),
    magicDefense: Math.floor(baseStats.magicDefense * multiplier),
    speed: Math.floor(baseStats.speed * (1 + (level - 1) * 0.02)), // Speed escala menos
    critRate: baseStats.critRate,
    critDamage: baseStats.critDamage,
  };
}

/**
 * Calcula salud máxima
 */
function calculateMaxHealth(stats: CharacterStats, tier: EnemyTier, level: number): number {
  const baseHealth = stats.vitality * 10 + 50;
  const tierMultiplier = TIER_MULTIPLIERS[tier].health;
  const levelMultiplier = 1 + (level - 1) * 0.15;
  
  return Math.floor(baseHealth * tierMultiplier * levelMultiplier);
}

/**
 * Calcula maná máximo
 */
function calculateMaxMana(stats: CharacterStats): number {
  return stats.intelligence * 5 + 20;
}

/**
 * Crea un enemigo
 */
export function createEnemy(
  type: EnemyType,
  level: number,
  position: THREE.Vector3 = new THREE.Vector3(),
  options: {
    tierOverride?: EnemyTier;
    nameOverride?: string;
  } = {}
): SpawnedEnemy {
  const template = ENEMY_TEMPLATES[type];
  if (!template) {
    throw new Error(`Unknown enemy type: ${type}`);
  }
  
  const tier = options.tierOverride ?? template.tier;
  const tierMultiplier = TIER_MULTIPLIERS[tier];
  
  // Escalar stats
  const scaledStats = scaleStatsByLevel(template.baseStats, level);
  
  // Aplicar multiplicadores de tier
  scaledStats.attack = Math.floor(scaledStats.attack * tierMultiplier.damage);
  scaledStats.defense = Math.floor(scaledStats.defense * tierMultiplier.defense);
  scaledStats.magicAttack = Math.floor(scaledStats.magicAttack * tierMultiplier.damage);
  scaledStats.magicDefense = Math.floor(scaledStats.magicDefense * tierMultiplier.defense);
  
  const maxHealth = calculateMaxHealth(scaledStats, tier, level);
  const maxMana = calculateMaxMana(scaledStats);
  
  const config: EnemyConfig = {
    ...template,
    level,
    tier,
    name: options.nameOverride ?? `${template.name} Lv.${level}`,
    baseStats: scaledStats,
    experienceValue: Math.floor(template.experienceValue * tierMultiplier.experience * level),
    goldValue: Math.floor(template.goldValue * tierMultiplier.gold * level),
  };
  
  return {
    ...config,
    id: `enemy_${++enemyIdCounter}`,
    position: position.clone(),
    rotation: new THREE.Euler(0, Math.random() * Math.PI * 2, 0),
    currentHealth: maxHealth,
    maxHealth,
    currentMana: maxMana,
    maxMana,
    isAlive: true,
    targetId: null,
    state: 'idle',
    lastAttackTime: 0,
    spawnTime: Date.now(),
  };
}

/**
 * Crea un grupo de enemigos
 */
export function createEnemyGroup(
  type: EnemyType,
  count: number,
  centerPosition: THREE.Vector3,
  spreadRadius: number = 5,
  levelRange: [number, number] = [1, 1]
): SpawnedEnemy[] {
  const enemies: SpawnedEnemy[] = [];
  
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2;
    const distance = Math.random() * spreadRadius;
    const position = new THREE.Vector3(
      centerPosition.x + Math.cos(angle) * distance,
      centerPosition.y,
      centerPosition.z + Math.sin(angle) * distance
    );
    
    const level = Math.floor(
      levelRange[0] + Math.random() * (levelRange[1] - levelRange[0] + 1)
    );
    
    enemies.push(createEnemy(type, level, position));
  }
  
  return enemies;
}

/**
 * Crea un encuentro mixto
 */
export function createEncounter(
  encounterDef: Array<{ type: EnemyType; count: number; level: number }>,
  centerPosition: THREE.Vector3,
  spreadRadius: number = 10
): SpawnedEnemy[] {
  const enemies: SpawnedEnemy[] = [];
  let totalCount = 0;
  
  encounterDef.forEach(def => {
    totalCount += def.count;
  });
  
  let currentIndex = 0;
  encounterDef.forEach(def => {
    for (let i = 0; i < def.count; i++) {
      const angle = ((currentIndex + i) / totalCount) * Math.PI * 2;
      const distance = spreadRadius * 0.5 + Math.random() * spreadRadius * 0.5;
      const position = new THREE.Vector3(
        centerPosition.x + Math.cos(angle) * distance,
        centerPosition.y,
        centerPosition.z + Math.sin(angle) * distance
      );
      
      enemies.push(createEnemy(def.type, def.level, position));
      currentIndex++;
    }
  });
  
  return enemies;
}

/**
 * Obtiene todos los tipos de enemigos disponibles
 */
export function getAvailableEnemyTypes(): EnemyType[] {
  return Object.keys(ENEMY_TEMPLATES) as EnemyType[];
}

/**
 * Obtiene la configuración de un tipo de enemigo
 */
export function getEnemyTemplate(type: EnemyType): Omit<EnemyConfig, 'level'> | null {
  return ENEMY_TEMPLATES[type] ?? null;
}
