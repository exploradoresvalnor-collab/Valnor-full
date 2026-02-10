/**
 * Ranking Service - Gestión de rankings, logros y estadísticas de jugador
 * 
 * Endpoints del backend:
 * 
 * Rankings (montados en /api/rankings):
 * - GET /api/rankings                          → Ranking global
 * - GET /api/rankings/leaderboard/:category    → Leaderboard por categoría
 * - GET /api/rankings/period/:periodo          → Ranking por período
 * - GET /api/rankings/stats                    → Estadísticas generales
 * - GET /api/rankings/me                       → Mi posición (auth)
 * 
 * Achievements (montados en /api/achievements):
 * - GET /api/achievements                      → Todos los logros (público)
 * - GET /api/achievements/:userId              → Logros de un usuario (público)
 * - POST /api/achievements/:userId/unlock      → Desbloquear logro (admin/auth)
 * 
 * Player Stats (montados en /api/player-stats):
 * - POST /api/player-stats                     → Registrar/actualizar stats
 * - GET /api/player-stats/usuario/:userId      → Stats por userId
 * - GET /api/player-stats/personaje/:personajeId → Stats por personaje
 * 
 * Perfiles (montados en /api/users):
 * - GET /api/users/profile/:userId             → Perfil público
 * - GET /api/users/me                          → Mi perfil
 */

import apiService from './api.service';
import type {
  Ranking,
  RankingCategory,
  RankingPeriod,
  RankingResponse,
  Achievement,
  AchievementsResponse,
  PublicProfile,
  ProfileResponse,
} from '../types';

class RankingService {
  private basePath = '/api/rankings';
  private achievementsPath = '/api/achievements';
  private profilesPath = '/api/users/profile';

  // =====================================
  // RANKINGS
  // =====================================

  /**
   * Obtener ranking general
   * GET /api/rankings
   */
  async getGeneralRanking(params?: { limit?: number; periodo?: string }): Promise<Ranking | null> {
    const query: Record<string, string> = {};
    if (params?.limit) query.limit = String(params.limit);
    if (params?.periodo) query.periodo = params.periodo;
    const response = await apiService.get<RankingResponse>(this.basePath, query);
    return response.ranking || null;
  }

  /**
   * Obtener leaderboard por categoría
   * GET /api/rankings/leaderboard/:category
   */
  async getLeaderboard(category: RankingCategory, params?: { page?: number; limit?: number }): Promise<Ranking | null> {
    const query: Record<string, string> = {};
    if (params?.page !== undefined) query.page = String(params.page);
    if (params?.limit) query.limit = String(params.limit);
    const response = await apiService.get<RankingResponse>(
      `${this.basePath}/leaderboard/${category}`, query
    );
    return response.ranking || null;
  }

  /**
   * Obtener ranking por período
   * GET /api/rankings/period/:periodo
   */
  async getRankingByPeriod(period: RankingPeriod): Promise<Ranking | null> {
    const response = await apiService.get<RankingResponse>(
      `${this.basePath}/period/${period}`
    );
    return response.ranking || null;
  }

  /**
   * Obtener estadísticas generales de ranking
   * GET /api/rankings/stats
   */
  async getRankingStats(params?: { periodo?: string }): Promise<unknown> {
    const query: Record<string, string> = {};
    if (params?.periodo) query.periodo = params.periodo;
    return apiService.get(`${this.basePath}/stats`, query);
  }

  /**
   * Obtener mi posición en el ranking
   * GET /api/rankings/me
   */
  async getMyRanking(): Promise<unknown> {
    return apiService.get(`${this.basePath}/me`);
  }

  // =====================================
  // LOGROS (Achievements)
  // =====================================

  /**
   * Obtener todos los logros disponibles
   * GET /api/achievements
   */
  async getAllAchievements(params?: { categoria?: string; limit?: number; page?: number }): Promise<Achievement[]> {
    const query: Record<string, string> = {};
    if (params?.categoria) query.categoria = params.categoria;
    if (params?.limit) query.limit = String(params.limit);
    if (params?.page !== undefined) query.page = String(params.page);
    const response = await apiService.get<AchievementsResponse>(this.achievementsPath, query);
    return response.achievements || [];
  }

  /**
   * Obtener logros de un usuario por su ID
   * GET /api/achievements/:userId
   */
  async getUserAchievements(userId: string): Promise<Achievement[]> {
    const response = await apiService.get<AchievementsResponse>(
      `${this.achievementsPath}/${userId}`
    );
    return response.achievements || [];
  }

  /**
   * Desbloquear un logro para un usuario (admin)
   * POST /api/achievements/:userId/unlock
   * Body: { achievementId }
   */
  async unlockAchievement(userId: string, achievementId: string): Promise<{ success: boolean; message?: string }> {
    return apiService.post(`${this.achievementsPath}/${userId}/unlock`, { achievementId });
  }

  // =====================================
  // PERFILES PÚBLICOS
  // =====================================

  /**
   * Obtener perfil público de un usuario
   * GET /api/users/profile/:userId
   */
  async getPublicProfile(userId: string): Promise<PublicProfile | null> {
    const response = await apiService.get<ProfileResponse>(
      `${this.profilesPath}/${userId}`
    );
    return response.profile || null;
  }

  /**
   * Obtener mi perfil
   * GET /api/users/me
   */
  async getMyPublicProfile(): Promise<PublicProfile | null> {
    const response = await apiService.get<ProfileResponse>('/api/users/me');
    return (response as any) || null;
  }

  // =====================================
  // PLAYER STATS
  // =====================================

  /**
   * Obtener stats de jugador por userId
   * GET /api/player-stats/usuario/:userId
   */
  async getPlayerStatsByUser(userId: string): Promise<unknown> {
    return apiService.get(`/api/player-stats/usuario/${userId}`);
  }

  /**
   * Obtener stats de personaje
   * GET /api/player-stats/personaje/:personajeId
   */
  async getPlayerStatsByCharacter(personajeId: string): Promise<unknown> {
    return apiService.get(`/api/player-stats/personaje/${personajeId}`);
  }

  /**
   * Registrar/actualizar stats
   * POST /api/player-stats
   */
  async postPlayerStats(data: Record<string, unknown>): Promise<unknown> {
    return apiService.post('/api/player-stats', data);
  }
}

export const rankingService = new RankingService();
