/**
 * TrailSystem - Sistema de Estelas
 * Estelas para armas, magia, movimiento y efectos
 */

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Trail } from '@react-three/drei';
import * as THREE from 'three';
import { create } from 'zustand';

// ============================================================
// TIPOS
// ============================================================

export type TrailType = 
  | 'sword' 
  | 'magic' 
  | 'speed' 
  | 'fire' 
  | 'ice' 
  | 'lightning'
  | 'poison'
  | 'holy';

export interface TrailConfig {
  type: TrailType;
  width?: number;
  length?: number;
  decay?: number;
  attenuation?: (t: number) => number;
}

interface ActiveTrail {
  id: string;
  config: TrailConfig;
  targetRef: React.RefObject<THREE.Object3D>;
  active: boolean;
}

// ============================================================
// TRAIL STORE
// ============================================================

interface TrailStore {
  trails: Map<string, ActiveTrail>;
  registerTrail: (id: string, config: TrailConfig, targetRef: React.RefObject<THREE.Object3D>) => void;
  unregisterTrail: (id: string) => void;
  setTrailActive: (id: string, active: boolean) => void;
  getTrail: (id: string) => ActiveTrail | undefined;
}

export const useTrailStore = create<TrailStore>((set, get) => ({
  trails: new Map(),

  registerTrail: (id, config, targetRef) => {
    set((state) => {
      const newTrails = new Map(state.trails);
      newTrails.set(id, { id, config, targetRef, active: false });
      return { trails: newTrails };
    });
  },

  unregisterTrail: (id) => {
    set((state) => {
      const newTrails = new Map(state.trails);
      newTrails.delete(id);
      return { trails: newTrails };
    });
  },

  setTrailActive: (id, active) => {
    set((state) => {
      const trail = state.trails.get(id);
      if (trail) {
        const newTrails = new Map(state.trails);
        newTrails.set(id, { ...trail, active });
        return { trails: newTrails };
      }
      return state;
    });
  },

  getTrail: (id) => get().trails.get(id),
}));

// ============================================================
// PRESETS DE ESTELAS
// ============================================================

export const TRAIL_PRESETS: Record<TrailType, {
  color: string;
  width: number;
  length: number;
  decay: number;
  attenuation: (t: number) => number;
}> = {
  sword: {
    color: '#ffffff',
    width: 0.5,
    length: 8,
    decay: 1,
    attenuation: (t) => t * t,
  },
  magic: {
    color: '#9966ff',
    width: 0.3,
    length: 12,
    decay: 0.8,
    attenuation: (t) => t,
  },
  speed: {
    color: '#00aaff',
    width: 0.2,
    length: 20,
    decay: 2,
    attenuation: (t) => t * t * t,
  },
  fire: {
    color: '#ff4400',
    width: 0.6,
    length: 10,
    decay: 1.5,
    attenuation: (t) => Math.sqrt(t),
  },
  ice: {
    color: '#88ddff',
    width: 0.4,
    length: 8,
    decay: 0.5,
    attenuation: (t) => t * t,
  },
  lightning: {
    color: '#ffff00',
    width: 0.15,
    length: 15,
    decay: 3,
    attenuation: (t) => t * t * t * t,
  },
  poison: {
    color: '#44ff00',
    width: 0.35,
    length: 10,
    decay: 0.6,
    attenuation: (t) => Math.sin(t * Math.PI * 0.5),
  },
  holy: {
    color: '#ffffcc',
    width: 0.5,
    length: 12,
    decay: 0.8,
    attenuation: (t) => 1 - (1 - t) * (1 - t),
  },
};

// ============================================================
// COMPONENTE DE TRAIL INDIVIDUAL
// ============================================================

interface TrailEffectProps {
  targetRef: React.RefObject<THREE.Object3D>;
  type?: TrailType;
  color?: string;
  width?: number;
  length?: number;
  decay?: number;
  attenuation?: (t: number) => number;
  active?: boolean;
}

export function TrailEffect({
  targetRef,
  type = 'sword',
  color,
  width,
  length,
  decay,
  attenuation,
  active = true,
}: TrailEffectProps) {
  const preset = TRAIL_PRESETS[type];

  const finalColor = color ?? preset.color;
  const finalWidth = width ?? preset.width;
  const finalLength = length ?? preset.length;
  const finalDecay = decay ?? preset.decay;
  const finalAttenuation = attenuation ?? preset.attenuation;

  if (!active) return null;

  return (
    <Trail
      target={targetRef}
      width={finalWidth}
      length={finalLength}
      decay={finalDecay}
      attenuation={finalAttenuation}
      color={finalColor}
    >
      <meshBasicMaterial transparent opacity={0.8} />
    </Trail>
  );
}

