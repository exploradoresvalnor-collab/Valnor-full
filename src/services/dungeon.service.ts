/**
 * Dungeon Service - Gestión de mazmorras
 * 
 * Endpoints reales del backend:
 * - GET  /api/dungeons                              (listar mazmorras)
 * - GET  /api/dungeons/:id                           (detalle de mazmorra)
 * - POST /api/dungeons/:dungeonId/start              (iniciar combate en mazmorra)
 * - GET  /api/dungeons/:dungeonId/progress           (obtener progreso)
 * - GET  /api/dungeons/:dungeonId/session/:sessionId (alias de progress)
 * - POST /api/dungeons/enter/:dungeonId              (alias de start)
 */

import apiService from './api.service';
import type { 
  Dungeon, 
  DungeonResponse, 
} from '../types';

class DungeonService {
  private basePath = '/api/dungeons';

  /**
   * Obtener lista de mazmorras disponibles
   * GET /api/dungeons
   * Backend devuelve array plano
   */
  async getDungeons(): Promise<Dungeon[]> {
    const response = await apiService.get<Dungeon[] | DungeonResponse>(this.basePath);
    if (Array.isArray(response)) return response;
    return response.dungeons || [];
  }

  /**
   * Obtener mazmorra por ID
   * GET /api/dungeons/:id
   * Backend puede devolver objeto directo o { dungeon: ... }
   */
  async getDungeon(dungeonId: string): Promise<Dungeon | null> {
    const response = await apiService.get<any>(`${this.basePath}/${dungeonId}`);
    if (response && response._id) return response as Dungeon; // Objeto directo
    return response?.dungeon || null;
  }

  /**
   * Iniciar combate en mazmorra
   * POST /api/dungeons/:dungeonId/start
   * Body: { team: ["charId1", "charId2", ...] }
   */
  async startDungeon(dungeonId: string, team: string[]): Promise<unknown> {
    return apiService.post(`${this.basePath}/${dungeonId}/start`, { team });
  }

  /**
   * Obtener progreso de mazmorra
   * GET /api/dungeons/:dungeonId/progress
   */
  async getProgress(dungeonId: string): Promise<unknown> {
    return apiService.get(`${this.basePath}/${dungeonId}/progress`);
  }

  /**
   * Obtener sesión específica (alias)
   * GET /api/dungeons/:dungeonId/session/:sessionId
   */
  async getSession(dungeonId: string, sessionId: string): Promise<unknown> {
    return apiService.get(`${this.basePath}/${dungeonId}/session/${sessionId}`);
  }
}

export const dungeonService = new DungeonService();
