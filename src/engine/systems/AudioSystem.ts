/**
 * Audio System - Sistema de audio 3D y música
 */

import { useEffect, useCallback, useMemo } from 'react';
import * as THREE from 'three';
import { useThree, useFrame } from '@react-three/fiber';
import { useGameStore } from '../../stores/gameStore';
import { useSettingsStore } from '../../stores/settingsStore';

// Categorías de audio
export type AudioCategory = 'master' | 'music' | 'sfx' | 'voice' | 'ambient';

// Tipos de audio
export type SoundType = 
  | 'sfx_attack'
  | 'sfx_hit'
  | 'sfx_death'
  | 'sfx_footstep'
  | 'sfx_jump'
  | 'sfx_land'
  | 'sfx_pickup'
  | 'sfx_ui_click'
  | 'sfx_ui_hover'
  | 'sfx_level_up'
  | 'music_menu'
  | 'music_combat'
  | 'music_exploration'
  | 'music_boss'
  | 'ambient_forest'
  | 'ambient_cave'
  | 'ambient_wind'
  | 'ambient_rain';

interface SoundConfig {
  url: string;
  category: AudioCategory;
  volume: number;
  loop: boolean;
  spatial: boolean;
  refDistance?: number;
  maxDistance?: number;
  rolloffFactor?: number;
}

interface PlayingSound {
  id: string;
  type: SoundType;
  audio: THREE.Audio<GainNode> | THREE.PositionalAudio;
  startTime: number;
  fadeOutTime?: number;
}

// Volúmenes por categoría
interface VolumeSettings {
  master: number;
  music: number;
  sfx: number;
  voice: number;
  ambient: number;
}

class AudioSystemManager {
  private listener: THREE.AudioListener | null = null;
  private audioLoader: THREE.AudioLoader;
  private bufferCache: Map<string, AudioBuffer> = new Map();
  private sounds: Map<SoundType, SoundConfig> = new Map();
  private playingSounds: Map<string, PlayingSound> = new Map();
  private volumes: VolumeSettings = {
    master: 1,
    music: 0.7,
    sfx: 1,
    voice: 1,
    ambient: 0.5,
  };
  
  private currentMusic: PlayingSound | null = null;
  private musicCrossfadeDuration: number = 2;

  constructor() {
    this.audioLoader = new THREE.AudioLoader();
  }

  /**
   * Inicializar con listener
   */
  initialize(listener: THREE.AudioListener) {
    this.listener = listener;
  }

  /**
   * Registrar un sonido
   */
  registerSound(type: SoundType, config: SoundConfig) {
    this.sounds.set(type, config);
  }

  /**
   * Precargar un sonido
   */
  async preload(type: SoundType): Promise<AudioBuffer | null> {
    const config = this.sounds.get(type);
    if (!config) return null;
    
    if (this.bufferCache.has(config.url)) {
      return this.bufferCache.get(config.url)!;
    }
    
    return new Promise((resolve, reject) => {
      this.audioLoader.load(
        config.url,
        (buffer) => {
          this.bufferCache.set(config.url, buffer);
          resolve(buffer);
        },
        undefined,
        reject
      );
    });
  }

  /**
   * Reproducir un sonido
   */
  play(
    type: SoundType,
    options?: {
      position?: THREE.Vector3;
      volume?: number;
      playbackRate?: number;
      loop?: boolean;
    }
  ): string | null {
    if (!this.listener) return null;
    
    const config = this.sounds.get(type);
    if (!config) {
      console.warn(`Sound not registered: ${type}`);
      return null;
    }
    
    const buffer = this.bufferCache.get(config.url);
    if (!buffer) {
      // Cargar y reproducir
      this.preload(type).then(() => {
        this.play(type, options);
      });
      return null;
    }
    
    // Crear audio
    let audio: THREE.Audio<GainNode> | THREE.PositionalAudio;
    
    if (config.spatial && options?.position) {
      const positionalAudio = new THREE.PositionalAudio(this.listener);
      positionalAudio.setRefDistance(config.refDistance ?? 5);
      positionalAudio.setMaxDistance(config.maxDistance ?? 50);
      positionalAudio.setRolloffFactor(config.rolloffFactor ?? 1);
      positionalAudio.position.copy(options.position);
      audio = positionalAudio;
    } else {
      audio = new THREE.Audio<GainNode>(this.listener);
    }
    
    audio.setBuffer(buffer);
    audio.setLoop(options?.loop ?? config.loop);
    
    // Calcular volumen final
    const categoryVolume = this.volumes[config.category];
    const baseVolume = options?.volume ?? config.volume;
    const finalVolume = baseVolume * categoryVolume * this.volumes.master;
    audio.setVolume(finalVolume);
    
    if (options?.playbackRate) {
      audio.setPlaybackRate(options.playbackRate);
    }
    
    audio.play();
    
    // Registrar
    const id = `${type}_${Date.now()}_${Math.random()}`;
    this.playingSounds.set(id, {
      id,
      type,
      audio,
      startTime: Date.now(),
    });
    
    // Auto-remove cuando termine (si no es loop)
    if (!audio.getLoop()) {
      const duration = buffer.duration * 1000 / (options?.playbackRate ?? 1);
      setTimeout(() => {
        this.stop(id);
      }, duration + 100);
    }
    
    return id;
  }

  /**
   * Detener un sonido
   */
  stop(id: string, fadeOut: number = 0) {
    const playing = this.playingSounds.get(id);
    if (!playing) return;
    
    if (fadeOut > 0) {
      playing.fadeOutTime = Date.now();
      // Fade out se maneja en update()
    } else {
      if (playing.audio.isPlaying) {
        playing.audio.stop();
      }
      this.playingSounds.delete(id);
    }
  }

