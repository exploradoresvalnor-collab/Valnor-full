/**
 * Ranking Types - Tipos de rankings y logros
 */

import type { CharacterClass } from './character.types';

// Categorías de ranking
export type RankingCategory = 
  | 'power'           // Poder total del personaje
  | 'level'           // Nivel del personaje
  | 'survival'        // Mejor oleada en survival
  | 'dungeons'        // Mazmorras completadas
  | 'pvp'             // Victorias en PvP
  | 'wealth'          // Oro acumulado
  | 'achievements';   // Puntos de logros

// Período de tiempo
export type RankingPeriod = 'all_time' | 'season' | 'monthly' | 'weekly' | 'daily';

// Entrada del ranking
export interface RankingEntry {
  rank: number;
  userId: string;
  userName: string;
  
  // Personaje
  characterId?: string;
  characterName?: string;
  characterClass?: CharacterClass;
  characterLevel?: number;
  
  // Valor del ranking
  value: number;
  previousRank?: number;  // Para mostrar cambios
  rankChange?: number;    // +2, -1, 0
  
  // Avatar
  avatarUrl?: string;
  
  // Fecha del récord
  achievedAt: string;
}

// Ranking completo
export interface Ranking {
  category: RankingCategory;
  period: RankingPeriod;
  
  // Entradas
  entries: RankingEntry[];
  totalEntries: number;
  
  // Posición del usuario actual
  myRank?: number;
  myEntry?: RankingEntry;
  
  // Metadatos
  lastUpdated: string;
  nextUpdate?: string;
}

// Categoría de logro
export type AchievementCategory = 
  | 'combat'      // Logros de combate
  | 'exploration' // Logros de exploración
  | 'collection'  // Logros de colección
  | 'social'      // Logros sociales
  | 'challenge'   // Logros de desafíos
  | 'story'       // Logros de historia
  | 'secret';     // Logros secretos

// Rareza del logro
export type AchievementRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

// Definición de logro
export interface Achievement {
  id: string;
  name: string;
  description: string;
  category: AchievementCategory;
  rarity: AchievementRarity;
  
  // Requisitos
  requirements: AchievementRequirement[];
  
  // Recompensas
  rewards: AchievementReward[];
  points: number;
  
  // Visual
  icon: string;
  iconLocked?: string;
  
  // Metadatos
  isSecret: boolean;
  isRepeatable: boolean;
  maxCompletions?: number;
}

export interface AchievementRequirement {
  type: 'kill_enemies' | 'complete_dungeons' | 'reach_level' | 'collect_items' | 
        'deal_damage' | 'win_pvp' | 'spend_gold' | 'play_time' | 'reach_wave' | 'custom';
  target: number;
  current?: number;
  customData?: Record<string, unknown>;
}

export interface AchievementReward {
  type: 'gold' | 'gems' | 'item' | 'title' | 'avatar' | 'experience';
  itemId?: string;
  amount: number;
  description?: string;
}

// Logro del usuario
export interface UserAchievement {
  achievementId: string;
  userId: string;
  
  // Progreso
  progress: number;
  isCompleted: boolean;
  completions: number;
  
  // Fechas
  startedAt?: string;
  completedAt?: string;
  lastUpdatedAt: string;
  
  // Datos del logro
  achievement?: Achievement;
}

// Título desbloqueado
export interface UserTitle {
  id: string;
  name: string;
  description: string;
  rarity: AchievementRarity;
  
  // Requisitos (qué logro lo desbloquea)
  achievementId?: string;
  
  // Visual
  color: string;
  prefix?: string;
  suffix?: string;
  
  // Estado
  isActive: boolean;
  unlockedAt: string;
}

// Perfil público del usuario
export interface PublicProfile {
  userId: string;
  userName: string;
  avatarUrl?: string;
  
  // Título activo
  activeTitle?: UserTitle;
  
  // Personaje principal
  mainCharacter?: {
    name: string;
    class: CharacterClass;
    level: number;
  };
  
  // Rankings
  rankings: {
    category: RankingCategory;
    rank: number;
    value: number;
  }[];
  
  // Stats generales
  stats: {
    totalPlayTime: number;
    dungeonsCompleted: number;
    enemiesKilled: number;
    highestSurvivalWave: number;
    achievementPoints: number;
  };
  
  // Logros recientes
  recentAchievements: UserAchievement[];
  
  // Metadatos
  memberSince: string;
  lastOnline: string;
}

// Respuestas del servidor
export interface RankingResponse {
  success: boolean;
  ranking?: Ranking;
  message?: string;
}

export interface AchievementsResponse {
  success: boolean;
  achievements?: Achievement[];
  userAchievements?: UserAchievement[];
  message?: string;
}

export interface ProfileResponse {
  success: boolean;
  profile?: PublicProfile;
  message?: string;
}

// Para buscar rankings
export interface GetRankingDTO {
  category: RankingCategory;
  period?: RankingPeriod;
  page?: number;
  limit?: number;
}

// Filtro de ranking (alineado con Angular ranking.model)
export interface RankingFilter {
  category?: string;
  timeframe?: 'all_time' | 'monthly' | 'weekly' | 'daily';
  region?: string;
  class?: string;
  page?: number;
  limit?: number;
}

// Stats detallados del jugador
export interface PlayerStats {
  totalExperience: number;
  dungeonsCompleted: number;
  itemsCollected: number;
  goldEarned: number;
  winRate: number;
  bestStreak: number;
  totalPlayTime: number;
  favoriteClass?: string;
  joinDate: string;
}

// Stats detallados extendidos
export interface DetailedStats {
  totalPlayTime: number;
  joinDate: string;
  lastActive: string;
  dungeonsAttempted: number;
  dungeonsCompleted: number;
  totalWins: number;
  totalLosses: number;
  winRate: number;
  bestStreak: number;
  currentStreak: number;
  averageCombatTime: number;
  totalGoldEarned: number;
  totalGoldSpent: number;
  currentGold: number;
  itemsPurchased: number;
  itemsSold: number;
  uniqueItemsCollected: number;
  totalItemsCollected: number;
  rareItemsCollected: number;
  epicItemsCollected: number;
  legendaryItemsCollected: number;
  friendsCount: number;
  marketplaceTransactions: number;
  itemsTraded: number;
  classStats: Record<string, {
    dungeonsCompleted: number;
    winRate: number;
    favoriteWeapon?: string;
    totalExperience: number;
  }>;
}

// Entrada de actividad reciente
export interface ActivityEntry {
  id: string;
  type: 'dungeon_completed' | 'item_obtained' | 'level_up' | 'achievement_unlocked' | 'ranking_change';
  description: string;
  timestamp: string;
  data?: unknown;
}

// Perfil completo del usuario (respuesta extendida)
export interface UserProfileFull {
  user: RankingEntry;
  achievements: Achievement[];
  recentActivity: ActivityEntry[];
  statistics: DetailedStats;
}

// Request/Response tipados
export interface GetRankingRequest extends RankingFilter {}

export interface GetRankingResponse {
  entries: RankingEntry[];
  totalEntries: number;
  userRank?: number;
  userEntry?: RankingEntry;
  lastUpdated: string;
  nextUpdate?: string;
}

export interface GetUserProfileRequest {
  userId: string;
}

export interface GetUserProfileResponse extends UserProfileFull {}

export interface GetAchievementsRequest {
  userId?: string;
  category?: string;
  unlocked?: boolean;
}

export interface GetAchievementsResponse {
  achievements?: Achievement[];
  totalCount?: number;
  unlockedCount?: number;
}
