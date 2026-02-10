/**
 * Combat Service - Sistema de combate
 * 
 * Endpoints del backend (montados en /api vía combatRoutes):
 * - POST /api/attack   (atacar en combate)
 * - POST /api/defend   (defender en combate)
 * - POST /api/end      (finalizar combate)
 * 
 * Nota: POST /api/dungeons/:dungeonId/start se gestiona desde dungeon.service.ts
 */

import api from './api.service';

// ============================================================
// TIPOS
// ============================================================

export interface CombatStartResponse {
  success: boolean;
  sessionId: string;
  resultado?: 'victoria' | 'derrota';
  log: string[];
  recompensas?: {
    expGanada: number;
    valGanado: number;
    botinObtenido: { itemId: string; nombre: string }[];
  };
  progresionMazmorra?: {
    puntosGanados: number;
    nivelActual: number;
    subiDeNivel: boolean;
  };
  estadoEquipo?: {
    personajeId: string;
    saludFinal: number;
    estado: 'saludable' | 'herido' | 'muerto';
  }[];
}

export interface CombatActionResponse {
  success: boolean;
  log: string[];
  damage?: number;
  enemyHp?: number;
  playerHp?: number;
  turno?: number;
  combatEnded?: boolean;
  resultado?: 'victoria' | 'derrota';
}

export interface CombatEndResponse {
  success: boolean;
  resultado: 'victoria' | 'derrota' | 'abandono';
  recompensas?: {
    expGanada: number;
    valGanado: number;
    botinObtenido: unknown[];
  };
  stats?: {
    turnosTotales: number;
    danoTotal: number;
    curacionTotal: number;
  };
}

// ============================================================
// SERVICIO
// ============================================================

class CombatService {
  private basePath = '/api';

  /**
   * Ejecutar ataque
   * POST /api/attack
   */
  async attack(data?: {
    sessionId?: string;
    targetId?: string;
    skillId?: string;
  }): Promise<CombatActionResponse> {
    return api.post(`${this.basePath}/attack`, data || {});
  }

  /**
   * Ejecutar defensa
   * POST /api/defend
   */
  async defend(data?: { sessionId?: string }): Promise<CombatActionResponse> {
    return api.post(`${this.basePath}/defend`, data || {});
  }

  /**
   * Finalizar combate
   * POST /api/end
   */
  async endCombat(data?: { sessionId?: string }): Promise<CombatEndResponse> {
    return api.post(`${this.basePath}/end`, data || {});
  }
}

export const combatService = new CombatService();
export default combatService;
