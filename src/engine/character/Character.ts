/**
 * Character - Clase principal de personaje del jugador
 */

import * as THREE from 'three';
import { GameEntity, type StatusEffect } from '../entities/GameEntity';
import type { CharacterClass, CharacterStats, Equipment } from '../../types';
import { 
  calculateDamage, 
  type DamageType, 
  type AttackType 
} from '../rpg/rpg-calculator';
import { 
  addExperience, 
  createInitialProgression, 
  getLevelProgress,
  type CharacterProgression, 
  type LevelUpResult 
} from '../rpg/leveling-system';

// ============================================================
// TIPOS
// ============================================================

export type CharacterState = 
  | 'idle'
  | 'walking'
  | 'running'
  | 'jumping'
  | 'falling'
  | 'attacking'
  | 'casting'
  | 'dodging'
  | 'blocking'
  | 'stunned'
  | 'dead';

export interface CharacterAbility {
  id: string;
  name: string;
  description: string;
  cooldown: number;
  currentCooldown: number;
  manaCost: number;
  damage?: number;
  damageType?: DamageType;
  attackType?: AttackType;
  range: number;
  castTime: number;
  animation?: string;
  icon?: string;
  unlockLevel: number;
}

export interface CharacterConfig {
  name: string;
  characterClass: CharacterClass;
  baseStats: CharacterStats;
  level?: number;
  position?: THREE.Vector3;
  equipment?: Equipment;
}

// ============================================================
// CLASE CHARACTER
// ============================================================

export class Character extends GameEntity {
  // Clase y progresión
  public readonly characterClass: CharacterClass;
  private _progression: CharacterProgression;
  
  // Estado actual
  private _characterState: CharacterState = 'idle';
  private _isGrounded: boolean = true;
  private _isMoving: boolean = false;
  
  // Movimiento
  public walkSpeed: number = 4;
  public runSpeed: number = 8;
  public jumpForce: number = 10;
  public gravity: number = -30;
  
  // Equipo
  private _equipment: Equipment;
  private _baseStats: CharacterStats;
  private _totalStats: CharacterStats;
  
  // Habilidades
  private _abilities: Map<string, CharacterAbility> = new Map();
  private _globalCooldown: number = 0;
  private _castingAbility: string | null = null;
  private _castProgress: number = 0;
  
  // Combate
  private _comboCount: number = 0;
  private _comboTimer: number = 0;
  private _lastAttackTime: number = 0;
  
  // Recursos secundarios (stamina, etc.)
  private _stamina: number = 100;
  private _maxStamina: number = 100;
  private _staminaRegenRate: number = 10; // por segundo
  
  // Eventos extendidos
  public onLevelUp?: (result: LevelUpResult) => void;
  public onAbilityUse?: (abilityId: string) => void;
  public onComboIncrease?: (count: number) => void;
  public onEquipmentChange?: (slot: keyof Equipment, itemId: string | null) => void;
  
  // ============================================================
  // CONSTRUCTOR
  // ============================================================
  
  constructor(config: CharacterConfig) {
    const level = config.level ?? 1;
    
    super(
      `player_${Date.now()}`,
      'player',
      config.name,
      level,
      config.baseStats,
      config.position ?? new THREE.Vector3()
    );
    
    this.characterClass = config.characterClass;
    this._baseStats = { ...config.baseStats };
    this._equipment = config.equipment ?? this.createEmptyEquipment();
    
    // Inicializar progresión
    this._progression = createInitialProgression(config.characterClass);
    this._progression.level = level;
    
    // Calcular stats totales
    this._totalStats = this.calculateTotalStats();
    this.stats = { ...this._totalStats };
    
    // Recalcular salud/maná con stats totales
    this._maxHealth = this.calculateMaxHealth();
    this._currentHealth = this._maxHealth;
    this._maxMana = this.calculateMaxMana();
    this._currentMana = this._maxMana;
    
    // Cargar habilidades
    this.loadClassAbilities();
  }
  
  // ============================================================
  // GETTERS Y SETTERS
  // ============================================================
  
