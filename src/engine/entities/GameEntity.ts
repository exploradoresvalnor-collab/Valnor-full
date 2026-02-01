/**
 * GameEntity - Clase base para todas las entidades del juego
 */

import * as THREE from 'three';
import type { CharacterStats } from '../../types';

// ============================================================
// TIPOS
// ============================================================

export type EntityState = 
  | 'idle'
  | 'moving'
  | 'attacking'
  | 'casting'
  | 'stunned'
  | 'frozen'
  | 'dead'
  | 'spawning'
  | 'despawning';

export type EntityType = 
  | 'player'
  | 'enemy'
  | 'npc'
  | 'boss'
  | 'object'
  | 'projectile';

export interface StatusEffect {
  id: string;
  type: string;
  duration: number;
  remainingDuration: number;
  stacks: number;
  maxStacks: number;
  tickInterval: number;
  lastTickTime: number;
  source: string;
  data?: Record<string, unknown>;
}

export interface EntityEvents {
  onDamage?: (amount: number, source: GameEntity | null) => void;
  onHeal?: (amount: number, source: GameEntity | null) => void;
  onDeath?: (killer: GameEntity | null) => void;
  onSpawn?: () => void;
  onStateChange?: (newState: EntityState, oldState: EntityState) => void;
  onStatusEffectApply?: (effect: StatusEffect) => void;
  onStatusEffectRemove?: (effect: StatusEffect) => void;
}

// ============================================================
// CLASE BASE
// ============================================================

export abstract class GameEntity {
  // Identificación
  public readonly id: string;
  public readonly type: EntityType;
  public name: string;
  
  // Posición y rotación
  public position: THREE.Vector3;
  public rotation: THREE.Euler;
  public velocity: THREE.Vector3;
  
  // Estado
  protected _state: EntityState = 'idle';
  protected _isAlive: boolean = true;
  
  // Stats
  public level: number;
  public stats: CharacterStats;
  
  // Salud y recursos
  protected _currentHealth: number;
  protected _maxHealth: number;
  protected _currentMana: number;
  protected _maxMana: number;
  
  // Efectos de estado
  protected _statusEffects: Map<string, StatusEffect> = new Map();
  
  // Eventos
  protected events: EntityEvents = {};
  
  // Timers
  protected lastUpdateTime: number = 0;
  protected invulnerableUntil: number = 0;
  
  // Físicas
  public hitboxRadius: number = 0.5;
  public hitboxHeight: number = 1.8;
  
  // Visual
  public visible: boolean = true;
  public opacity: number = 1;
  
  // ============================================================
  // CONSTRUCTOR
  // ============================================================
  
  constructor(
    id: string,
    type: EntityType,
    name: string,
    level: number,
    stats: CharacterStats,
    position: THREE.Vector3 = new THREE.Vector3()
  ) {
    this.id = id;
    this.type = type;
    this.name = name;
    this.level = level;
    this.stats = { ...stats };
    
    this.position = position.clone();
    this.rotation = new THREE.Euler();
    this.velocity = new THREE.Vector3();
    
    // Calcular salud y maná máximos
    this._maxHealth = this.calculateMaxHealth();
    this._currentHealth = this._maxHealth;
    this._maxMana = this.calculateMaxMana();
    this._currentMana = this._maxMana;
    
    this.lastUpdateTime = Date.now();
  }
  
  // ============================================================
  // GETTERS Y SETTERS
  // ============================================================
  
  get state(): EntityState {
    return this._state;
  }
  
  set state(newState: EntityState) {
    if (this._state !== newState) {
      const oldState = this._state;
      this._state = newState;
      this.events.onStateChange?.(newState, oldState);
    }
  }
  
  get isAlive(): boolean {
    return this._isAlive && this._currentHealth > 0;
  }
  
  get currentHealth(): number {
    return this._currentHealth;
  }
  
  get maxHealth(): number {
    return this._maxHealth;
  }
  
  get currentMana(): number {
    return this._currentMana;
  }
  
  get maxMana(): number {
    return this._maxMana;
  }
  
  get healthPercent(): number {
    return (this._currentHealth / this._maxHealth) * 100;
  }
  
  get manaPercent(): number {
    return this._maxMana > 0 ? (this._currentMana / this._maxMana) * 100 : 0;
  }
  
  get isInvulnerable(): boolean {
    return Date.now() < this.invulnerableUntil;
  }
  
  get statusEffects(): StatusEffect[] {
    return Array.from(this._statusEffects.values());
  }
  
  // ============================================================
  // CÁLCULOS DE STATS
  // ============================================================
  
  protected calculateMaxHealth(): number {
    return this.stats.vitality * 10 + 50 + this.level * 5;
  }
  
