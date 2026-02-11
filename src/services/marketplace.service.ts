/**
 * Marketplace Service - Marketplace P2P y transacciones
 * 
 * Marketplace:
 * - POST  /api/marketplace/list                (listar item en venta)
 * - POST  /api/marketplace/buy/:listingId      (comprar item)
 * - POST  /api/marketplace/cancel/:listingId   (cancelar listado)
 * - GET   /api/marketplace/history             (historial)
 * - GET   /api/marketplace/:listingId          (detalle de listado)
 * - PATCH /api/marketplace/:listingId/price    (actualizar precio)
 * 
 * Marketplace Transactions:
 * - GET /api/marketplace-transactions/my-history    (mi historial)
 * - GET /api/marketplace-transactions/my-sales      (mis ventas)
 * - GET /api/marketplace-transactions/my-purchases  (mis compras)
 * - GET /api/marketplace-transactions/stats         (estadísticas)
 * - GET /api/marketplace-transactions/:listingId    (detalle transacción)
 */

import api from './api.service';

// ============================================================
// TIPOS
// ============================================================

export interface MarketplaceListing {
  _id: string;
  sellerId: string;
  sellerUsername?: string;
  itemId: string;
  itemName: string;
  itemType: string;
  itemRareza: string;
  priceVal: number;
  status: 'active' | 'sold' | 'cancelled' | 'expired';
  createdAt: string;
  soldAt?: string;
  buyerId?: string;
}

export interface ListItemDTO {
  itemId: string;
  precio: number;
  descripcion?: string;
}

export interface MarketplaceTransaction {
  _id: string;
  listingId: string;
  sellerId: string;
  buyerId: string;
  itemId: string;
  priceVal: number;
  fee: number;
  netAmount: number;
  type: 'sale' | 'purchase';
  createdAt: string;
}

export interface MarketplaceStats {
  totalSales: number;
  totalPurchases: number;
  totalEarned: number;
  totalSpent: number;
  averageSalePrice: number;
}

// ============================================================
// SERVICIO
// ============================================================

class MarketplaceService {
  private basePath = '/api/marketplace';
  private txPath = '/api/marketplace-transactions';

  // =====================================
  // MARKETPLACE
  // =====================================

  /**
   * Listar un item en venta
   * POST /api/marketplace/list
   * Backend espera { itemId, precio, descripcion? }
   * Backend devuelve { exito, listing: { id, itemId, sellerId, precio, estado } }
   */
  async listItem(data: ListItemDTO): Promise<{ success: boolean; listing: MarketplaceListing }> {
    const response = await api.post<any>(`${this.basePath}/list`, data);
    return {
      success: response.exito ?? response.success ?? false,
      listing: response.listing,
    };
  }

  /**
   * Comprar item del marketplace
   * POST /api/marketplace/buy/:listingId
   * Backend devuelve { exito, transaccion: { listingId, compradorId, vendedorId, ... } }
   */
  async buyItem(listingId: string): Promise<{ success: boolean; transaction?: MarketplaceTransaction }> {
    const response = await api.post<any>(`${this.basePath}/buy/${listingId}`, {});
    return {
      success: response.exito ?? response.success ?? false,
      transaction: response.transaccion || response.transaction,
    };
  }

  /**
   * Cancelar listado
   * POST /api/marketplace/cancel/:listingId
   * Backend devuelve { exito, listing: { id, estado, itemId } }
   */
  async cancelListing(listingId: string): Promise<{ success: boolean; message?: string }> {
    const response = await api.post<any>(`${this.basePath}/cancel/${listingId}`, {});
    return {
      success: response.exito ?? response.success ?? false,
      message: response.mensaje || response.message,
    };
  }

  /**
   * Obtener historial del marketplace
   * GET /api/marketplace/history
   * NOTA: Actualmente es un STUB en el backend que devuelve { success, data: [], message }
   */
  async getHistory(params?: { page?: number; limit?: number }): Promise<{
    listings: MarketplaceListing[];
    total: number;
  }> {
    const queryParams: Record<string, string> = {};
    if (params?.page) queryParams.page = String(params.page);
    if (params?.limit) queryParams.limit = String(params.limit);
    const response = await api.get<any>(`${this.basePath}/history`, queryParams);
    // Backend devuelve { data: [...] } o { listings: [...] }
    return {
      listings: response.data || response.listings || [],
      total: response.total ?? (response.data?.length || 0),
    };
  }

