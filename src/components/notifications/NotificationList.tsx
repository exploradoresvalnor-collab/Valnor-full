/**
 * NotificationList - Lista de notificaciones con paginación
 * @module notifications
 */

import { useEffect } from 'react';
import { useNotifications } from '../../hooks/useNotifications';
import { NotificationItem } from './NotificationItem';
import './NotificationList.css';

interface NotificationListProps {
  onClose?: () => void;
}

export function NotificationList({ onClose }: NotificationListProps) {
  const {
    notifications,
    unreadCount,
    hasMore,
    loading,
    fetchNotifications,
    loadMore,
    markAllAsRead,
  } = useNotifications();
  
  // Fetch al montar
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);
  
  const handleMarkAllRead = async () => {
    await markAllAsRead();
  };
  
  return (
    <div className="notification-list">
      {/* Header */}
      <div className="notif-list-header">
        <h3>🔔 Notificaciones</h3>
        {unreadCount > 0 && (
          <button className="mark-all-btn" onClick={handleMarkAllRead}>
            Marcar todas
          </button>
        )}
      </div>
      
      {/* Content */}
      <div className="notif-list-content">
        {loading && notifications.length === 0 ? (
          <div className="notif-loading">
            <div className="loading-spinner" />
            <span>Cargando...</span>
          </div>
        ) : notifications.length === 0 ? (
          <div className="notif-empty">
            <span className="empty-icon">📭</span>
            <p>No tienes notificaciones</p>
          </div>
        ) : (
          <>
            {notifications.map((notif) => (
              <NotificationItem key={notif._id || notif.id} notification={notif} />
            ))}
            
            {hasMore && (
              <button 
                className="load-more-btn" 
                onClick={loadMore}
                disabled={loading}
              >
                {loading ? 'Cargando...' : 'Cargar más'}
              </button>
            )}
          </>
        )}
      </div>
      
      {/* Footer */}
      {onClose && (
        <div className="notif-list-footer">
          <button className="close-notif-btn" onClick={onClose}>
            Cerrar
          </button>
        </div>
      )}
    </div>
  );
}

export default NotificationList;
