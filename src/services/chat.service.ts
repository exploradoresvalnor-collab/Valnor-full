/**
 * Chat Service - Mensajería en tiempo real (REST + WebSocket)
 * 
 * Endpoints del backend:
 * - GET  /api/chat/messages   (obtener historial de mensajes)
 * - POST /api/chat/global     (enviar mensaje global)
 * - POST /api/chat/private    (enviar mensaje privado)
 * - POST /api/chat/party      (enviar mensaje de party/grupo)
 * 
 * WebSocket events (complementarios):
 * - 'chat:message:new' → recibir mensajes en tiempo real
 */

import api from './api.service';

// ============================================================
// TIPOS
// ============================================================

export interface ChatMessage {
  _id?: string;
  id?: string;
  senderId: string;
  senderName?: string;
  content: string;
  type: 'global' | 'party' | 'private';
  recipientId?: string;
  createdAt: string;
}

export interface GetMessagesParams {
  type?: 'global' | 'party' | 'private';
  limit?: number;
  before?: string; // cursor/timestamp para paginación
}

export interface SendMessageDTO {
  content: string;
}

export interface SendPrivateMessageDTO {
  content: string;
  recipientId: string;
}

// ============================================================
// SERVICIO
// ============================================================

class ChatService {
  private basePath = '/api/chat';

  /**
   * Obtener historial de mensajes
   * GET /api/chat/messages
   */
  async getMessages(params?: GetMessagesParams): Promise<{ messages: ChatMessage[]; total?: number }> {
    const queryParams: Record<string, string> = {};
    if (params?.type) queryParams.type = params.type;
    if (params?.limit) queryParams.limit = String(params.limit);
    if (params?.before) queryParams.before = params.before;
    return api.get(`${this.basePath}/messages`, queryParams);
  }

  /**
   * Enviar mensaje al chat global
   * POST /api/chat/global
   */
  async sendGlobal(content: string): Promise<{ success: boolean; message: ChatMessage }> {
    return api.post(`${this.basePath}/global`, { content });
  }

  /**
   * Enviar mensaje privado
   * POST /api/chat/private
   */
  async sendPrivate(recipientId: string, content: string): Promise<{ success: boolean; message: ChatMessage }> {
    return api.post(`${this.basePath}/private`, { recipientId, content });
  }

  /**
   * Enviar mensaje de party/grupo
   * POST /api/chat/party
   */
  async sendParty(content: string): Promise<{ success: boolean; message: ChatMessage }> {
    return api.post(`${this.basePath}/party`, { content });
  }
}

export const chatService = new ChatService();
export default chatService;
