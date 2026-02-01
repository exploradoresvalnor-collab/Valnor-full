/**
 * RPG Calculator - Cálculos de daño, defensa, críticos y fórmulas RPG
 */

import type { CharacterStats, CharacterClass } from '../../types';

// ============================================================
// TIPOS Y CONSTANTES
// ============================================================

export type DamageType = 'physical' | 'magical' | 'true' | 'fire' | 'ice' | 'lightning' | 'poison' | 'holy' | 'dark' | 'arcane' | 'light';
export type AttackType = 'melee' | 'ranged' | 'spell' | 'ability';

export interface DamageResult {
  baseDamage: number;
  finalDamage: number;
  isCritical: boolean;
  critMultiplier: number;
  elementalBonus: number;
  damageType: DamageType;
  mitigated: number;
  overkill: number;
}

export interface HealResult {
  baseHeal: number;
  finalHeal: number;
  isCritical: boolean;
  overheal: number;
}

// Multiplicadores elementales (atacante vs defensor)
const ELEMENTAL_EFFECTIVENESS: Record<DamageType, Record<DamageType, number>> = {
  fire: { fire: 0.5, ice: 2.0, lightning: 1.0, poison: 1.0, holy: 1.0, dark: 1.0, physical: 1.0, magical: 1.0, true: 1.0, arcane: 1.0, light: 1.0 },
  ice: { fire: 2.0, ice: 0.5, lightning: 0.5, poison: 1.0, holy: 1.0, dark: 1.0, physical: 1.0, magical: 1.0, true: 1.0, arcane: 1.0, light: 1.0 },
  lightning: { fire: 1.0, ice: 2.0, lightning: 0.5, poison: 1.0, holy: 1.5, dark: 0.5, physical: 1.0, magical: 1.0, true: 1.0, arcane: 1.0, light: 0.5 },
  poison: { fire: 0.5, ice: 1.0, lightning: 1.0, poison: 0, holy: 0.5, dark: 1.5, physical: 1.0, magical: 1.0, true: 1.0, arcane: 1.0, light: 2.0 },
  holy: { fire: 1.0, ice: 1.0, lightning: 0.5, poison: 1.5, holy: 0.5, dark: 2.0, physical: 1.0, magical: 1.0, true: 1.0, arcane: 0.5, light: 0.5 },
  dark: { fire: 1.0, ice: 1.0, lightning: 1.5, poison: 0.5, holy: 2.0, dark: 0.5, physical: 1.0, magical: 1.0, true: 1.0, arcane: 1.5, light: 2.0 },
  physical: { fire: 1.0, ice: 1.0, lightning: 1.0, poison: 1.0, holy: 1.0, dark: 1.0, physical: 1.0, magical: 1.0, true: 1.0, arcane: 1.0, light: 1.0 },
  magical: { fire: 1.0, ice: 1.0, lightning: 1.0, poison: 1.0, holy: 1.0, dark: 1.0, physical: 1.0, magical: 1.0, true: 1.0, arcane: 1.0, light: 1.0 },
  true: { fire: 1.0, ice: 1.0, lightning: 1.0, poison: 1.0, holy: 1.0, dark: 1.0, physical: 1.0, magical: 1.0, true: 1.0, arcane: 1.0, light: 1.0 },
  arcane: { fire: 1.0, ice: 1.0, lightning: 1.0, poison: 1.0, holy: 0.5, dark: 1.5, physical: 1.0, magical: 1.5, true: 1.0, arcane: 0.5, light: 1.0 },
  light: { fire: 1.0, ice: 1.0, lightning: 0.5, poison: 2.0, holy: 0.5, dark: 2.0, physical: 1.0, magical: 1.0, true: 1.0, arcane: 1.0, light: 0.5 },
};

