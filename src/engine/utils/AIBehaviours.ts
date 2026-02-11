/**
 * AI Behaviours — Adaptado de Sketchbook (MIT License)
 * 
 * Sistema de comportamientos de IA para NPCs y enemigos.
 * Lógica pura que produce intenciones de movimiento (dirección + acciones),
 * consumibles por cualquier sistema de movimiento (useMovement, EnemyEntity, etc.)
 * 
 * Behaviours:
 * - FollowTarget: Seguir a un Object3D o posición
 * - FollowPath: Seguir una ruta de nodos
 * - RandomBehaviour: Movimiento aleatorio (NPC ambiental)
 * - PatrolBehaviour: Patrullar entre puntos definidos
 */

import * as THREE from 'three';

// ============================================================
// INTERFACES
// ============================================================

/** Output de un behaviour — qué quiere hacer la IA este frame */
export interface AIIntent {
  /** Dirección de movimiento deseada (normalizada, 0 si quieto) */
  moveDirection: THREE.Vector3;
  /** Velocidad deseada (0-1, multiplicar por maxSpeed) */
  moveSpeed: number;
  /** Quiere saltar */
  jump: boolean;
  /** Quiere correr */
  sprint: boolean;
  /** Quiere atacar */
  attack: boolean;
  /** Quiere usar habilidad */
  useAbility: boolean;
  /** Dirección a la que mirar (puede diferir de moveDirection) */
  lookDirection: THREE.Vector3;
}

/** Nodo de un camino/ruta */
export interface PathNode {
  position: THREE.Vector3;
  /** Radio de "llegué a este nodo" */
  radius: number;
  /** Siguiente nodo (linked list, puede ser circular) */
  next?: PathNode;
  /** Nodo anterior */
  prev?: PathNode;
}

/** Info del sujeto controlado por el behaviour */
export interface AISubject {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  forward: THREE.Vector3; // Dirección frontal actual
  speed: number;
  isGrounded: boolean;
}

/** Interface base para todos los behaviours */
export interface IAIBehaviour {
  /** Nombre del behaviour para debug */
  name: string;
  /** Calcular intención de IA para este frame */
  update(subject: AISubject, delta: number): AIIntent;
  /** Resetear estado interno */
  reset(): void;
}

// ============================================================
// HELPERS
// ============================================================

function createDefaultIntent(): AIIntent {
  return {
    moveDirection: new THREE.Vector3(),
    moveSpeed: 0,
    jump: false,
    sprint: false,
    attack: false,
    useAbility: false,
    lookDirection: new THREE.Vector3(0, 0, 1),
  };
}

const _tempVec = new THREE.Vector3();

// ============================================================
// FOLLOW TARGET — Seguir a un objeto/posición
// ============================================================

export interface FollowTargetConfig {
  /** Distancia a la que dejar de acercarse */
  stopDistance: number;
  /** Distancia a la que empezar a correr */
  sprintDistance: number;
  /** Distancia a la que atacar */
  attackDistance: number;
  /** Velocidad de movimiento (0-1) */
  moveSpeed: number;
}

const DEFAULT_FOLLOW_CONFIG: FollowTargetConfig = {
  stopDistance: 2,
  sprintDistance: 10,
  attackDistance: 2.5,
  moveSpeed: 0.7,
};

export class FollowTarget implements IAIBehaviour {
  public name = 'FollowTarget';
  public target: THREE.Vector3;
  public config: FollowTargetConfig;

  constructor(
    target: THREE.Vector3 = new THREE.Vector3(),
    config: Partial<FollowTargetConfig> = {},
  ) {
    this.target = target;
    this.config = { ...DEFAULT_FOLLOW_CONFIG, ...config };
  }

  /** Actualizar la posición del target (para seguir un Object3D en movimiento) */
  public setTarget(position: THREE.Vector3): void {
    this.target.copy(position);
  }

  public update(subject: AISubject, _delta: number): AIIntent {
    const intent = createDefaultIntent();

    // Vector hacia el target (plano XZ)
    _tempVec.subVectors(this.target, subject.position);
    _tempVec.y = 0;
    const distance = _tempVec.length();

    // Siempre mirar al target
    if (distance > 0.1) {
      intent.lookDirection.copy(_tempVec).normalize();
    }

    if (distance > this.config.stopDistance) {
      // Moverse hacia el target
      intent.moveDirection.copy(_tempVec).normalize();
      intent.moveSpeed = this.config.moveSpeed;
      intent.sprint = distance > this.config.sprintDistance;
    } else {
      // Dentro de rango de parada
      intent.moveSpeed = 0;
    }

    // Atacar si está en rango
    if (distance <= this.config.attackDistance) {
      intent.attack = true;
    }

    return intent;
  }

  public reset(): void {
    this.target.set(0, 0, 0);
  }
}