  get characterState(): CharacterState {
    return this._characterState;
  }
  
  set characterState(state: CharacterState) {
    if (this._characterState !== state) {
      this._characterState = state;
    }
  }
  
  get isGrounded(): boolean {
    return this._isGrounded;
  }
  
  set isGrounded(value: boolean) {
    this._isGrounded = value;
  }
  
  get isMoving(): boolean {
    return this._isMoving;
  }
  
  get lastAttackTime(): number {
    return this._lastAttackTime;
  }
  
  get progression(): CharacterProgression {
    return { ...this._progression };
  }
  
  get levelProgress(): number {
    return getLevelProgress(this._progression);
  }
  
  get stamina(): number {
    return this._stamina;
  }
  
  get maxStamina(): number {
    return this._maxStamina;
  }
  
  get equipment(): Equipment {
    return { ...this._equipment };
  }
  
  get totalStats(): CharacterStats {
    return { ...this._totalStats };
  }
  
  get abilities(): CharacterAbility[] {
    return Array.from(this._abilities.values());
  }
  
  get comboCount(): number {
    return this._comboCount;
  }
  
  get isCasting(): boolean {
    return this._castingAbility !== null;
  }
  
  get castProgress(): number {
    return this._castProgress;
  }
  
  // ============================================================
  // EQUIPO
  // ============================================================
  
  private createEmptyEquipment(): Equipment {
    return {
      weapon: null,
      helmet: null,
      armor: null,
      gloves: null,
      boots: null,
      accessory1: null,
      accessory2: null,
    };
  }
  
  public equip(slot: keyof Equipment, itemId: string | null): void {
    const previousItem = this._equipment[slot];
    this._equipment[slot] = itemId;
    
    // Recalcular stats
    this._totalStats = this.calculateTotalStats();
    this.stats = { ...this._totalStats };
    this.recalculateStats();
    
    this.onEquipmentChange?.(slot, itemId);
    
    if (previousItem !== itemId) {
      console.log(`[Character] Equipped ${itemId} in ${slot}`);
    }
  }
  
  public unequip(slot: keyof Equipment): void {
    this.equip(slot, null);
  }
  
  private calculateTotalStats(): CharacterStats {
    // Empezar con stats base
    const total = { ...this._baseStats };
    
    // Aquí se añadirían los stats de equipo
    // Por ahora solo usamos stats base
    
    return total;
  }
  
  // ============================================================
  // HABILIDADES
  // ============================================================
  
  private loadClassAbilities(): void {
    // Habilidades comunes
    this.registerAbility({
      id: 'basic_attack',
      name: 'Ataque Básico',
      description: 'Un ataque básico con tu arma.',
      cooldown: 0,
      currentCooldown: 0,
      manaCost: 0,
      damage: this._totalStats.attack,
      damageType: 'physical',
      attackType: 'melee',
      range: 2,
      castTime: 0,
      animation: 'attack1',
      unlockLevel: 1,
    });
    
    // Habilidades específicas de clase
    switch (this.characterClass) {
      case 'warrior':
        this.loadWarriorAbilities();
        break;
      case 'mage':
        this.loadMageAbilities();
        break;
      case 'rogue':
        this.loadRogueAbilities();
        break;
      case 'archer':
        this.loadArcherAbilities();
        break;
      case 'paladin':
        this.loadPaladinAbilities();
        break;
      case 'necromancer':
        this.loadNecromancerAbilities();
        break;
      case 'berserker':
        this.loadBerserkerAbilities();
        break;
      case 'monk':
        this.loadMonkAbilities();
        break;
    }
  }
  
