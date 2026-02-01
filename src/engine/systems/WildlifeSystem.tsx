/**
 * WildlifeSystem - Sistema de Fauna
 * Animales ambientales: pájaros, mariposas, peces, conejos, etc.
 */

import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { create } from 'zustand';
import { useEngineStore } from '../stores/engineStore';

// ============================================================
// TIPOS
// ============================================================

export type AnimalType = 
  | 'bird' 
  | 'butterfly' 
  | 'fish' 
  | 'rabbit' 
  | 'deer'
  | 'firefly';

export interface AnimalBehavior {
  type: 'wander' | 'flock' | 'swim' | 'hop' | 'flee';
  speed: number;
  turnRate: number;
  bounds: THREE.Box3;
}

export interface WildlifeEntity {
  id: string;
  type: AnimalType;
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  rotation: number;
  state: 'idle' | 'moving' | 'fleeing';
  behavior: AnimalBehavior;
}

// ============================================================
// WILDLIFE STORE
// ============================================================

interface WildlifeStore {
  animals: Map<string, WildlifeEntity>;
  paused: boolean;
  spawnAnimal: (type: AnimalType, position: THREE.Vector3) => string;
  removeAnimal: (id: string) => void;
  updateAnimal: (id: string, updates: Partial<WildlifeEntity>) => void;
  clear: () => void;
  setPaused: (paused: boolean) => void;
}

