/**
 * BossEntity - Implementación de entidades jefe con mecánicas especiales
 */

import * as THREE from 'three';
import { EnemyEntity } from './EnemyEntity';
import type { GameEntity, StatusEffect } from './GameEntity';
import type { CharacterStats } from '../../types';
import type { EnemyTier, EnemyType } from '../rpg/enemy-factory';
import type { DamageType } from '../rpg/rpg-calculator';

// ============================================================
// TIPOS
// ============================================================

export type BossPhase = 1 | 2 | 3 | 4;

export interface PhaseTransition {
  healthPercent: number;
  onEnter: (boss: BossEntity) => void;
  abilities: string[];
  modifiers?: {
    damageMultiplier?: number;
    speedMultiplier?: number;
    defenseMultiplier?: number;
  };
}

export interface BossMechanic {
  id: string;
  name: string;
  description: string;
  execute: (boss: BossEntity) => void;
  interval?: number;
  lastExecuteTime?: number;
}

export interface BossConfig {
  phases: PhaseTransition[];
  mechanics: BossMechanic[];
  enrageTimer?: number;
  immunities?: DamageType[];
  resistances?: Partial<Record<DamageType, number>>;
}

// ============================================================
// CLASE BOSS ENTITY
// ============================================================

export class BossEntity extends EnemyEntity {
  // Fases
  private _currentPhase: BossPhase = 1;
  private _phases: PhaseTransition[];
  private _phaseAbilities: Map<BossPhase, string[]> = new Map();
  
  // Mecánicas
  private _mechanics: Map<string, BossMechanic> = new Map();
  private _activeMechanics: Set<string> = new Set();
  
  // Enrage
  private _enrageTimer: number;
  private _isEnraged: boolean = false;
  private _combatStartTime: number = 0;
  
  // Inmunidades y resistencias
  private _immunities: Set<DamageType> = new Set();
  private _resistances: Map<DamageType, number> = new Map();
  
  // Adds (enemigos invocados)
  private _summonedAdds: string[] = [];
  private _maxAdds: number = 10;
  
  // UI
  public showBossBar: boolean = true;
  public bossTitle: string = '';
  public bossSubtitle: string = '';
  
  // Eventos especiales
  public onPhaseChange?: (phase: BossPhase) => void;
  public onEnrage?: () => void;
  public onMechanicTrigger?: (mechanicId: string) => void;
  
  // ============================================================
  // CONSTRUCTOR
  // ============================================================
  
  constructor(
    id: string,
    name: string,
    enemyType: EnemyType,
    level: number,
    stats: CharacterStats,
    position: THREE.Vector3,
    config: {
      element?: DamageType;
      experienceValue: number;
      goldValue: number;
      lootTable: string;
      aggroRange: number;
      attackRange: number;
      moveSpeed: number;
      attackSpeed: number;
      abilities?: string[];
    },
    bossConfig: BossConfig
  ) {
    // Los bosses son siempre tier 'boss' o 'raid_boss'
    const tier: EnemyTier = level >= 50 ? 'raid_boss' : 'boss';
    
    super(
      id,
      name,
      enemyType,
      tier,
      'aggressive', // Bosses siempre agresivos
      level,
      stats,
      position,
      config
    );
    
    this._phases = bossConfig.phases;
    this._enrageTimer = bossConfig.enrageTimer ?? 600000; // 10 min default
    
    // Configurar inmunidades
    if (bossConfig.immunities) {
      bossConfig.immunities.forEach(type => this._immunities.add(type));
    }
    
    // Configurar resistencias
    if (bossConfig.resistances) {
      Object.entries(bossConfig.resistances).forEach(([type, value]) => {
        this._resistances.set(type as DamageType, value);
      });
    }
    
    // Configurar mecánicas
    bossConfig.mechanics.forEach(mechanic => {
      this._mechanics.set(mechanic.id, { ...mechanic, lastExecuteTime: 0 });
    });
    
    // Configurar habilidades por fase
    this._phases.forEach((phase, index) => {
      this._phaseAbilities.set((index + 1) as BossPhase, phase.abilities);
    });
    
    // Configuración de boss
    this.showBossBar = true;
    this.hitboxRadius = 2.0; // Hitbox más grande
    this.hitboxHeight = 4.0;
  }
  