// Modificadores de clase
const CLASS_MODIFIERS: Record<CharacterClass, {
  attackMultiplier: number;
  defenseMultiplier: number;
  magicMultiplier: number;
  critRateBonus: number;
}> = {
  warrior: { attackMultiplier: 1.2, defenseMultiplier: 1.3, magicMultiplier: 0.6, critRateBonus: 5 },
  mage: { attackMultiplier: 0.6, defenseMultiplier: 0.8, magicMultiplier: 1.5, critRateBonus: 10 },
  archer: { attackMultiplier: 1.1, defenseMultiplier: 0.9, magicMultiplier: 0.8, critRateBonus: 20 },
  rogue: { attackMultiplier: 1.0, defenseMultiplier: 0.7, magicMultiplier: 0.7, critRateBonus: 25 },
  healer: { attackMultiplier: 0.5, defenseMultiplier: 1.0, magicMultiplier: 1.3, critRateBonus: 15 },
  paladin: { attackMultiplier: 1.0, defenseMultiplier: 1.2, magicMultiplier: 1.0, critRateBonus: 5 },
  necromancer: { attackMultiplier: 0.7, defenseMultiplier: 0.9, magicMultiplier: 1.4, critRateBonus: 8 },
  berserker: { attackMultiplier: 1.5, defenseMultiplier: 0.6, magicMultiplier: 0.4, critRateBonus: 15 },
  monk: { attackMultiplier: 1.1, defenseMultiplier: 1.1, magicMultiplier: 0.9, critRateBonus: 12 },
};

// ============================================================
// CALCULADORA DE DAÑO
// ============================================================

/**
 * Calcula el daño base según tipo de ataque
 */
export function calculateBaseDamage(
  attackerStats: CharacterStats,
  attackType: AttackType,
  skillMultiplier: number = 1.0
): number {
  let baseDamage = 0;
  
  switch (attackType) {
    case 'melee':
      baseDamage = attackerStats.attack * 1.0 + attackerStats.strength * 0.5;
      break;
    case 'ranged':
      baseDamage = attackerStats.attack * 0.9 + attackerStats.dexterity * 0.6;
      break;
    case 'spell':
      baseDamage = attackerStats.magicAttack * 1.0 + attackerStats.intelligence * 0.7;
      break;
    case 'ability':
      baseDamage = (attackerStats.attack + attackerStats.magicAttack) * 0.5;
      break;
  }
  
  return Math.floor(baseDamage * skillMultiplier);
}

/**
 * Calcula la reducción de daño
 */
export function calculateMitigation(
  defenderStats: CharacterStats,
  damageType: DamageType,
  rawDamage: number
): number {
  // True damage ignora defensa
  if (damageType === 'true') return 0;
  
  const isPhysical = damageType === 'physical';
  const defense = isPhysical ? defenderStats.defense : defenderStats.magicDefense;
  
  // Fórmula: mitigation = defense / (defense + 100)
  // Esto da una curva suave que nunca llega al 100%
  const mitigationPercent = defense / (defense + 100);
  
  return Math.floor(rawDamage * mitigationPercent);
}

/**
 * Calcula si el ataque es crítico
 */
export function calculateCritical(
  attackerStats: CharacterStats,
  _defenderStats: CharacterStats,
  characterClass?: CharacterClass
): { isCritical: boolean; multiplier: number } {
  const baseCritRate = attackerStats.critRate ?? 5;
  const classBonus = characterClass ? CLASS_MODIFIERS[characterClass].critRateBonus : 0;
  const critRate = Math.min(100, baseCritRate + classBonus);
  
  const isCritical = Math.random() * 100 < critRate;
  
  // Multiplicador de crítico (base 150%, modificado por luck)
  const critDamage = attackerStats.critDamage ?? 150;
  const multiplier = isCritical ? critDamage / 100 : 1;
  
  return { isCritical, multiplier };
}

/**
 * Calcula efectividad elemental
 */
export function calculateElementalEffectiveness(
  attackElement: DamageType,
  defenderElement?: DamageType
): number {
  if (!defenderElement) return 1.0;
  return ELEMENTAL_EFFECTIVENESS[attackElement]?.[defenderElement] ?? 1.0;
}

/**
 * Calcula daño final
 */
export function calculateDamage(
  attackerStats: CharacterStats,
  defenderStats: CharacterStats,
  options: {
    attackType?: AttackType;
    damageType?: DamageType;
    skillMultiplier?: number;
    defenderElement?: DamageType;
    defenderCurrentHealth?: number;
    attackerClass?: CharacterClass;
  } = {}
): DamageResult {
  const {
    attackType = 'melee',
    damageType = 'physical',
    skillMultiplier = 1.0,
    defenderElement,
    defenderCurrentHealth = Infinity,
    attackerClass,
  } = options;
  
  // 1. Daño base
  const baseDamage = calculateBaseDamage(attackerStats, attackType, skillMultiplier);
  
  // 2. Efectividad elemental
  const elementalBonus = calculateElementalEffectiveness(damageType, defenderElement);
  let damageAfterElement = Math.floor(baseDamage * elementalBonus);
  
  // 3. Crítico
  const { isCritical, multiplier: critMultiplier } = calculateCritical(
    attackerStats,
    defenderStats,
    attackerClass
  );
  let damageAfterCrit = Math.floor(damageAfterElement * critMultiplier);
  
  // 4. Mitigación
  const mitigated = calculateMitigation(defenderStats, damageType, damageAfterCrit);
  let finalDamage = Math.max(1, damageAfterCrit - mitigated); // Mínimo 1 de daño
  
  // 5. Overkill
  const overkill = Math.max(0, finalDamage - defenderCurrentHealth);
  
  return {
    baseDamage,
    finalDamage,
    isCritical,
    critMultiplier,
    elementalBonus,
    damageType,
    mitigated,
    overkill,
  };
}

