/**
 * AmbientParticlesSystem - Sistema de Partículas Ambientales
 * Polvo, polen, cenizas, hojas flotantes, esporas, etc.
 */

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sparkles, Float } from '@react-three/drei';
import * as THREE from 'three';
import { useEngineStore } from '../stores/engineStore';

// ============================================================
// TIPOS
// ============================================================

export type ParticleType = 
  | 'dust' 
  | 'pollen' 
  | 'ash' 
  | 'leaves' 
  | 'spores'
  | 'embers'
  | 'snow_light'
  | 'magic';

export interface AmbientParticleConfig {
  type: ParticleType;
  count?: number;
  size?: number;
  speed?: number;
  opacity?: number;
  area?: [number, number, number];
  color?: string;
}

// ============================================================
// PRESETS DE PARTÍCULAS
// ============================================================

const PARTICLE_PRESETS: Record<ParticleType, {
  color: string;
  size: number;
  speed: number;
  opacity: number;
  count: number;
}> = {
  dust: {
    color: '#d4c4a8',
    size: 0.02,
    speed: 0.2,
    opacity: 0.3,
    count: 200,
  },
  pollen: {
    color: '#fff8dc',
    size: 0.03,
    speed: 0.3,
    opacity: 0.5,
    count: 100,
  },
  ash: {
    color: '#666666',
    size: 0.04,
    speed: 0.5,
    opacity: 0.4,
    count: 150,
  },
  leaves: {
    color: '#8b4513',
    size: 0.1,
    speed: 0.8,
    opacity: 0.8,
    count: 30,
  },
  spores: {
    color: '#90ee90',
    size: 0.015,
    speed: 0.15,
    opacity: 0.6,
    count: 300,
  },
  embers: {
    color: '#ff4500',
    size: 0.025,
    speed: 1.5,
    opacity: 0.9,
    count: 50,
  },
  snow_light: {
    color: '#ffffff',
    size: 0.03,
    speed: 0.4,
    opacity: 0.7,
    count: 500,
  },
  magic: {
    color: '#9966ff',
    size: 0.02,
    speed: 0.5,
    opacity: 0.8,
    count: 100,
  },
};

// ============================================================
// COMPONENTE DE PARTÍCULAS INSTANCIADAS
// ============================================================

interface InstancedParticlesProps {
  type: ParticleType;
  count?: number;
  area?: [number, number, number];
  position?: [number, number, number];
  windDirection?: THREE.Vector3;
  config?: Partial<typeof PARTICLE_PRESETS[ParticleType]>;
}