// ============================================================
// FOLLOW PATH — Seguir una ruta de nodos
// ============================================================

export interface FollowPathConfig {
  /** Radio para considerar que "llegó" al nodo */
  nodeRadius: number;
  /** Velocidad de movimiento (0-1) */
  moveSpeed: number;
  /** Hacer loop al final del camino */
  loop: boolean;
  /** Recorrer en reversa */
  reverse: boolean;
  /** Segundos sin moverse antes de considerar "atascado" */
  staleTimeout: number;
}

const DEFAULT_PATH_CONFIG: FollowPathConfig = {
  nodeRadius: 1.5,
  moveSpeed: 0.5,
  loop: true,
  reverse: false,
  staleTimeout: 5,
};

export class FollowPath implements IAIBehaviour {
  public name = 'FollowPath';
  public nodes: PathNode[];
  public config: FollowPathConfig;

  private currentNodeIndex: number = 0;
  private staleTimer: number = 0;
  private lastPosition: THREE.Vector3 = new THREE.Vector3();

  constructor(nodes: PathNode[] = [], config: Partial<FollowPathConfig> = {}) {
    this.nodes = nodes;
    this.config = { ...DEFAULT_PATH_CONFIG, ...config };
  }

  /** Crear una ruta circular a partir de posiciones */
  public static fromPositions(
    positions: THREE.Vector3[],
    radius: number = 1.5,
  ): PathNode[] {
    return positions.map((pos) => ({
      position: pos.clone(),
      radius,
      next: undefined, // Se linkea después si se necesita
      prev: undefined,
    }));
  }

  /** Crear una ruta circular (patrulla) alrededor de un punto central */
  public static createCircularPath(
    center: THREE.Vector3,
    radius: number,
    numPoints: number = 6,
    nodeRadius: number = 1.5,
  ): PathNode[] {
    const nodes: PathNode[] = [];
    for (let i = 0; i < numPoints; i++) {
      const angle = (i / numPoints) * Math.PI * 2;
      nodes.push({
        position: new THREE.Vector3(
          center.x + Math.cos(angle) * radius,
          center.y,
          center.z + Math.sin(angle) * radius,
        ),
        radius: nodeRadius,
      });
    }
    return nodes;
  }

  public update(subject: AISubject, delta: number): AIIntent {
    const intent = createDefaultIntent();

    if (this.nodes.length === 0) return intent;

    const targetNode = this.nodes[this.currentNodeIndex];
    
    // Vector hacia el nodo actual
    _tempVec.subVectors(targetNode.position, subject.position);
    _tempVec.y = 0;
    const distance = _tempVec.length();

    // Mirar al nodo
    if (distance > 0.1) {
      intent.lookDirection.copy(_tempVec).normalize();
      intent.moveDirection.copy(_tempVec).normalize();
      intent.moveSpeed = this.config.moveSpeed;
    }

    // Llegó al nodo → siguiente
    if (distance < this.config.nodeRadius) {
      if (this.config.reverse) {
        this.currentNodeIndex--;
        if (this.currentNodeIndex < 0) {
          this.currentNodeIndex = this.config.loop ? this.nodes.length - 1 : 0;
        }
      } else {
        this.currentNodeIndex++;
        if (this.currentNodeIndex >= this.nodes.length) {
          this.currentNodeIndex = this.config.loop ? 0 : this.nodes.length - 1;
        }
      }
    }

    // Detección de "atascado" — si no se mueve en N segundos
    const moved = subject.position.distanceTo(this.lastPosition);
    if (moved < 0.1) {
      this.staleTimer += delta;
      if (this.staleTimer > this.config.staleTimeout) {
        // Skip al siguiente nodo
        this.currentNodeIndex = (this.currentNodeIndex + 1) % this.nodes.length;
        this.staleTimer = 0;
      }
    } else {
      this.staleTimer = 0;
    }
    this.lastPosition.copy(subject.position);

    return intent;
  }

  public reset(): void {
    this.currentNodeIndex = 0;
    this.staleTimer = 0;
  }
}

// ============================================================
// RANDOM BEHAVIOUR — Movimiento aleatorio para NPCs ambientales
// ============================================================

export interface RandomBehaviourConfig {
  /** Frecuencia de cambios aleatorios (mayor = menos frecuente) */
  randomFrequency: number;
  /** Velocidad de movimiento (0-1) */
  moveSpeed: number;
  /** Probabilidad de saltar (0-1) */
  jumpChance: number;
  /** Probabilidad de correr (0-1) */
  sprintChance: number;
  /** Tiempo mínimo caminando en una dirección (segundos) */
  minWalkTime: number;
  /** Tiempo máximo caminando en una dirección (segundos) */
  maxWalkTime: number;
  /** Tiempo mínimo quieto (segundos) */
  minIdleTime: number;
  /** Tiempo máximo quieto (segundos) */
  maxIdleTime: number;
}

