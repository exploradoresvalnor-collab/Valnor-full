/**
 * Ranking Service - Gestión de rankings y logros
 */

import apiService from './api.service';
import type {
  Ranking,
  RankingCategory,
  RankingPeriod,
  RankingResponse,
  Achievement,
  UserAchievement,
  AchievementsResponse,
  PublicProfile,
  ProfileResponse,
  GetRankingDTO,
} from '../types';

class RankingService {
  private basePath = '/rankings';
  private achievementsPath = '/achievements';
  private profilesPath = '/profiles';

  // =====================================
  // RANKINGS
  // =====================================

  /**
   * Obtener ranking por categoría
   */
  async getRanking(params: GetRankingDTO): Promise<Ranking | null> {
    const { category, period = 'all_time', page = 1, limit = 100 } = params;
    const response = await apiService.get<RankingResponse>(
      `${this.basePath}/${category}`,
      { period, page: String(page), limit: String(limit) }
    );
    return response.ranking || null;
  }

  /**
   * Obtener posición del usuario en un ranking
   */
  async getMyRank(category: RankingCategory, period: RankingPeriod = 'all_time'): Promise<{
    rank: number;
    value: number;
    totalEntries: number;
  } | null> {
    return apiService.get(`${this.basePath}/${category}/me`, { period });
  }

  /**
   * Obtener todos los rankings del usuario
   */
  async getMyRankings(): Promise<{
    category: RankingCategory;
    rank: number;
    value: number;
  }[]> {
    return apiService.get(`${this.basePath}/me/all`);
  }

  /**
   * Obtener categorías de ranking disponibles
   */
  async getCategories(): Promise<{
    category: RankingCategory;
    displayName: string;
    description: string;
  }[]> {
    return apiService.get(`${this.basePath}/categories`);
  }

  // =====================================
  // LOGROS
  // =====================================

  /**
   * Obtener todos los logros disponibles
   */
  async getAllAchievements(): Promise<Achievement[]> {
    const response = await apiService.get<AchievementsResponse>(this.achievementsPath);
    return response.achievements || [];
  }

  /**
   * Obtener logros del usuario
   */
  async getMyAchievements(): Promise<UserAchievement[]> {
    const response = await apiService.get<AchievementsResponse>(
      `${this.achievementsPath}/me`
    );
    return response.userAchievements || [];
  }

  /**
   * Obtener logro específico
   */
  async getAchievement(achievementId: string): Promise<Achievement | null> {
    const response = await apiService.get<{ achievement: Achievement }>(
      `${this.achievementsPath}/${achievementId}`
    );
    return response.achievement || null;
  }

  /**
   * Obtener progreso de logro del usuario
   */
  async getAchievementProgress(achievementId: string): Promise<UserAchievement | null> {
    const response = await apiService.get<{ userAchievement: UserAchievement }>(
      `${this.achievementsPath}/${achievementId}/progress`
    );
    return response.userAchievement || null;
  }

  /**
   * Reclamar recompensa de logro completado
   */
  async claimAchievementReward(achievementId: string): Promise<{
    success: boolean;
    rewards: unknown[];
  }> {
    return apiService.post(`${this.achievementsPath}/${achievementId}/claim`, {});
  }

  /**
   * Obtener logros por categoría
   */
  async getAchievementsByCategory(category: string): Promise<Achievement[]> {
    const response = await apiService.get<AchievementsResponse>(
      `${this.achievementsPath}/category/${category}`
    );
    return response.achievements || [];
  }

  /**
   * Obtener puntos de logros del usuario
   */
  async getAchievementPoints(): Promise<{
    totalPoints: number;
    completedCount: number;
    totalCount: number;
  }> {
    return apiService.get(`${this.achievementsPath}/me/points`);
  }

  // =====================================
  // PERFILES PÚBLICOS
  // =====================================

  /**
   * Obtener perfil público de un usuario
   */
  async getPublicProfile(userId: string): Promise<PublicProfile | null> {
    const response = await apiService.get<ProfileResponse>(
      `${this.profilesPath}/${userId}`
    );
    return response.profile || null;
  }

  /**
   * Buscar usuarios
   */
  async searchUsers(query: string, limit: number = 20): Promise<{
    users: {
      id: string;
      username: string;
      avatarUrl?: string;
      level: number;
    }[];
  }> {
    return apiService.get(`${this.profilesPath}/search`, { q: query, limit: String(limit) });
  }

  /**
   * Obtener mi perfil público
   */
  async getMyPublicProfile(): Promise<PublicProfile | null> {
    const response = await apiService.get<ProfileResponse>(
      `${this.profilesPath}/me`
    );
    return response.profile || null;
  }

  /**
   * Actualizar título activo
   */
  async setActiveTitle(titleId: string): Promise<{ success: boolean }> {
    return apiService.put(`${this.profilesPath}/me/title`, { titleId });
  }

  /**
   * Obtener títulos disponibles
   */
  async getMyTitles(): Promise<{
    titles: {
      id: string;
      name: string;
      isActive: boolean;
    }[];
  }> {
    return apiService.get(`${this.profilesPath}/me/titles`);
  }
}

export const rankingService = new RankingService();
