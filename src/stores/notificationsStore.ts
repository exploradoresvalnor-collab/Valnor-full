/**
 * Notifications Store - Sistema de notificaciones del servidor
 * 
 * Endpoints:
 * - GET /api/notifications
 * - GET /api/notifications/unread/count
 * - PUT /api/notifications/:id/read
 * - PUT /api/notifications/read-all
 * - DELETE /api/notifications/:id
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

export type NotificationType = 
  | 'marketplace_sale'      // Tu item se vendió
  | 'marketplace_purchase'  // Compraste un item
  | 'marketplace_expired'   // Tu listado expiró
  | 'dungeon_complete'      // Completaste dungeon
  | 'survival_record'       // Nuevo récord en survival
  | 'level_up'              // Subiste de nivel
  | 'achievement'           // Logro desbloqueado
  | 'reward'                // Recibiste recompensa
  | 'system'                // Mensaje del sistema
  | 'friend_request'        // Solicitud de amistad
  | 'gift'                  // Regalo recibido
  | 'event';                // Evento especial

export interface GameNotification {
  _id: string;
  id?: string; // alias
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  data?: Record<string, unknown>; // Datos adicionales
  createdAt: string;
  expiresAt?: string;
}

interface NotificationsState {
  notifications: GameNotification[];
  unreadCount: number;
  total: number;
  
  // Paginación
  limit: number;
  skip: number;
  hasMore: boolean;
  
  // Estado de carga
  isLoading: boolean;
  error: string | null;
}

interface NotificationsActions {
  // CRUD
  setNotifications: (notifications: GameNotification[], total: number) => void;
  addNotification: (notification: GameNotification) => void;
  removeNotification: (id: string) => void;
  
  // Lectura
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  
  // Contador
  setUnreadCount: (count: number) => void;
  incrementUnread: () => void;
  decrementUnread: () => void;
  
  // Paginación
  setPage: (skip: number) => void;
  appendNotifications: (notifications: GameNotification[]) => void;
  
  // Estado
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  
  // Reset
  clearNotifications: () => void;
}

const initialState: NotificationsState = {
  notifications: [],
  unreadCount: 0,
  total: 0,
  limit: 20,
  skip: 0,
  hasMore: true,
  isLoading: false,
  error: null,
};

export const useNotificationsStore = create<NotificationsState & NotificationsActions>()(
  devtools(
    (set, _get) => ({
      ...initialState,

      setNotifications: (notifications, total) => 
        set({ 
          notifications, 
          total,
          hasMore: notifications.length < total,
        }),

      addNotification: (notification) => 
        set((state) => ({
          notifications: [notification, ...state.notifications],
          total: state.total + 1,
          unreadCount: notification.isRead ? state.unreadCount : state.unreadCount + 1,
        })),

      removeNotification: (id) => 
        set((state) => {
          const notif = state.notifications.find(n => n._id === id || n.id === id);
          return {
            notifications: state.notifications.filter(n => n._id !== id && n.id !== id),
            total: state.total - 1,
            unreadCount: notif && !notif.isRead ? state.unreadCount - 1 : state.unreadCount,
          };
        }),

      markAsRead: (id) => 
        set((state) => {
          const notif = state.notifications.find(n => n._id === id || n.id === id);
          if (notif && !notif.isRead) {
            return {
              notifications: state.notifications.map(n => 
                (n._id === id || n.id === id) ? { ...n, isRead: true } : n
              ),
              unreadCount: Math.max(0, state.unreadCount - 1),
            };
          }
          return state;
        }),

      markAllAsRead: () => 
        set((state) => ({
          notifications: state.notifications.map(n => ({ ...n, isRead: true })),
          unreadCount: 0,
        })),

      setUnreadCount: (unreadCount) => 
        set({ unreadCount }),

      incrementUnread: () => 
        set((state) => ({ unreadCount: state.unreadCount + 1 })),

      decrementUnread: () => 
        set((state) => ({ unreadCount: Math.max(0, state.unreadCount - 1) })),

      setPage: (skip) => 
        set({ skip }),

      appendNotifications: (newNotifications) => 
        set((state) => ({
          notifications: [...state.notifications, ...newNotifications],
          skip: state.skip + newNotifications.length,
          hasMore: state.notifications.length + newNotifications.length < state.total,
        })),

      setLoading: (isLoading) => 
        set({ isLoading }),

      setError: (error) => 
        set({ error }),

      clearNotifications: () => 
        set(initialState),
    }),
    { name: 'NotificationsStore' }
  )
);

// Selectores
export const useUnreadCount = () => useNotificationsStore((s) => s.unreadCount);
export const useNotificationsList = () => useNotificationsStore((s) => s.notifications);
export const useHasUnread = () => useNotificationsStore((s) => s.unreadCount > 0);
