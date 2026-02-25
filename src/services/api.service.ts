/**
 * API Service - Cliente HTTP base
 * Equivalente a api.service.ts de Angular
 */

import { API_CONFIG, DEFAULT_HEADERS } from '../config/api.config';
import { STORAGE_KEYS } from '../utils/constants';

interface RequestOptions {
  headers?: Record<string, string>;
  params?: Record<string, string>;
}

class ApiService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = API_CONFIG.baseUrl;
  }

  /**
   * Construye la URL con query params
   */
  private buildUrl(endpoint: string, params?: Record<string, string>): string {
    // Si baseUrl está vacío (proxy de Vite), usar ruta relativa
    const fullPath = `${this.baseUrl}${endpoint}`;

    if (params && Object.keys(params).length > 0) {
      const searchParams = new URLSearchParams();
      Object.keys(params).forEach(key => {
        if (params[key] !== null && params[key] !== undefined) {
          searchParams.append(key, params[key]);
        }
      });
      return `${fullPath}?${searchParams.toString()}`;
    }

    return fullPath;
  }

  /**
   * Obtiene headers con token de autorización si existe
   */
  private getHeaders(customHeaders?: Record<string, string>): HeadersInit {
    const headers: Record<string, string> = {
      ...DEFAULT_HEADERS,
      ...customHeaders,
    };

    // Añadir token si existe en localStorage
    const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
  }

  /**
   * Maneja la respuesta de la API
   */
  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({ message: 'Error desconocido' }));
      throw {
        status: response.status,
        // El backend usa "error" en unos endpoints y "message" en otros
        message: errorBody.error || errorBody.message || 'Error del servidor',
        error: errorBody.error || errorBody.message || 'Error del servidor',
        url: response.url,
        ...errorBody,
      };
    }

    // Si la respuesta está vacía, retornar undefined
    const text = await response.text();
    if (!text) return undefined as T;

    return JSON.parse(text);
  }

  /**
   * GET request
   */
  async get<T>(endpoint: string, params?: Record<string, string>, options?: RequestOptions): Promise<T> {
    const url = this.buildUrl(endpoint, params);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: this.getHeaders(options?.headers),
        credentials: 'include',
        signal: controller.signal,
      });
      clearTimeout(timeout);
      return this.handleResponse<T>(response);
    } catch (err) {
      clearTimeout(timeout);
      throw err;
    }
  }

  /**
   * POST request
   */
  async post<T>(endpoint: string, body: any, options?: RequestOptions): Promise<T> {
    const url = this.buildUrl(endpoint);
    console.log('[API] POST request to:', url);
    console.log('[API] POST body:', JSON.stringify(body, null, 2));

    const headers = this.getHeaders(options?.headers);
    const hasAuth = (headers as Record<string, string>)['Authorization'];
    console.log('[API] Headers:', { ...headers as any, Authorization: hasAuth ? '[BEARER TOKEN]' : '[COOKIE-ONLY]' });

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify(body),
        signal: controller.signal,
      });
      clearTimeout(timeout);

      console.log('[API] Response status:', response.status);
      console.log('[API] Response url:', response.url);

      return this.handleResponse<T>(response);
    } catch (err) {
      clearTimeout(timeout);
      throw err;
    }
  }

  /**
   * PUT request
   */
  async put<T>(endpoint: string, body: any, options?: RequestOptions): Promise<T> {
    const url = this.buildUrl(endpoint);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    try {
      const response = await fetch(url, {
        method: 'PUT',
        headers: this.getHeaders(options?.headers),
        credentials: 'include',
        body: JSON.stringify(body),
        signal: controller.signal,
      });
      clearTimeout(timeout);
      return this.handleResponse<T>(response);
    } catch (err) {
      clearTimeout(timeout);
      throw err;
    }
  }

  /**
   * PATCH request
   */
  async patch<T>(endpoint: string, body: any, options?: RequestOptions): Promise<T> {
    const url = this.buildUrl(endpoint);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    try {
      const response = await fetch(url, {
        method: 'PATCH',
        headers: this.getHeaders(options?.headers),
        credentials: 'include',
        body: JSON.stringify(body),
        signal: controller.signal,
      });
      clearTimeout(timeout);
      return this.handleResponse<T>(response);
    } catch (err) {
      clearTimeout(timeout);
      throw err;
    }
  }

  /**
   * DELETE request
   */
  async delete<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    const url = this.buildUrl(endpoint);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    try {
      const response = await fetch(url, {
        method: 'DELETE',
        headers: this.getHeaders(options?.headers),
        credentials: 'include',
        signal: controller.signal,
      });
      clearTimeout(timeout);
      return this.handleResponse<T>(response);
    } catch (err) {
      clearTimeout(timeout);
      throw err;
    }
  }
}

// Singleton
export const api = new ApiService();
export default api;
