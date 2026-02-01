/**
 * Save System - Sistema de guardado local y en la nube
 */

// ============================================================
// TIPOS
// ============================================================

export type SaveSlot = 'auto' | 'slot1' | 'slot2' | 'slot3' | 'quick';

export interface SaveMetadata {
  slot: SaveSlot;
  version: string;
  timestamp: number;
  playTime: number;
  playerName: string;
  playerLevel: number;
  location: string;
  screenshot?: string; // Base64
}

export interface CharacterSaveData {
  name: string;
  class: string;
  level: number;
  experience: number;
  totalExperience: number;
  health: number;
  maxHealth: number;
  mana: number;
  maxMana: number;
  stats: Record<string, number>;
  skillPoints: number;
  attributePoints: number;
  abilities: string[];
  equipment: Record<string, string | null>;
  position: { x: number; y: number; z: number };
  rotation: { x: number; y: number; z: number };
}

export interface InventorySaveData {
  items: Array<{
    itemId: string;
    quantity: number;
    slot: number;
  }>;
  gold: number;
  maxSlots: number;
}

export interface QuestSaveData {
  activeQuests: Array<{
    questId: string;
    progress: Record<string, number>;
    startedAt: number;
  }>;
  completedQuests: string[];
  failedQuests: string[];
}

export interface WorldSaveData {
  currentLevel: string;
  discoveredLocations: string[];
  unlockedTeleports: string[];
  killedBosses: string[];
  openedChests: string[];
  triggeredEvents: string[];
  npcStates: Record<string, unknown>;
  weather?: string;
  timeOfDay?: number;
}

export interface SettingsSaveData {
  volume: number;
  musicVolume: number;
  sfxVolume: number;
  isMuted: boolean;
  quality: string;
  language: string;
  keybindings: Record<string, string>;
  showTutorials: boolean;
  showDamageNumbers: boolean;
  cameraSpeed: number;
  invertY: boolean;
}

export interface GameSaveData {
  metadata: SaveMetadata;
  character: CharacterSaveData;
  inventory: InventorySaveData;
  quests: QuestSaveData;
  world: WorldSaveData;
  settings: SettingsSaveData;
  statistics: GameStatistics;
}

export interface GameStatistics {
  totalPlayTime: number;
  enemiesKilled: number;
  bossesKilled: number;
  deathCount: number;
  damageDealt: number;
  damageTaken: number;
  healingDone: number;
  goldEarned: number;
  goldSpent: number;
  itemsCollected: number;
  questsCompleted: number;
  achievementsUnlocked: string[];
}

// ============================================================
// CONSTANTES
// ============================================================

const SAVE_VERSION = '1.0.0';
const STORAGE_PREFIX = 'valnor_save_';
const CLOUD_SYNC_INTERVAL = 60000; // 1 minuto

// ============================================================
// CLASE SAVE MANAGER
// ============================================================

class SaveManager {
  private static instance: SaveManager;
  private cloudSyncEnabled = false;
  private cloudSyncTimer: ReturnType<typeof setInterval> | null = null;
  private lastCloudSync = 0;
  private pendingCloudSave = false;
  
  private constructor() {}
  
  static getInstance(): SaveManager {
    if (!SaveManager.instance) {
      SaveManager.instance = new SaveManager();
    }
    return SaveManager.instance;
  }
  
  // ============================================================
  // LOCAL STORAGE
  // ============================================================
  
  /**
   * Guarda datos en localStorage
   */
  saveLocal(slot: SaveSlot, data: GameSaveData): boolean {
    try {
      const key = `${STORAGE_PREFIX}${slot}`;
      const serialized = JSON.stringify(data);
      
      // Comprimir si es muy grande
      const toStore = serialized.length > 100000 
        ? this.compress(serialized)
        : serialized;
      
      localStorage.setItem(key, toStore);
      localStorage.setItem(`${key}_meta`, JSON.stringify(data.metadata));
      
      console.log(`[SaveSystem] Saved to ${slot}`);
      return true;
    } catch (error) {
      console.error('[SaveSystem] Error saving locally:', error);
      return false;
    }
  }
  
