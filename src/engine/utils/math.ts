/**
 * Math Utils - Utilidades matemáticas para el engine 3D
 */

import * as THREE from 'three';

/**
 * Convierte grados a radianes
 */
export function degToRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Convierte radianes a grados
 */
export function radToDeg(radians: number): number {
  return radians * (180 / Math.PI);
}

/**
 * Interpolación lineal
 */
export function lerp(start: number, end: number, t: number): number {
  return start + (end - start) * t;
}

/**
 * Interpolación lineal de vectores
 */
export function lerpVector3(
  start: THREE.Vector3,
  end: THREE.Vector3,
  t: number,
  out?: THREE.Vector3
): THREE.Vector3 {
  const result = out || new THREE.Vector3();
  result.lerpVectors(start, end, t);
  return result;
}

/**
 * Clamp - limita un valor entre min y max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Clamp01 - limita un valor entre 0 y 1
 */
export function clamp01(value: number): number {
  return clamp(value, 0, 1);
}

/**
 * Smooth step - interpolación suave
 */
export function smoothStep(edge0: number, edge1: number, x: number): number {
  const t = clamp01((x - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
}

/**
 * Ease in out
 */
export function easeInOut(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

/**
 * Ease out
 */
export function easeOut(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

/**
 * Ease in
 */
export function easeIn(t: number): number {
  return t * t * t;
}

/**
 * Obtiene un valor aleatorio entre min y max
 */
export function random(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

/**
 * Obtiene un entero aleatorio entre min y max (inclusive)
 */
export function randomInt(min: number, max: number): number {
  return Math.floor(random(min, max + 1));
}

/**
 * Obtiene un punto aleatorio en un círculo
 */
export function randomInCircle(radius: number): THREE.Vector2 {
  const angle = Math.random() * Math.PI * 2;
  const r = Math.sqrt(Math.random()) * radius;
  return new THREE.Vector2(Math.cos(angle) * r, Math.sin(angle) * r);
}

/**
 * Obtiene un punto aleatorio en una esfera
 */
export function randomInSphere(radius: number): THREE.Vector3 {
  const theta = Math.random() * Math.PI * 2;
  const phi = Math.acos(2 * Math.random() - 1);
  const r = Math.cbrt(Math.random()) * radius;
  
  return new THREE.Vector3(
    r * Math.sin(phi) * Math.cos(theta),
    r * Math.sin(phi) * Math.sin(theta),
    r * Math.cos(phi)
  );
}

/**
 * Obtiene un punto aleatorio en la superficie de una esfera
 */
export function randomOnSphere(radius: number): THREE.Vector3 {
  const theta = Math.random() * Math.PI * 2;
  const phi = Math.acos(2 * Math.random() - 1);
  
  return new THREE.Vector3(
    radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.sin(phi) * Math.sin(theta),
    radius * Math.cos(phi)
  );
}

/**
 * Distancia entre dos puntos 2D
 */
export function distance2D(x1: number, y1: number, x2: number, y2: number): number {
  return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
}

/**
 * Distancia entre dos puntos 3D
 */
export function distance3D(
  x1: number, y1: number, z1: number,
  x2: number, y2: number, z2: number
): number {
  return Math.sqrt(
    Math.pow(x2 - x1, 2) +
    Math.pow(y2 - y1, 2) +
    Math.pow(z2 - z1, 2)
  );
}

/**
 * Calcula el ángulo entre dos vectores
 */
export function angleBetween(v1: THREE.Vector3, v2: THREE.Vector3): number {
  return Math.acos(clamp(v1.dot(v2) / (v1.length() * v2.length()), -1, 1));
}

/**
 * Calcula el ángulo firmado entre dos vectores en el plano XZ
 */
export function signedAngleXZ(from: THREE.Vector3, to: THREE.Vector3): number {
  const angle = Math.atan2(to.x, to.z) - Math.atan2(from.x, from.z);
  return angle;
}

/**
 * Normaliza un ángulo a [-PI, PI]
 */
export function normalizeAngle(angle: number): number {
  while (angle > Math.PI) angle -= Math.PI * 2;
  while (angle < -Math.PI) angle += Math.PI * 2;
  return angle;
}

/**
 * Remap - remapea un valor de un rango a otro
 */
export function remap(
  value: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number
): number {
  return outMin + (value - inMin) * (outMax - outMin) / (inMax - inMin);
}

/**
 * Ping pong - oscila entre 0 y length
 */
export function pingPong(t: number, length: number): number {
  const l = length * 2;
  const tt = t % l;
  return length - Math.abs(tt - length);
}

/**
 * Move towards - mueve un valor hacia un objetivo con velocidad máxima
 */
export function moveTowards(current: number, target: number, maxDelta: number): number {
  if (Math.abs(target - current) <= maxDelta) {
    return target;
  }
  return current + Math.sign(target - current) * maxDelta;
}

/**
 * Move towards vector - mueve un vector hacia otro con velocidad máxima
 */
export function moveTowardsVector3(
  current: THREE.Vector3,
  target: THREE.Vector3,
  maxDelta: number
): THREE.Vector3 {
  const diff = target.clone().sub(current);
  const dist = diff.length();
  
  if (dist <= maxDelta || dist === 0) {
    return target.clone();
  }
  
  return current.clone().add(diff.normalize().multiplyScalar(maxDelta));
}

/**
 * Damped spring - movimiento de resorte amortiguado
 */
export function dampedSpring(
  current: number,
  target: number,
  velocity: number,
  smoothTime: number,
  maxSpeed: number,
  deltaTime: number
): { value: number; velocity: number } {
  smoothTime = Math.max(0.0001, smoothTime);
  const omega = 2 / smoothTime;
  
  const x = omega * deltaTime;
  const exp = 1 / (1 + x + 0.48 * x * x + 0.235 * x * x * x);
  
  let change = current - target;
  const originalTo = target;
  
  const maxChange = maxSpeed * smoothTime;
  change = clamp(change, -maxChange, maxChange);
  const newTarget = current - change;
  
  const temp = (velocity + omega * change) * deltaTime;
  let newVelocity = (velocity - omega * temp) * exp;
  let newValue = newTarget + (change + temp) * exp;
  
  if (originalTo - current > 0 === newValue > originalTo) {
    newValue = originalTo;
    newVelocity = (newValue - originalTo) / deltaTime;
  }
  
  return { value: newValue, velocity: newVelocity };
}

/**
 * Perlin noise simplificado (pseudo)
 */
export function noise2D(x: number, y: number): number {
  const n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
  return n - Math.floor(n);
}

/**
 * FBM (Fractal Brownian Motion) simplificado
 */
export function fbm(x: number, y: number, octaves: number = 4): number {
  let value = 0;
  let amplitude = 0.5;
  let frequency = 1;
  let maxValue = 0;
  
  for (let i = 0; i < octaves; i++) {
    value += amplitude * noise2D(x * frequency, y * frequency);
    maxValue += amplitude;
    amplitude *= 0.5;
    frequency *= 2;
  }
  
  return value / maxValue;
}
