/**
 * Survival Types - Tipos del modo survival
 */

import type { CharacterClass } from './character.types';
import type { DungeonEnemy, RewardItem } from './dungeon.types';

// Estado de la sesión survival
export type SurvivalStatus = 'waiting' | 'in_progress' | 'completed' | 'failed';

// Tipo de oleada
export type WaveType = 'normal' | 'elite' | 'boss' | 'rest';

// Sesión de survival
export interface SurvivalSession {
  id: string;
  userId: string;
  
  // Personaje
  characterId: string;
  characterClass: CharacterClass;
  characterLevel: number;
  
  // Estado
  status: SurvivalStatus;
  currentWave: number;
  maxWaveReached: number;
  
  // Stats de la sesión
  score: number;
  enemiesKilled: number;
  bossesKilled: number;
  damageDealt: number;
  damageTaken: number;
  healingDone: number;
  
  // Tiempos
  startedAt: string;
  endedAt?: string;
  duration: number; // en segundos
  
  // Recompensas
  rewards: RewardItem[];
  
  // Modificadores activos
  activeModifiers: SurvivalModifier[];
}

// Oleada de enemigos
export interface SurvivalWave {
  waveNumber: number;
  type: WaveType;
  
  // Enemigos
  enemies: WaveEnemy[];
  totalEnemies: number;
  
  // Tiempo límite (opcional)
  timeLimit?: number; // en segundos
  
  // Bonus por completar
  bonusScore: number;
  bonusRewards?: RewardItem[];
}

export interface WaveEnemy extends DungeonEnemy {
  spawnDelay: number; // segundos después de iniciar la oleada
  spawnPosition: { x: number; y: number; z: number };
}

// Modificadores de survival
export interface SurvivalModifier {
  id: string;
  name: string;
  description: string;
  type: 'buff' | 'debuff' | 'challenge';
  
  // Efectos
  effects: ModifierEffect[];
  
  // Duración
  duration: 'permanent' | 'wave' | number; // número = oleadas
  
  // Visual
  icon: string;
}

export interface ModifierEffect {
  stat: 'health' | 'damage' | 'defense' | 'speed' | 'critRate' | 'gold' | 'exp';
  value: number; // Porcentaje (+50 = +50%, -30 = -30%)
  target: 'player' | 'enemies' | 'all';
}

// Leaderboard de survival
export interface SurvivalLeaderboardEntry {
  rank: number;
  userId: string;
  userName: string;
  characterClass: CharacterClass;
  characterLevel: number;
  
  // Resultados
  maxWave: number;
  score: number;
  enemiesKilled: number;
  duration: number;
  
  // Fecha
  achievedAt: string;
}

export interface SurvivalLeaderboard {
  type: 'global' | 'weekly' | 'daily' | 'friends';
  entries: SurvivalLeaderboardEntry[];
  myRank?: number;
  myEntry?: SurvivalLeaderboardEntry;
  totalEntries: number;
  lastUpdated: string;
}

// Configuración del modo survival
export interface SurvivalConfig {
  // Escalado
  enemyHealthScale: number;     // Por oleada
  enemyDamageScale: number;     // Por oleada
  enemyCountScale: number;      // Enemigos adicionales por oleada
  
  // Oleadas especiales
  eliteWaveInterval: number;    // Cada X oleadas
  bossWaveInterval: number;     // Cada X oleadas
  restWaveInterval: number;     // Cada X oleadas (descanso)
  
  // Recompensas
  baseGoldPerWave: number;
  baseExpPerWave: number;
  scoreMultiplier: number;
}

// Para iniciar sesión survival
export interface CreateSurvivalSessionDTO {
  characterId: string;
  difficulty?: 'normal' | 'hard' | 'nightmare';
}

// Respuestas del servidor
export interface SurvivalResponse {
  success: boolean;
  session?: SurvivalSession;
  message?: string;
}

export interface SurvivalLeaderboardResponse {
  success: boolean;
  leaderboard?: SurvivalLeaderboard;
  message?: string;
}

// Resultado de oleada
export interface SurvivalWaveResult {
  waveNumber: number;
  enemiesDefeated: number;
  pointsEarned: number;
  dropsReceived: string[];
  characterHealthRemaining: number;
}

// Fin de partida
export interface SurvivalGameOver {
  sessionId: string;
  characterId: string;
  finalWave: number;
  totalPoints: number;
  totalEnemiesDefeated: number;
  survivalTime: number; // en segundos
  reward: {
    exp: number;
    val: number;
    items: string[];
  };
}

// Estadísticas de survival del usuario
export interface SurvivalStats {
  totalSessions: number;
  totalPoints: number;
  averageWave: number;
  personalBest: number;
  bestSession: {
    points: number;
    wave: number;
    date: string;
  };
  leaderboardPosition: number;
}

// Canje de puntos
export interface ExchangePointsRequest {
  pointsToExchange: number;
  exchangeType: 'exp' | 'val' | 'items';
  itemId?: string;
}

export interface ExchangePointsResponse {
  success: boolean;
  pointsExchanged: number;
  rewardReceived: number | string;
  remainingPoints: number;
}

// Datos para completar oleada
export interface CompleteWaveDTO {
  sessionId: string;
  waveNumber: number;
  enemiesKilled: number;
  damageDealt: number;
  damageTaken: number;
  timeSpent: number;
}

// Evento de survival (para WebSocket)
export interface SurvivalEvent {
  type: 'wave_start' | 'wave_complete' | 'enemy_spawn' | 'enemy_kill' | 'player_death' | 'session_end';
  sessionId: string;
  data: Record<string, unknown>;
  timestamp: number;
}
