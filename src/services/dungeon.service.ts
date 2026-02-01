/**
 * Dungeon Service - Gestión de mazmorras
 */

import apiService from './api.service';
import type { 
  Dungeon, 
  DungeonRun, 
  DungeonResponse, 
  DungeonRunResponse,
  CreateDungeonRunDTO,
  CombatAction,
  CombatResult 
} from '../types';

class DungeonService {
  private basePath = '/dungeons';

  /**
   * Obtener lista de mazmorras disponibles
   */
  async getDungeons(): Promise<Dungeon[]> {
    const response = await apiService.get<DungeonResponse>(this.basePath);
    return response.dungeons || [];
  }

  /**
   * Obtener mazmorra por ID
   */
  async getDungeon(dungeonId: string): Promise<Dungeon | null> {
    const response = await apiService.get<DungeonResponse>(`${this.basePath}/${dungeonId}`);
    return response.dungeon || null;
  }

  /**
   * Iniciar una run de mazmorra
   */
  async startRun(data: CreateDungeonRunDTO): Promise<DungeonRun | null> {
    const response = await apiService.post<DungeonRunResponse>(`${this.basePath}/runs`, data);
    return response.run || null;
  }

  /**
   * Obtener run actual
   */
  async getCurrentRun(): Promise<DungeonRun | null> {
    const response = await apiService.get<DungeonRunResponse>(`${this.basePath}/runs/current`);
    return response.run || null;
  }

  /**
   * Obtener run por ID
   */
  async getRun(runId: string): Promise<DungeonRun | null> {
    const response = await apiService.get<DungeonRunResponse>(`${this.basePath}/runs/${runId}`);
    return response.run || null;
  }

  /**
   * Ejecutar acción de combate
   */
  async executeAction(runId: string, action: CombatAction): Promise<CombatResult> {
    return apiService.post<CombatResult>(`${this.basePath}/runs/${runId}/action`, action);
  }

  /**
   * Avanzar al siguiente piso
   */
  async advanceFloor(runId: string): Promise<DungeonRun | null> {
    const response = await apiService.post<DungeonRunResponse>(
      `${this.basePath}/runs/${runId}/advance`,
      {}
    );
    return response.run || null;
  }

  /**
   * Abandonar run
   */
  async abandonRun(runId: string): Promise<void> {
    await apiService.post(`${this.basePath}/runs/${runId}/abandon`, {});
  }

  /**
   * Obtener historial de runs
   */
  async getRunHistory(page: number = 1, limit: number = 10): Promise<{
    runs: DungeonRun[];
    total: number;
    page: number;
  }> {
    return apiService.get(`${this.basePath}/runs/history`, { page: String(page), limit: String(limit) });
  }

  /**
   * Reclamar recompensas de run completada
   */
  async claimRewards(runId: string): Promise<{
    success: boolean;
    rewards: unknown[];
  }> {
    return apiService.post(`${this.basePath}/runs/${runId}/claim`, {});
  }

  /**
   * Obtener mazmorras completadas por el usuario
   */
  async getCompletedDungeons(): Promise<string[]> {
    const response = await apiService.get<{ dungeonIds: string[] }>(
      `${this.basePath}/completed`
    );
    return response.dungeonIds || [];
  }

  /**
   * Verificar si puede entrar a una mazmorra
   */
  async canEnterDungeon(dungeonId: string): Promise<{
    canEnter: boolean;
    reasons?: string[];
  }> {
    return apiService.get(`${this.basePath}/${dungeonId}/can-enter`);
  }
}

export const dungeonService = new DungeonService();
