/**
 * Leveling System - Sistema de experiencia y progresión de nivel
 */

import type { CharacterClass, CharacterStats } from '../../types';

// ============================================================
// CONSTANTES
// ============================================================

export const MAX_LEVEL = 100;
export const BASE_XP_REQUIREMENT = 100;
export const XP_GROWTH_RATE = 1.15; // 15% más XP por nivel

// ============================================================
// INTERFACES
// ============================================================

export interface LevelUpResult {
  newLevel: number;
  statGains: Partial<CharacterStats>;
  skillPointsGained: number;
  attributePointsGained: number;
  unlockedAbilities: string[];
}

export interface ExperienceGain {
  baseXP: number;
  levelDifferenceBonus: number;
  streakBonus: number;
  firstKillBonus: number;
  totalXP: number;
}

export interface CharacterProgression {
  level: number;
  currentXP: number;
  totalXP: number;
  xpToNextLevel: number;
  skillPoints: number;
  attributePoints: number;
  unlockedAbilities: string[];
}

// ============================================================
// TABLAS DE PROGRESIÓN POR CLASE
// ============================================================

interface ClassGrowth {
  strength: number;
  dexterity: number;
  intelligence: number;
  vitality: number;
  luck: number;
  attack: number;
  defense: number;
  magicAttack: number;
  magicDefense: number;
  speed: number;
}

const CLASS_GROWTH_RATES: Record<CharacterClass, ClassGrowth> = {
  warrior: {
    strength: 4, dexterity: 2, intelligence: 1, vitality: 4, luck: 1,
    attack: 3, defense: 3, magicAttack: 0, magicDefense: 1, speed: 1,
  },
  mage: {
    strength: 1, dexterity: 2, intelligence: 5, vitality: 2, luck: 2,
    attack: 1, defense: 1, magicAttack: 4, magicDefense: 3, speed: 1,
  },
  rogue: {
    strength: 2, dexterity: 5, intelligence: 2, vitality: 2, luck: 3,
    attack: 3, defense: 1, magicAttack: 1, magicDefense: 1, speed: 3,
  },
  archer: {
    strength: 2, dexterity: 4, intelligence: 2, vitality: 2, luck: 2,
    attack: 3, defense: 1, magicAttack: 1, magicDefense: 1, speed: 2,
  },
  paladin: {
    strength: 3, dexterity: 1, intelligence: 2, vitality: 4, luck: 1,
    attack: 2, defense: 4, magicAttack: 2, magicDefense: 3, speed: 0,
  },
  necromancer: {
    strength: 1, dexterity: 1, intelligence: 5, vitality: 3, luck: 2,
    attack: 1, defense: 1, magicAttack: 4, magicDefense: 3, speed: 1,
  },
  berserker: {
    strength: 5, dexterity: 3, intelligence: 0, vitality: 3, luck: 1,
    attack: 4, defense: 1, magicAttack: 0, magicDefense: 0, speed: 2,
  },
  monk: {
    strength: 3, dexterity: 4, intelligence: 2, vitality: 3, luck: 2,
    attack: 2, defense: 2, magicAttack: 2, magicDefense: 2, speed: 3,
  },
  healer: {
    strength: 1, dexterity: 2, intelligence: 4, vitality: 3, luck: 2,
    attack: 0, defense: 2, magicAttack: 3, magicDefense: 4, speed: 1,
  },
};

// ============================================================
// HABILIDADES DESBLOQUEABLES
// ============================================================

interface AbilityUnlock {
  level: number;
  ability: string;
}

