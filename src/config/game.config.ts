/**
 * Game Configuration - Valnor
 * Configuración global del juego
 */

export const GAME_CONFIG = {
  // Información del juego
  name: 'Valnor',
  version: '1.0.0',
  
  // Física
  physics: {
    gravity: -18.0,
    fixedTimeStep: 1 / 60,
    maxSubSteps: 3,
  },
  
  // Cámara
  camera: {
    fov: 60,
    near: 0.1,
    far: 2000,
    defaultDistance: 5,
    minDistance: 2,
    maxDistance: 15,
    height: 1.6, // Altura del jugador
  },
  
  // Jugador
  player: {
    walkSpeed: 4.0,
    runSpeed: 8.0,
    jumpForce: 8.0,
    rotationSpeed: 0.1,
    coyoteTime: 0.15, // Tiempo para saltar después de caer
    jumpBufferTime: 0.1, // Buffer de input de salto
  },
  
  // Renderizado
  render: {
    shadowMapSize: 2048,
    maxAnisotropy: 16,
    antialias: true,
  },
  
  // Calidad presets
  quality: {
    low: {
      shadows: false,
      particles: 100,
      drawDistance: 500,
      grassDensity: 0.3,
    },
    medium: {
      shadows: true,
      particles: 500,
      drawDistance: 1000,
      grassDensity: 0.6,
    },
    high: {
      shadows: true,
      particles: 1000,
      drawDistance: 2000,
      grassDensity: 1.0,
    },
    ultra: {
      shadows: true,
      particles: 2000,
      drawDistance: 3000,
      grassDensity: 1.5,
    },
  },
  
  // RPG Stats base
  rpg: {
    baseHealth: 100,
    baseMana: 50,
    baseStamina: 100,
    levelUpMultiplier: 1.15,
    expRequiredBase: 100,
    criticalMultiplier: 2.0,
  },
  
  // Combat
  combat: {
    hitStopDuration: 40, // ms
    damageFlashDuration: 100, // ms
    invincibilityFrames: 500, // ms
  },
};

export type QualityPreset = keyof typeof GAME_CONFIG.quality;
