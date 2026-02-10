/**
 * Character Service - Acciones sobre personajes
 * 
 * Endpoints documentados:
 * - POST /api/characters/:id/use-consumable
 * - POST /api/characters/:id/revive
 * - POST /api/characters/:id/damage
 * - POST /api/characters/:id/heal
 * - POST /api/characters/:id/evolve
 * - POST /api/characters/:id/add-experience
 * - POST /api/characters/:id/equip
 * - POST /api/characters/:id/unequip
 * - GET  /api/characters/:id/stats
 * - PUT  /api/characters/:id/level-up
 * 
 * También:
 * - GET  /api/user-characters        (mis personajes)
 * - GET  /api/user-characters/:id    (detalle de personaje)
 */

import api from './api.service';
import type { CharacterStats, CharacterData } from '../types';

// ============================================================
// TIPOS DE RESPUESTA
// ============================================================

export interface CharacterActionResponse {
  success: boolean;
  message: string;
  character?: CharacterData;
}

export interface EquipResponse extends CharacterActionResponse {
  equipmentSlot?: string;
  itemEquipped?: string;
}

export interface LevelUpResponse extends CharacterActionResponse {
  newLevel?: number;
  statsGained?: Partial<CharacterStats>;
}

export interface EvolveResponse extends CharacterActionResponse {
  newEtapa?: number;
  newRango?: string;
}

export interface UseConsumableResponse extends CharacterActionResponse {
  effectApplied?: string;
  remainingUses?: number;
}

export interface UserCharactersResponse {
  success: boolean;
  characters: CharacterData[];
  total: number;
}

// ============================================================
// SERVICIO
// ============================================================

class CharacterService {
  private basePath = '/api/characters';
  private userCharactersPath = '/api/user-characters';

  /**
   * Obtener mis personajes
   * GET /api/user-characters
   */
  async getMyCharacters(): Promise<CharacterData[]> {
    const response = await api.get<UserCharactersResponse>(this.userCharactersPath);
    return response.characters || [];
  }

  /**
   * Obtener detalle de un personaje
   * GET /api/user-characters/:id
   */
  async getCharacter(characterId: string): Promise<CharacterData | null> {
    const response = await api.get<{ character: CharacterData }>(`${this.userCharactersPath}/${characterId}`);
    return response.character || null;
  }

  /**
   * Obtener stats de un personaje
   * GET /api/characters/:characterId/stats
   */
  async getStats(characterId: string): Promise<CharacterStats> {
    return api.get<CharacterStats>(`${this.basePath}/${characterId}/stats`);
  }

  /**
   * Usar consumible en un personaje
   * POST /api/characters/:characterId/use-consumable
   */
  async useConsumable(characterId: string, consumableId: string): Promise<UseConsumableResponse> {
    return api.post(`${this.basePath}/${characterId}/use-consumable`, { consumableId });
  }

  /**
   * Revivir personaje
   * POST /api/characters/:characterId/revive
   */
  async revive(characterId: string): Promise<CharacterActionResponse> {
    return api.post(`${this.basePath}/${characterId}/revive`, {});
  }

  /**
   * Aplicar daño a personaje (debug/admin)
   * POST /api/characters/:characterId/damage
   */
  async damage(characterId: string, amount: number): Promise<CharacterActionResponse> {
    return api.post(`${this.basePath}/${characterId}/damage`, { amount });
  }

  /**
   * Curar personaje
   * POST /api/characters/:characterId/heal
   */
  async heal(characterId: string, amount?: number): Promise<CharacterActionResponse> {
    return api.post(`${this.basePath}/${characterId}/heal`, { amount });
  }

  /**
   * Evolucionar personaje
   * POST /api/characters/:characterId/evolve
   */
  async evolve(characterId: string): Promise<EvolveResponse> {
    return api.post(`${this.basePath}/${characterId}/evolve`, {});
  }

  /**
   * Agregar experiencia a personaje
   * POST /api/characters/:characterId/add-experience
   */
  async addExperience(characterId: string, amount: number): Promise<CharacterActionResponse> {
    return api.post(`${this.basePath}/${characterId}/add-experience`, { amount });
  }

  /**
   * Equipar item en personaje
   * POST /api/characters/:characterId/equip
   */
  async equip(characterId: string, itemId: string, slot?: string): Promise<EquipResponse> {
    return api.post(`${this.basePath}/${characterId}/equip`, { itemId, slot });
  }

  /**
   * Desequipar item
   * POST /api/characters/:characterId/unequip
   */
  async unequip(characterId: string, slot: string): Promise<EquipResponse> {
    return api.post(`${this.basePath}/${characterId}/unequip`, { slot });
  }

  /**
   * Subir de nivel
   * PUT /api/characters/:characterId/level-up
   */
  async levelUp(characterId: string): Promise<LevelUpResponse> {
    return api.put(`${this.basePath}/${characterId}/level-up`, {});
  }
}

export const characterService = new CharacterService();
export default characterService;
