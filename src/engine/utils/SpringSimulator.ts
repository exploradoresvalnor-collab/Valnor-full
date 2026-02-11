/**
 * Spring Simulation System — Adaptado de Sketchbook (MIT License)
 * 
 * Sistema de simulación de resortes para movimiento suave y natural.
 * Funciona a FPS interno fijo (60) con interpolación entre frames,
 * produciendo movimiento con inercia real, overshoot y damping.
 * 
 * Adaptado para funcionar con Three.js sin dependencias de Cannon.js.
 */

import * as THREE from 'three';

// ============================================================
// FRAMES DE SIMULACIÓN
// ============================================================

/** Frame de simulación escalar (1D) */
export class SimulationFrame {
  public position: number;
  public velocity: number;

  constructor(position: number = 0, velocity: number = 0) {
    this.position = position;
    this.velocity = velocity;
  }
}

/** Frame de simulación vectorial (3D) */
export class SimulationFrameVector {
  public position: THREE.Vector3;
  public velocity: THREE.Vector3;

  constructor(
    position: THREE.Vector3 = new THREE.Vector3(),
    velocity: THREE.Vector3 = new THREE.Vector3(),
  ) {
    this.position = position;
    this.velocity = velocity;
  }
}

// ============================================================
// FUNCIONES CORE DE RESORTE
// ============================================================

/**
 * Calcula un paso de spring 1D.
 * Produce movimiento suave con overshoot natural.
 */
export function spring(
  source: number,
  dest: number,
  velocity: number,
  mass: number,
  damping: number,
): SimulationFrame {
  let acceleration = dest - source;
  acceleration /= mass;
  velocity += acceleration;
  velocity *= damping;
  const position = source + velocity;
  return new SimulationFrame(position, velocity);
}

/**
 * Calcula un paso de spring 3D (mutando source y velocity in-place).
 */
export function springV(
  source: THREE.Vector3,
  dest: THREE.Vector3,
  velocity: THREE.Vector3,
  mass: number,
  damping: number,
): void {
  const acceleration = new THREE.Vector3().subVectors(dest, source);
  acceleration.divideScalar(mass);
  velocity.add(acceleration);
  velocity.multiplyScalar(damping);
  source.add(velocity);
}

// ============================================================
// BASE ABSTRACTA
// ============================================================

export abstract class SimulatorBase {
  public mass: number;
  public damping: number;
  public frameTime: number;
  public offset: number;
  public abstract cache: any[];

  constructor(fps: number, mass: number, damping: number) {
    this.mass = mass;
    this.damping = damping;
    this.frameTime = 1 / fps;
    this.offset = 0;
  }

  /**
   * Genera frames de simulación a FPS interno fijo.
   * Acumula tiempo sobrante para el siguiente frame.
   */
  public generateFrames(timeStep: number): void {
    const totalTimeStep = this.offset + timeStep;
    const framesToGenerate = Math.floor(totalTimeStep / this.frameTime);
    this.offset = totalTimeStep % this.frameTime;

    if (framesToGenerate > 0) {
      for (let i = 0; i < framesToGenerate; i++) {
        this.cache.push(this.getFrame(i + 1 === framesToGenerate));
      }
      // Solo guardar los últimos 2 frames para interpolación
      this.cache = this.cache.slice(-2);
    }
  }

  /** Devuelve el último frame del cache. */
  protected lastFrame(): any {
    return this.cache[this.cache.length - 1];
  }

  public abstract getFrame(isLastFrame: boolean): any;
  public abstract simulate(timeStep: number): void;
}

// ============================================================
// SPRING SIMULATOR — ESCALAR (para valores 1D: velocidad, zoom, etc.)
// ============================================================

export class SpringSimulator extends SimulatorBase {
  public position: number;
  public velocity: number;
  public target: number;
  public cache: SimulationFrame[];

  constructor(
    fps: number,
    mass: number,
    damping: number,
    startPosition: number = 0,
    startVelocity: number = 0,
  ) {
    super(fps, mass, damping);
    this.position = startPosition;
    this.velocity = startVelocity;
    this.target = 0;
    this.cache = [
      new SimulationFrame(startPosition, startVelocity),
      new SimulationFrame(startPosition, startVelocity),
    ];
  }