// ============================================================
// CALCULADORA DE CURACIÓN
// ============================================================

/**
 * Calcula curación base
 */
export function calculateBaseHeal(
  healerStats: CharacterStats,
  skillMultiplier: number = 1.0
): number {
  const baseHeal = healerStats.magicAttack * 0.8 + healerStats.intelligence * 0.5;
  return Math.floor(baseHeal * skillMultiplier);
}

/**
 * Calcula curación final
 */
export function calculateHeal(
  healerStats: CharacterStats,
  targetCurrentHealth: number,
  targetMaxHealth: number,
  skillMultiplier: number = 1.0
): HealResult {
  const baseHeal = calculateBaseHeal(healerStats, skillMultiplier);
  
  // Críticos de curación (mitad de probabilidad, mitad de bonus)
  const critRate = (healerStats.critRate ?? 5) / 2;
  const isCritical = Math.random() * 100 < critRate;
  const critMultiplier = isCritical ? 1.25 : 1;
  
  const finalHeal = Math.floor(baseHeal * critMultiplier);
  
  // Calcular overheal
  const actualHeal = Math.min(finalHeal, targetMaxHealth - targetCurrentHealth);
  const overheal = finalHeal - actualHeal;
  
  return {
    baseHeal,
    finalHeal: actualHeal,
    isCritical,
    overheal,
  };
}

// ============================================================
// UTILIDADES RPG
// ============================================================

/**
 * Calcula velocidad de ataque efectiva
 */
export function calculateAttackSpeed(stats: CharacterStats): number {
  const baseSpeed = 1.0; // 1 ataque por segundo
  const speedBonus = (stats.speed ?? 10) / 100;
  return baseSpeed + speedBonus;
}

/**
 * Calcula probabilidad de evasión
 */
export function calculateDodgeChance(
  defenderStats: CharacterStats,
  attackerStats: CharacterStats
): number {
  const baseDodge = (defenderStats.dexterity ?? 10) * 0.2;
  const accuracyPenalty = (attackerStats.dexterity ?? 10) * 0.1;
  return Math.min(50, Math.max(0, baseDodge - accuracyPenalty)); // 0-50%
}

/**
 * Calcula probabilidad de bloqueo (para guerreros/paladines)
 */
export function calculateBlockChance(
  defenderStats: CharacterStats,
  hasShield: boolean
): number {
  if (!hasShield) return 0;
  const baseBlock = 10 + (defenderStats.vitality ?? 10) * 0.3;
  return Math.min(40, baseBlock); // 0-40%
}

/**
 * Calcula DPS teórico
 */
export function calculateTheoreticalDPS(
  stats: CharacterStats,
  attackType: AttackType = 'melee'
): number {
  const baseDamage = calculateBaseDamage(stats, attackType);
  const attackSpeed = calculateAttackSpeed(stats);
  const critRate = (stats.critRate ?? 5) / 100;
  const critDamage = (stats.critDamage ?? 150) / 100;
  
  // DPS = Base * Speed * (1 + CritRate * (CritDamage - 1))
  const dps = baseDamage * attackSpeed * (1 + critRate * (critDamage - 1));
  
  return Math.floor(dps);
}

/**
 * Genera un número aleatorio con distribución normal
 * (para variación de daño más realista)
 */
export function gaussianRandom(mean: number, stdDev: number): number {
  const u1 = Math.random();
  const u2 = Math.random();
  const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
  return z0 * stdDev + mean;
}

/**
 * Aplica variación aleatoria al daño
 */
export function applyDamageVariation(
  damage: number,
  variationPercent: number = 10
): number {
  const variation = damage * (variationPercent / 100);
  const finalDamage = gaussianRandom(damage, variation);
  return Math.max(1, Math.floor(finalDamage));
}