  /**
   * Obtener detalle de un listado
   * GET /api/marketplace/:listingId
   */
  async getListing(listingId: string): Promise<MarketplaceListing> {
    return api.get<MarketplaceListing>(`${this.basePath}/${listingId}`);
  }

  /**
   * Actualizar precio de listado
   * PATCH /api/marketplace/:listingId/price
   * Backend devuelve { success, precio } (no el listing completo)
   */
  async updatePrice(listingId: string, newPrice: number): Promise<{ success: boolean; precio?: number }> {
    return api.patch(`${this.basePath}/${listingId}/price`, { price: newPrice });
  }

  // =====================================
  // TRANSACCIONES
  // =====================================

  /**
   * Mi historial de transacciones
   * GET /api/marketplace-transactions/my-history
   * Backend devuelve { success, data: [...], pagination: { total, limit, offset, hasMore } }
   */
  async getMyTransactionHistory(): Promise<{ transactions: MarketplaceTransaction[]; total: number }> {
    const response = await api.get<any>(`${this.txPath}/my-history`);
    const items = response.data || response.transactions || [];
    const total = response.pagination?.total ?? response.total ?? items.length;
    return { transactions: items, total };
  }

  /**
   * Mis ventas
   * GET /api/marketplace-transactions/my-sales
   * Backend devuelve { success, data: [...], pagination: { total, ... } }
   */
  async getMySales(): Promise<{ transactions: MarketplaceTransaction[]; total: number }> {
    const response = await api.get<any>(`${this.txPath}/my-sales`);
    const items = response.data || response.transactions || [];
    const total = response.pagination?.total ?? response.total ?? items.length;
    return { transactions: items, total };
  }

  /**
   * Mis compras
   * GET /api/marketplace-transactions/my-purchases
   * Backend devuelve { success, data: [...], pagination: { total, ... } }
   */
  async getMyPurchases(): Promise<{ transactions: MarketplaceTransaction[]; total: number }> {
    const response = await api.get<any>(`${this.txPath}/my-purchases`);
    const items = response.data || response.transactions || [];
    const total = response.pagination?.total ?? response.total ?? items.length;
    return { transactions: items, total };
  }

  /**
   * Estadísticas de transacciones
   * GET /api/marketplace-transactions/stats
   * Backend devuelve { success, stats: { ventas: { totalVentas, ingresosBrutos, ... }, compras: { totalCompras, gastoTotal }, ... } }
   * Mapeamos al formato del frontend (EN)
   */
  async getTransactionStats(): Promise<MarketplaceStats> {
    const response = await api.get<any>(`${this.txPath}/stats`);
    const stats = response.stats || response;
    return {
      totalSales: stats.ventas?.totalVentas ?? stats.totalSales ?? 0,
      totalPurchases: stats.compras?.totalCompras ?? stats.totalPurchases ?? 0,
      totalEarned: stats.ventas?.ingresosBrutos ?? stats.totalEarned ?? 0,
      totalSpent: stats.compras?.gastoTotal ?? stats.totalSpent ?? 0,
      averageSalePrice: stats.ventas?.precioPromedio ?? stats.averageSalePrice ?? 0,
    };
  }

  /**
   * Detalle de transacción
   * GET /api/marketplace-transactions/:listingId
   * Backend devuelve { success, data: Transaction[] } (array)
   * Tomamos el primer elemento
   */
  async getTransaction(listingId: string): Promise<MarketplaceTransaction | null> {
    const response = await api.get<any>(`${this.txPath}/${listingId}`);
    const data = response.data || response.transactions;
    if (Array.isArray(data)) return data[0] || null;
    return data || null;
  }
}

export const marketplaceService = new MarketplaceService();
export default marketplaceService;
