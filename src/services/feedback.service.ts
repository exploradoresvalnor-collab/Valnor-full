/**
 * Feedback Service - Envío de feedback/sugerencias
 * 
 * Endpoints del backend:
 * - POST /api/feedback   (enviar feedback, body: { message, category? })
 * - GET  /api/feedback    (listar últimos 50 feedbacks)
 * 
 * Nota: El backend almacena feedback en memoria (sin persistir en DB).
 */

import api from './api.service';

// ============================================================
// TIPOS
// ============================================================

export interface FeedbackEntry {
  id?: string;
  userId?: string;
  username?: string;
  message: string;
  category?: string;
  createdAt?: string;
}

export interface SubmitFeedbackDTO {
  message: string;
  category?: string;
}

// ============================================================
// SERVICIO
// ============================================================

class FeedbackService {
  private basePath = '/api/feedback';

  /**
   * Enviar feedback
   * POST /api/feedback
   */
  async submit(data: SubmitFeedbackDTO): Promise<{ success: boolean; message?: string }> {
    return api.post(this.basePath, data);
  }

  /**
   * Listar últimos 50 feedbacks
   * GET /api/feedback
   */
  async list(): Promise<{ feedbacks: FeedbackEntry[] }> {
    return api.get(this.basePath);
  }
}

export const feedbackService = new FeedbackService();
export default feedbackService;