  // ============================================================
  // GETTERS
  // ============================================================
  
  get currentPhase(): BossPhase {
    return this._currentPhase;
  }
  
  get isEnraged(): boolean {
    return this._isEnraged;
  }
  
  get enrageTimeRemaining(): number {
    if (!this._combatStartTime) return this._enrageTimer;
    return Math.max(0, this._enrageTimer - (Date.now() - this._combatStartTime));
  }
  
  get summonedAdds(): string[] {
    return [...this._summonedAdds];
  }
  
  get phaseHealthThresholds(): number[] {
    return this._phases.map(p => p.healthPercent);
  }
  
  // ============================================================
  // FASES
  // ============================================================
  
  private checkPhaseTransition(): void {
    const healthPercent = this.healthPercent;
    
    for (let i = this._phases.length - 1; i >= 0; i--) {
      const phase = this._phases[i];
      const phaseNum = (i + 1) as BossPhase;
      
      if (healthPercent <= phase.healthPercent && this._currentPhase < phaseNum) {
        this.transitionToPhase(phaseNum);
        break;
      }
    }
  }
  
  private transitionToPhase(phase: BossPhase): void {
    const phaseConfig = this._phases[phase - 1];
    if (!phaseConfig) return;
    
    console.log(`[Boss] ${this.name} transitioning to Phase ${phase}`);
    
    // Breve invulnerabilidad durante transición
    this.grantInvulnerability(2000);
    
    // Ejecutar callback de entrada de fase
    phaseConfig.onEnter(this);
    
    // Aplicar modificadores de fase
    if (phaseConfig.modifiers) {
      this.applyPhaseModifiers(phaseConfig.modifiers);
    }
    
    this._currentPhase = phase;
    this.onPhaseChange?.(phase);
  }
  
  private applyPhaseModifiers(modifiers: PhaseTransition['modifiers']): void {
    if (!modifiers) return;
    
    if (modifiers.damageMultiplier) {
      this.stats.attack = Math.floor(this.stats.attack * modifiers.damageMultiplier);
      this.stats.magicAttack = Math.floor(this.stats.magicAttack * modifiers.damageMultiplier);
    }
    
    if (modifiers.speedMultiplier) {
      this.moveSpeed *= modifiers.speedMultiplier;
      this.attackSpeed *= modifiers.speedMultiplier;
    }
    
    if (modifiers.defenseMultiplier) {
      this.stats.defense = Math.floor(this.stats.defense * modifiers.defenseMultiplier);
      this.stats.magicDefense = Math.floor(this.stats.magicDefense * modifiers.defenseMultiplier);
    }
  }
  
  // ============================================================
  // ENRAGE
  // ============================================================
  
  private checkEnrage(): void {
    if (this._isEnraged || !this._combatStartTime) return;
    
    if (this.enrageTimeRemaining <= 0) {
      this.triggerEnrage();
    }
  }
  
  private triggerEnrage(): void {
    if (this._isEnraged) return;
    
    console.log(`[Boss] ${this.name} ENRAGED!`);
    
    this._isEnraged = true;
    
    // Aumentar stats significativamente
    this.stats.attack = Math.floor(this.stats.attack * 2);
    this.stats.magicAttack = Math.floor(this.stats.magicAttack * 2);
    this.attackSpeed *= 1.5;
    this.moveSpeed *= 1.3;
    
    // Aplicar efecto visual (en el sistema de render)
    this.applyStatusEffect({
      id: 'enrage',
      type: 'buff',
      duration: Infinity,
      remainingDuration: Infinity,
      stacks: 1,
      maxStacks: 1,
      tickInterval: 0,
      lastTickTime: 0,
      source: this.id,
      data: { isEnrage: true },
    });
    
    this.onEnrage?.();
  }
  
  // ============================================================
  // MECÁNICAS
  // ============================================================
  