const DEFAULT_RANDOM_CONFIG: RandomBehaviourConfig = {
  randomFrequency: 120,
  moveSpeed: 0.4,
  jumpChance: 0.02,
  sprintChance: 0.1,
  minWalkTime: 2,
  maxWalkTime: 6,
  minIdleTime: 1,
  maxIdleTime: 4,
};

export class RandomBehaviour implements IAIBehaviour {
  public name = 'RandomBehaviour';
  public config: RandomBehaviourConfig;

  private currentDirection: THREE.Vector3 = new THREE.Vector3();
  private isWalking: boolean = false;
  private timer: number = 0;
  private currentDuration: number = 2;
  private wantsSprint: boolean = false;

  constructor(config: Partial<RandomBehaviourConfig> = {}) {
    this.config = { ...DEFAULT_RANDOM_CONFIG, ...config };
    this.pickNewState();
  }

  private pickNewState(): void {
    this.isWalking = Math.random() > 0.4; // 60% caminar, 40% quedarse quieto

    if (this.isWalking) {
      // Dirección aleatoria
      const angle = Math.random() * Math.PI * 2;
      this.currentDirection.set(Math.cos(angle), 0, Math.sin(angle));
      this.currentDuration = this.config.minWalkTime +
        Math.random() * (this.config.maxWalkTime - this.config.minWalkTime);
      this.wantsSprint = Math.random() < this.config.sprintChance;
    } else {
      this.currentDirection.set(0, 0, 0);
      this.currentDuration = this.config.minIdleTime +
        Math.random() * (this.config.maxIdleTime - this.config.minIdleTime);
      this.wantsSprint = false;
    }

    this.timer = 0;
  }

  public update(subject: AISubject, delta: number): AIIntent {
    const intent = createDefaultIntent();

    this.timer += delta;

    // Cambiar estado cuando se agota el timer
    if (this.timer >= this.currentDuration) {
      this.pickNewState();
    }

    // Random jump
    if (subject.isGrounded && Math.random() < this.config.jumpChance * delta * 60) {
      intent.jump = true;
    }

    if (this.isWalking) {
      intent.moveDirection.copy(this.currentDirection);
      intent.moveSpeed = this.config.moveSpeed;
      intent.sprint = this.wantsSprint;
      intent.lookDirection.copy(this.currentDirection);
    }

    return intent;
  }

  public reset(): void {
    this.pickNewState();
  }
}

// ============================================================
// PATROL BEHAVIOUR — Patrullar entre puntos con idle en cada uno
// ============================================================

export interface PatrolConfig {
  /** Nodos de patrulla */
  points: THREE.Vector3[];
  /** Tiempo de espera en cada punto (segundos) */
  waitTime: number;
  /** Radio para considerar "llegué" */
  arrivalRadius: number;
  /** Velocidad */
  moveSpeed: number;
  /** Loop */
  loop: boolean;
}

const DEFAULT_PATROL_CONFIG: PatrolConfig = {
  points: [],
  waitTime: 2,
  arrivalRadius: 1,
  moveSpeed: 0.5,
  loop: true,
};

export class PatrolBehaviour implements IAIBehaviour {
  public name = 'PatrolBehaviour';
  public config: PatrolConfig;

  private currentIndex: number = 0;
  private waiting: boolean = false;
  private waitTimer: number = 0;

  constructor(config: Partial<PatrolConfig> = {}) {
    this.config = { ...DEFAULT_PATROL_CONFIG, ...config };
  }

  public update(subject: AISubject, delta: number): AIIntent {
    const intent = createDefaultIntent();

    if (this.config.points.length === 0) return intent;

    // Si está esperando en un punto
    if (this.waiting) {
      this.waitTimer += delta;
      if (this.waitTimer >= this.config.waitTime) {
        this.waiting = false;
        this.waitTimer = 0;
        // Siguiente punto
        this.currentIndex++;
        if (this.currentIndex >= this.config.points.length) {
          this.currentIndex = this.config.loop ? 0 : this.config.points.length - 1;
        }
      }
      return intent; // Quieto mientras espera
    }

    // Moverse hacia el punto actual
    const target = this.config.points[this.currentIndex];
    _tempVec.subVectors(target, subject.position);
    _tempVec.y = 0;
    const distance = _tempVec.length();

    if (distance > this.config.arrivalRadius) {
      intent.moveDirection.copy(_tempVec).normalize();
      intent.lookDirection.copy(intent.moveDirection);
      intent.moveSpeed = this.config.moveSpeed;
    } else {
      // Llegó — empezar a esperar
      this.waiting = true;
      this.waitTimer = 0;
    }

    return intent;
  }

  public reset(): void {
    this.currentIndex = 0;
    this.waiting = false;
    this.waitTimer = 0;
  }
}
