/**
 * EnemyEntity - Implementación de entidad enemigo con IA
 */

import * as THREE from 'three';
import { GameEntity, type StatusEffect } from './GameEntity';
import type { CharacterStats } from '../../types';
import type { EnemyBehavior, EnemyTier, EnemyType } from '../rpg/enemy-factory';
import type { DamageType } from '../rpg/rpg-calculator';

// ============================================================
// TIPOS
// ============================================================

export type AIState = 
  | 'idle'
  | 'patrol'
  | 'chase'
  | 'attack'
  | 'ability'
  | 'flee'
  | 'return'
  | 'stunned';

export interface PatrolPoint {
  position: THREE.Vector3;
  waitTime: number;
}

export interface EnemyAbility {
  id: string;
  name: string;
  cooldown: number;
  lastUsedTime: number;
  range: number;
  manaCost: number;
  damage?: number;
  element?: DamageType;
  execute: (enemy: EnemyEntity, target: GameEntity | null) => void;
}

// ============================================================
// CLASE ENEMY ENTITY
// ============================================================

export class EnemyEntity extends GameEntity {
  // Tipo de enemigo
  public readonly enemyType: EnemyType;
  public readonly tier: EnemyTier;
  public readonly behavior: EnemyBehavior;
  public readonly element?: DamageType;
  
  // Recompensas
  public experienceValue: number;
  public goldValue: number;
  public lootTable: string;
  
  // AI
  private _aiState: AIState = 'idle';
  private _targetEntity: GameEntity | null = null;
  private _spawnPosition: THREE.Vector3;
  private _homeRadius: number = 30;
  
  // Rangos
  public aggroRange: number;
  public attackRange: number;
  public fleeHealthPercent: number = 0; // % de vida para huir (0 = nunca)
  
  // Velocidades
  public moveSpeed: number;
  public attackSpeed: number;
  
  // Patrulla
  private _patrolPoints: PatrolPoint[] = [];
  private _currentPatrolIndex: number = 0;
  private _patrolWaitTimer: number = 0;
  
  // Combate
  private _lastAttackTime: number = 0;
  private _abilities: Map<string, EnemyAbility> = new Map();
  private _globalCooldown: number = 0;
  
  // Aggro
  private _aggroTable: Map<string, number> = new Map();
  
  // ============================================================
  // CONSTRUCTOR
  // ============================================================
  