export const useWildlifeStore = create<WildlifeStore>((set, _get) => ({
  animals: new Map(),
  paused: false,

  spawnAnimal: (type, position) => {
    const id = `animal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const behavior = getDefaultBehavior(type);

    const animal: WildlifeEntity = {
      id,
      type,
      position: position.clone(),
      velocity: new THREE.Vector3(),
      rotation: Math.random() * Math.PI * 2,
      state: 'idle',
      behavior,
    };

    set((state) => {
      const newAnimals = new Map(state.animals);
      newAnimals.set(id, animal);
      return { animals: newAnimals };
    });

    return id;
  },

  removeAnimal: (id) => {
    set((state) => {
      const newAnimals = new Map(state.animals);
      newAnimals.delete(id);
      return { animals: newAnimals };
    });
  },

  updateAnimal: (id, updates) => {
    set((state) => {
      const animal = state.animals.get(id);
      if (animal) {
        const newAnimals = new Map(state.animals);
        newAnimals.set(id, { ...animal, ...updates });
        return { animals: newAnimals };
      }
      return state;
    });
  },

  clear: () => set({ animals: new Map() }),
  setPaused: (paused) => set({ paused }),
}));

// ============================================================
// COMPORTAMIENTOS POR DEFECTO
// ============================================================

function getDefaultBehavior(type: AnimalType): AnimalBehavior {
  const behaviors: Record<AnimalType, AnimalBehavior> = {
    bird: {
      type: 'flock',
      speed: 5,
      turnRate: 2,
      bounds: new THREE.Box3(
        new THREE.Vector3(-50, 5, -50),
        new THREE.Vector3(50, 30, 50)
      ),
    },
    butterfly: {
      type: 'wander',
      speed: 1,
      turnRate: 5,
      bounds: new THREE.Box3(
        new THREE.Vector3(-20, 0.5, -20),
        new THREE.Vector3(20, 5, 20)
      ),
    },
    fish: {
      type: 'swim',
      speed: 2,
      turnRate: 3,
      bounds: new THREE.Box3(
        new THREE.Vector3(-30, -5, -30),
        new THREE.Vector3(30, -0.5, 30)
      ),
    },
    rabbit: {
      type: 'hop',
      speed: 3,
      turnRate: 4,
      bounds: new THREE.Box3(
        new THREE.Vector3(-40, 0, -40),
        new THREE.Vector3(40, 0.5, 40)
      ),
    },
    deer: {
      type: 'wander',
      speed: 2,
      turnRate: 1.5,
      bounds: new THREE.Box3(
        new THREE.Vector3(-60, 0, -60),
        new THREE.Vector3(60, 2, 60)
      ),
    },
    firefly: {
      type: 'wander',
      speed: 0.5,
      turnRate: 8,
      bounds: new THREE.Box3(
        new THREE.Vector3(-15, 0.5, -15),
        new THREE.Vector3(15, 3, 15)
      ),
    },
  };

  return behaviors[type];
}

// ============================================================
// COMPONENTES DE ANIMALES
// ============================================================

interface AnimalProps {
  entity: WildlifeEntity;
  playerPosition?: THREE.Vector3;
}

// Pájaro simple (geometría básica)
function Bird({ entity, playerPosition: _playerPosition }: AnimalProps) {
  const meshRef = useRef<THREE.Group>(null);
  const wingPhase = useRef(Math.random() * Math.PI * 2);

  useFrame((_, delta) => {
    if (!meshRef.current) return;

    wingPhase.current += delta * 15;

    // Aleteo
    const wingAngle = Math.sin(wingPhase.current) * 0.5;
    const wings = meshRef.current.children;
    if (wings[1]) wings[1].rotation.z = wingAngle;
    if (wings[2]) wings[2].rotation.z = -wingAngle;

    // Posición y rotación
    meshRef.current.position.copy(entity.position);
    meshRef.current.rotation.y = entity.rotation;
  });

  return (
    <group ref={meshRef}>
      {/* Cuerpo */}
      <mesh>
        <coneGeometry args={[0.1, 0.4, 4]} />
        <meshStandardMaterial color="#4a3728" />
      </mesh>
      {/* Ala izquierda */}
      <mesh position={[0.1, 0, 0]} rotation={[0, 0, 0.3]}>
        <planeGeometry args={[0.3, 0.15]} />
        <meshStandardMaterial color="#5a4838" side={THREE.DoubleSide} />
      </mesh>
      {/* Ala derecha */}
      <mesh position={[-0.1, 0, 0]} rotation={[0, 0, -0.3]}>
        <planeGeometry args={[0.3, 0.15]} />
        <meshStandardMaterial color="#5a4838" side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

// Mariposa
function Butterfly({ entity }: AnimalProps) {
  const meshRef = useRef<THREE.Group>(null);
  const wingPhase = useRef(Math.random() * Math.PI * 2);

  const wingColor = useMemo(() => {
    const colors = ['#ff6b9d', '#6b9fff', '#ffdb6b', '#9dff6b', '#ff9d6b'];
    return colors[Math.floor(Math.random() * colors.length)];
  }, []);

  useFrame((_, delta) => {
    if (!meshRef.current) return;

    wingPhase.current += delta * 10;
    const wingAngle = Math.sin(wingPhase.current) * 0.8;

    const wings = meshRef.current.children;
    if (wings[1]) wings[1].rotation.y = wingAngle;
    if (wings[2]) wings[2].rotation.y = -wingAngle;

    meshRef.current.position.copy(entity.position);
    meshRef.current.rotation.y = entity.rotation;
  });

  return (
    <group ref={meshRef} scale={0.5}>
      {/* Cuerpo */}
      <mesh>
        <capsuleGeometry args={[0.02, 0.15, 4, 8]} />
        <meshStandardMaterial color="#222" />
      </mesh>
      {/* Ala izquierda */}
      <mesh position={[0.08, 0, 0]}>
        <circleGeometry args={[0.1, 16]} />
        <meshStandardMaterial color={wingColor} side={THREE.DoubleSide} transparent opacity={0.8} />
      </mesh>
      {/* Ala derecha */}
      <mesh position={[-0.08, 0, 0]}>
        <circleGeometry args={[0.1, 16]} />
        <meshStandardMaterial color={wingColor} side={THREE.DoubleSide} transparent opacity={0.8} />
      </mesh>
    </group>
  );
}

// Luciérnaga
function Firefly({ entity }: AnimalProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.PointLight>(null);
  const phase = useRef(Math.random() * Math.PI * 2);

  useFrame((_state, delta) => {
    if (!meshRef.current) return;

    phase.current += delta * 2;
    const intensity = 0.3 + Math.sin(phase.current) * 0.3;

    if (glowRef.current) {
      glowRef.current.intensity = intensity;
    }

    meshRef.current.position.copy(entity.position);
  });

  return (
    <group>
      <mesh ref={meshRef}>
        <sphereGeometry args={[0.03, 8, 8]} />
        <meshStandardMaterial color="#ffffaa" emissive="#ffff00" emissiveIntensity={2} />
      </mesh>
      <pointLight ref={glowRef} color="#ffff88" intensity={0.5} distance={3} />
    </group>
  );
}

// ============================================================
// WILDLIFE SYSTEM COMPONENT
// ============================================================

interface WildlifeSystemProps {
  enabled?: boolean;
  maxAnimals?: number;
  spawnRadius?: number;
  playerPosition?: THREE.Vector3;
}

export function WildlifeSystem({
  enabled = true,
  maxAnimals = 30,
  spawnRadius = 40,
  playerPosition,
}: WildlifeSystemProps) {
  const quality = useEngineStore((state) => state.quality);
  const animals = useWildlifeStore((state) => state.animals);
  const paused = useWildlifeStore((state) => state.paused);
  const spawnAnimal = useWildlifeStore((state) => state.spawnAnimal);
  const updateAnimal = useWildlifeStore((state) => state.updateAnimal);

  // Ajustar cantidad según calidad
  const adjustedMax = useMemo(() => {
    const multipliers: Record<string, number> = {
      ultra: 1.0,
      high: 0.7,
      medium: 0.4,
      low: 0.2,
      potato: 0,
    };
    return Math.floor(maxAnimals * (multipliers[quality] ?? 0.5));
  }, [maxAnimals, quality]);

  // Spawn inicial
  useEffect(() => {
    if (!enabled || adjustedMax === 0) return;

    // Spawn algunos animales iniciales
    const types: AnimalType[] = ['bird', 'butterfly', 'firefly'];
    for (let i = 0; i < Math.min(10, adjustedMax); i++) {
      const type = types[Math.floor(Math.random() * types.length)];
      const pos = new THREE.Vector3(
        (Math.random() - 0.5) * spawnRadius,
        type === 'bird' ? 10 + Math.random() * 10 : 1 + Math.random() * 2,
        (Math.random() - 0.5) * spawnRadius
      );
      spawnAnimal(type, pos);
    }
  }, [enabled, adjustedMax]);

  // Actualizar comportamiento
  useFrame((_, delta) => {
    if (paused || !enabled) return;

    animals.forEach((animal) => {
      const { behavior, position, velocity: _velocity, rotation } = animal;

      // Comportamiento básico de wander
      if (behavior.type === 'wander' || behavior.type === 'flock') {
        // Dirección aleatoria
        const targetRotation = rotation + (Math.random() - 0.5) * behavior.turnRate * delta;

        // Calcular nueva velocidad
        const newVel = new THREE.Vector3(
          Math.sin(targetRotation) * behavior.speed,
          animal.type === 'bird' ? Math.sin(Date.now() * 0.001) * 0.5 : 0,
          Math.cos(targetRotation) * behavior.speed
        );

        // Mantener dentro de bounds
        const newPos = position.clone().add(newVel.clone().multiplyScalar(delta));
        behavior.bounds.clampPoint(newPos, newPos);

        updateAnimal(animal.id, {
          position: newPos,
          velocity: newVel,
          rotation: targetRotation,
        });
      }
    });
  });

  if (!enabled || quality === 'low') return null;

  return (
    <group name="wildlife-system">
      {Array.from(animals.values()).map((animal) => {
        switch (animal.type) {
          case 'bird':
            return <Bird key={animal.id} entity={animal} playerPosition={playerPosition} />;
          case 'butterfly':
            return <Butterfly key={animal.id} entity={animal} />;
          case 'firefly':
            return <Firefly key={animal.id} entity={animal} />;
          default:
            return null;
        }
      })}
    </group>
  );
}

// ============================================================
// HOOK PARA CONTROLAR WILDLIFE
// ============================================================

export function useWildlife() {
  const store = useWildlifeStore();

  return {
    spawn: store.spawnAnimal,
    remove: store.removeAnimal,
    clear: store.clear,
    pause: () => store.setPaused(true),
    resume: () => store.setPaused(false),
    count: store.animals.size,
  };
}

export default WildlifeSystem;