  protected calculateMaxMana(): number {
    return this.stats.intelligence * 5 + 20 + this.level * 2;
  }
  
  /**
   * Recalcula stats máximos (llamar después de buff/debuff)
   */
  public recalculateStats(): void {
    const oldMaxHealth = this._maxHealth;
    const oldMaxMana = this._maxMana;
    
    this._maxHealth = this.calculateMaxHealth();
    this._maxMana = this.calculateMaxMana();
    
    // Ajustar current si max cambió
    if (this._maxHealth !== oldMaxHealth) {
      const ratio = this._currentHealth / oldMaxHealth;
      this._currentHealth = Math.floor(this._maxHealth * ratio);
    }
    
    if (this._maxMana !== oldMaxMana) {
      const ratio = this._currentMana / oldMaxMana;
      this._currentMana = Math.floor(this._maxMana * ratio);
    }
  }
  
  // ============================================================
  // DAÑO Y CURACIÓN
  // ============================================================
  
  /**
   * Aplica daño a la entidad
   */
  public takeDamage(
    amount: number,
    source: GameEntity | null = null,
    options: {
      ignoreArmor?: boolean;
      ignoreInvulnerability?: boolean;
      isTrueDamage?: boolean;
    } = {}
  ): number {
    if (!this._isAlive) return 0;
    
    // Verificar invulnerabilidad
    if (!options.ignoreInvulnerability && this.isInvulnerable) {
      return 0;
    }
    
    let finalDamage = amount;
    
    // Aplicar defensa si no es daño verdadero
    if (!options.isTrueDamage && !options.ignoreArmor) {
      const damageReduction = this.stats.defense / (this.stats.defense + 100);
      finalDamage = Math.floor(amount * (1 - damageReduction));
    }
    
    // Mínimo 1 de daño
    finalDamage = Math.max(1, finalDamage);
    
    // Aplicar daño
    this._currentHealth = Math.max(0, this._currentHealth - finalDamage);
    
    // Evento de daño
    this.events.onDamage?.(finalDamage, source);
    
    // Verificar muerte
    if (this._currentHealth <= 0) {
      this.die(source);
    }
    
    return finalDamage;
  }
  
  /**
   * Cura a la entidad
   */
  public heal(
    amount: number,
    source: GameEntity | null = null,
    options: {
      canOverheal?: boolean;
    } = {}
  ): number {
    if (!this._isAlive) return 0;
    
    const maxHeal = options.canOverheal 
      ? this._maxHealth * 1.2 
      : this._maxHealth;
    
    const actualHeal = Math.min(amount, maxHeal - this._currentHealth);
    
    if (actualHeal > 0) {
      this._currentHealth = Math.min(maxHeal, this._currentHealth + actualHeal);
      this.events.onHeal?.(actualHeal, source);
    }
    
    return actualHeal;
  }
  
  /**
   * Consume maná
   */
  public useMana(amount: number): boolean {
    if (this._currentMana < amount) return false;
    
    this._currentMana -= amount;
    return true;
  }
  
  /**
   * Restaura maná
   */
  public restoreMana(amount: number): number {
    const actualRestore = Math.min(amount, this._maxMana - this._currentMana);
    this._currentMana = Math.min(this._maxMana, this._currentMana + actualRestore);
    return actualRestore;
  }
  
  // ============================================================
  // ESTADOS Y EFECTOS
  // ============================================================
  
  /**
   * Aplica un efecto de estado
   */
  public applyStatusEffect(effect: StatusEffect): boolean {
    const existing = this._statusEffects.get(effect.id);
    
    if (existing) {
      // Stackear o refrescar duración
      if (existing.stacks < existing.maxStacks) {
        existing.stacks++;
      }
      existing.remainingDuration = Math.max(
        existing.remainingDuration,
        effect.duration
      );
      return true;
    }
    
    // Nuevo efecto
    this._statusEffects.set(effect.id, { ...effect });
    this.events.onStatusEffectApply?.(effect);
    
    return true;
  }
  
  /**
   * Remueve un efecto de estado
   */
  public removeStatusEffect(effectId: string): boolean {
    const effect = this._statusEffects.get(effectId);
    if (!effect) return false;
    
    this._statusEffects.delete(effectId);
    this.events.onStatusEffectRemove?.(effect);
    
    return true;
  }
  
  /**
   * Verifica si tiene un efecto
   */
  public hasStatusEffect(effectId: string): boolean {
    return this._statusEffects.has(effectId);
  }
  
  /**
   * Limpia todos los efectos de estado
   */
  public clearStatusEffects(): void {
    for (const effectId of this._statusEffects.keys()) {
      this.removeStatusEffect(effectId);
    }
  }
  
