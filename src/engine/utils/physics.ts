/**
 * Physics Utils - Utilidades de física
 */

import * as THREE from 'three';

/**
 * Calcula la fuerza de knockback basada en la dirección y potencia
 */
export function calculateKnockback(
  from: THREE.Vector3,
  to: THREE.Vector3,
  force: number,
  upwardForce: number = 0
): THREE.Vector3 {
  const direction = new THREE.Vector3().subVectors(to, from).normalize();
  direction.y = upwardForce;
  direction.normalize().multiplyScalar(force);
  return direction;
}

/**
 * Calcula la velocidad necesaria para alcanzar un punto con una trayectoria balística
 */
export function calculateBallisticVelocity(
  from: THREE.Vector3,
  to: THREE.Vector3,
  gravity: number = 9.81,
  angle: number = 45
): THREE.Vector3 | null {
  const angleRad = angle * (Math.PI / 180);
  const diff = new THREE.Vector3().subVectors(to, from);
  const distance = Math.sqrt(diff.x * diff.x + diff.z * diff.z);
  const height = diff.y;
  
  // Velocidad inicial necesaria
  const cosAngle = Math.cos(angleRad);
  const sinAngle = Math.sin(angleRad);
  const tanAngle = Math.tan(angleRad);
  
  const v2 = (gravity * distance * distance) / 
             (2 * cosAngle * cosAngle * (distance * tanAngle - height));
  
  if (v2 < 0) return null;
  
  const v = Math.sqrt(v2);
  
  // Dirección horizontal
  const horizontal = new THREE.Vector2(diff.x, diff.z).normalize();
  
  return new THREE.Vector3(
    horizontal.x * v * cosAngle,
    v * sinAngle,
    horizontal.y * v * cosAngle
  );
}

/**
 * Predice la posición de un objetivo en movimiento
 */
export function predictTargetPosition(
  targetPosition: THREE.Vector3,
  targetVelocity: THREE.Vector3,
  projectileSpeed: number,
  shooterPosition: THREE.Vector3
): THREE.Vector3 {
  const toTarget = new THREE.Vector3().subVectors(targetPosition, shooterPosition);
  const distance = toTarget.length();
  const timeToHit = distance / projectileSpeed;
  
  return new THREE.Vector3().copy(targetPosition).addScaledVector(targetVelocity, timeToHit);
}

/**
 * Verifica si un punto está dentro de un cono
 */
export function isPointInCone(
  coneOrigin: THREE.Vector3,
  coneDirection: THREE.Vector3,
  coneAngle: number, // en radianes
  coneRange: number,
  point: THREE.Vector3
): boolean {
  const toPoint = new THREE.Vector3().subVectors(point, coneOrigin);
  const distance = toPoint.length();
  
  if (distance > coneRange) return false;
  
  toPoint.normalize();
  const dot = coneDirection.dot(toPoint);
  const angle = Math.acos(dot);
  
  return angle <= coneAngle;
}

/**
 * Calcula la fuerza de explosión sobre un objeto
 */
export function calculateExplosionForce(
  explosionCenter: THREE.Vector3,
  objectPosition: THREE.Vector3,
  explosionForce: number,
  explosionRadius: number,
  upwardModifier: number = 0.5
): THREE.Vector3 {
  const direction = new THREE.Vector3().subVectors(objectPosition, explosionCenter);
  const distance = direction.length();
  
  if (distance > explosionRadius || distance === 0) {
    return new THREE.Vector3();
  }
  
  // Falloff lineal
  const forceMagnitude = explosionForce * (1 - distance / explosionRadius);
  
  direction.normalize();
  direction.y += upwardModifier;
  direction.normalize();
  
  return direction.multiplyScalar(forceMagnitude);
}

/**
 * Simula fricción
 */
export function applyFriction(
  velocity: THREE.Vector3,
  friction: number,
  deltaTime: number
): THREE.Vector3 {
  const frictionFactor = Math.pow(1 - friction, deltaTime);
  return velocity.multiplyScalar(frictionFactor);
}

/**
 * Aplica gravedad
 */
export function applyGravity(
  velocity: THREE.Vector3,
  gravity: number,
  deltaTime: number
): THREE.Vector3 {
  velocity.y -= gravity * deltaTime;
  return velocity;
}

/**
 * Calcula la velocidad terminal
 */
export function calculateTerminalVelocity(
  mass: number,
  dragCoefficient: number,
  crossSectionArea: number,
  airDensity: number = 1.225
): number {
  const gravity = 9.81;
  return Math.sqrt((2 * mass * gravity) / (airDensity * crossSectionArea * dragCoefficient));
}

/**
 * Verifica colisión esfera-esfera
 */
export function sphereSphereCollision(
  center1: THREE.Vector3,
  radius1: number,
  center2: THREE.Vector3,
  radius2: number
): boolean {
  const distance = center1.distanceTo(center2);
  return distance <= radius1 + radius2;
}

/**
 * Verifica colisión punto-caja
 */
export function pointInBox(
  point: THREE.Vector3,
  boxMin: THREE.Vector3,
  boxMax: THREE.Vector3
): boolean {
  return (
    point.x >= boxMin.x && point.x <= boxMax.x &&
    point.y >= boxMin.y && point.y <= boxMax.y &&
    point.z >= boxMin.z && point.z <= boxMax.z
  );
}

/**
 * Verifica colisión esfera-caja
 */
export function sphereBoxCollision(
  sphereCenter: THREE.Vector3,
  sphereRadius: number,
  boxMin: THREE.Vector3,
  boxMax: THREE.Vector3
): boolean {
  // Encontrar el punto más cercano de la caja a la esfera
  const closest = new THREE.Vector3(
    Math.max(boxMin.x, Math.min(sphereCenter.x, boxMax.x)),
    Math.max(boxMin.y, Math.min(sphereCenter.y, boxMax.y)),
    Math.max(boxMin.z, Math.min(sphereCenter.z, boxMax.z))
  );
  
  const distance = sphereCenter.distanceTo(closest);
  return distance <= sphereRadius;
}

/**
 * Calcula la normal de colisión entre dos esferas
 */
export function getCollisionNormal(
  center1: THREE.Vector3,
  center2: THREE.Vector3
): THREE.Vector3 {
  return new THREE.Vector3().subVectors(center1, center2).normalize();
}

/**
 * Resuelve colisión elástica entre dos esferas
 */
export function resolveElasticCollision(
  velocity1: THREE.Vector3,
  mass1: number,
  velocity2: THREE.Vector3,
  mass2: number,
  normal: THREE.Vector3,
  restitution: number = 1
): { v1: THREE.Vector3; v2: THREE.Vector3 } {
  const relativeVelocity = new THREE.Vector3().subVectors(velocity1, velocity2);
  const normalVelocity = relativeVelocity.dot(normal);
  
  if (normalVelocity > 0) {
    // Los objetos se están alejando
    return { v1: velocity1.clone(), v2: velocity2.clone() };
  }
  
  const j = -(1 + restitution) * normalVelocity / (1 / mass1 + 1 / mass2);
  
  const impulse = normal.clone().multiplyScalar(j);
  
  return {
    v1: velocity1.clone().addScaledVector(impulse, 1 / mass1),
    v2: velocity2.clone().addScaledVector(impulse, -1 / mass2),
  };
}