  private updateMechanics(): void {
    const now = Date.now();
    
    this._mechanics.forEach((mechanic, id) => {
      if (!mechanic.interval) return;
      if (!this._activeMechanics.has(id)) return;
      
      const lastTime = mechanic.lastExecuteTime ?? 0;
      if (now - lastTime >= mechanic.interval) {
        this.executeMechanic(id);
        mechanic.lastExecuteTime = now;
      }
    });
  }
  
  public executeMechanic(mechanicId: string): void {
    const mechanic = this._mechanics.get(mechanicId);
    if (!mechanic) return;
    
    console.log(`[Boss] Executing mechanic: ${mechanic.name}`);
    
    mechanic.execute(this);
    this.onMechanicTrigger?.(mechanicId);
  }
  
  public activateMechanic(mechanicId: string): void {
    if (this._mechanics.has(mechanicId)) {
      this._activeMechanics.add(mechanicId);
    }
  }
  
  public deactivateMechanic(mechanicId: string): void {
    this._activeMechanics.delete(mechanicId);
  }
  
  // ============================================================
  // INVOCACIÓN DE ADDS
  // ============================================================
  
  public canSummonAdd(): boolean {
    return this._summonedAdds.length < this._maxAdds;
  }
  
  public registerSummonedAdd(addId: string): void {
    if (this._summonedAdds.length < this._maxAdds) {
      this._summonedAdds.push(addId);
    }
  }
  
  public removeSummonedAdd(addId: string): void {
    const index = this._summonedAdds.indexOf(addId);
    if (index !== -1) {
      this._summonedAdds.splice(index, 1);
    }
  }
  
  public clearAllAdds(): void {
    this._summonedAdds = [];
  }
  
  // ============================================================
  // COMBATE
  // ============================================================
  
  public override takeDamage(
    amount: number,
    source: GameEntity | null = null,
    options: {
      ignoreArmor?: boolean;
      ignoreInvulnerability?: boolean;
      isTrueDamage?: boolean;
      damageType?: DamageType;
    } = {}
  ): number {
    // Verificar inmunidad
    if (options.damageType && this._immunities.has(options.damageType)) {
      console.log(`[Boss] ${this.name} is immune to ${options.damageType}!`);
      return 0;
    }
    
    // Aplicar resistencia
    let modifiedAmount = amount;
    if (options.damageType) {
      const resistance = this._resistances.get(options.damageType) ?? 0;
      modifiedAmount = Math.floor(amount * (1 - resistance / 100));
    }
    
    const damage = super.takeDamage(modifiedAmount, source, options);
    
    // Iniciar combate si no ha empezado
    if (damage > 0 && !this._combatStartTime) {
      this.startCombat();
    }
    
    // Verificar transición de fase
    this.checkPhaseTransition();
    
    return damage;
  }
  
  private startCombat(): void {
    this._combatStartTime = Date.now();
    console.log(`[Boss] ${this.name} entered combat!`);
    
    // Activar mecánicas iniciales
    this._phases[0]?.abilities.forEach((_ability) => {
      // Activar habilidades de fase 1
    });
  }
  
  public resetCombat(): void {
    this._combatStartTime = 0;
    this._isEnraged = false;
    this._currentPhase = 1;
    this._summonedAdds = [];
    this._activeMechanics.clear();
    
    // Restaurar stats base (necesitaría guardar los originales)
    this.clearStatusEffects();
    this.clearAggro();
  }
  
  // ============================================================
  // UPDATE
  // ============================================================
  
  public override update(deltaTime: number): void {
    if (!this.isAlive) return;
    
    super.update(deltaTime);
    
    // Verificar enrage
    this.checkEnrage();
    
    // Actualizar mecánicas activas
    this.updateMechanics();
  }
  
  // ============================================================
  // MUERTE
  // ============================================================
  
  public override die(killer: GameEntity | null = null): void {
    console.log(`[Boss] ${this.name} has been defeated!`);
    
    // Limpiar adds
    this.clearAllAdds();
    
    // Desactivar mecánicas
    this._activeMechanics.clear();
    
    super.die(killer);
  }
  
  // ============================================================
  // UTILIDADES
  // ============================================================
  
