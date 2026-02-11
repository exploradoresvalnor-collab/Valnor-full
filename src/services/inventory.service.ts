/**
 * Inventory Service - Gestión de inventario, items y equipamiento
 * 
 * Endpoints documentados:
 * - GET /api/items                    (catálogo de items)
 * - GET /api/equipment                (catálogo de equipamiento)
 * - GET /api/consumables              (catálogo de consumibles)
 * - GET /api/inventory                (mi inventario completo)
 * - GET /api/inventory/equipment      (mi equipamiento)
 * - GET /api/inventory/consumables    (mis consumibles)
 */

import api from './api.service';
import type { Item, EquipmentItem, ConsumableItem } from '../types';

// ============================================================
// TIPOS DE RESPUESTA
// ============================================================

export interface ItemsCatalogResponse {
  success: boolean;
  items: Item[];
  total: number;
}

export interface EquipmentCatalogResponse {
  success: boolean;
  equipment: EquipmentItem[];
  total: number;
}

export interface ConsumablesCatalogResponse {
  success: boolean;
  consumables: ConsumableItem[];
  total: number;
}

export interface InventoryResponse {
  success: boolean;
  equipment: EquipmentItem[];
  consumables: ConsumableItem[];
  totalEquipment: number;
  totalConsumables: number;
  limiteEquipamiento: number;
  limiteConsumibles: number;
}

// ============================================================
// SERVICIO
// ============================================================

class InventoryService {
  /**
   * Obtener catálogo completo de items
   * GET /api/items
   * Backend devuelve array plano
   */
  async getItemsCatalog(params?: { tipo?: string; rareza?: string }): Promise<Item[]> {
    const queryParams: Record<string, string> = {};
    if (params?.tipo) queryParams.tipo = params.tipo;
    if (params?.rareza) queryParams.rareza = params.rareza;
    const response = await api.get<Item[] | ItemsCatalogResponse>('/api/items', queryParams);
    if (Array.isArray(response)) return response;
    return response.items || [];
  }

  /**
   * Obtener catálogo de equipamiento
   * GET /api/equipment
   * Backend devuelve array plano
   */
  async getEquipmentCatalog(): Promise<EquipmentItem[]> {
    const response = await api.get<EquipmentItem[] | EquipmentCatalogResponse>('/api/equipment');
    if (Array.isArray(response)) return response;
    return response.equipment || [];
  }

  /**
   * Obtener catálogo de consumibles
   * GET /api/consumables
   * Backend devuelve array plano
   */
  async getConsumablesCatalog(): Promise<ConsumableItem[]> {
    const response = await api.get<ConsumableItem[] | ConsumablesCatalogResponse>('/api/consumables');
    if (Array.isArray(response)) return response;
    return response.consumables || [];
  }

  /**
   * Obtener mi inventario completo
   * GET /api/inventory
   */
  async getMyInventory(): Promise<InventoryResponse> {
    return api.get<InventoryResponse>('/api/inventory');
  }

  /**
   * Obtener mi equipamiento
   * GET /api/inventory/equipment
   * Backend devuelve array plano
   */
  async getMyEquipment(): Promise<EquipmentItem[]> {
    const response = await api.get<EquipmentItem[] | { equipment: EquipmentItem[] }>('/api/inventory/equipment');
    if (Array.isArray(response)) return response;
    return response.equipment || [];
  }

  /**
   * Obtener mis consumibles
   * GET /api/inventory/consumables
   * Backend devuelve array plano
   */
  async getMyConsumables(): Promise<ConsumableItem[]> {
    const response = await api.get<ConsumableItem[] | { consumables: ConsumableItem[] }>('/api/inventory/consumables');
    if (Array.isArray(response)) return response;
    return response.consumables || [];
  }
}

export const inventoryService = new InventoryService();
export default inventoryService;