// ============================================================
// COMPONENTE DE ESTELA DE ARMA
// ============================================================

interface WeaponTrailProps {
  startRef: React.RefObject<THREE.Object3D>;
  endRef: React.RefObject<THREE.Object3D>;
  type?: TrailType;
  active?: boolean;
  segments?: number;
}

export function WeaponTrail({
  startRef,
  endRef,
  type = 'sword',
  active = false,
  segments = 20,
}: WeaponTrailProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const preset = TRAIL_PRESETS[type];

  // Geometría de la estela
  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(segments * 6); // 2 vértices por segmento, 3 componentes
    const uvs = new Float32Array(segments * 4); // 2 vértices por segmento, 2 componentes
    
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
    
    return geo;
  }, [segments]);

  // Historia de posiciones
  const history = useRef<{ start: THREE.Vector3; end: THREE.Vector3 }[]>([]);

  useFrame(() => {
    if (!meshRef.current || !startRef.current || !endRef.current) return;

    const startPos = new THREE.Vector3();
    const endPos = new THREE.Vector3();
    startRef.current.getWorldPosition(startPos);
    endRef.current.getWorldPosition(endPos);

    // Agregar posición actual al historial
    if (active) {
      history.current.unshift({ start: startPos.clone(), end: endPos.clone() });
      if (history.current.length > segments) {
        history.current.pop();
      }
    } else {
      // Decay cuando no está activo
      if (history.current.length > 0) {
        history.current.pop();
      }
    }

    // Actualizar geometría
    const positions = geometry.attributes.position.array as Float32Array;
    const uvs = geometry.attributes.uv.array as Float32Array;

    for (let i = 0; i < segments; i++) {
      const entry = history.current[i];
      const t = i / segments;

      if (entry) {
        positions[i * 6 + 0] = entry.start.x;
        positions[i * 6 + 1] = entry.start.y;
        positions[i * 6 + 2] = entry.start.z;
        positions[i * 6 + 3] = entry.end.x;
        positions[i * 6 + 4] = entry.end.y;
        positions[i * 6 + 5] = entry.end.z;
      } else {
        // Sin datos, colapsar vértices
        const last = history.current[history.current.length - 1];
        if (last) {
          positions[i * 6 + 0] = last.start.x;
          positions[i * 6 + 1] = last.start.y;
          positions[i * 6 + 2] = last.start.z;
          positions[i * 6 + 3] = last.end.x;
          positions[i * 6 + 4] = last.end.y;
          positions[i * 6 + 5] = last.end.z;
        }
      }

      uvs[i * 4 + 0] = t;
      uvs[i * 4 + 1] = 0;
      uvs[i * 4 + 2] = t;
      uvs[i * 4 + 3] = 1;
    }

    geometry.attributes.position.needsUpdate = true;
    geometry.attributes.uv.needsUpdate = true;
    geometry.computeVertexNormals();
  });

  if (history.current.length === 0 && !active) return null;

  return (
    <mesh ref={meshRef} geometry={geometry}>
      <meshBasicMaterial
        color={preset.color}
        transparent
        opacity={0.6}
        side={THREE.DoubleSide}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </mesh>
  );
}

// ============================================================
// HOOK PARA USAR TRAILS
// ============================================================

export function useTrail(type: TrailType = 'sword') {
  const ref = useRef<THREE.Object3D>(null);
  const activeRef = useRef(false);

  return {
    ref,
    props: {
      targetRef: ref,
      type,
      active: activeRef.current,
    },
    start: () => { activeRef.current = true; },
    stop: () => { activeRef.current = false; },
    toggle: () => { activeRef.current = !activeRef.current; },
  };
}

// ============================================================
// SISTEMA CONTENEDOR
// ============================================================

interface TrailSystemProps {
  children?: React.ReactNode;
}

export function TrailSystem({ children }: TrailSystemProps) {
  return (
    <group name="trail-system">
      {children}
    </group>
  );
}

export default TrailSystem;