  private loadWarriorAbilities(): void {
    this.registerAbility({
      id: 'slash',
      name: 'Tajo',
      description: 'Un poderoso tajo horizontal.',
      cooldown: 3000,
      currentCooldown: 0,
      manaCost: 10,
      damage: this._totalStats.attack * 1.5,
      damageType: 'physical',
      attackType: 'melee',
      range: 2.5,
      castTime: 0,
      animation: 'slash',
      unlockLevel: 1,
    });
    
    this.registerAbility({
      id: 'shield_bash',
      name: 'Golpe de Escudo',
      description: 'Golpea con el escudo, aturdiendo al enemigo.',
      cooldown: 8000,
      currentCooldown: 0,
      manaCost: 15,
      damage: this._totalStats.attack * 0.8,
      damageType: 'physical',
      attackType: 'melee',
      range: 2,
      castTime: 0,
      animation: 'shieldBash',
      unlockLevel: 5,
    });
    
    this.registerAbility({
      id: 'whirlwind',
      name: 'Torbellino',
      description: 'Gira dañando a todos los enemigos cercanos.',
      cooldown: 12000,
      currentCooldown: 0,
      manaCost: 30,
      damage: this._totalStats.attack * 1.2,
      damageType: 'physical',
      attackType: 'melee',
      range: 4,
      castTime: 0,
      animation: 'whirlwind',
      unlockLevel: 20,
    });
  }
  
  private loadMageAbilities(): void {
    this.registerAbility({
      id: 'magic_missile',
      name: 'Misil Mágico',
      description: 'Dispara un proyectil mágico.',
      cooldown: 1500,
      currentCooldown: 0,
      manaCost: 8,
      damage: this._totalStats.magicAttack * 1.2,
      damageType: 'arcane',
      attackType: 'ranged',
      range: 15,
      castTime: 500,
      animation: 'cast1',
      unlockLevel: 1,
    });
    
    this.registerAbility({
      id: 'fireball',
      name: 'Bola de Fuego',
      description: 'Lanza una bola de fuego explosiva.',
      cooldown: 5000,
      currentCooldown: 0,
      manaCost: 25,
      damage: this._totalStats.magicAttack * 2,
      damageType: 'fire',
      attackType: 'ranged',
      range: 20,
      castTime: 1000,
      animation: 'castFire',
      unlockLevel: 5,
    });
    
    this.registerAbility({
      id: 'frost_nova',
      name: 'Nova de Escarcha',
      description: 'Congela a todos los enemigos cercanos.',
      cooldown: 15000,
      currentCooldown: 0,
      manaCost: 40,
      damage: this._totalStats.magicAttack * 1.5,
      damageType: 'ice',
      attackType: 'melee',
      range: 8,
      castTime: 500,
      animation: 'frostNova',
      unlockLevel: 10,
    });
  }
  
  private loadRogueAbilities(): void {
    this.registerAbility({
      id: 'backstab',
      name: 'Puñalada Trasera',
      description: 'Ataque crítico desde atrás.',
      cooldown: 6000,
      currentCooldown: 0,
      manaCost: 15,
      damage: this._totalStats.attack * 2.5,
      damageType: 'physical',
      attackType: 'melee',
      range: 2,
      castTime: 0,
      animation: 'backstab',
      unlockLevel: 1,
    });
  }
  
  private loadArcherAbilities(): void {
    this.registerAbility({
      id: 'aimed_shot',
      name: 'Disparo Apuntado',
      description: 'Disparo de alta precisión.',
      cooldown: 4000,
      currentCooldown: 0,
      manaCost: 12,
      damage: this._totalStats.attack * 1.8,
      damageType: 'physical',
      attackType: 'ranged',
      range: 30,
      castTime: 800,
      animation: 'aimedShot',
      unlockLevel: 1,
    });
  }
  
  private loadPaladinAbilities(): void {
    this.registerAbility({
      id: 'holy_strike',
      name: 'Golpe Sagrado',
      description: 'Infunde luz sagrada en tu arma.',
      cooldown: 4000,
      currentCooldown: 0,
      manaCost: 15,
      damage: this._totalStats.attack * 1.3 + this._totalStats.magicAttack * 0.5,
      damageType: 'light',
      attackType: 'melee',
      range: 2.5,
      castTime: 0,
      animation: 'holyStrike',
      unlockLevel: 1,
    });
  }
  