  constructor(
    id: string,
    name: string,
    enemyType: EnemyType,
    tier: EnemyTier,
    behavior: EnemyBehavior,
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
    }
  ) {
    super(id, 'enemy', name, level, stats, position);
    
    this.enemyType = enemyType;
    this.tier = tier;
    this.behavior = behavior;
    this.element = config.element;
    
    this.experienceValue = config.experienceValue;
    this.goldValue = config.goldValue;
    this.lootTable = config.lootTable;
    
    this.aggroRange = config.aggroRange;
    this.attackRange = config.attackRange;
    this.moveSpeed = config.moveSpeed;
    this.attackSpeed = config.attackSpeed;
    
    this._spawnPosition = position.clone();
    
    // Configurar comportamiento específico
    this.setupBehavior();
    
    // Registrar habilidades
    if (config.abilities) {
      this.registerAbilities(config.abilities);
    }
  }
  
  // ============================================================
  // GETTERS Y SETTERS
  // ============================================================
  
  get aiState(): AIState {
    return this._aiState;
  }
  
  set aiState(state: AIState) {
    if (this._aiState !== state) {
      this._aiState = state;
      this.onAIStateChange(state);
    }
  }
  
  get target(): GameEntity | null {
    return this._targetEntity;
  }
  
  get spawnPosition(): THREE.Vector3 {
    return this._spawnPosition.clone();
  }
  
  get distanceFromSpawn(): number {
    return this.position.distanceTo(this._spawnPosition);
  }
  
  get isOutOfBounds(): boolean {
    return this.distanceFromSpawn > this._homeRadius;
  }
  
  get canAttack(): boolean {
    const now = Date.now();
    const attackCooldown = 1000 / this.attackSpeed;
    return now - this._lastAttackTime >= attackCooldown && this._globalCooldown <= 0;
  }
  
  // ============================================================
  // CONFIGURACIÓN DE COMPORTAMIENTO
  // ============================================================
  
  private setupBehavior(): void {
    switch (this.behavior) {
      case 'aggressive':
        this.aggroRange *= 1.2;
        break;
      case 'defensive':
        this.aggroRange *= 0.7;
        this.fleeHealthPercent = 20;
        break;
      case 'ranged':
        this.attackRange *= 1.5;
        break;
      case 'patrol':
        this.generatePatrolRoute();
        break;
      case 'ambush':
        this.aggroRange *= 0.5; // Detecta solo de cerca
        break;
      case 'support':
        this.fleeHealthPercent = 40;
        break;
    }
  }
  
  private generatePatrolRoute(): void {
    // Generar puntos de patrulla alrededor del spawn
    const numPoints = 3 + Math.floor(Math.random() * 3);
    const radius = 5 + Math.random() * 5;
    
    for (let i = 0; i < numPoints; i++) {
      const angle = (i / numPoints) * Math.PI * 2;
      const point: PatrolPoint = {
        position: new THREE.Vector3(
          this._spawnPosition.x + Math.cos(angle) * radius,
          this._spawnPosition.y,
          this._spawnPosition.z + Math.sin(angle) * radius
        ),
        waitTime: 1000 + Math.random() * 2000,
      };
      this._patrolPoints.push(point);
    }
  }
  
  // ============================================================
  // HABILIDADES
  // ============================================================
  
  private registerAbilities(abilityIds: string[]): void {
    for (const abilityId of abilityIds) {
      const ability = this.createAbility(abilityId);
      if (ability) {
        this._abilities.set(abilityId, ability);
      }
    }
  }
  
  private createAbility(abilityId: string): EnemyAbility | null {
    // Definiciones de habilidades básicas
    const abilityDefs: Record<string, Partial<EnemyAbility>> = {
      basic_attack: {
        name: 'Ataque Básico',
        cooldown: 0,
        range: 2,
        manaCost: 0,
        damage: this.stats.attack,
      },
      heavy_strike: {
        name: 'Golpe Pesado',
        cooldown: 5000,
        range: 3,
        manaCost: 10,
        damage: this.stats.attack * 1.5,
      },
      war_cry: {
        name: 'Grito de Guerra',
        cooldown: 15000,
        range: 0,
        manaCost: 20,
      },
      fireball: {
        name: 'Bola de Fuego',
        cooldown: 3000,
        range: 8,
        manaCost: 15,
        damage: this.stats.magicAttack * 1.2,
        element: 'fire',
      },
      ice_spike: {
        name: 'Pico de Hielo',
        cooldown: 2500,
        range: 6,
        manaCost: 12,
        damage: this.stats.magicAttack,
        element: 'ice',
      },
      life_drain: {
        name: 'Drenar Vida',
        cooldown: 8000,
        range: 5,
        manaCost: 25,
        damage: this.stats.magicAttack * 0.8,
        element: 'dark',
      },
      summon_undead: {
        name: 'Invocar No-Muerto',
        cooldown: 20000,
        range: 0,
        manaCost: 50,
      },
    };
    
    const def = abilityDefs[abilityId];
    if (!def) return null;
    
    return {
      id: abilityId,
      name: def.name ?? abilityId,
      cooldown: def.cooldown ?? 0,
      lastUsedTime: 0,
      range: def.range ?? this.attackRange,
      manaCost: def.manaCost ?? 0,
      damage: def.damage,
      element: def.element,
      execute: (enemy, target) => this.executeAbility(abilityId, enemy, target),
    };
  }
  
  private executeAbility(abilityId: string, _enemy: EnemyEntity, target: GameEntity | null): void {
    const ability = this._abilities.get(abilityId);
    if (!ability || !target) return;
    
    // Aplicar daño si tiene
    if (ability.damage) {
      target.takeDamage(ability.damage, this);
    }
    
    // Efectos especiales por habilidad
    switch (abilityId) {
      case 'war_cry':
        // Buff de daño temporal (implementar con status effect)
        break;
      case 'life_drain':
        // Curar una parte del daño
        if (ability.damage) {
          this.heal(Math.floor(ability.damage * 0.5), this);
        }
        break;
    }
    
    ability.lastUsedTime = Date.now();
    this._globalCooldown = 500; // GCD de 500ms
  }
  
  public useAbility(abilityId: string): boolean {
    const ability = this._abilities.get(abilityId);
    if (!ability) return false;
    
    const now = Date.now();
    
    // Verificar cooldown
    if (now - ability.lastUsedTime < ability.cooldown) return false;
    
    // Verificar maná
    if (!this.useMana(ability.manaCost)) return false;
    
    // Verificar rango
    if (this._targetEntity && ability.range > 0) {
      if (!this.isInRange(this._targetEntity, ability.range)) return false;
    }
    
    // Ejecutar
    ability.execute(this, this._targetEntity);
    return true;
  }
  
  // ============================================================
  // AGGRO
  // ============================================================
  
  public addAggro(entityId: string, amount: number): void {
    const current = this._aggroTable.get(entityId) ?? 0;
    this._aggroTable.set(entityId, current + amount);
  }
  
  public getAggro(entityId: string): number {
    return this._aggroTable.get(entityId) ?? 0;
  }
  
  public clearAggro(): void {
    this._aggroTable.clear();
    this._targetEntity = null;
  }
  
  public getHighestAggroTarget(entities: GameEntity[]): GameEntity | null {
    let highestAggro = 0;
    let highestTarget: GameEntity | null = null;
    
    for (const entity of entities) {
      if (!entity.isAlive) continue;
      
      const aggro = this._aggroTable.get(entity.id) ?? 0;
      if (aggro > highestAggro) {
        highestAggro = aggro;
        highestTarget = entity;
      }
    }
    
    return highestTarget;
  }
  
  // ============================================================
  // AI UPDATE
  // ============================================================
  
  public override update(deltaTime: number): void {
    if (!this.isAlive) return;
    
    super.update(deltaTime);
    
    // Reducir GCD
    if (this._globalCooldown > 0) {
      this._globalCooldown -= deltaTime * 1000;
    }
    
    // Actualizar AI
    this.updateAI(deltaTime);
  }
  
  private updateAI(deltaTime: number): void {
    // Verificar si debe huir
    if (this.fleeHealthPercent > 0 && this.healthPercent <= this.fleeHealthPercent) {
      this.aiState = 'flee';
    }
    
    // Verificar si está fuera de rango de home
    if (this.isOutOfBounds && this.aiState !== 'return') {
      this.aiState = 'return';
      this.clearAggro();
    }
    
    switch (this.aiState) {
      case 'idle':
        this.updateIdle();
        break;
      case 'patrol':
        this.updatePatrol(deltaTime);
        break;
      case 'chase':
        this.updateChase(deltaTime);
        break;
      case 'attack':
        this.updateAttack();
        break;
      case 'flee':
        this.updateFlee(deltaTime);
        break;
      case 'return':
        this.updateReturn(deltaTime);
        break;
      case 'stunned':
        // No hacer nada mientras está stunned
        break;
    }
  }
  
  private updateIdle(): void {
    // Buscar objetivos en rango de aggro
    // En una implementación real, esto vendría del sistema de combate
    
    if (this.behavior === 'patrol' && this._patrolPoints.length > 0) {
      this.aiState = 'patrol';
    }
  }
  
  private updatePatrol(deltaTime: number): void {
    if (this._patrolPoints.length === 0) {
      this.aiState = 'idle';
      return;
    }
    
    const targetPoint = this._patrolPoints[this._currentPatrolIndex];
    const distance = this.position.distanceTo(targetPoint.position);
    
    if (distance < 0.5) {
      // Llegó al punto, esperar
      this._patrolWaitTimer -= deltaTime * 1000;
      
      if (this._patrolWaitTimer <= 0) {
        // Ir al siguiente punto
        this._currentPatrolIndex = (this._currentPatrolIndex + 1) % this._patrolPoints.length;
        this._patrolWaitTimer = this._patrolPoints[this._currentPatrolIndex].waitTime;
      }
    } else {
      // Moverse hacia el punto
      this.moveTowards(targetPoint.position, deltaTime);
    }
  }
  
  private updateChase(deltaTime: number): void {
    if (!this._targetEntity || !this._targetEntity.isAlive) {
      this.aiState = 'return';
      this._targetEntity = null;
      return;
    }
    
    const distance = this.distanceTo(this._targetEntity);
    
    if (distance <= this.attackRange) {
      this.aiState = 'attack';
    } else {
      this.moveTowards(this._targetEntity.position, deltaTime);
    }
  }
  
  private updateAttack(): void {
    if (!this._targetEntity || !this._targetEntity.isAlive) {
      this.aiState = 'return';
      this._targetEntity = null;
      return;
    }
    
    const distance = this.distanceTo(this._targetEntity);
    
    if (distance > this.attackRange) {
      this.aiState = 'chase';
      return;
    }
    
    // Mirar al objetivo
    this.lookAtEntity(this._targetEntity);
    
    // Intentar atacar
    if (this.canAttack) {
      this.performAttack();
    }
  }
  
  private updateFlee(deltaTime: number): void {
    if (!this._targetEntity) {
      this.aiState = 'return';
      return;
    }
    
    // Moverse en dirección opuesta al objetivo
    const fleeDirection = this.getDirectionTo(this._targetEntity).negate();
    const fleeTarget = this.position.clone().add(fleeDirection.multiplyScalar(10));
    
    this.moveTowards(fleeTarget, deltaTime);
    
    // Si recuperó salud, volver a atacar
    if (this.healthPercent > this.fleeHealthPercent + 20) {
      this.aiState = 'chase';
    }
  }
  
  private updateReturn(deltaTime: number): void {
    const distance = this.position.distanceTo(this._spawnPosition);
    
    if (distance < 1) {
      // Llegó al spawn
      this.aiState = 'idle';
      this._currentHealth = this._maxHealth; // Curar al volver
      return;
    }
    
    this.moveTowards(this._spawnPosition, deltaTime);
  }
  
  // ============================================================
  // MOVIMIENTO
  // ============================================================
  
  private moveTowards(target: THREE.Vector3, deltaTime: number): void {
    const direction = new THREE.Vector3()
      .subVectors(target, this.position)
      .normalize();
    
    this.velocity.copy(direction).multiplyScalar(this.moveSpeed);
    this.position.add(this.velocity.clone().multiplyScalar(deltaTime));
    
    // Rotar hacia la dirección de movimiento
    this.rotation.y = Math.atan2(direction.x, direction.z);
  }
  
  // ============================================================
  // COMBATE
  // ============================================================
  
  private performAttack(): void {
    if (!this._targetEntity) return;
    
    // Decidir qué habilidad usar
    const availableAbilities = Array.from(this._abilities.values()).filter(ability => {
      const now = Date.now();
      return now - ability.lastUsedTime >= ability.cooldown &&
             this._currentMana >= ability.manaCost &&
             (ability.range === 0 || this.isInRange(this._targetEntity!, ability.range));
    });
    
    if (availableAbilities.length > 0) {
      // Priorizar habilidades con daño alto
      availableAbilities.sort((a, b) => (b.damage ?? 0) - (a.damage ?? 0));
      
      // Usar la primera habilidad disponible (o aleatorio para variedad)
      const abilityToUse = Math.random() < 0.7 
        ? availableAbilities[0] 
        : availableAbilities[Math.floor(Math.random() * availableAbilities.length)];
      
      this.useAbility(abilityToUse.id);
    } else {
      // Ataque básico
      this.useAbility('basic_attack');
    }
    
    this._lastAttackTime = Date.now();
    this.state = 'attacking';
  }
  
  public setTarget(target: GameEntity | null): void {
    this._targetEntity = target;
    
    if (target && (this.aiState === 'idle' || this.aiState === 'patrol')) {
      this.aiState = 'chase';
      this.addAggro(target.id, 100); // Aggro inicial
    }
  }
  
  // ============================================================
  // EVENTOS
  // ============================================================
  
  private onAIStateChange(newState: AIState): void {
    // Cambiar estado de entidad según AI
    switch (newState) {
      case 'idle':
      case 'patrol':
        this.state = 'idle';
        break;
      case 'chase':
        this.state = 'moving';
        break;
      case 'attack':
        this.state = 'attacking';
        break;
      case 'flee':
        this.state = 'moving';
        break;
      case 'stunned':
        this.state = 'stunned';
        break;
    }
  }
  
  public override takeDamage(
    amount: number,
    source: GameEntity | null = null,
    options: {
      ignoreArmor?: boolean;
      ignoreInvulnerability?: boolean;
      isTrueDamage?: boolean;
    } = {}
  ): number {
    const damage = super.takeDamage(amount, source, options);
    
    // Agregar aggro al atacante
    if (source && damage > 0) {
      this.addAggro(source.id, damage * 1.5);
      
      // Si está idle/patrol, cambiar a chase
      if (this.aiState === 'idle' || this.aiState === 'patrol') {
        this.setTarget(source);
      }
    }
    
    return damage;
  }
  
  protected override processStatusEffectTick(effect: StatusEffect): void {
    switch (effect.type) {
      case 'poison':
      case 'bleed':
        const dotDamage = (effect.data?.damagePerTick as number) ?? 5;
        this.takeDamage(dotDamage * effect.stacks, null, { isTrueDamage: true });
        break;
      case 'burn':
        const burnDamage = (effect.data?.damagePerTick as number) ?? 8;
        this.takeDamage(burnDamage * effect.stacks, null);
        break;
      case 'regen':
        const healAmount = (effect.data?.healPerTick as number) ?? 10;
        this.heal(healAmount * effect.stacks, null);
        break;
    }
  }
  
  // ============================================================
  // SERIALIZACIÓN
  // ============================================================
  
  public override serialize(): Record<string, unknown> {
    return {
      ...super.serialize(),
      enemyType: this.enemyType,
      tier: this.tier,
      behavior: this.behavior,
      element: this.element,
      experienceValue: this.experienceValue,
      goldValue: this.goldValue,
      lootTable: this.lootTable,
      aiState: this._aiState,
      targetId: this._targetEntity?.id ?? null,
      spawnPosition: {
        x: this._spawnPosition.x,
        y: this._spawnPosition.y,
        z: this._spawnPosition.z,
      },
    };
  }
}
