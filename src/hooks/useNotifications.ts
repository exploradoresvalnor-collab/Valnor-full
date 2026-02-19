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
  // Valores (selectores individuales — evita recrear callbacks por cambios de estado)
  const notifications = useNotificationsStore((s) => s.notifications);
  const unreadCount = useNotificationsStore((s) => s.unreadCount);
  const total = useNotificationsStore((s) => s.total);
  const hasMore = useNotificationsStore((s) => s.hasMore);
  const loading = useNotificationsStore((s) => s.isLoading);
  const error = useNotificationsStore((s) => s.error);

  // Acciones (selectores de setters — son referencias estables)
  const setNotifications = useNotificationsStore((s) => s.setNotifications);
  const setUnreadCount = useNotificationsStore((s) => s.setUnreadCount);
  const appendNotifications = useNotificationsStore((s) => s.appendNotifications);
  const setLoading = useNotificationsStore((s) => s.setLoading);
  const setError = useNotificationsStore((s) => s.setError);
  const addNotification = useNotificationsStore((s) => s.addNotification);
  const removeNotification = useNotificationsStore((s) => s.removeNotification);
  const markAsReadStore = useNotificationsStore((s) => s.markAsRead);
  const markAllAsReadStore = useNotificationsStore((s) => s.markAllAsRead);
  const getSkip = () => useNotificationsStore.getState().skip;
  const getLimit = () => useNotificationsStore.getState().limit;
  const getHasMore = () => useNotificationsStore.getState().hasMore;
  const getIsLoading = () => useNotificationsStore.getState().isLoading;

  /**
   * GET /api/notifications
   */
  const fetchNotifications = useCallback(async (params: FetchNotificationsParams = {}) => {
    setLoading(true);
    setError(null);

    const { limit = 20, skip = 0, unreadOnly = false } = params;

    try {
      const data = await api.get<{ notifications: GameNotification[]; total: number }>(
        '/api/notifications',
        {
          limit: String(limit),
          skip: String(skip),
          unreadOnly: String(unreadOnly),
        }
      );
      setNotifications(data.notifications || [], data.total || 0);
      useNotificationsStore.getState().setPage(skip);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      setError(message);
      console.error('Error fetching notifications:', err);
    } finally {
      setLoading(false);
    }
  }, [setNotifications, setLoading, setError]);

  /**
   * GET /api/notifications/unread/count
   * (callback estable — no depende del objeto-estado entero)
   */
  const fetchUnreadCount = useCallback(async (): Promise<number> => {
    try {
      const data = await api.get<{ count: number }>('/api/notifications/unread/count');
      const count = data.count || 0;
      setUnreadCount(count);
      return count;
    } catch (err) {
      console.error('Error fetching unread count:', err);
      // No dependemos de `unreadCount` en el callback para evitar recreaciones
      return useNotificationsStore.getState().unreadCount;
    }
  }, [setUnreadCount]);

  /**
   * GET /api/notifications/:id
   */
  const fetchNotification = useCallback(async (id: string): Promise<GameNotification | null> => {
    try {
      const data = await api.get<{ notification: GameNotification }>(`/api/notifications/${id}`);
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
    if (!getHasMore() || getIsLoading()) return;
    setLoading(true);

    const newSkip = getSkip() + getLimit();
    try {
      const data = await api.get<{ notifications: GameNotification[] }>(
        '/api/notifications',
        {
          limit: String(getLimit()),
          skip: String(newSkip),
        }
      );
      appendNotifications(data.notifications || []);
    } catch (err) {
      console.error('Error loading more notifications:', err);
    } finally {
      setLoading(false);
    }
  }, [appendNotifications, setLoading]);

  /**
   * PUT /api/notifications/:id/read
   */
  const markAsRead = useCallback(async (id: string): Promise<boolean> => {
    try {
      await api.put(`/api/notifications/${id}/read`, {});
      markAsReadStore(id);
      return true;
    } catch (err) {
      console.error('Error marking notification as read:', err);
      return false;
    }
  }, [markAsReadStore]);

  /**
   * PUT /api/notifications/read-all
   */
  const markAllAsRead = useCallback(async (): Promise<boolean> => {
    try {
      await api.put('/api/notifications/read-all', {});
      markAllAsReadStore();
      return true;
    } catch (err) {
      console.error('Error marking all as read:', err);
      return false;
    }
  }, [markAllAsReadStore]);

  /**
   * DELETE /api/notifications/:id
   */
  const deleteNotification = useCallback(async (id: string): Promise<boolean> => {
    try {
      await api.delete(`/api/notifications/${id}`);
      removeNotification(id);
      return true;
    } catch (err) {
      console.error('Error deleting notification:', err);
      return false;
    }
  }, [removeNotification]);

  /**
   * Agregar notificación localmente (para WebSocket)
   */
  const addNotificationLocal = useCallback((notification: GameNotification) => {
    addNotification(notification);
  }, [addNotification]);

  return {
    notifications,
    unreadCount,
    total,
    hasMore,
    loading,
    error,
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
