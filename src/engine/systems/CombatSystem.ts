/**
 * Combat System - Sistema de combate RPG
 * Maneja ataques, habilidades, daño y efectos
 */

import { useRef, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { usePlayerStore } from '../../stores/playerStore';

// Tipos de ataque
export type AttackType = 'melee' | 'ranged' | 'magic' | 'skill';

// Elementos
export type Element = 
  | 'physical'
  | 'fire'
  | 'ice'
  | 'lightning'
  | 'earth'
  | 'wind'
  | 'water'
  | 'light'
  | 'dark';

// Efectos de estado
export type StatusEffect = 
  | 'burn'      // DoT de fuego
  | 'freeze'    // Congelado (no puede moverse)
  | 'stun'      // Aturdido (no puede hacer nada)
  | 'slow'      // Movimiento reducido
  | 'poison'    // DoT de veneno
  | 'bleed'     // DoT que escala con movimiento
  | 'blind'     // Reduce precisión
  | 'silence'   // No puede usar habilidades
  | 'weakness'  // Reduce daño
  | 'vulnerable'// Recibe más daño
  | 'regen'     // Regeneración de vida
  | 'shield'    // Escudo temporal
  | 'buff_atk'  // Aumento de ataque
  | 'buff_def'  // Aumento de defensa
  | 'buff_spd'; // Aumento de velocidad

interface StatusEffectInstance {
  type: StatusEffect;
  duration: number;
  remaining: number;
  stacks: number;
  maxStacks: number;
  value: number;      // Potencia del efecto
  source: string;     // ID del que aplicó el efecto
  tickInterval: number;
  lastTick: number;
}

interface DamageInstance {
  amount: number;
  element: Element;
  type: AttackType;
  isCritical: boolean;
  source: string;
  target: string;
  position: THREE.Vector3;
  knockback?: THREE.Vector3;
  statusEffects?: { type: StatusEffect; chance: number; duration: number; value: number }[];
}

interface CombatEntity {
  id: string;
  name: string;
  health: number;
  maxHealth: number;
  mana: number;
  maxMana: number;
  
  // Stats de combate
  attack: number;
  magicAttack: number;
  defense: number;
  magicDefense: number;
  critRate: number;
  critDamage: number;
  accuracy: number;
  evasion: number;
  
  // Resistencias elementales (0-1, negativo = debilidad)
  resistances: Partial<Record<Element, number>>;
  
  // Inmunidades
  immunities: StatusEffect[];
  
  // Efectos activos
  statusEffects: StatusEffectInstance[];
  
  // Estado
  isAlive: boolean;
  isInvulnerable: boolean;
  lastDamageTime: number;
}

interface CombatSystemState {
  entities: Map<string, CombatEntity>;
  damageQueue: DamageInstance[];
  combatLog: CombatLogEntry[];
  isInCombat: boolean;
  combatStartTime: number;
}

interface CombatLogEntry {
  timestamp: number;
  type: 'damage' | 'heal' | 'status' | 'death' | 'skill';
  source: string;
  target: string;
  value?: number;
  element?: Element;
  isCritical?: boolean;
  statusEffect?: StatusEffect;
  message: string;
}

// Fórmulas de daño
const DAMAGE_FORMULAS = {
  // Daño base = ATK * (100 / (100 + DEF))
  calculateBaseDamage: (attack: number, defense: number): number => {
    return attack * (100 / (100 + defense));
  },
  
  // Daño elemental considerando resistencias
  calculateElementalDamage: (baseDamage: number, resistance: number): number => {
    return baseDamage * (1 - resistance);
  },
  
  // Daño crítico
  calculateCriticalDamage: (damage: number, critDamage: number): number => {
    return damage * (critDamage / 100);
  },
  
  // Variación de daño (±10%)
  applyDamageVariance: (damage: number): number => {
    const variance = 0.1;
    const multiplier = 1 + (Math.random() * 2 - 1) * variance;
    return Math.round(damage * multiplier);
  },
};

export function useCombatSystem() {
  const playerStore = usePlayerStore();
  
  const state = useRef<CombatSystemState>({
    entities: new Map(),
    damageQueue: [],
    combatLog: [],
    isInCombat: false,
    combatStartTime: 0,
  });

  // Registrar entidad de combate
  const registerEntity = useCallback((entity: CombatEntity) => {
    state.current.entities.set(entity.id, { ...entity });
  }, []);

  // Remover entidad
  const unregisterEntity = useCallback((entityId: string) => {
    state.current.entities.delete(entityId);
  }, []);

  // Obtener entidad
  const getEntity = useCallback((entityId: string): CombatEntity | undefined => {
    return state.current.entities.get(entityId);
  }, []);

  // Calcular daño
  const calculateDamage = useCallback((
    attacker: CombatEntity,
    defender: CombatEntity,
    baseMultiplier: number = 1,
    element: Element = 'physical',
    type: AttackType = 'melee'
  ): DamageInstance => {
    // Determinar stats según tipo de ataque
    const attackStat = type === 'magic' || type === 'skill' 
      ? attacker.magicAttack 
      : attacker.attack;
    const defenseStat = type === 'magic' || type === 'skill'
      ? defender.magicDefense
      : defender.defense;
    
    // Daño base
    let damage = DAMAGE_FORMULAS.calculateBaseDamage(attackStat, defenseStat);
    damage *= baseMultiplier;
    
    // Resistencia elemental
    const resistance = defender.resistances[element] ?? 0;
    damage = DAMAGE_FORMULAS.calculateElementalDamage(damage, resistance);
    
    // Crítico
    const isCritical = Math.random() * 100 < attacker.critRate;
    if (isCritical) {
      damage = DAMAGE_FORMULAS.calculateCriticalDamage(damage, attacker.critDamage);
    }
    
    // Variación
    damage = DAMAGE_FORMULAS.applyDamageVariance(damage);
    
    // Mínimo 1 de daño
    damage = Math.max(1, Math.round(damage));
    
    return {
      amount: damage,
      element,
      type,
      isCritical,
      source: attacker.id,
      target: defender.id,
      position: new THREE.Vector3(), // Se setea externamente
    };
  }, []);

  // Aplicar daño
  const applyDamage = useCallback((damage: DamageInstance): boolean => {
    const target = state.current.entities.get(damage.target);
    if (!target || !target.isAlive || target.isInvulnerable) {
      return false;
    }
    
    // Aplicar daño
    target.health = Math.max(0, target.health - damage.amount);
    target.lastDamageTime = performance.now();
    
    // Log
    const logEntry: CombatLogEntry = {
      timestamp: Date.now(),
      type: 'damage',
      source: damage.source,
      target: damage.target,
      value: damage.amount,
      element: damage.element,
      isCritical: damage.isCritical,
      message: `${damage.source} dealt ${damage.amount} ${damage.element} damage to ${damage.target}${damage.isCritical ? ' (CRITICAL!)' : ''}`,
    };
    state.current.combatLog.push(logEntry);
    // Limitar tamaño del log para evitar memory leak en combates largos
    if (state.current.combatLog.length > 200) {
      state.current.combatLog.splice(0, state.current.combatLog.length - 200);
    }
    
    // Verificar muerte
    if (target.health <= 0) {
      target.isAlive = false;
      state.current.combatLog.push({
        timestamp: Date.now(),
        type: 'death',
        source: damage.source,
        target: damage.target,
        message: `${damage.target} was defeated by ${damage.source}`,
      });
    }
    
    // Aplicar efectos de estado
    if (damage.statusEffects) {
      damage.statusEffects.forEach(effect => {
        if (Math.random() * 100 < effect.chance) {
          applyStatusEffect(damage.target, {
            type: effect.type,
            duration: effect.duration,
            remaining: effect.duration,
            stacks: 1,
            maxStacks: 5,
            value: effect.value,
            source: damage.source,
            tickInterval: 1,
            lastTick: 0,
          });
        }
      });
    }
    
    // Actualizar store del player si es el target
    if (damage.target === 'player') {
      playerStore.takeDamage(damage.amount);
    }
    
    return true;
  }, [playerStore]);

  // Aplicar curación
  const applyHeal = useCallback((
    targetId: string,
    amount: number,
    sourceId: string
  ): boolean => {
    const target = state.current.entities.get(targetId);
    if (!target || !target.isAlive) {
      return false;
    }
    
    const actualHeal = Math.min(amount, target.maxHealth - target.health);
    target.health += actualHeal;
    
    state.current.combatLog.push({
      timestamp: Date.now(),
      type: 'heal',
      source: sourceId,
      target: targetId,
      value: actualHeal,
      message: `${sourceId} healed ${targetId} for ${actualHeal}`,
    });
    
    if (targetId === 'player') {
      playerStore.heal(actualHeal);
    }
    
    return true;
  }, [playerStore]);

  // Aplicar efecto de estado
  const applyStatusEffect = useCallback((
    targetId: string,
    effect: StatusEffectInstance
  ): boolean => {
    const target = state.current.entities.get(targetId);
    if (!target || !target.isAlive) {
      return false;
    }
    
    // Verificar inmunidad
    if (target.immunities.includes(effect.type)) {
      return false;
    }
    
    // Buscar efecto existente
    const existingIndex = target.statusEffects.findIndex(
      e => e.type === effect.type
    );
    
    if (existingIndex >= 0) {
      const existing = target.statusEffects[existingIndex];
      // Stack o refresh
      if (existing.stacks < existing.maxStacks) {
        existing.stacks++;
      }
      existing.remaining = Math.max(existing.remaining, effect.duration);
    } else {
      target.statusEffects.push({ ...effect });
    }
    
    state.current.combatLog.push({
      timestamp: Date.now(),
      type: 'status',
      source: effect.source,
      target: targetId,
      statusEffect: effect.type,
      message: `${targetId} received ${effect.type} from ${effect.source}`,
    });
    
    return true;
  }, []);

  // Remover efecto de estado
  const removeStatusEffect = useCallback((
    targetId: string,
    effectType: StatusEffect
  ): boolean => {
    const target = state.current.entities.get(targetId);
    if (!target) return false;
    
    const index = target.statusEffects.findIndex(e => e.type === effectType);
    if (index >= 0) {
      target.statusEffects.splice(index, 1);
      return true;
    }
    return false;
  }, []);

  // Procesar efectos de estado (DoT, etc.)
  const processStatusEffects = useCallback((entityId: string, deltaTime: number) => {
    const entity = state.current.entities.get(entityId);
    if (!entity || !entity.isAlive) return;
    
    const toRemove: StatusEffect[] = [];
    
    entity.statusEffects.forEach(effect => {
      effect.remaining -= deltaTime;
      
      // Tick de daño/efecto
      effect.lastTick += deltaTime;
      if (effect.lastTick >= effect.tickInterval) {
        effect.lastTick = 0;
        
        // Aplicar efecto según tipo
        switch (effect.type) {
          case 'burn':
          case 'poison':
          case 'bleed':
            const dotDamage = effect.value * effect.stacks;
            entity.health = Math.max(0, entity.health - dotDamage);
            break;
          case 'regen':
            entity.health = Math.min(entity.maxHealth, entity.health + effect.value);
            break;
        }
      }
      
      // Marcar para remover si expiró
      if (effect.remaining <= 0) {
        toRemove.push(effect.type);
      }
    });
    
    // Remover efectos expirados
    toRemove.forEach(type => removeStatusEffect(entityId, type));
  }, [removeStatusEffect]);

  // Update loop
  useFrame((_, delta) => {
    // Procesar daños en cola
    while (state.current.damageQueue.length > 0) {
      const damage = state.current.damageQueue.shift()!;
      applyDamage(damage);
    }
    
    // Procesar efectos de estado
    state.current.entities.forEach((_, id) => {
      processStatusEffects(id, delta);
    });
  });

  return {
    // Estado
    get isInCombat() { return state.current.isInCombat; },
    get combatLog() { return state.current.combatLog; },
    
    // Gestión de entidades
    registerEntity,
    unregisterEntity,
    getEntity,
    
    // Combate
    calculateDamage,
    applyDamage,
    applyHeal,
    applyStatusEffect,
    removeStatusEffect,
    
    // Encolar daño para procesamiento
    queueDamage: (damage: DamageInstance) => {
      state.current.damageQueue.push(damage);
    },
    
    // Entrar/salir de combate
    enterCombat: () => {
      state.current.isInCombat = true;
      state.current.combatStartTime = Date.now();
      playerStore.enterCombat();
    },
    
    exitCombat: () => {
      state.current.isInCombat = false;
      playerStore.exitCombat();
    },
    
    // Obtener log reciente
    getRecentLog: (count: number = 10) => {
      return state.current.combatLog.slice(-count);
    },
    
    // Limpiar log
    clearLog: () => {
      state.current.combatLog = [];
    },
  };
}

export default useCombatSystem;
