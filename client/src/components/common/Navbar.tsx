import { useAuth } from '../../context/AuthContext';
import { useEffect, useState } from 'react';
import { api } from '../../services/api';
import NotificationPanel from './NotificationPanel';

export default function Navbar() {
  const { user, logout } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifOpen, setNotifOpen] = useState(false);

  useEffect(() => {
    api.getUnreadNotifications()
      .then(n => setUnreadCount(n.length))
      .catch(() => {});
    const interval = setInterval(() => {
      api.getUnreadNotifications()
        .then(n => setUnreadCount(n.length))
        .catch(() => {});
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  const getInitials = () => {
    if (!user) return '?';
    return `${(user.first_name || '')[0] || ''}${(user.last_name || '')[0] || ''}`.toUpperCase();
  };

  const getRoleLabel = () => {
    const role = user?.role;
    if (role === 'ADMIN') return 'Admin';
    if (role === 'STAFF') return 'Staff';
    return 'Customer';
  };

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <div className="navbar-brand-icon">Q</div>
        <span>QueueFlow</span>
      </div>
      <div className="navbar-right">
        <div
          className="notification-bell"
          title={`${unreadCount} unread notifications`}
          onClick={() => setNotifOpen(!notifOpen)}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
          </svg>
          {unreadCount > 0 && (
            <span className="notification-badge-count">{unreadCount}</span>
          )}
        </div>

        <NotificationPanel
          isOpen={notifOpen}
          onClose={() => setNotifOpen(false)}
          onCountUpdate={setUnreadCount}
        />

        <div className="navbar-user">
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{getRoleLabel()}</span>
          <span>{user?.first_name} {user?.last_name}</span>
          <div className="navbar-avatar">{getInitials()}</div>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={logout}>
          Logout
        </button>
      </div>
    </nav>
  );
}
