/**
 * Weather System - Sistema de clima dinámico
 * Lluvia, nieve, niebla, rayos
 */

import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useEngineStore } from '../stores/engineStore';

export type WeatherType = 'clear' | 'cloudy' | 'rain' | 'storm' | 'snow' | 'fog';

interface WeatherConfig {
  type: WeatherType;
  intensity: number;      // 0-1
  windDirection: THREE.Vector3;
  windSpeed: number;
  fogDensity: number;
  fogColor: THREE.Color;
  ambientLight: number;
  thunderChance: number;  // Para tormentas
}

const WEATHER_PRESETS: Record<WeatherType, Partial<WeatherConfig>> = {
  clear: {
    intensity: 0,
    fogDensity: 0,
    ambientLight: 1,
    thunderChance: 0,
  },
  cloudy: {
    intensity: 0.3,
    fogDensity: 0.0005,
    ambientLight: 0.7,
    thunderChance: 0,
  },
  rain: {
    intensity: 0.7,
    fogDensity: 0.001,
    ambientLight: 0.5,
    thunderChance: 0,
  },
  storm: {
    intensity: 1,
    fogDensity: 0.002,
    ambientLight: 0.3,
    thunderChance: 0.1,
  },
  snow: {
    intensity: 0.8,
    fogDensity: 0.001,
    ambientLight: 0.8,
    thunderChance: 0,
  },
  fog: {
    intensity: 0.5,
    fogDensity: 0.005,
    ambientLight: 0.6,
    thunderChance: 0,
  },
};

interface RainProps {
  count?: number;
  intensity?: number;
  area?: number;
  speed?: number;
  windDirection?: THREE.Vector3;
}

/**
 * Rain - Sistema de partículas de lluvia
 */
export function Rain({
  count = 10000,
  intensity = 1,
  area = 50,
  speed = 15,
  windDirection = new THREE.Vector3(0.2, 0, 0.1),
}: RainProps) {
  const pointsRef = useRef<THREE.Points>(null);
  const { enableParticles } = useEngineStore();
  
  // Crear geometría de partículas
  const [positions, velocities] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const vel = new Float32Array(count * 3);
    
    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      // Posición inicial aleatoria
      pos[i3] = (Math.random() - 0.5) * area;
      pos[i3 + 1] = Math.random() * area;
      pos[i3 + 2] = (Math.random() - 0.5) * area;
      
      // Velocidad con variación
      vel[i3] = windDirection.x * speed + (Math.random() - 0.5) * 2;
      vel[i3 + 1] = -speed * (0.8 + Math.random() * 0.4);
      vel[i3 + 2] = windDirection.z * speed + (Math.random() - 0.5) * 2;
    }
    
    return [pos, vel];
  }, [count, area, speed, windDirection]);

  // Material de lluvia
  const material = useMemo(() => {
    return new THREE.PointsMaterial({
      color: 0x99ccff,
      size: 0.1,
      transparent: true,
      opacity: 0.6 * intensity,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
  }, [intensity]);

  // Actualizar partículas
  useFrame((_state, delta) => {
    if (!pointsRef.current || !enableParticles) return;
    
    const positions = pointsRef.current.geometry.attributes.position.array as Float32Array;
    const halfArea = area / 2;
    
    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      
      // Mover partícula
      positions[i3] += velocities[i3] * delta;
      positions[i3 + 1] += velocities[i3 + 1] * delta;
      positions[i3 + 2] += velocities[i3 + 2] * delta;
      
      // Reiniciar si sale del área
      if (positions[i3 + 1] < 0) {
        positions[i3] = (Math.random() - 0.5) * area;
        positions[i3 + 1] = area;
        positions[i3 + 2] = (Math.random() - 0.5) * area;
      }
      
      // Wrap horizontal
      if (positions[i3] > halfArea) positions[i3] -= area;
      if (positions[i3] < -halfArea) positions[i3] += area;
      if (positions[i3 + 2] > halfArea) positions[i3 + 2] -= area;
      if (positions[i3 + 2] < -halfArea) positions[i3 + 2] += area;
    }
    
    pointsRef.current.geometry.attributes.position.needsUpdate = true;
  });

  if (!enableParticles) return null;

  return (
    <points ref={pointsRef} frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>
      <primitive object={material} attach="material" />
    </points>
  );
}

