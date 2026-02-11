/**
 * SceneEnhancer — Mejoras visuales unificadas para cualquier escena
 * 
 * Integra en un solo componente:
 * - PostProcessSystem (Bloom, Vignette, SMAA)
 * - Niebla atmosférica configurable por bioma
 * - WeatherSystem opcional (lluvia, nieve)
 * - Environment lighting sutil
 * 
 * Usar como hijo directo dentro del <group> de cada nivel.
 */

import { useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { Environment } from '@react-three/drei';
import { PostProcessSystem, usePostProcessStore } from '../systems/PostProcessSystem';
import { WeatherSystem, type WeatherType } from '../systems/WeatherSystem';

// ============================================================
// BIOME PRESETS
// ============================================================

export type BiomeType =
  | 'canyon'
  | 'castle'
  | 'valley'
  | 'plains'
  | 'mine'
  | 'preview'
  | 'mountain'
  | 'default';

interface BiomePreset {
  // Niebla
  fogColor: string;
  fogNear: number;
  fogFar: number;
  // Bloom override
  bloomIntensity: number;
  bloomThreshold: number;
  // Vignette
  vignetteIntensity: number;
  // Clima
  weather: WeatherType;
  // Ambiente HDR
  environmentPreset: 'sunset' | 'dawn' | 'night' | 'warehouse' | 'forest' | 'apartment' | 'studio' | 'city' | 'park' | 'lobby';
  environmentIntensity: number;
}

const BIOME_PRESETS: Record<BiomeType, BiomePreset> = {
  canyon: {
    fogColor: '#c4956a',
    fogNear: 40,
    fogFar: 180,
    bloomIntensity: 0.4,
    bloomThreshold: 0.85,
    vignetteIntensity: 0.45,
    weather: 'clear',
    environmentPreset: 'sunset',
    environmentIntensity: 0.15,
  },
  castle: {
    fogColor: '#8899aa',
    fogNear: 50,
    fogFar: 200,
    bloomIntensity: 0.35,
    bloomThreshold: 0.9,
    vignetteIntensity: 0.4,
    weather: 'cloudy',
    environmentPreset: 'dawn',
    environmentIntensity: 0.1,
  },
  valley: {
    fogColor: '#a8c4b8',
    fogNear: 60,
    fogFar: 250,
    bloomIntensity: 0.3,
    bloomThreshold: 0.85,
    vignetteIntensity: 0.3,
    weather: 'clear',
    environmentPreset: 'forest',
    environmentIntensity: 0.2,
  },
  plains: {
    fogColor: '#c8d8b0',
    fogNear: 80,
    fogFar: 300,
    bloomIntensity: 0.3,
    bloomThreshold: 0.8,
    vignetteIntensity: 0.25,
    weather: 'clear',
    environmentPreset: 'park',
    environmentIntensity: 0.2,
  },
  mine: {
    fogColor: '#1a1a2a',
    fogNear: 5,
    fogFar: 40,
    bloomIntensity: 0.7,
    bloomThreshold: 0.6,
    vignetteIntensity: 0.6,
    weather: 'clear',
    environmentPreset: 'warehouse',
    environmentIntensity: 0.05,
  },
  preview: {
    fogColor: '#1a5276',
    fogNear: 50,
    fogFar: 200,
    bloomIntensity: 0.5,
    bloomThreshold: 0.7,
    vignetteIntensity: 0.4,
    weather: 'clear',
    environmentPreset: 'night',
    environmentIntensity: 0.15,
  },
  mountain: {
    fogColor: '#b8c8d8',
    fogNear: 30,
    fogFar: 150,
    bloomIntensity: 0.35,
    bloomThreshold: 0.85,
    vignetteIntensity: 0.35,
    weather: 'snow',
    environmentPreset: 'dawn',
    environmentIntensity: 0.15,
  },
  default: {
    fogColor: '#aabbcc',
    fogNear: 50,
    fogFar: 200,
    bloomIntensity: 0.4,
    bloomThreshold: 0.8,
    vignetteIntensity: 0.35,
    weather: 'clear',
    environmentPreset: 'sunset',
    environmentIntensity: 0.1,
  },
};

// ============================================================
// COMPONENT
// ============================================================

interface SceneEnhancerProps {
  /** Bioma de la escena (determina preset de niebla, bloom, clima) */
  biome: BiomeType;
  /** Post-procesado habilitado */
  postProcess?: boolean;
  /** Niebla habilitada */
  fog?: boolean;
  /** Clima habilitado */
  weather?: boolean;
  /** Environment map habilitado */
  environment?: boolean;
  /** Override del tipo de clima */
  weatherOverride?: WeatherType;
  /** Override de la intensidad del bloom */
  bloomOverride?: number;
}

export function SceneEnhancer({
  biome,
  postProcess = true,
  fog = true,
  weather = false,
  environment = true,
  weatherOverride,
  bloomOverride,
}: SceneEnhancerProps) {
  const { scene } = useThree();
  const preset = BIOME_PRESETS[biome] ?? BIOME_PRESETS.default;

  // Configurar niebla en la escena Three.js
  useEffect(() => {
    if (fog) {
      scene.fog = new THREE.Fog(preset.fogColor, preset.fogNear, preset.fogFar);
    }
    return () => {
      scene.fog = null;
    };
  }, [scene, fog, preset.fogColor, preset.fogNear, preset.fogFar]);

  // Configurar bloom/vignette según preset
  const setBloom = usePostProcessStore((s) => s.setBloom);
  const setVignette = usePostProcessStore((s) => s.setVignette);

  useEffect(() => {
    if (postProcess) {
      setBloom(true, bloomOverride ?? preset.bloomIntensity);
      setVignette(true, preset.vignetteIntensity);
    }
  }, [postProcess, preset, bloomOverride, setBloom, setVignette]);

  const weatherType = weatherOverride ?? preset.weather;

  return (
    <>
      {/* Post-procesado */}
      {postProcess && <PostProcessSystem enabled />}

      {/* Climate */}
      {weather && weatherType !== 'clear' && (
        <WeatherSystem weather={weatherType} followCamera />
      )}

      {/* Environment map para reflejos ambientales y GI sutil */}
      {environment && (
        <Environment
          preset={preset.environmentPreset}
          environmentIntensity={preset.environmentIntensity}
          background={false}
        />
      )}
    </>
  );
}

export default SceneEnhancer;