  private loadNecromancerAbilities(): void {
    this.registerAbility({
      id: 'shadow_bolt',
      name: 'Rayo de Sombra',
      description: 'Proyectil de energía oscura.',
      cooldown: 2000,
      currentCooldown: 0,
      manaCost: 10,
      damage: this._totalStats.magicAttack * 1.3,
      damageType: 'dark',
      attackType: 'ranged',
      range: 18,
      castTime: 600,
      animation: 'shadowBolt',
      unlockLevel: 1,
    });
  }
  
  private loadBerserkerAbilities(): void {
    this.registerAbility({
      id: 'savage_strike',
      name: 'Golpe Salvaje',
      description: 'Un golpe brutal con fuerza bruta.',
      cooldown: 3000,
      currentCooldown: 0,
      manaCost: 5,
      damage: this._totalStats.attack * 1.8,
      damageType: 'physical',
      attackType: 'melee',
      range: 3,
      castTime: 0,
      animation: 'savageStrike',
      unlockLevel: 1,
    });
  }
  
  private loadMonkAbilities(): void {
    this.registerAbility({
      id: 'palm_strike',
      name: 'Golpe de Palma',
      description: 'Golpe rápido con la palma.',
      cooldown: 2000,
      currentCooldown: 0,
      manaCost: 8,
      damage: this._totalStats.attack * 1.2,
      damageType: 'physical',
      attackType: 'melee',
      range: 2,
      castTime: 0,
      animation: 'palmStrike',
      unlockLevel: 1,
    });
  }
  
  private registerAbility(ability: CharacterAbility): void {
    if (this.level >= ability.unlockLevel) {
      this._abilities.set(ability.id, ability);
    }
  }
  
  public useAbility(abilityId: string, target?: GameEntity): boolean {
    const ability = this._abilities.get(abilityId);
    if (!ability) return false;
    
    // Verificar cooldown
    if (ability.currentCooldown > 0) return false;
    
    // Verificar GCD
    if (this._globalCooldown > 0) return false;
    
    // Verificar maná
    if (!this.useMana(ability.manaCost)) return false;
    
    // Si tiene tiempo de casteo
    if (ability.castTime > 0) {
      this._castingAbility = abilityId;
      this._castProgress = 0;
      this.characterState = 'casting';
      return true;
    }
    
    // Ejecutar inmediatamente
    this.executeAbility(ability, target);
    return true;
  }
  
  private executeAbility(ability: CharacterAbility, target?: GameEntity): void {
    // Aplicar cooldown
    ability.currentCooldown = ability.cooldown;
    this._globalCooldown = 500;
    
    // Calcular y aplicar daño si tiene
    if (ability.damage && target) {
      const result = calculateDamage(
        this._totalStats,
        target.stats,
        {
          damageType: ability.damageType ?? 'physical',
          attackType: ability.attackType ?? 'melee',
          attackerClass: this.characterClass,
          skillMultiplier: ability.damage / 100, // Convertir daño a multiplicador
        }
      );
      
      target.takeDamage(result.finalDamage, this, {
        damageType: ability.damageType,
      } as { damageType?: DamageType; ignoreArmor?: boolean; ignoreInvulnerability?: boolean; isTrueDamage?: boolean });
      
      this._lastAttackTime = Date.now();
    }
    
    // Incrementar combo
    this.incrementCombo();
    
    this.onAbilityUse?.(ability.id);
    this._castingAbility = null;
    this._castProgress = 0;
  }
  
  public cancelCast(): void {
    if (this._castingAbility) {
      // Devolver maná parcialmente
      const ability = this._abilities.get(this._castingAbility);
      if (ability) {
        this.restoreMana(Math.floor(ability.manaCost * 0.5));
      }
      
      this._castingAbility = null;
      this._castProgress = 0;
      this.characterState = 'idle';
    }
  }
  
  public getAbilityCooldown(abilityId: string): number {
    const ability = this._abilities.get(abilityId);
    return ability?.currentCooldown ?? 0;
  }
  
  // ============================================================
  // COMBOS
  // ============================================================
  
  private incrementCombo(): void {
    this._comboCount++;
    this._comboTimer = 3000; // 3 segundos para mantener combo
    this.onComboIncrease?.(this._comboCount);
  }
  
