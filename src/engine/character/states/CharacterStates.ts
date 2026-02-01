/**
 * Character States - Máquina de estados del personaje
 */

import type { Character, CharacterState } from '../Character';

// ============================================================
// INTERFAZ BASE DE ESTADO
// ============================================================

export interface ICharacterState {
  name: CharacterState;
  canEnter(character: Character, fromState: CharacterState): boolean;
  onEnter(character: Character): void;
  onExit(character: Character): void;
  update(character: Character, deltaTime: number): void;
  canTransitionTo(targetState: CharacterState): boolean;
}

// ============================================================
// ESTADOS CONCRETOS
// ============================================================

export class IdleState implements ICharacterState {
  name: CharacterState = 'idle';
  
  canEnter(character: Character, _fromState: CharacterState): boolean {
    return character.isAlive && character.isGrounded;
  }
  
  onEnter(_character: Character): void {
    // Resetear velocidad horizontal
  }
  
  onExit(_character: Character): void {
    // Nada especial
  }
  
  update(_character: Character, _deltaTime: number): void {
    // Regeneración pasiva
  }
  
  canTransitionTo(_targetState: CharacterState): boolean {
    return true; // Puede transicionar a cualquier estado
  }
}

export class WalkingState implements ICharacterState {
  name: CharacterState = 'walking';
  
  canEnter(character: Character, _fromState: CharacterState): boolean {
    return character.isAlive && character.isGrounded;
  }
  
  onEnter(_character: Character): void {
    // Iniciar animación de caminar
  }
  
  onExit(_character: Character): void {
    // Detener animación
  }
  
  update(_character: Character, _deltaTime: number): void {
    // Verificar si sigue moviéndose
  }
  
  canTransitionTo(targetState: CharacterState): boolean {
    const allowed: CharacterState[] = ['idle', 'running', 'jumping', 'attacking', 'dodging', 'stunned', 'dead'];
    return allowed.includes(targetState);
  }
}

export class RunningState implements ICharacterState {
  name: CharacterState = 'running';
  
  canEnter(character: Character, _fromState: CharacterState): boolean {
    return character.isAlive && character.isGrounded && character.stamina > 0;
  }
  
  onEnter(_character: Character): void {
    // Iniciar animación de correr
  }
  
  onExit(_character: Character): void {
    // Detener animación
  }
  
  update(character: Character, deltaTime: number): void {
    // Consumir stamina
    if (!character.useStamina(5 * deltaTime)) {
      character.characterState = 'walking';
    }
  }
  
  canTransitionTo(targetState: CharacterState): boolean {
    const allowed: CharacterState[] = ['idle', 'walking', 'jumping', 'attacking', 'dodging', 'stunned', 'dead'];
    return allowed.includes(targetState);
  }
}

export class JumpingState implements ICharacterState {
  name: CharacterState = 'jumping';
  
  canEnter(character: Character, _fromState: CharacterState): boolean {
    return character.isAlive && character.isGrounded;
  }
  
  onEnter(_character: Character): void {
    // Aplicar fuerza de salto
  }
  
  onExit(_character: Character): void {
    // Nada
  }
  
  update(character: Character, _deltaTime: number): void {
    // Verificar si empieza a caer
    if (character['velocity'].y < 0) {
      character.characterState = 'falling';
    }
  }
  
  canTransitionTo(targetState: CharacterState): boolean {
    const allowed: CharacterState[] = ['falling', 'attacking', 'stunned', 'dead'];
    return allowed.includes(targetState);
  }
}

export class FallingState implements ICharacterState {
  name: CharacterState = 'falling';
  
  canEnter(character: Character, _fromState: CharacterState): boolean {
    return character.isAlive && !character.isGrounded;
  }
  
  onEnter(_character: Character): void {
    // Iniciar animación de caída
  }
  
  onExit(_character: Character): void {
    // Detener animación
  }
  
  update(character: Character, _deltaTime: number): void {
    // Verificar si aterrizó
    if (character.isGrounded) {
      character.characterState = 'idle';
    }
  }
  
  canTransitionTo(targetState: CharacterState): boolean {
    const allowed: CharacterState[] = ['idle', 'walking', 'running', 'stunned', 'dead'];
    return allowed.includes(targetState);
  }
}

export class AttackingState implements ICharacterState {
  name: CharacterState = 'attacking';
  private attackDuration: number = 500;
  private elapsedTime: number = 0;
  
  canEnter(character: Character, _fromState: CharacterState): boolean {
    return character.isAlive;
  }
  
  onEnter(_character: Character): void {
    this.elapsedTime = 0;
  }
  
  onExit(_character: Character): void {
    // Nada
  }
  
  update(character: Character, deltaTime: number): void {
    this.elapsedTime += deltaTime * 1000;
    
    if (this.elapsedTime >= this.attackDuration) {
      character.characterState = 'idle';
    }
  }
  
  canTransitionTo(targetState: CharacterState): boolean {
    const allowed: CharacterState[] = ['idle', 'attacking', 'stunned', 'dead'];
    return allowed.includes(targetState);
  }
}

export class CastingState implements ICharacterState {
  name: CharacterState = 'casting';
  
  canEnter(character: Character, _fromState: CharacterState): boolean {
    return character.isAlive && character.isGrounded;
  }
  
  onEnter(_character: Character): void {
    // Iniciar animación de casteo
  }
  
