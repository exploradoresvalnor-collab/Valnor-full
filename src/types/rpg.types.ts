/**
 * RPG Types - Tipos del sistema RPG
 */

import type { CharacterStats, CharacterClass } from './character.types';

// ============================================
// ELEMENTOS Y ESTADOS
// ============================================

export type Element = 'fire' | 'ice' | 'lightning' | 'earth' | 'wind' | 'water' | 'light' | 'dark' | 'none';

export type StatusEffect = 
  | 'poison'      // Daño por tiempo
  | 'burn'        // Daño de fuego por tiempo
  | 'freeze'      // No puede moverse
  | 'stun'        // No puede actuar
  | 'bleed'       // Daño físico por tiempo
  | 'slow'        // Velocidad reducida
  | 'blind'       // Precisión reducida
  | 'silence'     // No puede usar habilidades mágicas
  | 'weakness'    // Daño reducido
  | 'armor_break' // Defensa reducida
  | 'regen'       // Curación por tiempo
  | 'shield'      // Absorbe daño
  | 'haste'       // Velocidad aumentada
  | 'strength_up' // Ataque aumentado
  | 'defense_up'; // Defensa aumentada

// ============================================
// HABILIDADES
// ============================================

export type SkillType = 'active' | 'passive' | 'ultimate';
export type SkillTarget = 'self' | 'single_enemy' | 'all_enemies' | 'single_ally' | 'all_allies' | 'area';

export interface Skill {
  id: string;
  name: string;
  description: string;
  type: SkillType;
  
  // Requisitos
  requiredLevel: number;
  requiredClass?: CharacterClass;
  
  // Costos
  manaCost: number;
  staminaCost: number;
  cooldown: number; // En segundos
  
  // Efectos
  damage?: number;           // Daño base
  damageScaling?: DamageScaling;
  healing?: number;          // Curación base
  healingScaling?: HealingScaling;
  statusEffects?: SkillStatusEffect[];
  
  // Targeting
  target: SkillTarget;
  range: number;
  areaRadius?: number;
  
  // Elemento
  element: Element;
  
  // Visual
  icon: string;
  animation: string;
  vfx: string;
}

export interface DamageScaling {
  stat: keyof CharacterStats;
  ratio: number; // 0.5 = 50% del stat
}

export interface HealingScaling {
  stat: keyof CharacterStats;
  ratio: number;
}

export interface SkillStatusEffect {
  effect: StatusEffect;
  chance: number;     // 0-100
  duration: number;   // En segundos
  value?: number;     // Intensidad del efecto
}

// ============================================
// CÁLCULOS DE COMBATE
// ============================================

export interface DamageCalculation {
  baseDamage: number;
  attackerStats: CharacterStats;
  defenderStats: CharacterStats;
  skill?: Skill;
  isCritical: boolean;
  element: Element;
  modifiers: DamageModifier[];
}

export interface DamageModifier {
  type: 'flat' | 'percent';
  value: number;
  source: string;
}

export interface DamageResult {
  finalDamage: number;
  rawDamage: number;
  mitigated: number;
  isCritical: boolean;
  isBlocked: boolean;
  element: Element;
  breakdown: {
    base: number;
    scaling: number;
    critical: number;
    elemental: number;
    defense: number;
    modifiers: number;
  };
}

// ============================================
// SISTEMA DE EXPERIENCIA Y NIVELES
// ============================================

export interface LevelingConfig {
  maxLevel: number;
  baseExpRequired: number;
  expGrowthRate: number;
  
  // Stats por nivel
  statGrowth: {
    [key in keyof CharacterStats]?: number;
  };
}

export interface LevelUpResult {
  newLevel: number;
  statsGained: Partial<CharacterStats>;
  skillsUnlocked: string[];
  remainingExp: number;
}

// ============================================
// SISTEMA DE LOOT
// ============================================

export interface LootTable {
  id: string;
  name: string;
  entries: LootEntry[];
}

export interface LootEntry {
  itemId: string;
  weight: number;        // Peso relativo
  minQuantity: number;
  maxQuantity: number;
  conditions?: LootCondition[];
}

export interface LootCondition {
  type: 'player_level' | 'enemy_type' | 'difficulty' | 'luck' | 'first_kill';
  operator: '>' | '<' | '=' | '>=' | '<=';
  value: number | string;
}

export interface LootDrop {
  itemId: string;
  quantity: number;
  position?: { x: number; y: number; z: number };
}

// ============================================
// ENEMIGOS
// ============================================

export interface EnemyDefinition {
  id: string;
  name: string;
  type: 'normal' | 'elite' | 'boss' | 'miniboss';
  
  // Base stats
  baseLevel: number;
  baseStats: CharacterStats;
  
  // Escalado
  levelScaling: {
    health: number;
    damage: number;
    defense: number;
  };
  
  // Habilidades
  skills: string[];
  
  // IA
  aiPattern: 'aggressive' | 'defensive' | 'balanced' | 'support';
  
  // Loot
  lootTableId: string;
  baseExp: number;
  baseGold: number;
  
  // Visual
  modelPath: string;
  scale: number;
}

export interface SpawnedEnemy {
  instanceId: string;
  definitionId: string;
  definition: EnemyDefinition;
  
  // Stats calculados para este nivel
  level: number;
  currentHealth: number;
  maxHealth: number;
  stats: CharacterStats;
  
  // Estado
  statusEffects: ActiveStatusEffect[];
  position: { x: number; y: number; z: number };
  rotation: { x: number; y: number; z: number };
  
  // Combate
  targetId: string | null;
  lastAttackTime: number;
  skillCooldowns: Map<string, number>;
}

export interface ActiveStatusEffect {
  effect: StatusEffect;
  duration: number;
  remainingTime: number;
  value: number;
  sourceId: string;
}

// ============================================
// FÓRMULAS RPG (constantes)
// ============================================

export const RPG_FORMULAS = {
  // Daño físico: ATK * (100 / (100 + DEF))
  physicalDamageReduction: (defense: number) => 100 / (100 + defense),
  
  // Daño mágico: MATK * (100 / (100 + MDEF))
  magicalDamageReduction: (magicDefense: number) => 100 / (100 + magicDefense),
  
  // Probabilidad de crítico
  criticalChance: (critRate: number, luck: number) => Math.min(critRate + luck * 0.1, 100),
  
  // Daño crítico
  criticalMultiplier: (critDamage: number) => critDamage / 100,
  
  // XP requerida para nivel
  expRequired: (level: number, base: number = 100, growth: number = 1.15) => 
    Math.floor(base * Math.pow(growth, level - 1)),
  
  // Multiplicador elemental
  elementalMultiplier: (attackElement: Element, defenseElement: Element): number => {
    const weaknesses: Record<Element, Element> = {
      fire: 'ice',
      ice: 'fire',
      lightning: 'earth',
      earth: 'wind',
      wind: 'lightning',
      water: 'fire',
      light: 'dark',
      dark: 'light',
      none: 'none',
    };
    
    if (weaknesses[attackElement] === defenseElement) return 1.5;
    if (weaknesses[defenseElement] === attackElement) return 0.75;
    return 1.0;
  },
};