  /**
   * Hace que el boss sea inmune a CC (crowd control)
   */
  public isImmuneToCC(): boolean {
    // Los bosses son inmunes a la mayoría de CC
    return true;
  }
  
  /**
   * Aplica CC con resistencia de boss
   */
  public override applyStatusEffect(effect: StatusEffect): boolean {
    // Reducir duración de CC en bosses
    const ccTypes = ['stun', 'freeze', 'root', 'silence', 'fear'];
    
    if (ccTypes.includes(effect.type)) {
      if (this.isImmuneToCC()) {
        console.log(`[Boss] ${this.name} is immune to ${effect.type}!`);
        return false;
      }
      
      // Reducir duración de CC al 30%
      effect.duration *= 0.3;
      effect.remainingDuration *= 0.3;
    }
    
    return super.applyStatusEffect(effect);
  }
  
  /**
   * Teleporta el boss a una posición
   */
  public teleport(position: THREE.Vector3): void {
    this.position.copy(position);
    this.velocity.set(0, 0, 0);
  }
  
  /**
   * Gira hacia los jugadores (para AOE)
   */
  public faceRandomDirection(): void {
    this.rotation.y = Math.random() * Math.PI * 2;
  }
  
  // ============================================================
  // SERIALIZACIÓN
  // ============================================================
  
  public override serialize(): Record<string, unknown> {
    return {
      ...super.serialize(),
      currentPhase: this._currentPhase,
      isEnraged: this._isEnraged,
      combatStartTime: this._combatStartTime,
      summonedAdds: [...this._summonedAdds],
      activeMechanics: Array.from(this._activeMechanics),
    };
  }
}

// ============================================================
// FACTORY HELPERS
// ============================================================

/**
 * Crea un boss con configuración predefinida
 */
