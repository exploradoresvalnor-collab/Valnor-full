/**
 * PostProcessSystem - Sistema de Post-procesado
 * Bloom, Vignette, ChromaticAberration, SSAO, etc.
 */

import { useEffect } from 'react';
import {
  EffectComposer,
  Bloom,
  Vignette,
  SMAA,
} from '@react-three/postprocessing';
import { BlendFunction, KernelSize } from 'postprocessing';
import { useEngineStore, type QualityLevel } from '../stores/engineStore';
import { create } from 'zustand';

// Alias local para presets que incluye 'potato' opcionalmente
type QualityPreset = QualityLevel | 'potato';

// ============================================================
// POST PROCESS STORE
// ============================================================

interface PostProcessSettings {
  // Bloom
  bloomEnabled: boolean;
  bloomIntensity: number;
  bloomThreshold: number;
  bloomRadius: number;

  // Vignette
  vignetteEnabled: boolean;
  vignetteIntensity: number;
  vignetteOffset: number;

  // Chromatic Aberration
  chromaticEnabled: boolean;
  chromaticOffset: [number, number];

  // Depth of Field
  dofEnabled: boolean;
  dofFocusDistance: number;
  dofFocalLength: number;
  dofBokehScale: number;

  // Noise/Grain
  noiseEnabled: boolean;
  noiseOpacity: number;

  // SMAA
  smaaEnabled: boolean;
}

interface PostProcessStore extends PostProcessSettings {
  setBloom: (enabled: boolean, intensity?: number) => void;
  setVignette: (enabled: boolean, intensity?: number) => void;
  setChromatic: (enabled: boolean) => void;
  setDOF: (enabled: boolean, focusDistance?: number) => void;
  setNoise: (enabled: boolean, opacity?: number) => void;
  setSMAA: (enabled: boolean) => void;
  applyPreset: (preset: QualityPreset) => void;
  reset: () => void;
}

const defaultSettings: PostProcessSettings = {
  bloomEnabled: true,
  bloomIntensity: 0.5,
  bloomThreshold: 0.8,
  bloomRadius: 0.8,

  vignetteEnabled: true,
  vignetteIntensity: 0.4,
  vignetteOffset: 0.2,

  chromaticEnabled: false,
  chromaticOffset: [0.002, 0.002],

  dofEnabled: false,
  dofFocusDistance: 0.02,
  dofFocalLength: 0.05,
  dofBokehScale: 2,

  noiseEnabled: false,
  noiseOpacity: 0.03,

  smaaEnabled: true,
};

export const usePostProcessStore = create<PostProcessStore>((set) => ({
  ...defaultSettings,

  setBloom: (enabled, intensity) =>
    set((state) => ({
      bloomEnabled: enabled,
      bloomIntensity: intensity ?? state.bloomIntensity,
    })),

  setVignette: (enabled, intensity) =>
    set((state) => ({
      vignetteEnabled: enabled,
      vignetteIntensity: intensity ?? state.vignetteIntensity,
    })),

  setChromatic: (enabled) => set({ chromaticEnabled: enabled }),

  setDOF: (enabled, focusDistance) =>
    set((state) => ({
      dofEnabled: enabled,
      dofFocusDistance: focusDistance ?? state.dofFocusDistance,
    })),

  setNoise: (enabled, opacity) =>
    set((state) => ({
      noiseEnabled: enabled,
      noiseOpacity: opacity ?? state.noiseOpacity,
    })),

  setSMAA: (enabled) => set({ smaaEnabled: enabled }),

  applyPreset: (preset) => {
    const presets: Record<QualityPreset, Partial<PostProcessSettings>> = {
      ultra: {
        bloomEnabled: true,
        bloomIntensity: 0.6,
        vignetteEnabled: true,
        chromaticEnabled: true,
        dofEnabled: true,
        noiseEnabled: true,
        smaaEnabled: true,
      },
      high: {
        bloomEnabled: true,
        bloomIntensity: 0.5,
        vignetteEnabled: true,
        chromaticEnabled: false,
        dofEnabled: false,
        noiseEnabled: false,
        smaaEnabled: true,
      },
      medium: {
        bloomEnabled: true,
        bloomIntensity: 0.4,
        vignetteEnabled: true,
        chromaticEnabled: false,
        dofEnabled: false,
        noiseEnabled: false,
        smaaEnabled: false,
      },
      low: {
        bloomEnabled: false,
        vignetteEnabled: true,
        vignetteIntensity: 0.3,
        chromaticEnabled: false,
        dofEnabled: false,
        noiseEnabled: false,
        smaaEnabled: false,
      },
      potato: {
        bloomEnabled: false,
        vignetteEnabled: false,
        chromaticEnabled: false,
        dofEnabled: false,
        noiseEnabled: false,
        smaaEnabled: false,
      },
    };
    set(presets[preset]);
  },

  reset: () => set(defaultSettings),
}));

// ============================================================
// POST PROCESS SYSTEM COMPONENT
// ============================================================

interface PostProcessSystemProps {
  enabled?: boolean;
}

export function PostProcessSystem({ enabled = true }: PostProcessSystemProps) {
  const quality = useEngineStore((state) => state.quality);
  const settings = usePostProcessStore();

  // Aplicar preset cuando cambie la calidad
  useEffect(() => {
    settings.applyPreset(quality);
  }, [quality]);

  if (!enabled) return null;

  // En calidad baja, reducir efectos
  if (quality === 'low') {
    return (
      <EffectComposer multisampling={0}>
        <Vignette
          offset={settings.vignetteOffset}
          darkness={settings.vignetteIntensity}
          blendFunction={BlendFunction.NORMAL}
        />
      </EffectComposer>
    );
  }

  return (
    <EffectComposer multisampling={0}>
      <SMAA />
      <Bloom
        intensity={settings.bloomEnabled ? settings.bloomIntensity : 0}
        luminanceThreshold={settings.bloomThreshold}
        luminanceSmoothing={0.9}
        kernelSize={quality === 'ultra' ? KernelSize.LARGE : KernelSize.MEDIUM}
        mipmapBlur
      />
      <Vignette
        offset={settings.vignetteOffset}
        darkness={settings.vignetteEnabled ? settings.vignetteIntensity : 0}
        blendFunction={BlendFunction.NORMAL}
      />
    </EffectComposer>
  );
}

// ============================================================
// EFECTOS ESPECIALES (Combate, Daño, etc.)
// ============================================================

/**
 * Hook para aplicar efectos de pantalla temporales
 */
export function useScreenEffects() {
  const setChromatic = usePostProcessStore((state) => state.setChromatic);
  const setNoise = usePostProcessStore((state) => state.setNoise);

  return {
    // Efecto de daño recibido
    damageFlash: (duration = 200) => {
      setChromatic(true);
      setTimeout(() => setChromatic(false), duration);
    },

    // Efecto de golpe crítico
    criticalHit: (duration = 300) => {
      setChromatic(true);
      setNoise(true, 0.1);
      setTimeout(() => {
        setChromatic(false);
        setNoise(false);
      }, duration);
    },

    // Efecto de curación
    healPulse: (_duration = 500) => {
      // Podría usar bloom temporal aumentado
    },

    // Efecto de niebla/confusión
    confusion: (duration = 2000) => {
      setChromatic(true);
      setTimeout(() => setChromatic(false), duration);
    },
  };
}

export default PostProcessSystem;
