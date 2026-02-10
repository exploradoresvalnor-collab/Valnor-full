/**
 * useNotifications Hook - Gestión de notificaciones del servidor
 * 
 * Endpoints:
 * - GET /api/notifications
 * - GET /api/notifications/unread/count
 * - GET /api/notifications/:id
 * - PUT /api/notifications/:id/read
 * - PUT /api/notifications/read-all
 * - DELETE /api/notifications/:id
 */

import { useCallback } from 'react';
import { 
  useNotificationsStore, 
  type GameNotification 
} from '../stores/notificationsStore';
import api from '../services/api.service';

interface FetchNotificationsParams {
  limit?: number;
  skip?: number;
  unreadOnly?: boolean;
}

interface UseNotificationsReturn {
  // Estado
  notifications: GameNotification[];
  unreadCount: number;
  total: number;
  hasMore: boolean;
  loading: boolean;
  error: string | null;
  
  // Fetch
  fetchNotifications: (params?: FetchNotificationsParams) => Promise<void>;
  fetchUnreadCount: () => Promise<number>;
  fetchNotification: (id: string) => Promise<GameNotification | null>;
  loadMore: () => Promise<void>;
  
  // Acciones
  markAsRead: (id: string) => Promise<boolean>;
  markAllAsRead: () => Promise<boolean>;
  deleteNotification: (id: string) => Promise<boolean>;
  
  // Local (para WebSocket)
  addNotificationLocal: (notification: GameNotification) => void;
}

export function useNotifications(): UseNotificationsReturn {
  const store = useNotificationsStore();
  
  /**
   * GET /api/notifications
   */
  const fetchNotifications = useCallback(async (params: FetchNotificationsParams = {}) => {
    store.setLoading(true);
    store.setError(null);
    
    const { limit = 20, skip = 0, unreadOnly = false } = params;
    const queryParams = new URLSearchParams({
      limit: String(limit),
      skip: String(skip),
      unreadOnly: String(unreadOnly),
    });
    
    try {
      const data = await api.get<{ notifications: GameNotification[]; total: number }>(
        '/api/notifications',
        {
          limit: String(limit),
          skip: String(skip),
          unreadOnly: String(unreadOnly),
        }
      );
      store.setNotifications(data.notifications || [], data.total || 0);
      store.setPage(skip);
      
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      store.setError(message);
      console.error('Error fetching notifications:', err);
    } finally {
      store.setLoading(false);
    }
  }, [store]);
  
  /**
   * GET /api/notifications/unread/count
   */
  const fetchUnreadCount = useCallback(async (): Promise<number> => {
    try {
      const data = await api.get<{ count: number }>('/api/notifications/unread/count');
      const count = data.count || 0;
      store.setUnreadCount(count);
      return count;
      
    } catch (err) {
      console.error('Error fetching unread count:', err);
      return store.unreadCount;
    }
  }, [store]);
  
  /**
   * GET /api/notifications/:id
   */
  const fetchNotification = useCallback(async (id: string): Promise<GameNotification | null> => {
    try {
      const data = await api.get<{ notification: GameNotification }>(
        `/api/notifications/${id}`
      );
      return data.notification || null;
    } catch (err) {
      console.error('Error fetching notification:', err);
      return null;
    }
  }, []);

  /**
   * Cargar más notificaciones (paginación)
   */
  const loadMore = useCallback(async () => {
    if (!store.hasMore || store.isLoading) return;
    
    store.setLoading(true);
    
    const newSkip = store.skip + store.limit;
    const queryParams = new URLSearchParams({
      limit: String(store.limit),
      skip: String(newSkip),
    });
    
    try {
      const data = await api.get<{ notifications: GameNotification[] }>(
        '/api/notifications',
        {
          limit: String(store.limit),
          skip: String(newSkip),
        }
      );
      store.appendNotifications(data.notifications || []);
      
    } catch (err) {
      console.error('Error loading more notifications:', err);
    } finally {
      store.setLoading(false);
    }
  }, [store]);
  
  /**
   * PUT /api/notifications/:id/read
   */
  const markAsRead = useCallback(async (id: string): Promise<boolean> => {
    try {
      await api.put(`/api/notifications/${id}/read`, {});
      store.markAsRead(id);
      return true;
      
    } catch (err) {
      console.error('Error marking notification as read:', err);
      return false;
    }
  }, [store]);
  
  /**
   * PUT /api/notifications/read-all
   */
  const markAllAsRead = useCallback(async (): Promise<boolean> => {
    try {
      await api.put('/api/notifications/read-all', {});
      store.markAllAsRead();
      return true;
      
    } catch (err) {
      console.error('Error marking all as read:', err);
      return false;
    }
  }, [store]);
  
  /**
   * DELETE /api/notifications/:id
   */
  const deleteNotification = useCallback(async (id: string): Promise<boolean> => {
    try {
      await api.delete(`/api/notifications/${id}`);
      store.removeNotification(id);
      return true;
      
    } catch (err) {
      console.error('Error deleting notification:', err);
      return false;
    }
  }, [store]);
  
  /**
   * Agregar notificación localmente (para WebSocket)
   */
  const addNotificationLocal = useCallback((notification: GameNotification) => {
    store.addNotification(notification);
  }, [store]);
  
  return {
    notifications: store.notifications,
    unreadCount: store.unreadCount,
    total: store.total,
    hasMore: store.hasMore,
    loading: store.isLoading,
    error: store.error,
    fetchNotifications,
    fetchUnreadCount,
    fetchNotification,
    loadMore,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    addNotificationLocal,
  };
}

export default useNotifications;
