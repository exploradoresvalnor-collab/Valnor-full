/**
 * Team Service - Gestión de equipos (API real)
 * 
 * Endpoints documentados:
 * - GET    /api/teams              (listar mis equipos)
 * - GET    /api/teams/:id          (detalle de un equipo)
 * - POST   /api/teams              (crear equipo)
 * - PUT    /api/teams/:id          (actualizar equipo)
 * - DELETE /api/teams/:id          (eliminar equipo)
 * - PUT    /api/teams/:id/activate (activar equipo)
 * 
 * Reglas de negocio:
 * - Máx 5 equipos por usuario
 * - Máx 9 personajes por equipo
 * - Solo 1 equipo activo a la vez
 */

import api from './api.service';

// ============================================================
// TIPOS
// ============================================================

export interface TeamCharacter {
  _id: string;
  personajeId: string;
  nombre: string;
  rango: string;
  nivel: number;
  etapa: number;
  stats?: Record<string, number>;
}

export interface Team {
  _id: string;
  userId: string;
  name: string;
  characters: TeamCharacter[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TeamsResponse {
  success: boolean;
  teams: Team[];
  total: number;
}

export interface TeamResponse {
  success: boolean;
  team: Team;
  message?: string;
}

export interface CreateTeamDTO {
  name: string;
  characters: string[]; // IDs de personajes
}

export interface UpdateTeamDTO {
  name?: string;
  characters?: string[];
}

// ============================================================
// SERVICIO
// ============================================================

class TeamService {
  private basePath = '/api/teams';

  /**
   * Listar mis equipos
   * GET /api/teams
   */
  async getMyTeams(): Promise<Team[]> {
    const response = await api.get<TeamsResponse>(this.basePath);
    return response.teams || [];
  }

  /**
   * Obtener detalle de un equipo
   * GET /api/teams/:id
   */
  async getTeam(teamId: string): Promise<Team | null> {
    const response = await api.get<TeamResponse>(`${this.basePath}/${teamId}`);
    return response.team || null;
  }

  /**
   * Crear nuevo equipo
   * POST /api/teams
   */
  async createTeam(data: CreateTeamDTO): Promise<Team> {
    const response = await api.post<TeamResponse>(this.basePath, data);
    return response.team;
  }

  /**
   * Actualizar equipo existente
   * PUT /api/teams/:id
   */
  async updateTeam(teamId: string, data: UpdateTeamDTO): Promise<Team> {
    const response = await api.put<TeamResponse>(`${this.basePath}/${teamId}`, data);
    return response.team;
  }

  /**
   * Eliminar equipo
   * DELETE /api/teams/:id
   */
  async deleteTeam(teamId: string): Promise<{ success: boolean; message: string }> {
    return api.delete(`${this.basePath}/${teamId}`);
  }

  /**
   * Activar equipo (desactiva los demás automáticamente)
   * PUT /api/teams/:id/activate
   */
  async activateTeam(teamId: string): Promise<Team> {
    const response = await api.put<TeamResponse>(`${this.basePath}/${teamId}/activate`, {});
    return response.team;
  }

  /**
   * Obtener equipo activo (helper local)
   */
  async getActiveTeam(): Promise<Team | null> {
    const teams = await this.getMyTeams();
    return teams.find(t => t.isActive) || null;
  }
}

export const teamService = new TeamService();
export default teamService;
