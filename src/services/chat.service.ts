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
   * Backend devuelve { success, data: [...] }
   */
  async getMessages(params?: GetMessagesParams): Promise<{ messages: ChatMessage[]; total?: number }> {
    const queryParams: Record<string, string> = {};
    if (params?.type) queryParams.type = params.type;
    if (params?.limit) queryParams.limit = String(params.limit);
    if (params?.before) queryParams.before = params.before;
    const response = await api.get<any>(`${this.basePath}/messages`, queryParams);
    // Backend devuelve { data: [...] }, normalizamos a { messages: [...] }
    const messages = response.data || response.messages || [];
    return { messages, total: response.total };
  }

  /**
   * Enviar mensaje al chat global
   * POST /api/chat/global
   * Backend devuelve { success, data: ChatMessage }
   */
  async sendGlobal(content: string): Promise<{ success: boolean; message: ChatMessage }> {
    const response = await api.post<any>(`${this.basePath}/global`, { content });
    return { success: response.success, message: response.data || response.message };
  }

  /**
   * Enviar mensaje privado
   * POST /api/chat/private
   * Backend devuelve { success, data: ChatMessage }
   */
  async sendPrivate(recipientId: string, content: string): Promise<{ success: boolean; message: ChatMessage }> {
    const response = await api.post<any>(`${this.basePath}/private`, { recipientId, content });
    return { success: response.success, message: response.data || response.message };
  }

  /**
   * Enviar mensaje de party/grupo
   * POST /api/chat/party
   * Backend espera { content, partyId } — partyId es obligatorio
   */
  async sendParty(content: string, partyId?: string): Promise<{ success: boolean; message: ChatMessage }> {
    const response = await api.post<any>(`${this.basePath}/party`, { content, partyId });
    return { success: response.success, message: response.data || response.message };
  }
}

export const chatService = new ChatService();
export default chatService;