export function InstancedParticles({
  type,
  count,
  area = [30, 15, 30],
  position = [0, 5, 0],
  windDirection = new THREE.Vector3(1, 0, 0.3),
  config = {},
}: InstancedParticlesProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const quality = useEngineStore((state) => state.quality);

  const preset = { ...PARTICLE_PRESETS[type], ...config };
  const particleCount = count ?? preset.count;

  // Ajustar cantidad según calidad
  const adjustedCount = useMemo(() => {
    const multipliers: Record<string, number> = {
      ultra: 1.0,
      high: 0.7,
      medium: 0.4,
      low: 0.15,
      potato: 0,
    };
    return Math.floor(particleCount * (multipliers[quality] ?? 0.5));
  }, [particleCount, quality]);

  // Datos de partículas
  const particleData = useMemo(() => {
    const data: {
      position: THREE.Vector3;
      velocity: THREE.Vector3;
      phase: number;
      rotationSpeed: number;
    }[] = [];

    for (let i = 0; i < adjustedCount; i++) {
      data.push({
        position: new THREE.Vector3(
          (Math.random() - 0.5) * area[0],
          Math.random() * area[1],
          (Math.random() - 0.5) * area[2]
        ),
        velocity: new THREE.Vector3(
          (Math.random() - 0.5) * preset.speed,
          -preset.speed * 0.5 + Math.random() * preset.speed * 0.3,
          (Math.random() - 0.5) * preset.speed
        ),
        phase: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 2,
      });
    }

    return data;
  }, [adjustedCount, area, preset.speed]);

  const dummy = useMemo(() => new THREE.Object3D(), []);

  // Animación
  useFrame((state, delta) => {
    if (!meshRef.current || adjustedCount === 0) return;

    const time = state.clock.elapsedTime;

    particleData.forEach((particle, i) => {
      // Movimiento con viento
      particle.position.x += (particle.velocity.x + windDirection.x * 0.3) * delta;
      particle.position.y += particle.velocity.y * delta;
      particle.position.z += (particle.velocity.z + windDirection.z * 0.3) * delta;

      // Movimiento sinusoidal (flotar)
      const wave = Math.sin(time + particle.phase) * 0.1;
      particle.position.x += wave * delta;

      // Wrap around (respawn cuando sale del área)
      if (particle.position.y < 0) {
        particle.position.y = area[1];
        particle.position.x = (Math.random() - 0.5) * area[0];
        particle.position.z = (Math.random() - 0.5) * area[2];
      }
      if (particle.position.x > area[0] / 2) particle.position.x = -area[0] / 2;
      if (particle.position.x < -area[0] / 2) particle.position.x = area[0] / 2;
      if (particle.position.z > area[2] / 2) particle.position.z = -area[2] / 2;
      if (particle.position.z < -area[2] / 2) particle.position.z = area[2] / 2;

      // Actualizar matriz
      dummy.position.copy(particle.position);
      dummy.rotation.x += particle.rotationSpeed * delta;
      dummy.rotation.y += particle.rotationSpeed * 0.5 * delta;
      dummy.scale.setScalar(preset.size);
      dummy.updateMatrix();

      meshRef.current!.setMatrixAt(i, dummy.matrix);
    });

    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  if (quality === 'low' || adjustedCount === 0) return null;

  // Geometría según tipo
  const geometry = useMemo(() => {
    if (type === 'leaves') {
      return new THREE.PlaneGeometry(1, 0.6);
    }
    return new THREE.SphereGeometry(1, 4, 4);
  }, [type]);

  return (
    <group position={position}>
      <instancedMesh ref={meshRef} args={[geometry, undefined, adjustedCount]}>
        <meshBasicMaterial
          color={preset.color}
          transparent
          opacity={preset.opacity}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </instancedMesh>
    </group>
  );
}

// ============================================================
// COMPONENTE SPARKLES (usando drei)
// ============================================================

interface MagicSparklesProps {
  position?: [number, number, number];
  count?: number;
  color?: string;
  size?: number;
  speed?: number;
  scale?: [number, number, number];
}

export function MagicSparkles({
  position = [0, 2, 0],
  count = 50,
  color = '#ffdd88',
  size = 2,
  speed = 0.3,
  scale = [10, 10, 10],
}: MagicSparklesProps) {
  const quality = useEngineStore((state) => state.quality);

  if (quality === 'low') return null;

  const adjustedCount = quality === 'ultra' ? count : Math.floor(count * 0.5);

  return (
    <Sparkles
      position={position}
      count={adjustedCount}
      color={color}
      size={size}
      speed={speed}
      scale={scale}
      opacity={0.8}
    />
  );
}

// ============================================================
// FLOATING LEAVES (Hojas flotantes)
// ============================================================

interface FloatingLeavesProps {
  count?: number;
  area?: [number, number, number];
  position?: [number, number, number];
}

export function FloatingLeaves({
  count = 10,
  area = [20, 10, 20],
  position = [0, 5, 0],
}: FloatingLeavesProps) {
  const quality = useEngineStore((state) => state.quality);

  if (quality === 'low') return null;

  const leaves = useMemo(() => {
    const leafData = [];
    for (let i = 0; i < count; i++) {
      leafData.push({
        position: [
          (Math.random() - 0.5) * area[0],
          Math.random() * area[1],
          (Math.random() - 0.5) * area[2],
        ] as [number, number, number],
        rotation: Math.random() * Math.PI * 2,
        floatIntensity: 0.5 + Math.random() * 0.5,
        rotationIntensity: 0.3 + Math.random() * 0.4,
        color: ['#8b4513', '#a0522d', '#cd853f', '#daa520'][Math.floor(Math.random() * 4)],
      });
    }
    return leafData;
  }, [count, area]);

  return (
    <group position={position}>
      {leaves.map((leaf, i) => (
        <Float
          key={i}
          position={leaf.position}
          floatIntensity={leaf.floatIntensity}
          rotationIntensity={leaf.rotationIntensity}
          speed={1.5}
        >
          <mesh rotation={[leaf.rotation, leaf.rotation * 0.5, 0]}>
            <planeGeometry args={[0.15, 0.1]} />
            <meshStandardMaterial
              color={leaf.color}
              side={THREE.DoubleSide}
              transparent
              opacity={0.9}
            />
          </mesh>
        </Float>
      ))}
    </group>
  );
}

// ============================================================
// AMBIENT PARTICLES SYSTEM (Contenedor principal)
// ============================================================

interface AmbientParticlesSystemProps {
  enabled?: boolean;
  preset?: ParticleType;
  configs?: AmbientParticleConfig[];
  children?: React.ReactNode;
}

export function AmbientParticlesSystem({
  enabled = true,
  preset,
  configs = [],
  children,
}: AmbientParticlesSystemProps) {
  const quality = useEngineStore((state) => state.quality);

  if (!enabled || quality === 'low') return null;

  return (
    <group name="ambient-particles-system">
      {/* Preset simple */}
      {preset && <InstancedParticles type={preset} />}

      {/* Configuraciones múltiples */}
      {configs.map((config, i) => (
        <InstancedParticles
          key={`particles-${i}`}
          type={config.type}
          count={config.count}
          area={config.area}
          config={{
            size: config.size,
            speed: config.speed,
            opacity: config.opacity,
            color: config.color,
          }}
        />
      ))}

      {/* Children personalizados */}
      {children}
    </group>
  );
}

// ============================================================
// PRESETS DE AMBIENTES
// ============================================================

export function ForestAmbience() {
  return (
    <AmbientParticlesSystem enabled>
      <InstancedParticles type="pollen" count={80} area={[40, 8, 40]} />
      <InstancedParticles type="spores" count={100} area={[30, 5, 30]} />
      <FloatingLeaves count={15} area={[50, 15, 50]} />
    </AmbientParticlesSystem>
  );
}

export function CaveAmbience() {
  return (
    <AmbientParticlesSystem enabled>
      <InstancedParticles type="dust" count={300} area={[20, 10, 20]} />
      <MagicSparkles color="#4488ff" count={30} />
    </AmbientParticlesSystem>
  );
}

export function VolcanoAmbience() {
  return (
    <AmbientParticlesSystem enabled>
      <InstancedParticles type="ash" count={400} area={[50, 30, 50]} />
      <InstancedParticles type="embers" count={100} area={[30, 20, 30]} />
    </AmbientParticlesSystem>
  );
}

export function MagicAmbience() {
  return (
    <AmbientParticlesSystem enabled>
      <InstancedParticles type="magic" count={150} area={[25, 12, 25]} />
      <MagicSparkles color="#aa66ff" count={80} />
      <MagicSparkles color="#66aaff" count={40} position={[5, 3, 5]} />
    </AmbientParticlesSystem>
  );
}

export default AmbientParticlesSystem;
