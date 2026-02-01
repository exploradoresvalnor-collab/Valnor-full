/**
 * VFXSystem - Sistema de Efectos Visuales
 * Gestiona efectos de partículas, impactos, explosiones y habilidades
 */

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { create } from 'zustand';

// ============================================================
// TIPOS
// ============================================================

export type VFXType = 
  | 'impact' 
  | 'explosion' 
  | 'heal' 
  | 'levelUp' 
  | 'magic' 
  | 'fire'
  | 'ice'
  | 'lightning'
  | 'slash'
  | 'buff'
  | 'debuff';

export interface VFXConfig {
  type: VFXType;
  position: THREE.Vector3;
  color?: string;
  scale?: number;
  duration?: number;
  intensity?: number;
}

export interface ActiveVFX extends VFXConfig {
  id: string;
  startTime: number;
  particles: THREE.Vector3[];
  velocities: THREE.Vector3[];
}

// ============================================================
// VFX STORE
// ============================================================

interface VFXStore {
  activeEffects: ActiveVFX[];
  spawnVFX: (config: VFXConfig) => void;
  removeVFX: (id: string) => void;
  clearAll: () => void;
}

export const useVFXStore = create<VFXStore>((set, get) => ({
  activeEffects: [],

  spawnVFX: (config) => {
    const id = `vfx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const particles: THREE.Vector3[] = [];
    const velocities: THREE.Vector3[] = [];

    // Generar partículas según tipo
    const count = getParticleCount(config.type);
    for (let i = 0; i < count; i++) {
      particles.push(config.position.clone());
      velocities.push(getInitialVelocity(config.type, i, count));
    }

    const vfx: ActiveVFX = {
      ...config,
      id,
      startTime: performance.now(),
      particles,
      velocities,
      duration: config.duration ?? getDefaultDuration(config.type),
      scale: config.scale ?? 1,
      intensity: config.intensity ?? 1,
    };

    set((state) => ({
      activeEffects: [...state.activeEffects, vfx],
    }));

    // Auto-remove después de la duración
    setTimeout(() => {
      get().removeVFX(id);
    }, vfx.duration);
  },

  removeVFX: (id) => {
    set((state) => ({
      activeEffects: state.activeEffects.filter((vfx) => vfx.id !== id),
    }));
  },

  clearAll: () => {
    set({ activeEffects: [] });
  },
}));

// ============================================================
// HELPERS
// ============================================================

function getParticleCount(type: VFXType): number {
  const counts: Record<VFXType, number> = {
    impact: 20,
    explosion: 50,
    heal: 30,
    levelUp: 100,
    magic: 40,
    fire: 35,
    ice: 25,
    lightning: 15,
    slash: 10,
    buff: 20,
    debuff: 20,
  };
  return counts[type];
}

function getDefaultDuration(type: VFXType): number {
  const durations: Record<VFXType, number> = {
    impact: 500,
    explosion: 1000,
    heal: 1500,
    levelUp: 2000,
    magic: 800,
    fire: 1200,
    ice: 1000,
    lightning: 300,
    slash: 400,
    buff: 1500,
    debuff: 1500,
  };
  return durations[type];
}

function getInitialVelocity(type: VFXType, index: number, total: number): THREE.Vector3 {
  const v = new THREE.Vector3();

  switch (type) {
    case 'explosion':
      // Explosión esférica
      const phi = Math.acos(-1 + (2 * index) / total);
      const theta = Math.sqrt(total * Math.PI) * phi;
      v.setFromSphericalCoords(3 + Math.random() * 2, phi, theta);
      break;

    case 'levelUp':
      // Espiral ascendente
      const angle = (index / total) * Math.PI * 4;
      v.set(
        Math.cos(angle) * 0.5,
        2 + Math.random(),
        Math.sin(angle) * 0.5
      );
      break;

    case 'heal':
      // Ascendente suave
      v.set(
        (Math.random() - 0.5) * 0.5,
        1 + Math.random() * 0.5,
        (Math.random() - 0.5) * 0.5
      );
      break;

    case 'fire':
      // Llamas ascendentes
      v.set(
        (Math.random() - 0.5) * 0.8,
        1.5 + Math.random(),
        (Math.random() - 0.5) * 0.8
      );
      break;

    case 'ice':
      // Cristales que caen
      v.set(
        (Math.random() - 0.5) * 1.5,
        0.5 - Math.random() * 0.5,
        (Math.random() - 0.5) * 1.5
      );
      break;

    case 'lightning':
      // Rayos rápidos verticales
      v.set(
        (Math.random() - 0.5) * 0.2,
        -5 + Math.random() * 10,
        (Math.random() - 0.5) * 0.2
      );
      break;

    case 'slash':
      // Arco horizontal
      const slashAngle = ((index / total) - 0.5) * Math.PI * 0.5;
      v.set(Math.cos(slashAngle) * 3, 0, Math.sin(slashAngle) * 3);
      break;

    default:
      // Dispersión aleatoria
      v.set(
        (Math.random() - 0.5) * 2,
        (Math.random() - 0.5) * 2,
        (Math.random() - 0.5) * 2
      );
  }

  return v;
}

function getVFXColor(type: VFXType, customColor?: string): string {
  if (customColor) return customColor;

  const colors: Record<VFXType, string> = {
    impact: '#ffffff',
    explosion: '#ff6600',
    heal: '#00ff88',
    levelUp: '#ffd700',
    magic: '#9966ff',
    fire: '#ff4400',
    ice: '#88ddff',
    lightning: '#ffff00',
    slash: '#ffffff',
    buff: '#00ffaa',
    debuff: '#aa00ff',
  };
  return colors[type];
}

// ============================================================
// COMPONENTES DE PARTÍCULAS
// ============================================================

interface ParticleSystemProps {
  vfx: ActiveVFX;
}

function ParticleSystem({ vfx }: ParticleSystemProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const color = useMemo(() => new THREE.Color(getVFXColor(vfx.type, vfx.color)), [vfx.type, vfx.color]);

  const count = vfx.particles.length;

  useFrame((_, delta) => {
    if (!meshRef.current) return;

    const elapsed = performance.now() - vfx.startTime;
    const progress = Math.min(elapsed / (vfx.duration ?? 1000), 1);

    // Actualizar cada partícula
    for (let i = 0; i < count; i++) {
      const pos = vfx.particles[i];
      const vel = vfx.velocities[i];

      // Aplicar velocidad con gravedad según tipo
      const gravity = vfx.type === 'fire' || vfx.type === 'heal' || vfx.type === 'levelUp' 
        ? 0 
        : -9.8;

      pos.x += vel.x * delta;
      pos.y += vel.y * delta + 0.5 * gravity * delta * delta;
      pos.z += vel.z * delta;

      // Actualizar velocidad
      vel.y += gravity * delta;

      // Escala decrece con el tiempo
      const scale = (1 - progress) * (vfx.scale ?? 1) * 0.1;

      dummy.position.copy(pos);
      dummy.scale.setScalar(scale);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    }

    meshRef.current.instanceMatrix.needsUpdate = true;

    // Actualizar opacidad del material
    const material = meshRef.current.material as THREE.MeshBasicMaterial;
    material.opacity = 1 - progress * progress;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <sphereGeometry args={[1, 8, 8]} />
      <meshBasicMaterial 
        color={color} 
        transparent 
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </instancedMesh>
  );
}

// ============================================================
// VFX SYSTEM COMPONENT
// ============================================================

interface VFXSystemProps {
  maxEffects?: number;
}

export function VFXSystem({ maxEffects = 20 }: VFXSystemProps) {
  const activeEffects = useVFXStore((state) => state.activeEffects);

  // Limitar efectos activos
  const visibleEffects = activeEffects.slice(-maxEffects);

  return (
    <group name="vfx-system">
      {visibleEffects.map((vfx) => (
        <ParticleSystem key={vfx.id} vfx={vfx} />
      ))}
    </group>
  );
}

// ============================================================
// HOOKS UTILITARIOS
// ============================================================

/**
 * Hook para spawear VFX fácilmente desde cualquier componente
 */
export function useVFX() {
  const spawnVFX = useVFXStore((state) => state.spawnVFX);
  const clearAll = useVFXStore((state) => state.clearAll);

  return {
    // Efectos básicos
    spawnImpact: (position: THREE.Vector3, color?: string) =>
      spawnVFX({ type: 'impact', position, color }),

    spawnExplosion: (position: THREE.Vector3, scale = 1) =>
      spawnVFX({ type: 'explosion', position, scale }),

    spawnHeal: (position: THREE.Vector3) =>
      spawnVFX({ type: 'heal', position }),

    spawnLevelUp: (position: THREE.Vector3) =>
      spawnVFX({ type: 'levelUp', position }),

    // Efectos elementales
    spawnFire: (position: THREE.Vector3) =>
      spawnVFX({ type: 'fire', position }),

    spawnIce: (position: THREE.Vector3) =>
      spawnVFX({ type: 'ice', position }),

    spawnLightning: (position: THREE.Vector3) =>
      spawnVFX({ type: 'lightning', position }),

    // Efectos de combate
    spawnSlash: (position: THREE.Vector3, color?: string) =>
      spawnVFX({ type: 'slash', position, color }),

    spawnBuff: (position: THREE.Vector3) =>
      spawnVFX({ type: 'buff', position }),

    spawnDebuff: (position: THREE.Vector3) =>
      spawnVFX({ type: 'debuff', position }),

    // Efecto personalizado
    spawn: spawnVFX,
    clearAll,
  };
}

export default VFXSystem;
