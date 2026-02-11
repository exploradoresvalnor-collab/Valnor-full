/**
 * PhysicsWorld - Wrapper del mundo físico con Rapier
 * Correcciones: raycast real, sphereCast, overlapSphere filtrado, collision data real
 */

import React, { createContext, useContext, useRef, useCallback } from 'react';
import { RigidBody, RapierRigidBody, useRapier } from '@react-three/rapier';
import * as THREE from 'three';

// Tipos para colisiones
export interface CollisionEvent {
  other: RapierRigidBody;
  normal: THREE.Vector3;
  point: THREE.Vector3;
}

export interface PhysicsBodyProps {
  children: React.ReactNode;
  type?: 'fixed' | 'dynamic' | 'kinematicPosition' | 'kinematicVelocity';
  collisionGroups?: number;
  mass?: number;
  friction?: number;
  restitution?: number;
  linearDamping?: number;
  angularDamping?: number;
  gravityScale?: number;
  canSleep?: boolean;
  ccd?: boolean;
  onCollisionEnter?: (event: CollisionEvent) => void;
  onCollisionExit?: (event: CollisionEvent) => void;
  onSleep?: () => void;
  onWake?: () => void;
  userData?: Record<string, unknown>;
}

// Grupos de colisión (bitmasks)
export const CollisionGroups = {
  DEFAULT:    0x0001,
  PLAYER:     0x0002,
  ENEMY:      0x0004,
  TERRAIN:    0x0008,
  TRIGGER:    0x0010,
  PROJECTILE: 0x0020,
  ITEM:       0x0040,
  NPC:        0x0080,
  ALL:        0xFFFF,
} as const;

// Máscaras de filtro predefinidas
export const CollisionFilters = {
  PLAYER: {
    groups: CollisionGroups.PLAYER,
    mask: CollisionGroups.ALL & ~CollisionGroups.TRIGGER,
  },
  ENEMY: {
    groups: CollisionGroups.ENEMY,
    mask: CollisionGroups.TERRAIN | CollisionGroups.PLAYER | CollisionGroups.ENEMY | CollisionGroups.NPC | CollisionGroups.PROJECTILE,
  },
  TERRAIN: {
    groups: CollisionGroups.TERRAIN,
    mask: CollisionGroups.ALL,
  },
  TRIGGER: {
    groups: CollisionGroups.TRIGGER,
    mask: CollisionGroups.PLAYER,
  },
  PROJECTILE: {
    groups: CollisionGroups.PROJECTILE,
    mask: CollisionGroups.TERRAIN | CollisionGroups.PLAYER | CollisionGroups.ENEMY | CollisionGroups.NPC,
  },
} as const;

// Contexto para raycast y queries
interface PhysicsContextType {
  raycast: (
    origin: THREE.Vector3,
    direction: THREE.Vector3,
    maxDistance: number,
    groups?: number
  ) => RaycastHit | null;
  sphereCast: (
    origin: THREE.Vector3,
    radius: number,
    direction: THREE.Vector3,
    maxDistance: number,
    groups?: number
  ) => RaycastHit | null;
  overlapSphere: (
    origin: THREE.Vector3,
    radius: number,
    groups?: number
  ) => RapierRigidBody[];
}

export interface RaycastHit {
  point: THREE.Vector3;
  normal: THREE.Vector3;
  distance: number;
  body: RapierRigidBody | null;
}

const PhysicsContext = createContext<PhysicsContextType | null>(null);

// ── Vectores reutilizables para evitar allocaciones por frame ──
const _hitPoint = new THREE.Vector3();
const _hitNormal = new THREE.Vector3();

/**
 * Hook para acceder a utilidades de física
 */
export function usePhysicsWorld() {
  const context = useContext(PhysicsContext);
  if (!context) {
    throw new Error('usePhysicsWorld must be used within PhysicsWorld');
  }
  return context;
}

/**
 * PhysicsWorldProvider - Provee contexto de física con queries reales de Rapier
 */
