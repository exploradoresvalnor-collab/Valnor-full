/**
 * Payment Service - Pagos y transacciones monetarias
 * 
 * Endpoints documentados:
 * - POST /api/payments/checkout              (iniciar checkout Stripe)
 * - POST /api/payments/blockchain/initiate   (iniciar pago blockchain)
 * - POST /api/payments/wallet/connect        (conectar wallet)
 * - GET  /api/payments/history               (historial de pagos)
 * 
 * Nota: POST /payments/webhook es solo para Stripe, no se llama desde frontend.
 */

import api from './api.service';

// ============================================================
// TIPOS
// ============================================================

export interface CheckoutDTO {
  packageId: string;
  quantity?: number;
  currency?: string;
}

export interface CheckoutResponse {
  success: boolean;
  sessionId: string;         // Stripe session ID
  checkoutUrl: string;       // URL para redirigir al usuario
}

export interface BlockchainPaymentDTO {
  packageId: string;
  walletAddress: string;
  network?: string;
}

export interface BlockchainPaymentResponse {
  success: boolean;
  transactionId: string;
  contractAddress: string;
  amount: string;
  network: string;
  status: 'initiated' | 'pending';
}

export interface WalletConnectResponse {
  success: boolean;
  walletAddress: string;
  network: string;
  message: string;
}

export interface PaymentRecord {
  _id: string;
  userId: string;
  amount: number;
  currency: string;
  provider: 'stripe' | 'blockchain' | 'manual';
  status: 'initiated' | 'pending' | 'confirmed' | 'failed' | 'refunded';
  packageId?: string;
  stripeSessionId?: string;
  txHash?: string;
  createdAt: string;
  confirmedAt?: string;
}

// ============================================================
// SERVICIO
// ============================================================

class PaymentService {
  private basePath = '/api/payments';

  /**
   * Iniciar checkout con Stripe
   * POST /api/payments/checkout
   */
  async checkout(data: CheckoutDTO): Promise<CheckoutResponse> {
    return api.post<CheckoutResponse>(`${this.basePath}/checkout`, data);
  }

  /**
   * Iniciar pago blockchain
   * POST /api/payments/blockchain/initiate
   */
  async initiateBlockchain(data: BlockchainPaymentDTO): Promise<BlockchainPaymentResponse> {
    return api.post<BlockchainPaymentResponse>(`${this.basePath}/blockchain/initiate`, data);
  }

  /**
   * Conectar wallet
   * POST /api/payments/wallet/connect
   */
  async connectWallet(walletAddress: string, network: string = 'ethereum'): Promise<WalletConnectResponse> {
    return api.post<WalletConnectResponse>(`${this.basePath}/wallet/connect`, {
      walletAddress,
      network,
    });
  }

  /**
   * Obtener historial de pagos
   * GET /api/payments/history
   */
  async getHistory(params?: { page?: number; limit?: number }): Promise<{
    payments: PaymentRecord[];
    total: number;
  }> {
    const queryParams: Record<string, string> = {};
    if (params?.page) queryParams.page = String(params.page);
    if (params?.limit) queryParams.limit = String(params.limit);
    return api.get(`${this.basePath}/history`, queryParams);
  }
}

export const paymentService = new PaymentService();
export default paymentService;