  onExit(_character: Character): void {
    // Detener animación
  }
  
  update(_character: Character, _deltaTime: number): void {
    // El Character maneja el progreso del casteo
  }
  
  canTransitionTo(targetState: CharacterState): boolean {
    const allowed: CharacterState[] = ['idle', 'stunned', 'dead'];
    return allowed.includes(targetState);
  }
}

export class DodgingState implements ICharacterState {
  name: CharacterState = 'dodging';
  private dodgeDuration: number = 300;
  private elapsedTime: number = 0;
  
  canEnter(character: Character, _fromState: CharacterState): boolean {
    return character.isAlive && character.stamina >= 25;
  }
  
  onEnter(_character: Character): void {
    this.elapsedTime = 0;
  }
  
  onExit(_character: Character): void {
    // Nada
  }
  
  update(character: Character, deltaTime: number): void {
    this.elapsedTime += deltaTime * 1000;
    
    if (this.elapsedTime >= this.dodgeDuration) {
      character.characterState = 'idle';
    }
  }
  
  canTransitionTo(targetState: CharacterState): boolean {
    const allowed: CharacterState[] = ['idle', 'dead'];
    return allowed.includes(targetState);
  }
}

export class BlockingState implements ICharacterState {
  name: CharacterState = 'blocking';
  
  canEnter(character: Character, _fromState: CharacterState): boolean {
    return character.isAlive && character.isGrounded;
  }
  
  onEnter(_character: Character): void {
    // Levantar escudo
  }
  
  onExit(_character: Character): void {
    // Bajar escudo
  }
  
  update(character: Character, deltaTime: number): void {
    // Consumir stamina mientras bloquea
    if (!character.useStamina(2 * deltaTime)) {
      character.characterState = 'idle';
    }
  }
  
  canTransitionTo(targetState: CharacterState): boolean {
    const allowed: CharacterState[] = ['idle', 'stunned', 'dead'];
    return allowed.includes(targetState);
  }
}

export class StunnedState implements ICharacterState {
  name: CharacterState = 'stunned';
  private stunDuration: number = 0;
  private elapsedTime: number = 0;
  
  canEnter(character: Character, _fromState: CharacterState): boolean {
    return character.isAlive;
  }
  
  onEnter(_character: Character): void {
    this.elapsedTime = 0;
  }
  
  onExit(_character: Character): void {
    // Nada
  }
  
  update(character: Character, deltaTime: number): void {
    this.elapsedTime += deltaTime * 1000;
    
    if (this.elapsedTime >= this.stunDuration) {
      character.characterState = 'idle';
    }
  }
  
  canTransitionTo(targetState: CharacterState): boolean {
    const allowed: CharacterState[] = ['idle', 'dead'];
    return allowed.includes(targetState);
  }
  
  setDuration(duration: number): void {
    this.stunDuration = duration;
    this.elapsedTime = 0;
  }
}

export class DeadState implements ICharacterState {
  name: CharacterState = 'dead';
  
  canEnter(character: Character, _fromState: CharacterState): boolean {
    return !character.isAlive;
  }
  
  onEnter(_character: Character): void {
    // Animación de muerte
  }
  
  onExit(_character: Character): void {
    // Animación de revivir
  }
  
  update(_character: Character, _deltaTime: number): void {
    // Nada
  }
  
  canTransitionTo(_targetState: CharacterState): boolean {
    return false; // Solo puede salir al revivir
  }
}

// ============================================================
// STATE MANAGER
// ============================================================

export class CharacterStateManager {
  private states: Map<CharacterState, ICharacterState> = new Map();
  private currentState: ICharacterState;
  private character: Character;
  
  constructor(character: Character) {
    this.character = character;
    
    // Registrar todos los estados
    this.states.set('idle', new IdleState());
    this.states.set('walking', new WalkingState());
    this.states.set('running', new RunningState());
    this.states.set('jumping', new JumpingState());
    this.states.set('falling', new FallingState());
    this.states.set('attacking', new AttackingState());
    this.states.set('casting', new CastingState());
    this.states.set('dodging', new DodgingState());
    this.states.set('blocking', new BlockingState());
    this.states.set('stunned', new StunnedState());
    this.states.set('dead', new DeadState());
    
    // Estado inicial
    this.currentState = this.states.get('idle')!;
    this.currentState.onEnter(character);
  }
  
  get current(): ICharacterState {
    return this.currentState;
  }
  
  get currentStateName(): CharacterState {
    return this.currentState.name;
  }
  
  public transition(targetState: CharacterState): boolean {
    const newState = this.states.get(targetState);
    if (!newState) return false;
    
    // Verificar si la transición es válida
    if (!this.currentState.canTransitionTo(targetState)) {
      return false;
    }
    
    // Verificar si el nuevo estado puede ser entrado
    if (!newState.canEnter(this.character, this.currentState.name)) {
      return false;
    }
    
    // Ejecutar transición
    this.currentState.onExit(this.character);
    this.currentState = newState;
    this.currentState.onEnter(this.character);
    
    return true;
  }
  
  public update(deltaTime: number): void {
    this.currentState.update(this.character, deltaTime);
  }
  
  public forceState(targetState: CharacterState): void {
    const newState = this.states.get(targetState);
    if (!newState) return;
    
    this.currentState.onExit(this.character);
    this.currentState = newState;
    this.currentState.onEnter(this.character);
  }
}
