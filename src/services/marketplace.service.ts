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
  priceVal: number;
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
   */
  async listItem(data: ListItemDTO): Promise<{ success: boolean; listing: MarketplaceListing }> {
    return api.post(`${this.basePath}/list`, data);
  }

  /**
   * Comprar item del marketplace
   * POST /api/marketplace/buy/:listingId
   */
  async buyItem(listingId: string): Promise<{ success: boolean; message: string; transaction?: MarketplaceTransaction }> {
    return api.post(`${this.basePath}/buy/${listingId}`, {});
  }

  /**
   * Cancelar listado
   * POST /api/marketplace/cancel/:listingId
   */
  async cancelListing(listingId: string): Promise<{ success: boolean; message: string }> {
    return api.post(`${this.basePath}/cancel/${listingId}`, {});
  }

  /**
   * Obtener historial del marketplace
   * GET /api/marketplace/history
   */
  async getHistory(params?: { page?: number; limit?: number }): Promise<{
    listings: MarketplaceListing[];
    total: number;
  }> {
    const queryParams: Record<string, string> = {};
    if (params?.page) queryParams.page = String(params.page);
    if (params?.limit) queryParams.limit = String(params.limit);
    return api.get(`${this.basePath}/history`, queryParams);
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
   */
  async updatePrice(listingId: string, newPrice: number): Promise<{ success: boolean; listing: MarketplaceListing }> {
    return api.patch(`${this.basePath}/${listingId}/price`, { priceVal: newPrice });
  }

  // =====================================
  // TRANSACCIONES
  // =====================================

  /**
   * Mi historial de transacciones
   * GET /api/marketplace-transactions/my-history
   */
  async getMyTransactionHistory(): Promise<{ transactions: MarketplaceTransaction[]; total: number }> {
    return api.get(`${this.txPath}/my-history`);
  }

  /**
   * Mis ventas
   * GET /api/marketplace-transactions/my-sales
   */
  async getMySales(): Promise<{ transactions: MarketplaceTransaction[]; total: number }> {
    return api.get(`${this.txPath}/my-sales`);
  }

  /**
   * Mis compras
   * GET /api/marketplace-transactions/my-purchases
   */
  async getMyPurchases(): Promise<{ transactions: MarketplaceTransaction[]; total: number }> {
    return api.get(`${this.txPath}/my-purchases`);
  }

  /**
   * Estadísticas de transacciones
   * GET /api/marketplace-transactions/stats
   */
  async getTransactionStats(): Promise<MarketplaceStats> {
    return api.get<MarketplaceStats>(`${this.txPath}/stats`);
  }

  /**
   * Detalle de transacción
   * GET /api/marketplace-transactions/:listingId
   */
  async getTransaction(listingId: string): Promise<MarketplaceTransaction> {
    return api.get<MarketplaceTransaction>(`${this.txPath}/${listingId}`);
  }
}

export const marketplaceService = new MarketplaceService();
export default marketplaceService;
