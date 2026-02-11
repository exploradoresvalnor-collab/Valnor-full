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
// TIPOS — Alineados con controllers del backend
// Backend usa campos en español: exito, ataque, defensa, etc.
// Mapeamos a una interfaz unificada para el frontend.
// ============================================================

/** Respuesta raw del backend para attack/defend */
interface CombatActionRaw {
  exito?: boolean;
  success?: boolean;
  ataque?: {
    personaje: string;
    dano: number;
    critico: boolean;
    tipo: string;
    timestamp: string;
  };
  defensa?: {
    personaje: string;
    reduccionDano: number;
    estado: string;
    duracionTurnos: number;
  };
  [key: string]: unknown;
}

/** Respuesta raw del backend para endCombat */
interface CombatEndRaw {
  exito?: boolean;
  success?: boolean;
  combate?: {
    resultado?: string;
    [key: string]: unknown;
  };
  recompensas?: {
    experiencia?: number;
    val?: number;
    [key: string]: unknown;
  };
  estadisticas?: {
    experienciaTotal?: number;
    valTotal?: number;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

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
  ataque?: CombatActionRaw['ataque'];
  defensa?: CombatActionRaw['defensa'];
  damage?: number;
  log?: string[];
  combatEnded?: boolean;
  resultado?: 'victoria' | 'derrota';
  raw: CombatActionRaw;
}

export interface CombatEndResponse {
  success: boolean;
  resultado: 'victoria' | 'derrota' | 'abandono';
  recompensas?: {
    experiencia: number;
    val: number;
  };
  estadisticas?: Record<string, unknown>;
  raw: CombatEndRaw;
}

// ============================================================
// SERVICIO
// ============================================================

class CombatService {
  private basePath = '/api';

  /**
   * Ejecutar ataque
   * POST /api/attack
   * Backend espera { combateId, characterId }
   * Backend devuelve { exito, ataque: { personaje, dano, critico, tipo, timestamp } }
   */
  async attack(data: {
    combateId: string;
    characterId: string;
    skillId?: string;
  }): Promise<CombatActionResponse> {
    const raw = await api.post<CombatActionRaw>(`${this.basePath}/attack`, data);
    return {
      success: raw.exito ?? raw.success ?? false,
      ataque: raw.ataque,
      damage: raw.ataque?.dano,
      raw,
    };
  }

  /**
   * Ejecutar defensa
   * POST /api/defend
   * Backend espera { combateId, characterId }
   * Backend devuelve { exito, defensa: { personaje, reduccionDano, estado, duracionTurnos } }
   */
  async defend(data: {
    combateId: string;
    characterId: string;
  }): Promise<CombatActionResponse> {
    const raw = await api.post<CombatActionRaw>(`${this.basePath}/defend`, data);
    return {
      success: raw.exito ?? raw.success ?? false,
      defensa: raw.defensa,
      raw,
    };
  }

  /**
   * Finalizar combate
   * POST /api/end
   * Backend espera { combateId, characterId, resultado }
   * Backend devuelve { exito, combate: { resultado, ... }, recompensas, estadisticas }
   */
  async endCombat(data: {
    combateId: string;
    characterId: string;
    resultado: 'victoria' | 'derrota' | 'abandono';
  }): Promise<CombatEndResponse> {
    const raw = await api.post<CombatEndRaw>(`${this.basePath}/end`, data);
    return {
      success: raw.exito ?? raw.success ?? false,
      resultado: (raw.combate?.resultado || data.resultado) as CombatEndResponse['resultado'],
      recompensas: raw.recompensas ? {
        experiencia: raw.recompensas.experiencia ?? 0,
        val: raw.recompensas.val ?? 0,
      } : undefined,
      estadisticas: raw.estadisticas,
      raw,
    };
  }
}

export const combatService = new CombatService();
export default combatService;