  /**
   * Simula el spring por un timestep dado.
   * Genera frames internos a FPS fijo e interpola el resultado.
   */
  public simulate(timeStep: number): void {
    this.generateFrames(timeStep);

    this.position = THREE.MathUtils.lerp(
      this.cache[0].position,
      this.cache[1].position,
      this.offset / this.frameTime,
    );

    this.velocity = THREE.MathUtils.lerp(
      this.cache[0].velocity,
      this.cache[1].velocity,
      this.offset / this.frameTime,
    );
  }

  public getFrame(_isLastFrame: boolean): SimulationFrame {
    return spring(
      this.lastFrame().position,
      this.target,
      this.lastFrame().velocity,
      this.mass,
      this.damping,
    );
  }
}

// ============================================================
// VECTOR SPRING SIMULATOR — 3D (para velocidad de movimiento)
// ============================================================

export class VectorSpringSimulator extends SimulatorBase {
  public position: THREE.Vector3;
  public velocity: THREE.Vector3;
  public target: THREE.Vector3;
  public cache: SimulationFrameVector[];

  constructor(fps: number, mass: number, damping: number) {
    super(fps, mass, damping);
    this.position = new THREE.Vector3();
    this.velocity = new THREE.Vector3();
    this.target = new THREE.Vector3();
    this.cache = [
      new SimulationFrameVector(new THREE.Vector3(), new THREE.Vector3()),
      new SimulationFrameVector(new THREE.Vector3(), new THREE.Vector3()),
    ];
  }

  /** Re-inicializa el simulador. */
  public init(): void {
    this.position.set(0, 0, 0);
    this.velocity.set(0, 0, 0);
    this.target.set(0, 0, 0);
    this.cache = [
      new SimulationFrameVector(new THREE.Vector3(), new THREE.Vector3()),
      new SimulationFrameVector(new THREE.Vector3(), new THREE.Vector3()),
    ];
    this.offset = 0;
  }

  /**
   * Simula el spring 3D por un timestep dado.
   * Interpola entre frames cacheados.
   */
  public simulate(timeStep: number): void {
    this.generateFrames(timeStep);

    this.position.lerpVectors(
      this.cache[0].position,
      this.cache[1].position,
      this.offset / this.frameTime,
    );

    this.velocity.lerpVectors(
      this.cache[0].velocity,
      this.cache[1].velocity,
      this.offset / this.frameTime,
    );
  }

  public getFrame(_isLastFrame: boolean): SimulationFrameVector {
    const newSpring = new SimulationFrameVector(
      this.lastFrame().position.clone(),
      this.lastFrame().velocity.clone(),
    );
    springV(newSpring.position, this.target, newSpring.velocity, this.mass, this.damping);
    return newSpring;
  }
}

// ============================================================
// RELATIVE SPRING SIMULATOR — para rotación (output es delta relativo)
// ============================================================

export class RelativeSpringSimulator extends SimulatorBase {
  public position: number;
  public velocity: number;
  public target: number;
  public lastLerp: number;
  public cache: SimulationFrame[];

  constructor(
    fps: number,
    mass: number,
    damping: number,
    startPosition: number = 0,
    startVelocity: number = 0,
  ) {
    super(fps, mass, damping);
    this.position = startPosition;
    this.velocity = startVelocity;
    this.target = 0;
    this.lastLerp = 0;
    this.cache = [
      new SimulationFrame(startPosition, startVelocity),
      new SimulationFrame(startPosition, startVelocity),
    ];
  }

  /**
   * Simula el spring relativo. El output `position` es un DELTA que se debe
   * SUMAR a la rotación actual, no una posición absoluta.
   */
  public simulate(timeStep: number): void {
    this.generateFrames(timeStep);

    const lerp = THREE.MathUtils.lerp(
      0,
      this.cache[1].position,
      this.offset / this.frameTime,
    );

    // Output relativo: diferencia desde el último lerp
    this.position = lerp - this.lastLerp;
    this.lastLerp = lerp;

    this.velocity = THREE.MathUtils.lerp(
      this.cache[0].velocity,
      this.cache[1].velocity,
      this.offset / this.frameTime,
    );
  }

  public getFrame(isLastFrame: boolean): SimulationFrame {
    const newFrame = new SimulationFrame(
      this.lastFrame().position,
      this.lastFrame().velocity,
    );

    if (isLastFrame) {
      // Reset para el siguiente ciclo
      newFrame.position = 0;
      this.lastLerp = this.lastLerp - this.lastFrame().position;
    }

    return spring(newFrame.position, this.target, newFrame.velocity, this.mass, this.damping);
  }
}
