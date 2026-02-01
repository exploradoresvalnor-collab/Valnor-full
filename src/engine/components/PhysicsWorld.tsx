/**
 * PhysicsWorld - Wrapper del mundo físico con Rapier
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
  ccd?: boolean; // Continuous collision detection
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
  // El jugador colisiona con todo excepto triggers
  PLAYER: {
    groups: CollisionGroups.PLAYER,
    mask: CollisionGroups.ALL & ~CollisionGroups.TRIGGER,
  },
  // Enemigos colisionan con terreno, jugador y otros enemigos
  ENEMY: {
    groups: CollisionGroups.ENEMY,
    mask: CollisionGroups.TERRAIN | CollisionGroups.PLAYER | CollisionGroups.ENEMY,
  },
  // Terreno es estático, colisiona con todo
  TERRAIN: {
    groups: CollisionGroups.TERRAIN,
    mask: CollisionGroups.ALL,
  },
  // Triggers solo detectan al jugador
  TRIGGER: {
    groups: CollisionGroups.TRIGGER,
    mask: CollisionGroups.PLAYER,
  },
  // Proyectiles colisionan con terreno, jugador y enemigos
  PROJECTILE: {
    groups: CollisionGroups.PROJECTILE,
    mask: CollisionGroups.TERRAIN | CollisionGroups.PLAYER | CollisionGroups.ENEMY,
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

interface RaycastHit {
  point: THREE.Vector3;
  normal: THREE.Vector3;
  distance: number;
  body: RapierRigidBody | null;
}

const PhysicsContext = createContext<PhysicsContextType | null>(null);

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
 * PhysicsWorldProvider - Provee contexto de física
 */
export function PhysicsWorldProvider({ children }: { children: React.ReactNode }) {
  const { world, rapier } = useRapier();

  const raycast = useCallback(
    (
      origin: THREE.Vector3,
      direction: THREE.Vector3,
      maxDistance: number,
      _groups: number = CollisionGroups.ALL
    ): RaycastHit | null => {
      const ray = new rapier.Ray(
        { x: origin.x, y: origin.y, z: origin.z },
        { x: direction.x, y: direction.y, z: direction.z }
      );

      const hit = world.castRay(ray, maxDistance, true);
      
      if (hit) {
        const point = ray.pointAt(hit.timeOfImpact);
        return {
          point: new THREE.Vector3(point.x, point.y, point.z),
          normal: new THREE.Vector3(0, 1, 0), // Simplificado
          distance: hit.timeOfImpact,
          body: null, // Simplificado
        };
      }
      
      return null;
    },
    [world, rapier]
  );

  const sphereCast = useCallback(
    (
      origin: THREE.Vector3,
      _radius: number,
      direction: THREE.Vector3,
      maxDistance: number,
      _groups: number = CollisionGroups.ALL
    ): RaycastHit | null => {
      // Simplificado: usamos raycast normal
      return raycast(origin, direction, maxDistance, _groups);
    },
    [raycast]
  );

  const overlapSphere = useCallback(
    (
      origin: THREE.Vector3,
      radius: number,
      _groups: number = CollisionGroups.ALL
    ): RapierRigidBody[] => {
      const bodies: RapierRigidBody[] = [];
      
      // Obtener todos los bodies dentro del radio
      world.bodies.forEach((body) => {
        const pos = body.translation();
        const distance = Math.sqrt(
          Math.pow(pos.x - origin.x, 2) +
          Math.pow(pos.y - origin.y, 2) +
          Math.pow(pos.z - origin.z, 2)
        );
        if (distance <= radius) {
          bodies.push(body);
        }
      });
      
      return bodies;
    },
    [world]
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
          onCollisionEnter({
            other: payload.other.rigidBody,
            normal: new THREE.Vector3(0, 1, 0),
            point: new THREE.Vector3(0, 0, 0),
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
      onSleep={() => console.log('Body sleeping')}
      onWake={() => console.log('Body waking')}
    >
      {children}
    </RigidBody>
  );
}

export default PhysicsBody;
