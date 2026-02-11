/**
 * Socket Service - Socket.IO para tiempo real
 * Alineado con el backend RealtimeService (Socket.IO ^4.8.1)
 */

import { io, Socket } from 'socket.io-client';
import { API_CONFIG } from '../config/api.config';
import { STORAGE_KEYS } from '../utils/constants';

// Tipos de eventos del servidor (alineados con RealtimeService del backend)
export interface SocketEvents {
  // Auth
  'auth:success': () => void;
  'auth:error': (data: { message: string }) => void;

  // Inventario
  'inventory:update': (inventory: unknown) => void;
  'reward:received': (reward: unknown) => void;

  // Personaje
  'character:update': (data: { characterId: string; [key: string]: unknown }) => void;
  'character:level-up': (data: {
    characterId: string;
    level: number;
    levelsGained: number;
    statsDelta: { atk?: number; defensa?: number; vida?: number };
    timestamp: string;
  }) => void;
  'character:evolved': (data: {
    characterId: string;
    etapa: number;
    timestamp: string;
  }) => void;

  // Marketplace
  'marketplace:update': (data: { type: 'new' | 'sold' | 'cancelled' | 'refresh'; data: unknown }) => void;
  'marketplace:item:listed': (data: { listing: unknown; timestamp: string }) => void;
  'marketplace:item:sold': (data: { listingId: string; buyerId: string; priceVal: number; timestamp: string }) => void;
  'marketplace:item:cancelled': (data: { listingId: string; reason?: string; timestamp: string }) => void;

  // Survival
  'survival:wave:new': (data: { sessionId: string; waveNumber: number; enemiesRemaining: number; timestamp: string }) => void;
  'survival:end': (data: { sessionId: string; totalWaves: number; durationMs: number; rewards: unknown; timestamp: string }) => void;

  // Chat
  'chat:message:new': (data: {
    id?: string;
    senderId: string;
    senderName?: string;
    content: string;
    type: 'global' | 'party' | 'private';
    createdAt: string;
  }) => void;

  // Notificaciones
  'notification:new': (data: { notification: unknown; timestamp: string }) => void;
  'notification:read': (data: { notificationId: string; timestamp: string }) => void;

  // Pagos
  'payments:status': (data: {
    id?: string;
    provider: 'stripe' | 'blockchain' | 'manual';
    state: 'initiated' | 'pending' | 'confirmed' | 'failed' | 'refunded';
    meta?: unknown;
    timestamp: string;
  }) => void;

  // Eventos globales
  'game:event': (eventData: unknown) => void;
  'rankings:update': (rankings: unknown) => void;
  'battle:update': (battleState: unknown) => void;
}

type EventName = keyof SocketEvents;
type EventCallback = (...args: unknown[]) => void;

class SocketService {
  private socket: Socket | null = null;
  private listeners: Map<string, Set<EventCallback>> = new Map();

  /**
   * Conectar al servidor Socket.IO
   */
  connect(): void {
    if (this.socket?.connected) return;

    const baseUrl = API_CONFIG.baseUrl;

    this.socket = io(baseUrl, {
      transports: ['websocket'],
      withCredentials: true,
      autoConnect: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    });

    this.socket.on('connect', () => {
      console.log('[Socket.IO] Conectado - ID:', this.socket?.id);

      // Autenticar con token JWT
      const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
      if (token) {
        this.socket?.emit('auth', token);
      }

      // Re-registrar listeners existentes
      this.reattachListeners();
    });

    this.socket.on('auth:success', () => {
      console.log('[Socket.IO] Autenticación exitosa');
    });

    this.socket.on('auth:error', (data: { message: string }) => {
      console.error('[Socket.IO] Error de autenticación:', data.message);
    });

    this.socket.on('connect_error', (err) => {
      console.error('[Socket.IO] Error de conexión:', err.message);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('[Socket.IO] Desconectado - Razón:', reason);
    });
  }

  /**
   * Desconectar del servidor
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.listeners.clear();
  }

  /**
   * Emitir evento al servidor
   */
  emit(event: string, data?: unknown): void {
    if (this.socket?.connected) {
      this.socket.emit(event, data);
    } else {
      console.warn(`[Socket.IO] No conectado, no se puede emitir "${event}"`);
    }
  }

  /**
   * Suscribirse a un evento del servidor
   */
  on<E extends EventName>(event: E, callback: SocketEvents[E]): () => void {
    // Guardar en nuestro registro para re-attach
    const key = event as string;
    if (!this.listeners.has(key)) {
      this.listeners.set(key, new Set());
    }
    this.listeners.get(key)!.add(callback as EventCallback);

    // Registrar en socket.io
    this.socket?.on(key, callback as EventCallback);

    // Retornar función para desuscribirse
    return () => this.off(event, callback);
  }

  /**
   * Desuscribirse de un evento
   */
  off<E extends EventName>(event: E, callback: SocketEvents[E]): void {
    const key = event as string;
    const callbacks = this.listeners.get(key);
    if (callbacks) {
      callbacks.delete(callback as EventCallback);
      if (callbacks.size === 0) {
        this.listeners.delete(key);
      }
    }
    this.socket?.off(key, callback as EventCallback);
  }

  /**
   * Verificar si está conectado
   */
  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  /**
   * Re-registrar listeners después de reconexión
   */
  private reattachListeners(): void {
    this.listeners.forEach((callbacks, event) => {
      callbacks.forEach((cb) => {
        this.socket?.on(event, cb);
      });
    });
  }

  // =====================================
  // MÉTODOS DE CONVENIENCIA
  // =====================================
  // NOTA: El backend RealtimeService SOLO escucha 'auth' y 'disconnect'.
  // Todas las acciones de juego (chat, combate, etc.) se hacen vía REST API.
  // Los sockets son solo para recibir notificaciones push del servidor.
  // No emitir eventos custom porque el backend no los maneja.

  // =====================================
  // LISTENERS TIPADOS DE CONVENIENCIA
  // =====================================

  /** Escuchar actualizaciones del marketplace */
  onMarketplaceUpdate(cb: SocketEvents['marketplace:update']): () => void {
    return this.on('marketplace:update', cb);
  }

  /** Escuchar eventos globales del juego */
  onGameEvent(cb: SocketEvents['game:event']): () => void {
    return this.on('game:event', cb);
  }

  /** Escuchar actualizaciones de rankings */
  onRankingsUpdate(cb: SocketEvents['rankings:update']): () => void {
    return this.on('rankings:update', cb);
  }

  /** Escuchar nuevas notificaciones */
  onNotification(cb: SocketEvents['notification:new']): () => void {
    return this.on('notification:new', cb);
  }

  /** Escuchar actualizaciones de inventario */
  onInventoryUpdate(cb: SocketEvents['inventory:update']): () => void {
    return this.on('inventory:update', cb);
  }

  /** Escuchar subida de nivel de personaje */
  onCharacterLevelUp(cb: SocketEvents['character:level-up']): () => void {
    return this.on('character:level-up', cb);
  }

  /** Escuchar oleadas de survival */
  onSurvivalWave(cb: SocketEvents['survival:wave:new']): () => void {
    return this.on('survival:wave:new', cb);
  }
}

export const socketService = new SocketService();