export function createBoss(
  bossType: 'goblin_king' | 'ancient_dragon' | 'lich_lord',
  level: number,
  position: THREE.Vector3
): BossEntity {
  const bossConfigs: Record<string, {
    name: string;
    enemyType: EnemyType;
    stats: CharacterStats;
    element?: DamageType;
    config: BossConfig;
  }> = {
    goblin_king: {
      name: 'Rey Goblin',
      enemyType: 'boss_goblin_king',
      stats: {
        strength: 25 + level, dexterity: 18 + level * 0.5, intelligence: 15, 
        vitality: 40 + level * 2, luck: 15,
        attack: 30 + level * 2, defense: 20 + level, 
        magicAttack: 15, magicDefense: 15, speed: 12,
        critRate: 15, critDamage: 160,
      },
      config: {
        phases: [
          {
            healthPercent: 100,
            onEnter: () => {},
            abilities: ['royal_slash', 'summon_goblins'],
          },
          {
            healthPercent: 50,
            onEnter: (boss) => {
              console.log(`${boss.name}: ¡Guardias, a mi!`);
            },
            abilities: ['royal_slash', 'summon_goblins', 'war_cry', 'enrage'],
            modifiers: { damageMultiplier: 1.3, speedMultiplier: 1.2 },
          },
        ],
        mechanics: [
          {
            id: 'summon_wave',
            name: 'Oleada de Goblins',
            description: 'Invoca una oleada de goblins',
            execute: (boss) => {
              if (boss.canSummonAdd()) {
                console.log(`${boss.name} invoca goblins!`);
              }
            },
            interval: 30000,
          },
        ],
        enrageTimer: 300000, // 5 minutos
      },
    },
    ancient_dragon: {
      name: 'Dragón Ancestral',
      enemyType: 'boss_dragon',
      element: 'fire',
      stats: {
        strength: 50 + level * 2, dexterity: 20 + level, intelligence: 35 + level, 
        vitality: 80 + level * 3, luck: 15,
        attack: 55 + level * 3, defense: 45 + level * 2, 
        magicAttack: 50 + level * 2, magicDefense: 40 + level, speed: 12,
        critRate: 15, critDamage: 200,
      },
      config: {
        phases: [
          {
            healthPercent: 100,
            onEnter: () => {},
            abilities: ['claw_attack', 'fire_breath', 'tail_swipe'],
          },
          {
            healthPercent: 70,
            onEnter: (boss) => {
              console.log(`${boss.name} despliega sus alas!`);
              boss.activateMechanic('fly_phase');
            },
            abilities: ['fire_breath', 'meteor_strike', 'fly'],
            modifiers: { damageMultiplier: 1.2 },
          },
          {
            healthPercent: 30,
            onEnter: (boss) => {
              console.log(`${boss.name}: ¡SENTIRÉIS MI IRA!`);
              boss.activateMechanic('desperation');
            },
            abilities: ['fire_breath', 'meteor_strike', 'fear_roar', 'enrage'],
            modifiers: { damageMultiplier: 1.5, speedMultiplier: 1.3 },
          },
        ],
        mechanics: [
          {
            id: 'fly_phase',
            name: 'Fase de Vuelo',
            description: 'El dragón vuela y ataca desde el aire',
            execute: (boss) => {
              console.log(`${boss.name} se eleva en el aire!`);
            },
            interval: 45000,
          },
          {
            id: 'desperation',
            name: 'Desesperación',
            description: 'Ataques más frecuentes y poderosos',
            execute: () => {},
          },
        ],
        enrageTimer: 480000, // 8 minutos
        resistances: {
          fire: 75,
          ice: -25, // Debilidad
        },
      },
    },
    lich_lord: {
      name: 'Señor Lich',
      enemyType: 'boss_lich',
      element: 'dark',
      stats: {
        strength: 15, dexterity: 15, intelligence: 60 + level * 2, 
        vitality: 60 + level * 2, luck: 20,
        attack: 20, defense: 25 + level, 
        magicAttack: 65 + level * 3, magicDefense: 50 + level * 2, speed: 8,
        critRate: 20, critDamage: 180,
      },
      config: {
        phases: [
          {
            healthPercent: 100,
            onEnter: () => {},
            abilities: ['death_bolt', 'summon_undead', 'frost_nova'],
          },
          {
            healthPercent: 60,
            onEnter: (boss) => {
              console.log(`${boss.name}: Mi filacteria me protege...`);
              boss.activateMechanic('phylactery_shield');
            },
            abilities: ['death_bolt', 'summon_undead', 'soul_drain', 'phylactery_shield'],
          },
          {
            healthPercent: 25,
            onEnter: (boss) => {
              console.log(`${boss.name}: ¡LA MUERTE NO ES EL FIN!`);
              boss.activateMechanic('dark_ritual');
            },
            abilities: ['death_bolt', 'soul_drain', 'dark_ritual', 'army_of_dead'],
            modifiers: { damageMultiplier: 1.8 },
          },
        ],
        mechanics: [
          {
            id: 'phylactery_shield',
            name: 'Escudo de Filacteria',
            description: 'Un escudo protege al lich mientras la filacteria existe',
            execute: (boss) => {
              boss.grantInvulnerability(5000);
              console.log(`Destruid la filacteria!`);
            },
            interval: 60000,
          },
          {
            id: 'dark_ritual',
            name: 'Ritual Oscuro',
            description: 'El lich canaliza un ritual devastador',
            execute: (boss) => {
              console.log(`${boss.name} comienza un ritual oscuro...`);
            },
            interval: 40000,
          },
        ],
        enrageTimer: 420000, // 7 minutos
        immunities: ['poison'],
        resistances: {
          dark: 50,
          light: -50, // Debilidad
        },
      },
    },
  };
  
  const bossData = bossConfigs[bossType];
  if (!bossData) {
    throw new Error(`Unknown boss type: ${bossType}`);
  }
  
  return new BossEntity(
    `boss_${bossType}_${Date.now()}`,
    bossData.name,
    bossData.enemyType,
    level,
    bossData.stats,
    position,
    {
      element: bossData.element,
      experienceValue: 2000 * level,
      goldValue: 1000 * level,
      lootTable: `loot_boss_${bossType}`,
      aggroRange: 30,
      attackRange: bossType === 'lich_lord' ? 12 : 5,
      moveSpeed: bossType === 'ancient_dragon' ? 10 : 5,
      attackSpeed: 0.8,
      abilities: bossData.config.phases[0].abilities,
    },
    bossData.config
  );
}
