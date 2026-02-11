/**
 * Game Config Service - Configuración estática / datos maestros del juego
 * 
 * Endpoints del backend:
 * - GET /api/game-settings        → Configuración global del juego (público)
 * - GET /api/base-characters      → Personajes / clases base disponibles (público)
 * - GET /api/categories           → Categorías de ítems (⚠️ PROTEGIDO — requiere auth)
 * - GET /api/level-requirements   → Requisitos por nivel (⚠️ PROTEGIDO — requiere auth)
 * - GET /api/events               → Eventos activos (⚠️ PROTEGIDO — requiere auth)
 * - GET /api/version              → Versión del servidor (público)
 * 
 * NOTA: categories, level-requirements y events están montados DESPUÉS de
 * checkAuth en el backend app.ts, por lo que requieren un token/cookie válido.
 * Llamar estos endpoints sin autenticación dará 401 Unauthorized.
 */

import api from './api.service';

// ============================================================
// TIPOS
// ============================================================

export interface GameSettings {
  [key: string]: unknown;
}

export interface BaseCharacter {
  id?: string;
  _id?: string;
  name: string;
  class?: string;
  description?: string;
  stats?: Record<string, number>;
  [key: string]: unknown;
}

export interface Category {
  id?: string;
  _id?: string;
  name: string;
  slug?: string;
  [key: string]: unknown;
}

export interface LevelRequirement {
  level: number;
  xpRequired: number;
  [key: string]: unknown;
}

export interface GameEvent {
  id?: string;
  _id?: string;
  name: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  active?: boolean;
  [key: string]: unknown;
}

// ============================================================
// SERVICIO
// ============================================================

class GameConfigService {
  /**
   * Obtener configuración global del juego
   * GET /api/game-settings
   */
  async getSettings(): Promise<GameSettings> {
    return api.get('/api/game-settings');
  }

  /**
   * Obtener personajes / clases base disponibles
   * GET /api/base-characters
   */
  async getBaseCharacters(): Promise<BaseCharacter[]> {
    return api.get('/api/base-characters');
  }

  /**
   * Obtener categorías de ítems / objetos
   * GET /api/categories
   */
  async getCategories(): Promise<Category[]> {
    return api.get('/api/categories');
  }

  /**
   * Obtener requisitos por nivel
   * GET /api/level-requirements
   */
  async getLevelRequirements(): Promise<LevelRequirement[]> {
    return api.get('/api/level-requirements');
  }

  /**
   * Obtener eventos activos / programados
   * GET /api/events
   */
  async getEvents(): Promise<GameEvent[]> {
    return api.get('/api/events');
  }

  /**
   * Obtener versión del servidor
   * GET /api/version
   */
  async getServerVersion(): Promise<{ version: string; name: string; buildDate: string; environment: string }> {
    return api.get('/api/version');
  }
}

export const gameConfigService = new GameConfigService();
export default gameConfigService;