  private updateCombo(deltaTime: number): void {
    if (this._comboTimer > 0) {
      this._comboTimer -= deltaTime * 1000;
      if (this._comboTimer <= 0) {
        this._comboCount = 0;
        this._comboTimer = 0;
      }
    }
  }
  
  // ============================================================
  // EXPERIENCIA Y NIVEL
  // ============================================================
  
  public gainExperience(amount: number): LevelUpResult[] {
    const { newProgression, levelUps } = addExperience(
      this._progression,
      this.characterClass,
      amount
    );
    
    this._progression = newProgression;
    
    // Aplicar mejoras de nivel
    for (const levelUp of levelUps) {
      this.applyLevelUp(levelUp);
    }
    
    return levelUps;
  }
  
  private applyLevelUp(levelUp: LevelUpResult): void {
    this.level = levelUp.newLevel;
    
    // Aplicar ganancia de stats
    if (levelUp.statGains) {
      for (const [stat, value] of Object.entries(levelUp.statGains)) {
        if (value && stat in this._baseStats) {
          (this._baseStats as unknown as Record<string, number>)[stat] += value;
        }
      }
    }
    
    // Recalcular stats totales
    this._totalStats = this.calculateTotalStats();
    this.stats = { ...this._totalStats };
    this.recalculateStats();
    
    // Restaurar salud y maná al subir nivel
    this._currentHealth = this._maxHealth;
    this._currentMana = this._maxMana;
    
    // Desbloquear nuevas habilidades
    for (const abilityId of levelUp.unlockedAbilities) {
      console.log(`[Character] Unlocked ability: ${abilityId}`);
    }
    
    // Recargar habilidades
    this.loadClassAbilities();
    
    this.onLevelUp?.(levelUp);
    console.log(`[Character] Level up! Now level ${levelUp.newLevel}`);
  }
  
  // ============================================================
  // STAMINA
  // ============================================================
  
  public useStamina(amount: number): boolean {
    if (this._stamina < amount) return false;
    this._stamina -= amount;
    return true;
  }
  
  public restoreStamina(amount: number): void {
    this._stamina = Math.min(this._maxStamina, this._stamina + amount);
  }
  
  private updateStamina(deltaTime: number): void {
    if (this._stamina < this._maxStamina && !this._isMoving) {
      this._stamina = Math.min(
        this._maxStamina,
        this._stamina + this._staminaRegenRate * deltaTime
      );
    }
  }
  
  // ============================================================
  // MOVIMIENTO
  // ============================================================
  
  public move(direction: THREE.Vector3, isRunning: boolean = false): void {
    if (!this.isAlive) return;
    if (this.characterState === 'stunned' || this.characterState === 'casting') return;
    
    const speed = isRunning ? this.runSpeed : this.walkSpeed;
    
    if (isRunning && !this.useStamina(0.1)) {
      // Sin stamina, caminar
      this.velocity.copy(direction.normalize().multiplyScalar(this.walkSpeed));
      this._isMoving = true;
      this.characterState = 'walking';
    } else {
      this.velocity.copy(direction.normalize().multiplyScalar(speed));
      this._isMoving = direction.lengthSq() > 0.001;
      this.characterState = this._isMoving 
        ? (isRunning ? 'running' : 'walking')
        : 'idle';
    }
  }
  
  public jump(): boolean {
    if (!this._isGrounded) return false;
    if (!this.useStamina(10)) return false;
    
    this.velocity.y = this.jumpForce;
    this._isGrounded = false;
    this.characterState = 'jumping';
    
    return true;
  }
  
  public dodge(direction: THREE.Vector3): boolean {
    if (!this.useStamina(25)) return false;
    if (this.characterState === 'stunned') return false;
    
    // Impulso en la dirección
    this.velocity.copy(direction.normalize().multiplyScalar(this.runSpeed * 2));
    this.characterState = 'dodging';
    
    // Pequeña invulnerabilidad
    this.grantInvulnerability(300);
    
    // Volver a idle después
    setTimeout(() => {
      if (this.characterState === 'dodging') {
        this.characterState = 'idle';
      }
    }, 300);
    
    return true;
  }
  
