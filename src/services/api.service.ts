/**
 * API Service - Cliente HTTP base
 * Equivalente a api.service.ts de Angular
 */

import { API_CONFIG, DEFAULT_HEADERS } from '../config/api.config';
import { STORAGE_KEYS } from '../utils/constants';
import { useSessionStore } from '../stores/sessionStore';
import { DEMO_CHARACTERS } from '../data/demoMockData';

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

    const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
  }

  // --- MOCK DATA FOR DEMO GACHA SYSTEM ---
  private mockPackages = [
    {
      _id: 'pkg_demo_starter',
      nombre: 'Cofre del Principiante',
      descripcion: 'Un cofre básico con garantias de equipo común y consumibles útiles.',
      precio: 500,
      moneda: 'val',
      rareza: 'common',
      contenido: [],
      disponible: true,
      featured: false,
    },
    {
      _id: 'pkg_demo_epic',
      nombre: 'Grimorio de Invocación',
      descripcion: 'Invoca un Héroe garantizado. Altas posibilidades de obtener calidad Rara o Épica.',
      precio: 2500,
      moneda: 'val',
      rareza: 'epic',
      contenido: [],
      disponible: true,
      featured: true,
    },
    {
      _id: 'pkg_demo_legendary',
      nombre: 'Relicario de Loto',
      descripcion: 'El cofre más escaso. Contiene maravillas incalculables y probabilidad de Legendario.',
      precio: 10000,
      moneda: 'val',
      rareza: 'legendary',
      contenido: [],
      disponible: true,
      featured: true,
    }
  ];

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
   * Comprueba si estamos en modo Guest para interceptar y no golpear la red.
   */
  private checkGuestMode<T>(method: string, endpoint: string, body?: any): T | null {
    if (useSessionStore.getState().isGuest) {
      console.info(`[Demo/Guest] Red bloqueada: ${method} ${endpoint}`);

      // MOCKS PARA GET
      if (method === 'GET') {
        if (endpoint.includes('/api/shop/packages') || endpoint.includes('/api/packages')) {
          return { packages: this.mockPackages } as unknown as T;
        }
        if (endpoint.includes('/api/user-packages/')) { // Obtener cajas del usuario
          const demoUserStr = localStorage.getItem(STORAGE_KEYS.USER);
          const demoUser = demoUserStr ? JSON.parse(demoUserStr) : {};
          return { packages: demoUser.userPackages || [] } as unknown as T;
        }
      }

      // MOCKS PARA POST
      if (method === 'POST') {
        if (endpoint.includes('/api/shop/purchase') && body?.purchaseType?.startsWith('pkg_demo')) {
          // Guardar compra de paquete en local
          const demoUserStr = localStorage.getItem(STORAGE_KEYS.USER);
          if (demoUserStr) {
            const demoUser = JSON.parse(demoUserStr);
            const pkgInfo = this.mockPackages.find(p => p._id === body.purchaseType);
            if (pkgInfo && ((demoUser.val || 0) >= pkgInfo.precio)) {
              demoUser.val -= pkgInfo.precio;
              const newPkg = {
                _id: `upkg_${Math.random()}`,
                userId: demoUser.id,
                paqueteId: pkgInfo._id,
                nombre: pkgInfo.nombre,
                abierto: false,
                createdAt: new Date().toISOString()
              };
              demoUser.userPackages = [...(demoUser.userPackages || []), newPkg];
              localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(demoUser));
              import('../services/auth.service').then(m => m.authService.loadFromStorage()); // forced update
              return { success: true, message: 'Compra simulada exitosa' } as unknown as T;
            } else {
              throw { message: 'VAL insuficiente para Demo' };
            }
          }
        }

        if (endpoint.includes('/api/user-packages/') && endpoint.includes('/open')) {
          const packageId = endpoint.split('/')[3]; // /api/user-packages/PKG_ID/open
          const demoUserStr = localStorage.getItem(STORAGE_KEYS.USER);
          if (demoUserStr) {
            const demoUser = JSON.parse(demoUserStr);
            const userPkgs = demoUser.userPackages || [];

            const pIdx = userPkgs.findIndex((p: any) => p._id === packageId && !p.abierto);
            if (pIdx >= 0) {
              userPkgs[pIdx].abierto = true;
              userPkgs[pIdx].openedAt = new Date().toISOString();
              demoUser.userPackages = userPkgs;

              // Assign a random demo character to the user's personajes
              const existingPersonajes = demoUser.personajes || [];
              const existingIds = existingPersonajes.map((p: any) => p.id);
              const availableChars = DEMO_CHARACTERS.filter(c => !existingIds.includes(c.id));
              let charsReceived = 0;
              if (availableChars.length > 0) {
                const randomChar = availableChars[Math.floor(Math.random() * availableChars.length)];
                existingPersonajes.push({
                  id: randomChar.id,
                  name: randomChar.name,
                  nombre: randomChar.name,
                  level: randomChar.level,
                  nivel: randomChar.level,
                  class: randomChar.class,
                  clase: randomChar.class,
                  rarity: randomChar.rarity,
                  rareza: randomChar.rarity,
                  stats: randomChar.stats,
                });
                demoUser.personajes = existingPersonajes;
                charsReceived = 1;
              }

              localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(demoUser));
              import('../services/auth.service').then(m => m.authService.loadFromStorage());

              return {
                ok: true,
                assigned: {
                  userPackageId: packageId,
                  paqueteId: userPkgs[pIdx].paqueteId,
                  openedAt: new Date().toISOString()
                },
                summary: {
                  charactersReceived: charsReceived,
                  itemsReceived: Math.floor(Math.random() * 3),
                  consumablesReceived: Math.floor(Math.random() * 5),
                  valReceived: Math.floor(Math.random() * 500) + 100,
                  totalCharacters: existingPersonajes.length,
                  totalItems: 2,
                  totalConsumables: 5,
                  valBalance: demoUser.val
                },
                inventory: { equipamientoNuevos: [], consumiblesNuevos: [] }
              } as unknown as T;
            } else {
              throw { message: 'Paquete demo no encontrado o ya abierto' };
            }
          }
        }
      }

      return {} as T;
    }
    return null;
  }

  /**
   * GET request
   */
  async get<T>(endpoint: string, params?: Record<string, string>, options?: RequestOptions): Promise<T> {
    const guestIntercept = this.checkGuestMode<T>('GET', endpoint);
    if (guestIntercept) return guestIntercept;

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
    const guestIntercept = this.checkGuestMode<T>('POST', endpoint, body);
    if (guestIntercept) return guestIntercept;

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
    const guestIntercept = this.checkGuestMode<T>('PUT', endpoint, body);
    if (guestIntercept) return guestIntercept;

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
    const guestIntercept = this.checkGuestMode<T>('PATCH', endpoint, body);
    if (guestIntercept) return guestIntercept;

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
    const guestIntercept = this.checkGuestMode<T>('DELETE', endpoint);
    if (guestIntercept) return guestIntercept;

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
