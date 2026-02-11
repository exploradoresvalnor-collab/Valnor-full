/**
 * User Service - Gestión de usuarios y recursos
 * 
 * Endpoints documentados:
 * - GET    /api/users              (lista de usuarios)
 * - GET    /api/users/me           (mi perfil)
 * - GET    /api/users/profile/:id  (perfil público)
 * - GET    /api/users/resources    (recursos: val, evo, energía)
 * - GET    /api/users/dashboard    (datos del dashboard)
 * - PUT    /api/users/tutorial/complete
 * - POST   /api/users/characters/add
 * - PUT    /api/users/set-active-character/:personajeId
 * - DELETE /api/users/characters/:personajeId
 * - POST   /api/users/energy/consume
 * - GET    /api/users/energy/status
 */

import api from './api.service';
import type { User } from '../types';

// ============================================================
// TIPOS DE RESPUESTA
// ============================================================

export interface UserResources {
  val: number;
  evo: number;
  boletos: number;
  energia: number;
  energiaMaxima: number;
  tiempoRegeneracion?: string;
}

export interface DashboardData {
  user: User;
  resources: UserResources;
  activeTeam?: unknown;
  notifications?: { unreadCount: number };
  recentActivity?: unknown[];
}

export interface EnergyStatus {
  energia: number;
  energiaMaxima: number;
  tiempoParaSiguienteRegeneracion?: string;
  regeneracionPorMinuto?: number;
}

// ============================================================
// SERVICIO
// ============================================================

class UserService {
  private basePath = '/api/users';

  /**
   * Obtener mi perfil completo
   * GET /api/users/me
   */
  async getMe(): Promise<User> {
    return api.get<User>(`${this.basePath}/me`);
  }

  /**
   * Obtener perfil público de un usuario
   * GET /api/users/profile/:userId
   */
  async getProfile(userId: string): Promise<User> {
    return api.get<User>(`${this.basePath}/profile/${userId}`);
  }

  /**
   * Obtener lista de usuarios
   * GET /api/users
   * Backend devuelve array plano
   */
  async getUsers(params?: { page?: number; limit?: number }): Promise<{ users: User[]; total: number }> {
    const queryParams: Record<string, string> = {};
    if (params?.page) queryParams.page = String(params.page);
    if (params?.limit) queryParams.limit = String(params.limit);
    const response = await api.get<User[] | { users: User[]; total: number }>(`${this.basePath}`, queryParams);
    if (Array.isArray(response)) return { users: response, total: response.length };
    return response;
  }

  /**
   * Obtener recursos del usuario (val, evo, energía, boletos)
   * GET /api/users/resources
   */
  async getResources(): Promise<UserResources> {
    return api.get<UserResources>(`${this.basePath}/resources`);
  }

  /**
   * Obtener datos del dashboard
   * GET /api/users/dashboard
   */
  async getDashboard(): Promise<DashboardData> {
    return api.get<DashboardData>(`${this.basePath}/dashboard`);
  }

  /**
   * Completar tutorial
   * PUT /api/users/tutorial/complete
   */
  async completeTutorial(): Promise<{ success: boolean; message: string }> {
    return api.put(`${this.basePath}/tutorial/complete`, {});
  }

  /**
   * Agregar personaje al usuario
   * POST /api/users/characters/add
   * Backend espera { personajeId, rango }
   */
  async addCharacter(personajeId: string, rango: string = 'E'): Promise<{ success: boolean; message: string }> {
    return api.post(`${this.basePath}/characters/add`, { personajeId, rango });
  }

  /**
   * Establecer personaje activo
   * PUT /api/users/set-active-character/:personajeId
   */
  async setActiveCharacter(personajeId: string): Promise<{ success: boolean; message: string }> {
    return api.put(`${this.basePath}/set-active-character/${personajeId}`, {});
  }

  /**
   * Eliminar personaje del usuario
   * DELETE /api/users/characters/:personajeId
   */
  async removeCharacter(personajeId: string): Promise<{ success: boolean; message: string }> {
    return api.delete(`${this.basePath}/characters/${personajeId}`);
  }

  /**
   * Consumir energía
   * POST /api/users/energy/consume
   */
  async consumeEnergy(amount: number): Promise<{ success: boolean; remaining: number }> {
    return api.post(`${this.basePath}/energy/consume`, { amount });
  }

  /**
   * Obtener estado de energía
   * GET /api/users/energy/status
   */
  async getEnergyStatus(): Promise<EnergyStatus> {
    return api.get<EnergyStatus>(`${this.basePath}/energy/status`);
  }
}

export const userService = new UserService();
export default userService;
