/**
 * Survival Service - Modo Survival (sesiones roguelite)
 * 
 * Endpoints documentados:
 * - POST /api/survival/start                          (iniciar sesión)
 * - POST /api/survival/:sessionId/complete-wave       (completar oleada)
 * - POST /api/survival/:sessionId/use-consumable      (usar consumible)
 * - POST /api/survival/:sessionId/pickup-drop         (recoger drop)
 * - POST /api/survival/:sessionId/end                 (terminar sesión - victoria)
 * - POST /api/survival/:sessionId/death               (game over)
 * - POST /api/survival/:sessionId/abandon             (abandonar)
 * - POST /api/survival/exchange-points/exp             (canjear puntos por EXP)
 * - POST /api/survival/exchange-points/val             (canjear puntos por VAL)
 * - POST /api/survival/exchange-points/guaranteed-item (canjear por item garantizado)
 * - GET  /api/survival/leaderboard                    (tabla de posiciones)
 * - GET  /api/survival/my-stats                       (mis estadísticas)
 */

import api from './api.service';
import type { SurvivalSession, SurvivalLeaderboardEntry } from '../types';

// ============================================================
// TIPOS
// ============================================================

export interface SurvivalStartDTO {
  characterId: string;
  consumables?: string[]; // IDs de consumibles equipados
}

export interface SurvivalSessionResponse {
  success: boolean;
  session: SurvivalSession;
  message?: string;
}

export interface WaveCompleteResponse {
  success: boolean;
  session: SurvivalSession;
  waveRewards?: {
    score: number;
    drops: { itemId: string; nombre: string; rareza: string }[];
  };
  nextWave?: {
    waveNumber: number;
    enemies: number;
    type: string;
  };
}

export interface SurvivalEndResponse {
  success: boolean;
  session: SurvivalSession;
  totalRewards: {
    expGanada: number;
    valGanado: number;
    itemsObtenidos: unknown[];
    scoreTotal: number;
  };
  newRecord?: boolean;
}

export interface ExchangeResponse {
  success: boolean;
  message: string;
  pointsSpent: number;
  pointsRemaining: number;
  received?: {
    type: string;
    amount?: number;
    item?: unknown;
  };
}

export interface SurvivalStats {
  totalSessions: number;
  bestWave: number;
  bestScore: number;
  totalEnemiesKilled: number;
  totalBossesKilled: number;
  averageWavesPerSession: number;
  favoriteClass?: string;
  totalTimePlayed: number;
}

export interface LeaderboardResponse {
  success: boolean;
  leaderboard: SurvivalLeaderboardEntry[];
  total: number;
  myRank?: number;
}

// ============================================================
// SERVICIO
// ============================================================

class SurvivalService {
  private basePath = '/api/survival';

  /**
   * Iniciar sesión de survival
   * POST /api/survival/start
   */
  async start(data: SurvivalStartDTO): Promise<SurvivalSession> {
    const response = await api.post<SurvivalSessionResponse>(`${this.basePath}/start`, data);
    return response.session;
  }

  /**
   * Completar oleada
   * POST /api/survival/:sessionId/complete-wave
   */
  async completeWave(sessionId: string, data?: {
    enemiesKilled?: number;
    damageDealt?: number;
    damageTaken?: number;
  }): Promise<WaveCompleteResponse> {
    return api.post(`${this.basePath}/${sessionId}/complete-wave`, data || {});
  }

  /**
   * Usar consumible durante sesión
   * POST /api/survival/:sessionId/use-consumable
   */
  async useConsumable(sessionId: string, consumableId: string): Promise<{
    success: boolean;
    effectApplied: string;
    remainingUses: number;
  }> {
    return api.post(`${this.basePath}/${sessionId}/use-consumable`, { consumableId });
  }

  /**
   * Recoger drop de enemigo
   * POST /api/survival/:sessionId/pickup-drop
   */
  async pickupDrop(sessionId: string, dropId: string): Promise<{
    success: boolean;
    item: unknown;
  }> {
    return api.post(`${this.basePath}/${sessionId}/pickup-drop`, { dropId });
  }

  /**
   * Terminar sesión (victoria/retirarse bien)
   * POST /api/survival/:sessionId/end
   */
  async endSession(sessionId: string): Promise<SurvivalEndResponse> {
    return api.post(`${this.basePath}/${sessionId}/end`, {});
  }

  /**
   * Game over (muerte)
   * POST /api/survival/:sessionId/death
   */
  async death(sessionId: string): Promise<SurvivalEndResponse> {
    return api.post(`${this.basePath}/${sessionId}/death`, {});
  }

  /**
   * Abandonar sesión
   * POST /api/survival/:sessionId/abandon
   */
  async abandon(sessionId: string): Promise<{ success: boolean; message: string }> {
    return api.post(`${this.basePath}/${sessionId}/abandon`, {});
  }

  /**
   * Canjear puntos por EXP
   * POST /api/survival/exchange-points/exp
   */
  async exchangeForExp(points: number): Promise<ExchangeResponse> {
    return api.post(`${this.basePath}/exchange-points/exp`, { points });
  }

  /**
   * Canjear puntos por VAL
   * POST /api/survival/exchange-points/val
   */
  async exchangeForVal(points: number): Promise<ExchangeResponse> {
    return api.post(`${this.basePath}/exchange-points/val`, { points });
  }

  /**
   * Canjear puntos por item garantizado
   * POST /api/survival/exchange-points/guaranteed-item
   */
  async exchangeForItem(points: number): Promise<ExchangeResponse> {
    return api.post(`${this.basePath}/exchange-points/guaranteed-item`, { points });
  }

  /**
   * Tabla de posiciones
   * GET /api/survival/leaderboard
   */
  async getLeaderboard(params?: { page?: number; limit?: number }): Promise<LeaderboardResponse> {
    const queryParams: Record<string, string> = {};
    if (params?.page) queryParams.page = String(params.page);
    if (params?.limit) queryParams.limit = String(params.limit);
    return api.get(`${this.basePath}/leaderboard`, queryParams);
  }

  /**
   * Mis estadísticas de survival
   * GET /api/survival/my-stats
   */
  async getMyStats(): Promise<SurvivalStats> {
    return api.get<SurvivalStats>(`${this.basePath}/my-stats`);
  }
}

export const survivalService = new SurvivalService();
export default survivalService;
