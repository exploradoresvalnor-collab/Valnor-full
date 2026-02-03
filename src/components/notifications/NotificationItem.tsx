/**
 * NotificationItem - Item individual de notificación
 * @module notifications
 */

import { useState } from 'react';
import { useNotifications } from '../../hooks/useNotifications';
import { type GameNotification, type NotificationType } from '../../stores/notificationsStore';
import './NotificationItem.css';

interface NotificationItemProps {
  notification: GameNotification;
}

const NOTIFICATION_ICONS: Record<NotificationType, string> = {
  marketplace_sale: '💰',
  marketplace_purchase: '🛒',
  marketplace_expired: '⏰',
  dungeon_complete: '🏰',
  survival_record: '🏆',
  level_up: '⬆️',
  achievement: '🎖️',
  reward: '🎁',
  system: '📢',
  friend_request: '👤',
  gift: '🎀',
  event: '🎉',
};

const NOTIFICATION_COLORS: Record<NotificationType, string> = {
  marketplace_sale: '#ffd700',
  marketplace_purchase: '#3498db',
  marketplace_expired: '#e74c3c',
  dungeon_complete: '#2ecc71',
  survival_record: '#f39c12',
  level_up: '#9b59b6',
  achievement: '#e67e22',
  reward: '#1abc9c',
  system: '#95a5a6',
  friend_request: '#3498db',
  gift: '#e91e63',
  event: '#ff9800',
};

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffMins < 1) return 'Ahora';
  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays < 7) return `${diffDays}d`;
  return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
}

export function NotificationItem({ notification }: NotificationItemProps) {
  const { markAsRead, deleteNotification } = useNotifications();
  const [isDeleting, setIsDeleting] = useState(false);
  
  const icon = NOTIFICATION_ICONS[notification.type] || '📬';
  const color = NOTIFICATION_COLORS[notification.type] || '#888';
  
  const handleClick = async () => {
    if (!notification.isRead) {
      await markAsRead(notification._id || notification.id || '');
    }
  };
  
  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDeleting(true);
    await deleteNotification(notification._id || notification.id || '');
  };
  
  return (
    <div 
      className={`notification-item ${notification.isRead ? 'read' : 'unread'} ${isDeleting ? 'deleting' : ''}`}
      onClick={handleClick}
      style={{ '--notif-color': color } as React.CSSProperties}
    >
      <div className="notif-icon">
        {icon}
      </div>
      
      <div className="notif-content">
        <span className="notif-title">{notification.title}</span>
        <span className="notif-message">{notification.message}</span>
        <span className="notif-time">{formatTimeAgo(notification.createdAt)}</span>
      </div>
      
      <button 
        className="notif-delete" 
        onClick={handleDelete}
        aria-label="Eliminar"
      >
        ×
      </button>
      
      {!notification.isRead && <div className="unread-dot" />}
    </div>
  );
}

export default NotificationItem;