  /**
   * Carga datos de localStorage
   */
  loadLocal(slot: SaveSlot): GameSaveData | null {
    try {
      const key = `${STORAGE_PREFIX}${slot}`;
      const stored = localStorage.getItem(key);
      
      if (!stored) return null;
      
      // Intentar descomprimir si está comprimido
      const serialized = stored.startsWith('{') 
        ? stored 
        : this.decompress(stored);
      
      const data = JSON.parse(serialized) as GameSaveData;
      
      // Validar versión
      if (data.metadata.version !== SAVE_VERSION) {
        console.warn('[SaveSystem] Save version mismatch, migrating...');
        return this.migrateSave(data);
      }
      
      return data;
    } catch (error) {
      console.error('[SaveSystem] Error loading locally:', error);
      return null;
    }
  }
  
  /**
   * Elimina un guardado local
   */
  deleteLocal(slot: SaveSlot): boolean {
    try {
      const key = `${STORAGE_PREFIX}${slot}`;
      localStorage.removeItem(key);
      localStorage.removeItem(`${key}_meta`);
      return true;
    } catch (error) {
      console.error('[SaveSystem] Error deleting:', error);
      return false;
    }
  }
  
  /**
   * Obtiene metadata de todos los slots
   */
  getAllSaveMetadata(): Map<SaveSlot, SaveMetadata | null> {
    const slots: SaveSlot[] = ['auto', 'slot1', 'slot2', 'slot3', 'quick'];
    const result = new Map<SaveSlot, SaveMetadata | null>();
    
    for (const slot of slots) {
      const meta = localStorage.getItem(`${STORAGE_PREFIX}${slot}_meta`);
      result.set(slot, meta ? JSON.parse(meta) : null);
    }
    
    return result;
  }
  
  /**
   * Verifica si hay espacio suficiente
   */
  hasStorageSpace(): boolean {
    try {
      const test = 'test';
      localStorage.setItem('_space_test', test);
      localStorage.removeItem('_space_test');
      return true;
    } catch {
      return false;
    }
  }
  
  // ============================================================
  // CLOUD SYNC (Placeholder - requiere backend)
  // ============================================================
  
  /**
   * Habilita sincronización en la nube
   */
  enableCloudSync(_userId: string): void {
    this.cloudSyncEnabled = true;
    
    // Iniciar timer de sincronización
    this.cloudSyncTimer = setInterval(() => {
      this.syncToCloud();
    }, CLOUD_SYNC_INTERVAL);
  }
  
  /**
   * Deshabilita sincronización en la nube
   */
  disableCloudSync(): void {
    this.cloudSyncEnabled = false;
    
    if (this.cloudSyncTimer) {
      clearInterval(this.cloudSyncTimer);
      this.cloudSyncTimer = null;
    }
  }
  
  /**
   * Sincroniza con la nube
   */
  async syncToCloud(): Promise<boolean> {
    if (!this.cloudSyncEnabled) return false;
    
    try {
      // TODO: Implementar llamada al backend
      console.log('[SaveSystem] Cloud sync (placeholder)');
      this.lastCloudSync = Date.now();
      this.pendingCloudSave = false;
      return true;
    } catch (error) {
      console.error('[SaveSystem] Cloud sync error:', error);
      return false;
    }
  }
  
  /**
   * Descarga guardado de la nube
   */
  async loadFromCloud(_slot: SaveSlot): Promise<GameSaveData | null> {
    if (!this.cloudSyncEnabled) return null;
    
    try {
      // TODO: Implementar llamada al backend
      console.log('[SaveSystem] Load from cloud (placeholder)');
      return null;
    } catch (error) {
      console.error('[SaveSystem] Cloud load error:', error);
      return null;
    }
  }
  
  // ============================================================
  // UTILIDADES
  // ============================================================
  
  /**
   * Comprime string (simple RLE para demo)
   */
  private compress(data: string): string {
    // En producción usar LZString o similar
    return btoa(data);
  }
  
  /**
   * Descomprime string
   */
  private decompress(data: string): string {
    return atob(data);
  }
  
  /**
   * Migra guardados antiguos
   */
  private migrateSave(data: GameSaveData): GameSaveData {
    // Aquí iría la lógica de migración según versiones
    data.metadata.version = SAVE_VERSION;
    return data;
  }
  