const CLASS_ABILITY_UNLOCKS: Record<CharacterClass, AbilityUnlock[]> = {
  warrior: [
    { level: 1, ability: 'slash' },
    { level: 5, ability: 'shield_bash' },
    { level: 10, ability: 'war_cry' },
    { level: 15, ability: 'charge' },
    { level: 20, ability: 'whirlwind' },
    { level: 30, ability: 'execute' },
    { level: 40, ability: 'blade_storm' },
    { level: 50, ability: 'avatar_of_war' },
  ],
  mage: [
    { level: 1, ability: 'magic_missile' },
    { level: 5, ability: 'fireball' },
    { level: 10, ability: 'frost_nova' },
    { level: 15, ability: 'lightning_bolt' },
    { level: 20, ability: 'teleport' },
    { level: 30, ability: 'meteor' },
    { level: 40, ability: 'arcane_barrier' },
    { level: 50, ability: 'time_warp' },
  ],
  rogue: [
    { level: 1, ability: 'backstab' },
    { level: 5, ability: 'poison_blade' },
    { level: 10, ability: 'smoke_bomb' },
    { level: 15, ability: 'shadow_step' },
    { level: 20, ability: 'assassinate' },
    { level: 30, ability: 'fan_of_knives' },
    { level: 40, ability: 'vanish' },
    { level: 50, ability: 'death_mark' },
  ],
  archer: [
    { level: 1, ability: 'aimed_shot' },
    { level: 5, ability: 'rapid_fire' },
    { level: 10, ability: 'trap' },
    { level: 15, ability: 'poison_arrow' },
    { level: 20, ability: 'multishot' },
    { level: 30, ability: 'explosive_arrow' },
    { level: 40, ability: 'eagle_eye' },
    { level: 50, ability: 'rain_of_arrows' },
  ],
  paladin: [
    { level: 1, ability: 'holy_strike' },
    { level: 5, ability: 'heal' },
    { level: 10, ability: 'blessing' },
    { level: 15, ability: 'consecrate' },
    { level: 20, ability: 'divine_shield' },
    { level: 30, ability: 'holy_wrath' },
    { level: 40, ability: 'lay_on_hands' },
    { level: 50, ability: 'avatar_of_light' },
  ],
  necromancer: [
    { level: 1, ability: 'shadow_bolt' },
    { level: 5, ability: 'raise_skeleton' },
    { level: 10, ability: 'life_drain' },
    { level: 15, ability: 'curse' },
    { level: 20, ability: 'bone_armor' },
    { level: 30, ability: 'summon_wraith' },
    { level: 40, ability: 'army_of_dead' },
    { level: 50, ability: 'death_pact' },
  ],
  berserker: [
    { level: 1, ability: 'savage_strike' },
    { level: 5, ability: 'battle_rage' },
    { level: 10, ability: 'bloodlust' },
    { level: 15, ability: 'ground_slam' },
    { level: 20, ability: 'rampage' },
    { level: 30, ability: 'undying_rage' },
    { level: 40, ability: 'earthquake' },
    { level: 50, ability: 'titan_form' },
  ],
  monk: [
    { level: 1, ability: 'palm_strike' },
    { level: 5, ability: 'meditate' },
    { level: 10, ability: 'chi_burst' },
    { level: 15, ability: 'flying_kick' },
    { level: 20, ability: 'inner_peace' },
    { level: 30, ability: 'hundred_fists' },
    { level: 40, ability: 'spirit_form' },
    { level: 50, ability: 'enlightenment' },
  ],
  healer: [
    { level: 1, ability: 'heal' },
    { level: 5, ability: 'regeneration' },
    { level: 10, ability: 'purify' },
    { level: 15, ability: 'shield_of_faith' },
    { level: 20, ability: 'mass_heal' },
    { level: 30, ability: 'resurrection' },
    { level: 40, ability: 'divine_intervention' },
    { level: 50, ability: 'sanctuary' },
  ],
};

// ============================================================
// FUNCIONES DE CÁLCULO
// ============================================================

/**
 * Calcula XP requerido para un nivel específico
 */
export function getXPForLevel(level: number): number {
  if (level <= 1) return 0;
  if (level > MAX_LEVEL) return Infinity;
  
  // Fórmula exponencial: baseXP * growthRate^(level-1)
  return Math.floor(BASE_XP_REQUIREMENT * Math.pow(XP_GROWTH_RATE, level - 1));
}

/**
 * Calcula XP total acumulado para alcanzar un nivel
 */
export function getTotalXPForLevel(level: number): number {
  let total = 0;
  for (let i = 1; i < level; i++) {
    total += getXPForLevel(i);
  }
  return total;
}

/**
 * Calcula el nivel basado en XP total
 */
export function getLevelFromXP(totalXP: number): number {
  let level = 1;
  let xpRequired = 0;
  
  while (level < MAX_LEVEL) {
    xpRequired += getXPForLevel(level);
    if (xpRequired > totalXP) break;
    level++;
  }
  
  return level;
}

/**
 * Calcula ganancia de XP por matar enemigo
 */
export function calculateExperienceGain(
  enemyLevel: number,
  enemyBaseXP: number,
  playerLevel: number,
  options: {
    killStreak?: number;
    isFirstKill?: boolean;
    xpMultiplier?: number;
  } = {}
): ExperienceGain {
  const { killStreak = 0, isFirstKill = false, xpMultiplier = 1.0 } = options;
  
  // Diferencia de nivel
  const levelDiff = enemyLevel - playerLevel;
  let levelDifferenceBonus = 0;
  
  if (levelDiff > 0) {
    // Bonus por matar enemigo de mayor nivel (hasta +50%)
    levelDifferenceBonus = Math.min(levelDiff * 0.1, 0.5);
  } else if (levelDiff < -5) {
    // Penalización por enemigo de bajo nivel
    levelDifferenceBonus = Math.max(levelDiff * 0.1, -0.8);
  }
  
  // Bonus por racha de kills (hasta +30%)
  const streakBonus = Math.min(killStreak * 0.02, 0.3);
  
  // Bonus primera muerte de ese tipo (50%)
  const firstKillBonus = isFirstKill ? 0.5 : 0;
  
  const baseXP = enemyBaseXP;
  const totalXP = Math.floor(
    baseXP * (1 + levelDifferenceBonus + streakBonus + firstKillBonus) * xpMultiplier
  );
  
  return {
    baseXP,
    levelDifferenceBonus: Math.floor(baseXP * levelDifferenceBonus),
    streakBonus: Math.floor(baseXP * streakBonus),
    firstKillBonus: Math.floor(baseXP * firstKillBonus),
    totalXP: Math.max(1, totalXP), // Mínimo 1 XP
  };
}