  /**
   * Otorga invulnerabilidad temporal
   */
  public grantInvulnerability(duration: number): void {
    this.invulnerableUntil = Math.max(
      this.invulnerableUntil,
      Date.now() + duration
    );
  }
  
  // ============================================================
  // CICLO DE VIDA
  // ============================================================
  
  /**
   * Mata a la entidad
   */
  public die(killer: GameEntity | null = null): void {
    if (!this._isAlive) return;
    
    this._isAlive = false;
    this._currentHealth = 0;
    this.state = 'dead';
    
    this.clearStatusEffects();
    this.events.onDeath?.(killer);
  }
  
  /**
   * Revive a la entidad
   */
  public revive(healthPercent: number = 100): void {
    if (this._isAlive) return;
    
    this._isAlive = true;
    this._currentHealth = Math.floor(this._maxHealth * (healthPercent / 100));
    this._currentMana = Math.floor(this._maxMana * 0.5);
    this.state = 'idle';
  }
  
  /**
   * Spawn de la entidad
   */
  public spawn(position?: THREE.Vector3): void {
    if (position) {
      this.position.copy(position);
    }
    
    this._isAlive = true;
    this._currentHealth = this._maxHealth;
    this._currentMana = this._maxMana;
    this.state = 'spawning';
    
    this.clearStatusEffects();
    this.events.onSpawn?.();
    
    // Después de un pequeño delay, cambiar a idle
    setTimeout(() => {
      if (this.state === 'spawning') {
        this.state = 'idle';
      }
    }, 500);
  }
  
  // ============================================================
  // UPDATE
  // ============================================================
  
  /**
   * Actualiza la entidad (llamar cada frame)
   */
  public update(deltaTime: number): void {
    if (!this._isAlive) return;
    
    const now = Date.now();
    
    // Actualizar efectos de estado
    this.updateStatusEffects(deltaTime, now);
    
    // Actualizar posición
    if (this.velocity.lengthSq() > 0.001) {
      this.position.add(
        this.velocity.clone().multiplyScalar(deltaTime)
      );
    }
    
    this.lastUpdateTime = now;
  }
  
  /**
   * Actualiza efectos de estado
   */
  protected updateStatusEffects(_deltaTime: number, now: number): void {
    for (const [effectId, effect] of this._statusEffects) {
      // Reducir duración
      effect.remainingDuration -= _deltaTime * 1000;
      
      // Tick de daño/heal periódico
      if (effect.tickInterval > 0 && now - effect.lastTickTime >= effect.tickInterval) {
        this.processStatusEffectTick(effect);
        effect.lastTickTime = now;
      }
      
      // Remover si expiró
      if (effect.remainingDuration <= 0) {
        this.removeStatusEffect(effectId);
      }
    }
  }
  
  /**
   * Procesa tick de efecto (override en subclases)
   */
  protected processStatusEffectTick(_effect: StatusEffect): void {
    // Implementar en subclases
  }
  
  // ============================================================
  // UTILIDADES
  // ============================================================
  
  /**
   * Calcula distancia a otra entidad
   */
  public distanceTo(other: GameEntity): number {
    return this.position.distanceTo(other.position);
  }
  
  /**
   * Mira hacia una posición
   */
  public lookAt(target: THREE.Vector3): void {
    const direction = new THREE.Vector3()
      .subVectors(target, this.position)
      .normalize();
    
    this.rotation.y = Math.atan2(direction.x, direction.z);
  }
  
  /**
   * Mira hacia otra entidad
   */
  public lookAtEntity(target: GameEntity): void {
    this.lookAt(target.position);
  }
  
  /**
   * Verifica si está dentro de rango de otra entidad
   */
  public isInRange(target: GameEntity, range: number): boolean {
    return this.distanceTo(target) <= range;
  }
  
  /**
   * Obtiene dirección hacia otra entidad
   */
  public getDirectionTo(target: GameEntity): THREE.Vector3 {
    return new THREE.Vector3()
      .subVectors(target.position, this.position)
      .normalize();
  }
  
  /**
   * Serializa para guardado
   */
  public serialize(): Record<string, unknown> {
    return {
      id: this.id,
      type: this.type,
      name: this.name,
      level: this.level,
      stats: { ...this.stats },
      position: { x: this.position.x, y: this.position.y, z: this.position.z },
      rotation: { x: this.rotation.x, y: this.rotation.y, z: this.rotation.z },
      currentHealth: this._currentHealth,
      maxHealth: this._maxHealth,
      currentMana: this._currentMana,
      maxMana: this._maxMana,
      isAlive: this._isAlive,
      state: this._state,
    };
  }
  
  /**
   * Registra eventos
   */
  public setEvents(events: EntityEvents): void {
    this.events = { ...this.events, ...events };
  }
}