  /**
   * Exporta guardado a archivo
   */
  exportSave(slot: SaveSlot): string | null {
    const data = this.loadLocal(slot);
    if (!data) return null;
    
    return btoa(JSON.stringify(data));
  }
  
  /**
   * Importa guardado desde string
   */
  importSave(slot: SaveSlot, encoded: string): boolean {
    try {
      const decoded = atob(encoded);
      const data = JSON.parse(decoded) as GameSaveData;
      
      // Validar estructura básica
      if (!data.metadata || !data.character) {
        throw new Error('Invalid save structure');
      }
      
      return this.saveLocal(slot, data);
    } catch (error) {
      console.error('[SaveSystem] Import error:', error);
      return false;
    }
  }
  
  // ============================================================
  // GETTERS
  // ============================================================
  
  get isCloudSyncEnabled(): boolean {
    return this.cloudSyncEnabled;
  }
  
  get lastCloudSyncTime(): number {
    return this.lastCloudSync;
  }
  
  get hasPendingCloudSave(): boolean {
    return this.pendingCloudSave;
  }
}

// ============================================================
// FUNCIONES HELPER
// ============================================================

/**
 * Crea estructura de guardado vacía
 */
export function createEmptySave(playerName: string): GameSaveData {
  const now = Date.now();
  
  return {
    metadata: {
      slot: 'slot1',
      version: SAVE_VERSION,
      timestamp: now,
      playTime: 0,
      playerName,
      playerLevel: 1,
      location: 'starting_area',
    },
    character: {
      name: playerName,
      class: 'warrior',
      level: 1,
      experience: 0,
      totalExperience: 0,
      health: 100,
      maxHealth: 100,
      mana: 50,
      maxMana: 50,
      stats: {
        strength: 10,
        dexterity: 10,
        intelligence: 10,
        vitality: 10,
        luck: 10,
      },
      skillPoints: 0,
      attributePoints: 5,
      abilities: ['basic_attack'],
      equipment: {
        mainHand: null,
        offHand: null,
        head: null,
        chest: null,
        legs: null,
        feet: null,
        hands: null,
        neck: null,
        ring1: null,
        ring2: null,
      },
      position: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
    },
    inventory: {
      items: [],
      gold: 0,
      maxSlots: 30,
    },
    quests: {
      activeQuests: [],
      completedQuests: [],
      failedQuests: [],
    },
    world: {
      currentLevel: 'starting_area',
      discoveredLocations: ['starting_area'],
      unlockedTeleports: [],
      killedBosses: [],
      openedChests: [],
      triggeredEvents: [],
      npcStates: {},
    },
    settings: {
      volume: 0.8,
      musicVolume: 0.7,
      sfxVolume: 0.8,
      isMuted: false,
      quality: 'high',
      language: 'es',
      keybindings: {},
      showTutorials: true,
      showDamageNumbers: true,
      cameraSpeed: 1.0,
      invertY: false,
    },
    statistics: {
      totalPlayTime: 0,
      enemiesKilled: 0,
      bossesKilled: 0,
      deathCount: 0,
      damageDealt: 0,
      damageTaken: 0,
      healingDone: 0,
      goldEarned: 0,
      goldSpent: 0,
      itemsCollected: 0,
      questsCompleted: 0,
      achievementsUnlocked: [],
    },
  };
}

/**
 * Formatea tiempo de juego
 */
export function formatPlayTime(milliseconds: number): string {
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  }
  return `${minutes}m ${seconds % 60}s`;
}

/**
 * Formatea timestamp
 */
export function formatSaveDate(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// ============================================================
// EXPORTS
// ============================================================

export const saveManager = SaveManager.getInstance();

// Funciones de conveniencia
export const saveGame = (slot: SaveSlot, data: GameSaveData) => 
  saveManager.saveLocal(slot, data);

export const loadGame = (slot: SaveSlot) => 
  saveManager.loadLocal(slot);

export const deleteGame = (slot: SaveSlot) => 
  saveManager.deleteLocal(slot);

export const getSaveSlots = () => 
  saveManager.getAllSaveMetadata();

export const exportSave = (slot: SaveSlot) => 
  saveManager.exportSave(slot);

export const importSave = (slot: SaveSlot, data: string) => 
  saveManager.importSave(slot, data);