/**
 * Calcula stats ganados al subir de nivel
 */
export function calculateStatGains(characterClass: CharacterClass, newLevel: number): Partial<CharacterStats> {
  const growth = CLASS_GROWTH_RATES[characterClass];
  
  // Algunos niveles dan bonificaciones extra
  const isMilestone = newLevel % 10 === 0;
  const multiplier = isMilestone ? 1.5 : 1.0;
  
  return {
    strength: Math.floor(growth.strength * multiplier),
    dexterity: Math.floor(growth.dexterity * multiplier),
    intelligence: Math.floor(growth.intelligence * multiplier),
    vitality: Math.floor(growth.vitality * multiplier),
    luck: Math.floor(growth.luck * multiplier),
    attack: Math.floor(growth.attack * multiplier),
    defense: Math.floor(growth.defense * multiplier),
    magicAttack: Math.floor(growth.magicAttack * multiplier),
    magicDefense: Math.floor(growth.magicDefense * multiplier),
    speed: Math.floor(growth.speed * multiplier),
  };
}

/**
 * Obtiene habilidades desbloqueadas al subir de nivel
 */
export function getUnlockedAbilities(characterClass: CharacterClass, newLevel: number): string[] {
  const unlocks = CLASS_ABILITY_UNLOCKS[characterClass] || [];
  return unlocks.filter(u => u.level === newLevel).map(u => u.ability);
}

/**
 * Obtiene todas las habilidades disponibles hasta un nivel
 */
export function getAllUnlockedAbilities(characterClass: CharacterClass, level: number): string[] {
  const unlocks = CLASS_ABILITY_UNLOCKS[characterClass] || [];
  return unlocks.filter(u => u.level <= level).map(u => u.ability);
}

/**
 * Procesa subida de nivel
 */
export function processLevelUp(
  currentLevel: number,
  characterClass: CharacterClass
): LevelUpResult {
  const newLevel = currentLevel + 1;
  
  if (newLevel > MAX_LEVEL) {
    throw new Error(`Cannot exceed max level: ${MAX_LEVEL}`);
  }
  
  const statGains = calculateStatGains(characterClass, newLevel);
  const unlockedAbilities = getUnlockedAbilities(characterClass, newLevel);
  
  // Puntos de habilidad (1 cada 5 niveles)
  const skillPointsGained = newLevel % 5 === 0 ? 1 : 0;
  
  // Puntos de atributo (3 por nivel, 5 en hitos)
  const attributePointsGained = newLevel % 10 === 0 ? 5 : 3;
  
  return {
    newLevel,
    statGains,
    skillPointsGained,
    attributePointsGained,
    unlockedAbilities,
  };
}

/**
 * Añade XP y procesa subidas de nivel múltiples si es necesario
 */
export function addExperience(
  progression: CharacterProgression,
  characterClass: CharacterClass,
  xpGained: number
): {
  newProgression: CharacterProgression;
  levelUps: LevelUpResult[];
} {
  const levelUps: LevelUpResult[] = [];
  let currentLevel = progression.level;
  let currentXP = progression.currentXP + xpGained;
  let totalXP = progression.totalXP + xpGained;
  let skillPoints = progression.skillPoints;
  let attributePoints = progression.attributePoints;
  let unlockedAbilities = [...progression.unlockedAbilities];
  
  // Procesar múltiples level ups
  while (currentLevel < MAX_LEVEL) {
    const xpNeeded = getXPForLevel(currentLevel);
    
    if (currentXP >= xpNeeded) {
      currentXP -= xpNeeded;
      const levelUp = processLevelUp(currentLevel, characterClass);
      levelUps.push(levelUp);
      
      currentLevel = levelUp.newLevel;
      skillPoints += levelUp.skillPointsGained;
      attributePoints += levelUp.attributePointsGained;
      unlockedAbilities.push(...levelUp.unlockedAbilities);
    } else {
      break;
    }
  }
  
  // Si llegó a nivel máximo, XP se queda en 0
  if (currentLevel >= MAX_LEVEL) {
    currentXP = 0;
  }
  
  const newProgression: CharacterProgression = {
    level: currentLevel,
    currentXP,
    totalXP,
    xpToNextLevel: currentLevel < MAX_LEVEL ? getXPForLevel(currentLevel) : 0,
    skillPoints,
    attributePoints,
    unlockedAbilities,
  };
  
  return { newProgression, levelUps };
}

/**
 * Crea progresión inicial
 */
export function createInitialProgression(characterClass: CharacterClass): CharacterProgression {
  return {
    level: 1,
    currentXP: 0,
    totalXP: 0,
    xpToNextLevel: getXPForLevel(1),
    skillPoints: 0,
    attributePoints: 5, // Puntos iniciales para distribuir
    unlockedAbilities: getAllUnlockedAbilities(characterClass, 1),
  };
}

/**
 * Calcula porcentaje de progreso al siguiente nivel
 */
export function getLevelProgress(progression: CharacterProgression): number {
  if (progression.level >= MAX_LEVEL) return 100;
  return Math.floor((progression.currentXP / progression.xpToNextLevel) * 100);
}