export function PhysicsWorldProvider({ children }: { children: React.ReactNode }) {
  const { world, rapier } = useRapier();

  const raycast = useCallback(
    (
      origin: THREE.Vector3,
      direction: THREE.Vector3,
      maxDistance: number,
      groups: number = CollisionGroups.ALL
    ): RaycastHit | null => {
      const ray = new rapier.Ray(
        { x: origin.x, y: origin.y, z: origin.z },
        { x: direction.x, y: direction.y, z: direction.z }
      );

      // castRay con filtro de grupos de colisión
      const hit = world.castRay(ray, maxDistance, true, undefined, groups);

      if (hit) {
        const hitPoint = ray.pointAt(hit.timeOfImpact);
        _hitPoint.set(hitPoint.x, hitPoint.y, hitPoint.z);

        // Extraer normal real del hit
        const normal = hit.normal;
        if (normal) {
          _hitNormal.set(normal.x, normal.y, normal.z);
        } else {
          _hitNormal.set(0, 1, 0);
        }

        // Obtener el RigidBody del collider impactado
        let hitBody: RapierRigidBody | null = null;
        const collider = hit.collider;
        if (collider) {
          const parent = collider.parent();
          if (parent) {
            hitBody = parent as unknown as RapierRigidBody;
          }
        }

        return {
          point: _hitPoint.clone(),
          normal: _hitNormal.clone(),
          distance: hit.timeOfImpact,
          body: hitBody,
        };
      }

      return null;
    },
    [world, rapier]
  );

  const sphereCast = useCallback(
    (
      origin: THREE.Vector3,
      radius: number,
      direction: THREE.Vector3,
      maxDistance: number,
      groups: number = CollisionGroups.ALL
    ): RaycastHit | null => {
      // Shape cast real con esfera de Rapier
      const shape = new rapier.Ball(radius);
      const shapePos = { x: origin.x, y: origin.y, z: origin.z };
      const shapeRot = { x: 0, y: 0, z: 0, w: 1 };
      const shapeVel = { x: direction.x, y: direction.y, z: direction.z };

      const hit = world.castShape(
        shapePos,
        shapeRot,
        shapeVel,
        shape,
        maxDistance,
        true,
        undefined,
        groups
      );

      if (hit) {
        // Reconstruir punto de impacto
        const toi = hit.timeOfImpact;
        _hitPoint.set(
          origin.x + direction.x * toi,
          origin.y + direction.y * toi,
          origin.z + direction.z * toi
        );

        const normal = hit.normal1;
        if (normal) {
          _hitNormal.set(normal.x, normal.y, normal.z);
        } else {
          _hitNormal.set(0, 1, 0);
        }

        let hitBody: RapierRigidBody | null = null;
        const collider = hit.collider;
        if (collider) {
          const parent = collider.parent();
          if (parent) {
            hitBody = parent as unknown as RapierRigidBody;
          }
        }

        return {
          point: _hitPoint.clone(),
          normal: _hitNormal.clone(),
          distance: toi,
          body: hitBody,
        };
      }

      return null;
    },
    [world, rapier]
  );

  const overlapSphere = useCallback(
    (
      origin: THREE.Vector3,
      radius: number,
      groups: number = CollisionGroups.ALL
    ): RapierRigidBody[] => {
      const bodies: RapierRigidBody[] = [];
      const seen = new Set<number>();

      // Usar intersectionsWithShape de Rapier para eficiencia real
      const shape = new rapier.Ball(radius);
      const shapePos = { x: origin.x, y: origin.y, z: origin.z };
      const shapeRot = { x: 0, y: 0, z: 0, w: 1 };

      world.intersectionsWithShape(shapePos, shapeRot, shape, (collider) => {
        const parent = collider.parent();
        if (parent) {
          const handle = parent.handle;
          // Filtrar por collision groups si no es ALL
          if (groups !== CollisionGroups.ALL) {
            const cGroups = collider.collisionGroups();
            if ((cGroups & groups) === 0) return true; // continuar
          }
          if (!seen.has(handle)) {
            seen.add(handle);
            bodies.push(parent as unknown as RapierRigidBody);
          }
        }
        return true; // continuar iterando
      });

      return bodies;
    },
    [world, rapier]
  );

  return (
    <PhysicsContext.Provider value={{ raycast, sphereCast, overlapSphere }}>
      {children}
    </PhysicsContext.Provider>
  );
}

/**
 * PhysicsBody - Componente wrapper para RigidBody con configuración predefinida
 */
export function PhysicsBody({
  children,
  type = 'dynamic',
  collisionGroups,
  mass = 1,
  friction = 0.5,
  restitution = 0.1,
  linearDamping = 0.1,
  angularDamping = 0.1,
  gravityScale = 1,
  canSleep = true,
  ccd = false,
  onCollisionEnter,
  onCollisionExit,
  userData,
}: PhysicsBodyProps) {
  const bodyRef = useRef<RapierRigidBody>(null);

  return (
    <RigidBody
      ref={bodyRef}
      type={type}
      collisionGroups={collisionGroups}
      mass={mass}
      friction={friction}
      restitution={restitution}
      linearDamping={linearDamping}
      angularDamping={angularDamping}
      gravityScale={gravityScale}
      canSleep={canSleep}
      ccd={ccd}
      userData={userData}
      onCollisionEnter={(payload) => {
        if (onCollisionEnter && payload.other.rigidBody) {
          // Extraer datos de contacto reales del manifold
          const manifold = payload.manifold;
          let contactNormal = new THREE.Vector3(0, 1, 0);
          let contactPoint = new THREE.Vector3(0, 0, 0);
          
          if (manifold) {
            const normal = manifold.normal();
            if (normal) {
              contactNormal.set(normal.x, normal.y, normal.z);
            }
            // Intentar obtener punto de contacto del solver
            const numPoints = manifold.numSolverContacts();
            if (numPoints > 0) {
              const pt = manifold.solverContactPoint(0);
              if (pt) {
                contactPoint.set(pt.x, pt.y, pt.z);
              }
            }
          }
          
          onCollisionEnter({
            other: payload.other.rigidBody,
            normal: contactNormal,
            point: contactPoint,
          });
        }
      }}
      onCollisionExit={(payload) => {
        if (onCollisionExit && payload.other.rigidBody) {
          onCollisionExit({
            other: payload.other.rigidBody,
            normal: new THREE.Vector3(0, 1, 0),
            point: new THREE.Vector3(0, 0, 0),
          });
        }
      }}
    >
      {children}
    </RigidBody>
  );
}

export default PhysicsBody;
