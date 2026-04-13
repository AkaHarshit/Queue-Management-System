import { useState, useEffect, useRef } from 'react';
import { api } from '../../services/api';
import { Notification } from '../../types';

interface NotificationPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onCountUpdate: (count: number) => void;
}

export default function NotificationPanel({ isOpen, onClose, onCountUpdate }: NotificationPanelProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const data = await api.getNotifications();
      setNotifications(data);
      const unread = data.filter(n => !n.is_read).length;
      onCountUpdate(unread);
    } catch (e) {
      console.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadNotifications();
    }
  }, [isOpen]);

  // Close panel when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  const handleMarkRead = async (id: number) => {
    try {
      await api.markNotificationRead(id);
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, is_read: true } : n)
      );
      onCountUpdate(notifications.filter(n => !n.is_read && n.id !== id).length);
    } catch (e) {
      console.error('Failed to mark notification as read');
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.markAllNotificationsRead();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      onCountUpdate(0);
    } catch (e) {
      console.error('Failed to mark all as read');
    }
  };

  const getTimeAgo = (dateStr: string): string => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const getNotificationIcon = (type: string): string => {
    switch (type) {
      case 'TOKEN_GENERATED': return '🎟️';
      case 'SERVICE_STARTED': return '▶️';
      case 'SERVICE_COMPLETED': return '✅';
      case 'TOKEN_READY': return '🔔';
      default: return '📢';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="notification-panel" ref={panelRef}>
      <div className="notification-panel-header">
        <h3 className="notification-panel-title">Notifications</h3>
        {notifications.some(n => !n.is_read) && (
          <button
            className="btn btn-secondary btn-sm"
            onClick={handleMarkAllRead}
            style={{ fontSize: '0.7rem', padding: '4px 10px' }}
          >
            Mark all read
          </button>
        )}
      </div>

      <div className="notification-panel-body">
        {loading ? (
          <div className="loading" style={{ padding: '30px' }}>
            <div className="spinner" style={{ width: '24px', height: '24px' }}></div>
          </div>
        ) : notifications.length === 0 ? (
          <div className="notification-empty">
            <span style={{ fontSize: '2rem', opacity: 0.4 }}>🔔</span>
            <p>No notifications yet</p>
          </div>
        ) : (
          notifications.slice(0, 20).map(notification => (
            <div
              key={notification.id}
              className={`notification-item ${!notification.is_read ? 'notification-unread' : ''}`}
              onClick={() => !notification.is_read && handleMarkRead(notification.id)}
            >
              <div className="notification-item-icon">
                {getNotificationIcon(notification.notification_type)}
              </div>
              <div className="notification-item-content">
                <div className="notification-item-title">{notification.title}</div>
                <div className="notification-item-message">{notification.message}</div>
                <div className="notification-item-time">{getTimeAgo(notification.sent_at)}</div>
              </div>
              {!notification.is_read && <div className="notification-item-dot"></div>}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
