/**
 * Shop Service - Tienda y paquetes
 * 
 * Endpoints documentados:
 * - GET  /api/offers                   (ofertas disponibles)
 * - GET  /api/packages                 (catálogo de paquetes)
 * - GET  /api/shop/info                (info de la tienda)
 * - GET  /api/shop/packages            (paquetes en la tienda)
 * - POST /api/shop/buy-evo             (comprar EVO tokens)
 * - POST /api/shop/buy-boletos         (comprar boletos)
 * - POST /api/shop/buy-val             (comprar VAL)
 * - POST /api/shop/purchase            (compra general)
 * - POST /api/user-packages/agregar    (agregar paquete al usuario)
 * - POST /api/user-packages/quitar     (quitar paquete del usuario)
 * - GET  /api/user-packages/:userId    (paquetes del usuario)
 * - POST /api/user-packages/:id/open   (abrir paquete específico)
 * - POST /api/user-packages/open       (abrir siguiente paquete pendiente)
 */

import api from './api.service';

// ============================================================
// TIPOS
// ============================================================

export interface ShopInfo {
  isOpen: boolean;
  featuredPackages: ShopPackage[];
  categories: string[];
  announcements?: string[];
}

export interface ShopPackage {
  _id: string;
  nombre: string;
  descripcion: string;
  precio: number;
  moneda: 'val' | 'evo' | 'real';
  contenido: PackageContent[];
  imagen?: string;
  rareza?: string;
  disponible: boolean;
  limite?: number;
  featured: boolean;
}

export interface PackageContent {
  tipo: 'personaje' | 'item' | 'consumible' | 'val' | 'evo';
  cantidad: number;
  garantizado: boolean;
  itemId?: string;
}

export interface Offer {
  _id: string;
  nombre: string;
  descripcion: string;
  descuento: number;
  paqueteId: string;
  fechaInicio: string;
  fechaFin: string;
  activa: boolean;
}

export interface UserPackage {
  _id: string;
  userId: string;
  paqueteId: string;
  nombre?: string;
  abierto: boolean;
  openedAt?: string;
  createdAt: string;
}

export interface OpenPackageResult {
  ok: boolean;
  assigned: {
    userPackageId: string;
    paqueteId: string;
    openedAt: string;
  };
  summary: {
    charactersReceived: number;
    itemsReceived: number;
    consumablesReceived: number;
    valReceived: number;
    totalCharacters: number;
    totalItems: number;
    totalConsumables: number;
    valBalance: number;
  };
  inventory: {
    equipamientoNuevos: string[];
    consumiblesNuevos: { consumableId: string; usos_restantes: number }[];
  };
}

export interface PurchaseResponse {
  success: boolean;
  message: string;
  transaction?: {
    id: string;
    amount: number;
    currency: string;
  };
}

// ============================================================
// SERVICIO
// ============================================================

class ShopService {
  /**
   * Obtener info de la tienda
   * GET /api/shop/info
   */
  async getShopInfo(): Promise<ShopInfo> {
    return api.get<ShopInfo>('/api/shop/info');
  }

  /**
   * Obtener paquetes disponibles en la tienda
   * GET /api/shop/packages
   */
  async getShopPackages(): Promise<ShopPackage[]> {
    const response = await api.get<{ packages: ShopPackage[] }>('/api/shop/packages');
    return response.packages || [];
  }

  /**
   * Obtener catálogo general de paquetes
   * GET /api/packages
   */
  async getPackagesCatalog(): Promise<ShopPackage[]> {
    const response = await api.get<{ packages: ShopPackage[] }>('/api/packages');
    return response.packages || [];
  }

  /**
   * Obtener ofertas activas
   * GET /api/offers
   */
  async getOffers(): Promise<Offer[]> {
    const response = await api.get<{ offers: Offer[] }>('/api/offers');
    return response.offers || [];
  }

  /**
   * Comprar EVO tokens
   * POST /api/shop/buy-evo
   */
  async buyEvo(amount: number): Promise<PurchaseResponse> {
    return api.post('/api/shop/buy-evo', { amount });
  }

  /**
   * Comprar boletos
   * POST /api/shop/buy-boletos
   */
  async buyBoletos(amount: number): Promise<PurchaseResponse> {
    return api.post('/api/shop/buy-boletos', { amount });
  }

  /**
   * Comprar VAL
   * POST /api/shop/buy-val
   */
  async buyVal(amount: number): Promise<PurchaseResponse> {
    return api.post('/api/shop/buy-val', { amount });
  }

  /**
   * Compra general (paquete)
   * POST /api/shop/purchase
   */
  async purchase(packageId: string, quantity: number = 1): Promise<PurchaseResponse> {
    return api.post('/api/shop/purchase', { packageId, quantity });
  }

  /**
   * Obtener paquetes del usuario
   * GET /api/user-packages/:userId
   */
  async getUserPackages(userId: string): Promise<UserPackage[]> {
    const response = await api.get<{ packages: UserPackage[] }>(`/api/user-packages/${userId}`);
    return response.packages || [];
  }

  /**
   * Abrir paquete específico por ID
   * POST /api/user-packages/:id/open
   */
  async openPackageById(packageId: string): Promise<OpenPackageResult> {
    return api.post<OpenPackageResult>(`/api/user-packages/${packageId}/open`, {});
  }

  /**
   * Abrir siguiente paquete pendiente (sin especificar ID)
   * POST /api/user-packages/open
   */
  async openNextPackage(): Promise<OpenPackageResult> {
    return api.post<OpenPackageResult>('/api/user-packages/open', {});
  }

  /**
   * Comprar/agregar paquete a un usuario (cobra VAL)
   * POST /api/user-packages/agregar
   * Body: { userId, paqueteId }
   */
  async addPackageToUser(userId: string, paqueteId: string): Promise<{ ok: boolean; userPackage?: unknown }> {
    return api.post('/api/user-packages/agregar', { userId, paqueteId });
  }

  /**
   * Quitar paquete de un usuario
   * POST /api/user-packages/quitar
   * Body: { userId, paqueteId }
   */
  async removePackageFromUser(userId: string, paqueteId: string): Promise<{ ok: boolean; eliminado?: unknown }> {
    return api.post('/api/user-packages/quitar', { userId, paqueteId });
  }
}

export const shopService = new ShopService();
export default shopService;