interface SnowProps {
  count?: number;
  intensity?: number;
  area?: number;
}

/**
 * Snow - Sistema de partículas de nieve
 */
export function Snow({
  count = 5000,
  intensity = 1,
  area = 50,
}: SnowProps) {
  const pointsRef = useRef<THREE.Points>(null);
  const { enableParticles } = useEngineStore();
  
  // Crear geometría
  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    
    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      pos[i3] = (Math.random() - 0.5) * area;
      pos[i3 + 1] = Math.random() * area;
      pos[i3 + 2] = (Math.random() - 0.5) * area;
    }
    
    return pos;
  }, [count, area]);

  // Material de nieve
  const material = useMemo(() => {
    return new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.15,
      transparent: true,
      opacity: 0.8 * intensity,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
  }, [intensity]);

  // Datos de movimiento por partícula
  const particleData = useRef<{ phase: number; amplitude: number; speed: number }[]>([]);
  
  useEffect(() => {
    particleData.current = Array.from({ length: count }, () => ({
      phase: Math.random() * Math.PI * 2,
      amplitude: 0.5 + Math.random() * 1,
      speed: 1 + Math.random() * 2,
    }));
  }, [count]);

  // Actualizar
  useFrame((state, delta) => {
    if (!pointsRef.current || !enableParticles) return;
    
    const positions = pointsRef.current.geometry.attributes.position.array as Float32Array;
    const time = state.clock.elapsedTime;
    
    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      const data = particleData.current[i];
      
      // Movimiento ondulante horizontal
      positions[i3] += Math.sin(time * data.speed + data.phase) * data.amplitude * delta;
      positions[i3 + 2] += Math.cos(time * data.speed + data.phase) * data.amplitude * 0.5 * delta;
      
      // Caída lenta
      positions[i3 + 1] -= (1 + Math.random() * 0.5) * delta;
      
      // Reiniciar
      if (positions[i3 + 1] < 0) {
        positions[i3] = (Math.random() - 0.5) * area;
        positions[i3 + 1] = area;
        positions[i3 + 2] = (Math.random() - 0.5) * area;
      }
    }
    
    pointsRef.current.geometry.attributes.position.needsUpdate = true;
  });

  if (!enableParticles) return null;

  return (
    <points ref={pointsRef} frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>
      <primitive object={material} attach="material" />
    </points>
  );
}

interface WeatherSystemProps {
  weather?: WeatherType;
  transitionDuration?: number;
  followCamera?: boolean;
}

/**
 * WeatherSystem - Componente principal del sistema de clima
 */
export function WeatherSystem({
  weather = 'clear',
  followCamera = true,
}: WeatherSystemProps) {
  const groupRef = useRef<THREE.Group>(null);
  
  const currentConfig = useMemo(() => {
    return {
      ...WEATHER_PRESETS[weather],
      type: weather,
    } as WeatherConfig;
  }, [weather]);

  // Seguir la cámara
  useFrame(({ camera }) => {
    if (followCamera && groupRef.current) {
      groupRef.current.position.copy(camera.position);
    }
  });

  return (
    <group ref={groupRef}>
      {/* Lluvia */}
      {(weather === 'rain' || weather === 'storm') && (
        <Rain 
          intensity={currentConfig.intensity}
          count={weather === 'storm' ? 15000 : 10000}
        />
      )}
      
      {/* Nieve */}
      {weather === 'snow' && (
        <Snow intensity={currentConfig.intensity} />
      )}
      
      {/* TODO: Agregar niebla volumétrica, rayos, etc. */}
    </group>
  );
}

export default WeatherSystem;
