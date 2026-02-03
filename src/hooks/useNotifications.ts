/**
 * useNotifications Hook - Gestión de notificaciones del servidor
 * 
 * Endpoints:
 * - GET /api/notifications
 * - GET /api/notifications/unread/count
 * - PUT /api/notifications/:id/read
 * - PUT /api/notifications/read-all
 * - DELETE /api/notifications/:id
 */

import { useCallback } from 'react';
import { 
  useNotificationsStore, 
  type GameNotification 
} from '../stores/notificationsStore';

const API_BASE = import.meta.env.VITE_API_URL || '';

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
      const response = await fetch(
        `${API_BASE}/api/notifications?${queryParams}`,
        {
          method: 'GET',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
        }
      );
      
      if (!response.ok) {
        throw new Error('Error al obtener notificaciones');
      }
      
      const data = await response.json();
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
      const response = await fetch(
        `${API_BASE}/api/notifications/unread/count`,
        {
          method: 'GET',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
        }
      );
      
      if (!response.ok) {
        throw new Error('Error al obtener contador');
      }
      
      const data = await response.json();
      const count = data.count || 0;
      store.setUnreadCount(count);
      return count;
      
    } catch (err) {
      console.error('Error fetching unread count:', err);
      return store.unreadCount;
    }
  }, [store]);
  
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
      const response = await fetch(
        `${API_BASE}/api/notifications?${queryParams}`,
        {
          method: 'GET',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
        }
      );
      
      if (!response.ok) {
        throw new Error('Error al cargar más notificaciones');
      }
      
      const data = await response.json();
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
      const response = await fetch(
        `${API_BASE}/api/notifications/${id}/read`,
        {
          method: 'PUT',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
        }
      );
      
      if (!response.ok) {
        throw new Error('Error al marcar como leída');
      }
      
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
      const response = await fetch(
        `${API_BASE}/api/notifications/read-all`,
        {
          method: 'PUT',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
        }
      );
      
      if (!response.ok) {
        throw new Error('Error al marcar todas como leídas');
      }
      
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
      const response = await fetch(
        `${API_BASE}/api/notifications/${id}`,
        {
          method: 'DELETE',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
        }
      );
      
      if (!response.ok) {
        throw new Error('Error al eliminar notificación');
      }
      
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
    loadMore,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    addNotificationLocal,
  };
}

export default useNotifications;
