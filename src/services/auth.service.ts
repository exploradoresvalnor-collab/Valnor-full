/**
 * Auth Service - Servicio de autenticación
 * Equivalente a auth.service.ts de Angular
 */

import api from './api.service';
import {
  User,
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
  ForgotPasswordResponse,
  ResetPasswordResponse,
  CheckAvailabilityParams,
  CheckAvailabilityResponse,
  ValidateResetTokenResponse,
  VerifyEmailResponse,
} from '../types';

// Estado de autenticación
let currentUser: User | null = null;
let authListeners: ((user: User | null) => void)[] = [];

/**
 * Notifica a los listeners del cambio de usuario
 */
const notifyListeners = (user: User | null) => {
  authListeners.forEach(listener => listener(user));
};

/**
 * Auth Service
 */
export const authService = {
  /**
   * Registrar nuevo usuario
   * POST /api/auth/register
   */
  async register(data: RegisterRequest): Promise<RegisterResponse> {
    const response = await api.post<RegisterResponse>('/api/auth/register', data);
    return response;
  },

  /**
   * Iniciar sesión
   * POST /api/auth/login
   */
  async login(data: LoginRequest): Promise<LoginResponse> {
    // Limpiar tokens previos
    localStorage.removeItem('token');
    localStorage.removeItem('DEV_TOKEN');

    const response = await api.post<LoginResponse>('/api/auth/login', data);

    // Guardar usuario y token
    currentUser = response.user;
    if (response.token) {
      localStorage.setItem('token', response.token);
    }
    if (response.user) {
      localStorage.setItem('user', JSON.stringify(response.user));
    }

    notifyListeners(currentUser);
    console.log('✅ Login exitoso:', response.user?.username);

    return response;
  },

  /**
   * Cerrar sesión
   * POST /api/auth/logout
   */
  async logout(): Promise<void> {
    try {
      await api.post<void>('/api/auth/logout', {});
    } catch (e) {
      console.warn('Logout en backend falló, limpiando localmente');
    }

    currentUser = null;
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    notifyListeners(null);
    console.log('🗑️ Sesión cerrada');
  },

  /**
   * Verificar email con token
   * GET /api/auth/verify/:token
   */
  async verifyEmail(token: string): Promise<VerifyEmailResponse> {
    return api.get<VerifyEmailResponse>(`/api/auth/verify/${token}`);
  },

  /**
   * Solicitar recuperación de contraseña
   * POST /api/auth/forgot-password
   */
  async forgotPassword(email: string): Promise<ForgotPasswordResponse> {
    return api.post<ForgotPasswordResponse>('/api/auth/forgot-password', { email });
  },

  /**
   * Restablecer contraseña
   * POST /api/auth/reset-password/:token
   */
  async resetPassword(token: string, password: string): Promise<ResetPasswordResponse> {
    return api.post<ResetPasswordResponse>(`/api/auth/reset-password/${token}`, { password });
  },

  /**
   * Validar token de recuperación
   * GET /api/auth/reset-password/validate/:token
   */
  async validateResetToken(token: string): Promise<ValidateResetTokenResponse> {
    return api.get<ValidateResetTokenResponse>(`/api/auth/reset-password/validate/${token}`);
  },

  /**
   * Reenviar email de verificación
   * POST /api/auth/resend-verification
   */
  async resendVerification(email: string): Promise<{ message: string }> {
    return api.post<{ message: string }>('/api/auth/resend-verification', { email });
  },

  /**
   * Verificar disponibilidad de email/username
   * GET /api/auth/check
   */
  async checkAvailability(params: CheckAvailabilityParams): Promise<CheckAvailabilityResponse> {
    const queryParams: Record<string, string> = {};
    if (params.email) queryParams.email = params.email;
    if (params.username) queryParams.username = params.username;
    return api.get<CheckAvailabilityResponse>('/api/auth/check', queryParams);
  },

  /**
   * Obtener usuario actual del backend
   * GET /api/users/me
   */
  async getCurrentUser(): Promise<User> {
    const user = await api.get<User>('/api/users/me');
    currentUser = user;
    localStorage.setItem('user', JSON.stringify(user));
    notifyListeners(user);
    return user;
  },

  /**
   * Verificar sesión actual
   */
  async checkSession(): Promise<boolean> {
    try {
      await this.getCurrentUser();
      return true;
    } catch {
      return false;
    }
  },

  /**
   * Obtener usuario en memoria (sin llamar al backend)
   */
  getUser(): User | null {
    return currentUser;
  },

  /**
   * Verificar si está autenticado
   */
  isAuthenticated(): boolean {
    return currentUser !== null || localStorage.getItem('token') !== null;
  },

  /**
   * Cargar usuario desde localStorage al iniciar
   */
  loadFromStorage(): void {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        currentUser = JSON.parse(storedUser);
        notifyListeners(currentUser);
        console.log('💾 Usuario cargado desde localStorage');
      } catch (e) {
        console.error('Error parseando usuario:', e);
      }
    }
  },

  /**
   * Suscribirse a cambios de autenticación
   */
  subscribe(listener: (user: User | null) => void): () => void {
    authListeners.push(listener);
    // Notificar estado actual inmediatamente
    listener(currentUser);
    // Retornar función para desuscribirse
    return () => {
      authListeners = authListeners.filter(l => l !== listener);
    };
  },

  /**
   * Obtener token para Socket.IO
   * GET /api/auth/socket-token
   */
  async getSocketToken(): Promise<{ token: string }> {
    return api.get<{ token: string }>('/api/auth/socket-token');
  },
};

// Cargar usuario al importar el módulo
authService.loadFromStorage();

export default authService;
