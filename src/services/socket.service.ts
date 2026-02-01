/**
 * Socket Service - WebSocket para tiempo real
 */

import { API_CONFIG } from '../config/api.config';

type EventCallback = (data: unknown) => void;

interface SocketMessage {
  event: string;
  data: unknown;
}

class SocketService {
  private socket: WebSocket | null = null;
  private listeners: Map<string, Set<EventCallback>> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private isConnecting = false;
  private messageQueue: SocketMessage[] = [];

  /**
   * Conectar al servidor WebSocket
   */
  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.socket?.readyState === WebSocket.OPEN) {
        resolve();
        return;
      }

      if (this.isConnecting) {
        // Esperar a que se conecte
        const checkConnection = setInterval(() => {
          if (this.socket?.readyState === WebSocket.OPEN) {
            clearInterval(checkConnection);
            resolve();
          }
        }, 100);
        return;
      }

      this.isConnecting = true;

      try {
        const wsUrl = API_CONFIG.baseUrl.replace('http', 'ws') + '/ws';
        this.socket = new WebSocket(wsUrl);

        this.socket.onopen = () => {
          console.log('[Socket] Connected');
          this.isConnecting = false;
          this.reconnectAttempts = 0;
          
          // Enviar mensajes en cola
          this.flushMessageQueue();
          
          // Autenticar si hay token
          const token = localStorage.getItem('token');
          if (token) {
            this.emit('authenticate', { token });
          }
          
          resolve();
        };

        this.socket.onmessage = (event) => {
          try {
            const message: SocketMessage = JSON.parse(event.data);
            this.handleMessage(message);
          } catch (error) {
            console.error('[Socket] Error parsing message:', error);
          }
        };

        this.socket.onclose = (event) => {
          console.log('[Socket] Disconnected:', event.code, event.reason);
          this.isConnecting = false;
          this.handleDisconnect();
        };

        this.socket.onerror = (error) => {
          console.error('[Socket] Error:', error);
          this.isConnecting = false;
          reject(error);
        };

      } catch (error) {
        this.isConnecting = false;
        reject(error);
      }
    });
  }

  /**
   * Desconectar del servidor
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.close(1000, 'Client disconnect');
      this.socket = null;
    }
    this.listeners.clear();
    this.messageQueue = [];
  }

  /**
   * Emitir evento al servidor
   */
  emit(event: string, data?: unknown): void {
    const message: SocketMessage = { event, data };

    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(message));
    } else {
      // Encolar mensaje para enviar después
      this.messageQueue.push(message);
      
      // Intentar reconectar
      if (!this.isConnecting) {
        this.connect().catch(console.error);
      }
    }
  }

  /**
   * Suscribirse a un evento
   */
  on(event: string, callback: EventCallback): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);

    // Retornar función para desuscribirse
    return () => {
      this.off(event, callback);
    };
  }

  /**
   * Desuscribirse de un evento
   */
  off(event: string, callback: EventCallback): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.delete(callback);
      if (callbacks.size === 0) {
        this.listeners.delete(event);
      }
    }
  }

  /**
   * Suscribirse a un evento una sola vez
   */
  once(event: string, callback: EventCallback): void {
    const wrapper: EventCallback = (data) => {
      this.off(event, wrapper);
      callback(data);
    };
    this.on(event, wrapper);
  }

  /**
   * Verificar si está conectado
   */
  isConnected(): boolean {
    return this.socket?.readyState === WebSocket.OPEN;
  }

  /**
   * Manejar mensaje recibido
   */
  private handleMessage(message: SocketMessage): void {
    const callbacks = this.listeners.get(message.event);
    if (callbacks) {
      callbacks.forEach((callback) => {
        try {
          callback(message.data);
        } catch (error) {
          console.error(`[Socket] Error in listener for "${message.event}":`, error);
        }
      });
    }
  }

  /**
   * Manejar desconexión
   */
  private handleDisconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts);
      console.log(`[Socket] Reconnecting in ${delay}ms... (attempt ${this.reconnectAttempts + 1})`);
      
      setTimeout(() => {
        this.reconnectAttempts++;
        this.connect().catch(console.error);
      }, delay);
    } else {
      console.error('[Socket] Max reconnect attempts reached');
      this.listeners.get('connection_failed')?.forEach(cb => cb(null));
    }
  }

  /**
   * Enviar mensajes en cola
   */
  private flushMessageQueue(): void {
    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift()!;
      if (this.socket?.readyState === WebSocket.OPEN) {
        this.socket.send(JSON.stringify(message));
      }
    }
  }

  // =====================================
  // MÉTODOS DE CONVENIENCIA
  // =====================================

  /**
   * Unirse a una sala (para chat, party, etc.)
   */
  joinRoom(roomId: string): void {
    this.emit('join_room', { roomId });
  }

  /**
   * Salir de una sala
   */
  leaveRoom(roomId: string): void {
    this.emit('leave_room', { roomId });
  }

  /**
   * Enviar mensaje de chat
   */
  sendChatMessage(roomId: string, message: string): void {
    this.emit('chat_message', { roomId, message });
  }

  /**
   * Notificar posición del jugador (para multijugador)
   */
  sendPlayerPosition(position: { x: number; y: number; z: number }, rotation: { y: number }): void {
    this.emit('player_position', { position, rotation });
  }

  /**
   * Notificar acción de combate
   */
  sendCombatAction(action: unknown): void {
    this.emit('combat_action', action);
  }
}

export const socketService = new SocketService();
