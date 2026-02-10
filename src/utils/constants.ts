/**
 * Constants - Constantes globales del juego
 */

// Rutas de la aplicación
export const ROUTES = {
  // Públicas
  LANDING: '/landing',
  SPLASH: '/splash',
  WIKI: '/wiki',
  
  // Auth
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',
  VERIFY: '/auth/verify',
  FORGOT_PASSWORD: '/auth/forgot-password',
  RESET_PASSWORD: '/auth/reset-password',
  
  // Protegidas
  DASHBOARD: '/dashboard',
  DEMO: '/demo',
  INVENTORY: '/inventory',
  SHOP: '/shop',
  MARKETPLACE: '/marketplace',
  DUNGEON: '/dungeon',
  RANKING: '/ranking',
  SURVIVAL: '/survival',
} as const;

// Raridades de items - re-exportar de item.types (fuente única de verdad)
// Importar desde '@/types/item.types' o desde '@/types'
// RARITY_COLORS y RARITY_NAMES están definidos en src/types/item.types.ts

// Clases de personaje
import type { CharacterClass } from '../types/character.types';

export const CLASS_NAMES: Record<CharacterClass, string> = {
  warrior: 'Guerrero',
  mage: 'Mago',
  rogue: 'Pícaro',
  archer: 'Arquero',
  paladin: 'Paladín',
  necromancer: 'Nigromante',
  berserker: 'Berserker',
  monk: 'Monje',
  healer: 'Sanador',
};

export const CLASS_COLORS: Record<CharacterClass, string> = {
  warrior: '#c79c6e',
  mage: '#69ccf0',
  rogue: '#fff569',
  archer: '#abd473',
  paladin: '#f58cba',
  necromancer: '#9482c9',
  berserker: '#e2231a',
  monk: '#00ff96',
  healer: '#ffffc0',
};

// Elementos
export const ELEMENT_COLORS = {
  fire: '#ff6b35',
  ice: '#69ccf0',
  lightning: '#ffeb3b',
  earth: '#8d6e63',
  wind: '#81c784',
  water: '#4fc3f7',
  light: '#fff59d',
  dark: '#9575cd',
  none: '#9e9e9e',
} as const;

export const ELEMENT_NAMES = {
  fire: 'Fuego',
  ice: 'Hielo',
  lightning: 'Rayo',
  earth: 'Tierra',
  wind: 'Viento',
  water: 'Agua',
  light: 'Luz',
  dark: 'Oscuridad',
  none: 'Ninguno',
} as const;

// Teclas de control (por defecto)
export const DEFAULT_KEYBINDS = {
  // Movimiento
  moveForward: 'KeyW',
  moveBackward: 'KeyS',
  moveLeft: 'KeyA',
  moveRight: 'KeyD',
  jump: 'Space',
  sprint: 'ShiftLeft',
  
  // Cámara
  lockCamera: 'KeyQ',
  resetCamera: 'KeyR',
  
  // Combate
  attack: 'Mouse0',
  skill1: 'Digit1',
  skill2: 'Digit2',
  skill3: 'Digit3',
  skill4: 'Digit4',
  ultimate: 'KeyE',
  
  // UI
  inventory: 'KeyI',
  menu: 'Escape',
  map: 'KeyM',
  chat: 'Enter',
} as const;

// Tiempos y duraciones
export const TIMINGS = {
  TOAST_DURATION: 5000,
  TRANSITION_DURATION: 300,
  DEBOUNCE_DELAY: 300,
  API_TIMEOUT: 30000,
  RECONNECT_DELAY: 1000,
  MAX_RECONNECT_ATTEMPTS: 5,
} as const;

// Límites
export const LIMITS = {
  MAX_USERNAME_LENGTH: 20,
  MIN_USERNAME_LENGTH: 3,
  MAX_PASSWORD_LENGTH: 128,
  MIN_PASSWORD_LENGTH: 8,
  MAX_CHARACTER_NAME_LENGTH: 16,
  MAX_INVENTORY_SLOTS: 100,
  MAX_PARTY_SIZE: 4,
} as const;

// Formatos
export const FORMATS = {
  DATE: 'DD/MM/YYYY',
  DATETIME: 'DD/MM/YYYY HH:mm',
  TIME: 'HH:mm:ss',
} as const;

// Local Storage Keys
export const STORAGE_KEYS = {
  TOKEN: 'valnor_token',
  REFRESH_TOKEN: 'valnor_refresh_token',
  USER: 'valnor_user',
  SETTINGS: 'valnor_settings',
  KEYBINDS: 'valnor_keybinds',
} as const;