  /**
   * Detener todos los sonidos de una categoría
   */
  stopCategory(category: AudioCategory, fadeOut: number = 0) {
    this.playingSounds.forEach((playing, id) => {
      const config = this.sounds.get(playing.type);
      if (config?.category === category) {
        this.stop(id, fadeOut);
      }
    });
  }

  /**
   * Cambiar música con crossfade
   */
  playMusic(type: SoundType, crossfade: boolean = true) {
    const config = this.sounds.get(type);
    if (!config || config.category !== 'music') return;
    
    // Fade out música actual
    if (this.currentMusic && crossfade) {
      this.stop(this.currentMusic.id, this.musicCrossfadeDuration);
    } else if (this.currentMusic) {
      this.stop(this.currentMusic.id);
    }
    
    // Play nueva música
    const id = this.play(type, { loop: true, volume: 0 });
    if (id) {
      const playing = this.playingSounds.get(id);
      if (playing) {
        this.currentMusic = playing;
        
        // Fade in
        if (crossfade) {
          // Se maneja en update()
        } else {
          playing.audio.setVolume(config.volume * this.volumes.music * this.volumes.master);
        }
      }
    }
  }

  /**
   * Establecer volumen de una categoría
   */
  setVolume(category: AudioCategory, volume: number) {
    this.volumes[category] = Math.max(0, Math.min(1, volume));
    
    // Actualizar sonidos activos de esa categoría
    this.playingSounds.forEach((playing) => {
      const config = this.sounds.get(playing.type);
      if (config?.category === category) {
        const finalVolume = config.volume * this.volumes[category] * this.volumes.master;
        playing.audio.setVolume(finalVolume);
      }
    });
  }

  /**
   * Obtener volumen de una categoría
   */
  getVolume(category: AudioCategory): number {
    return this.volumes[category];
  }

  /**
   * Update (para fade in/out)
   */
  update(_deltaTime: number) {
    const now = Date.now();
    const toRemove: string[] = [];
    
    this.playingSounds.forEach((playing, id) => {
      const config = this.sounds.get(playing.type);
      if (!config) return;
      
      // Fade out
      if (playing.fadeOutTime) {
        const elapsed = (now - playing.fadeOutTime) / 1000;
        const progress = elapsed / this.musicCrossfadeDuration;
        
        if (progress >= 1) {
          playing.audio.stop();
          toRemove.push(id);
        } else {
          const volume = config.volume * (1 - progress) * this.volumes[config.category] * this.volumes.master;
          playing.audio.setVolume(volume);
        }
      }
      
      // Fade in para música
      if (this.currentMusic?.id === id && !playing.fadeOutTime) {
        const elapsed = (now - playing.startTime) / 1000;
        if (elapsed < this.musicCrossfadeDuration) {
          const progress = elapsed / this.musicCrossfadeDuration;
          const volume = config.volume * progress * this.volumes.music * this.volumes.master;
          playing.audio.setVolume(volume);
        }
      }
    });
    
    toRemove.forEach(id => this.playingSounds.delete(id));
  }

  /**
   * Cleanup
   */
  dispose() {
    this.playingSounds.forEach((playing) => {
      if (playing.audio.isPlaying) {
        playing.audio.stop();
      }
    });
    this.playingSounds.clear();
    this.bufferCache.clear();
    this.listener = null;
  }
}

// Singleton
const audioManager = new AudioSystemManager();

/**
 * Hook para usar el sistema de audio
 */
export function useAudioSystem() {
  const { camera } = useThree();
  const { isMuted } = useGameStore();
  const { masterVolume, musicVolume, sfxVolume } = useSettingsStore();
  
  // Crear listener
  const listener = useMemo(() => {
    const l = new THREE.AudioListener();
    camera.add(l);
    audioManager.initialize(l);
    return l;
  }, [camera]);

  // Sincronizar volumen con settingsStore (fuente única de verdad)
  useEffect(() => {
    const vol = isMuted ? 0 : masterVolume / 100;
    audioManager.setVolume('master', vol);
    audioManager.setVolume('music', (musicVolume / 100) * vol);
    audioManager.setVolume('sfx', (sfxVolume / 100) * vol);
  }, [masterVolume, musicVolume, sfxVolume, isMuted]);

  // Cleanup
  useEffect(() => {
    return () => {
      camera.remove(listener);
      audioManager.dispose();
    };
  }, [camera, listener]);

  // Update
  useFrame((_, delta) => {
    audioManager.update(delta);
  });

  return {
    // Reproducir sonido
    play: useCallback((type: SoundType, options?: {
      position?: THREE.Vector3;
      volume?: number;
      playbackRate?: number;
      loop?: boolean;
    }) => audioManager.play(type, options), []),
    
    // Detener sonido
    stop: useCallback((id: string, fadeOut?: number) => 
      audioManager.stop(id, fadeOut), []),
    
    // Música
    playMusic: useCallback((type: SoundType, crossfade?: boolean) => 
      audioManager.playMusic(type, crossfade), []),
    
    // Volumen
    setVolume: useCallback((category: AudioCategory, volume: number) => 
      audioManager.setVolume(category, volume), []),
    
    getVolume: useCallback((category: AudioCategory) => 
      audioManager.getVolume(category), []),
    
    // Registrar sonido
    registerSound: useCallback((type: SoundType, config: SoundConfig) => 
      audioManager.registerSound(type, config), []),
    
    // Precargar
    preload: useCallback((type: SoundType) => 
      audioManager.preload(type), []),
  };
}

export default useAudioSystem;