  // ============================================================
  // UPDATE
  // ============================================================
  
  public override update(deltaTime: number): void {
    if (!this.isAlive) return;
    
    super.update(deltaTime);
    
    // Actualizar cooldowns
    this.updateCooldowns(deltaTime);
    
    // Actualizar combo
    this.updateCombo(deltaTime);
    
    // Actualizar stamina
    this.updateStamina(deltaTime);
    
    // Actualizar casting
    this.updateCasting(deltaTime);
    
    // Aplicar gravedad
    if (!this._isGrounded) {
      this.velocity.y += this.gravity * deltaTime;
      
      if (this.velocity.y < 0 && this.characterState === 'jumping') {
        this.characterState = 'falling';
      }
    }
    
    // Actualizar estado de movimiento
    if (Math.abs(this.velocity.x) < 0.1 && Math.abs(this.velocity.z) < 0.1) {
      this._isMoving = false;
      if (this._isGrounded && 
          this.characterState !== 'attacking' && 
          this.characterState !== 'casting') {
        this.characterState = 'idle';
      }
    }
  }
  
  private updateCooldowns(deltaTime: number): void {
    // Global cooldown
    if (this._globalCooldown > 0) {
      this._globalCooldown -= deltaTime * 1000;
    }
    
    // Cooldowns de habilidades
    this._abilities.forEach(ability => {
      if (ability.currentCooldown > 0) {
        ability.currentCooldown -= deltaTime * 1000;
        if (ability.currentCooldown < 0) {
          ability.currentCooldown = 0;
        }
      }
    });
  }
  
  private updateCasting(deltaTime: number): void {
    if (!this._castingAbility) return;
    
    const ability = this._abilities.get(this._castingAbility);
    if (!ability) return;
    
    this._castProgress += (deltaTime * 1000) / ability.castTime;
    
    if (this._castProgress >= 1) {
      this.executeAbility(ability);
    }
  }
  
  // ============================================================
  // STATUS EFFECTS
  // ============================================================
  
  protected override processStatusEffectTick(effect: StatusEffect): void {
    switch (effect.type) {
      case 'poison':
      case 'bleed':
        const dotDamage = (effect.data?.damagePerTick as number) ?? 5;
        this.takeDamage(dotDamage * effect.stacks, null, { isTrueDamage: true });
        break;
      case 'regen':
        const healAmount = (effect.data?.healPerTick as number) ?? 10;
        this.heal(healAmount * effect.stacks, null);
        break;
      case 'manaRegen':
        const manaAmount = (effect.data?.manaPerTick as number) ?? 5;
        this.restoreMana(manaAmount * effect.stacks);
        break;
    }
  }
  
  // ============================================================
  // SERIALIZACIÓN
  // ============================================================
  
  public override serialize(): Record<string, unknown> {
    return {
      ...super.serialize(),
      characterClass: this.characterClass,
      progression: { ...this._progression },
      equipment: { ...this._equipment },
      baseStats: { ...this._baseStats },
      stamina: this._stamina,
      maxStamina: this._maxStamina,
    };
  }
  
  /**
   * Restaura un personaje desde datos guardados
   */
  public static fromSaveData(data: Record<string, unknown>): Character {
    const config: CharacterConfig = {
      name: data.name as string,
      characterClass: data.characterClass as CharacterClass,
      baseStats: data.baseStats as CharacterStats,
      level: data.level as number,
      position: new THREE.Vector3(
        (data.position as { x: number; y: number; z: number }).x,
        (data.position as { x: number; y: number; z: number }).y,
        (data.position as { x: number; y: number; z: number }).z
      ),
      equipment: data.equipment as Equipment,
    };
    
    const character = new Character(config);
    
    // Restaurar estado
    character._currentHealth = data.currentHealth as number;
    character._currentMana = data.currentMana as number;
    character._stamina = data.stamina as number;
    character._progression = data.progression as CharacterProgression;
    
    return character;
  }
}
