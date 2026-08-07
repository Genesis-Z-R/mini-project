import { useState, useRef, useEffect } from 'react';
import { Bell, Check, Trash, GraduationCap, Users, BookOpen, Calendar, Checks } from '@phosphor-icons/react';

export function NotificationBell({ 
  notifications = [], 
  onMarkAsRead, 
  onMarkAllAsRead, 
  onDelete,
  onNavigate 
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getIcon = (type) => {
    switch (type) {
      case 'FRIEND_REQUEST_RECEIVED':
      case 'FRIEND_REQUEST_ACCEPTED':
        return <Users size={16} style={{ color: 'var(--accent)' }} />;
      case 'FRIEND_RESOURCE_UPLOAD':
      case 'FRIEND_COURSE_RESOURCE_UPLOAD':
        return <BookOpen size={16} style={{ color: 'var(--accent-secondary)' }} />;
      case 'CLASS_REMINDER':
      case 'STUDY_SESSION_REMINDER':
      case 'EVENT_REMINDER':
      case 'DAILY_DIGEST':
        return <Calendar size={16} style={{ color: '#F59E0B' }} />;
      default:
        return <Bell size={16} style={{ color: 'var(--accent)' }} />;
    }
  };

  const handleNotificationClick = (n) => {
    if (!n.isRead && onMarkAsRead) {
      onMarkAsRead(n.id);
    }
    if (n.link && onNavigate) {
      onNavigate(n.link);
      setIsOpen(false);
    }
  };

  return (
    <div style={{ position: 'relative' }} ref={dropdownRef}>
      {/* Bell Icon Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Notifications"
        style={{
          position: 'relative',
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-color)',
          borderRadius: '10px',
          width: '38px',
          height: '38px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          color: 'var(--text-primary)',
          transition: 'all 0.2s ease',
          boxShadow: 'var(--shadow-out)'
        }}
      >
        <Bell size={18} weight={unreadCount > 0 ? 'fill' : 'regular'} />
        {unreadCount > 0 && (
          <span
            style={{
              position: 'absolute',
              top: '-4px',
              right: '-4px',
              background: '#EF4444',
              color: '#ffffff',
              fontSize: '10px',
              fontWeight: '800',
              borderRadius: '10px',
              minWidth: '18px',
              height: '18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0 4px',
              border: '2px solid var(--bg-surface)'
            }}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notifications Popover Dropdown */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            right: 0,
            top: '46px',
            width: '340px',
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-color)',
            borderRadius: '14px',
            boxShadow: '0 16px 40px rgba(0,0,0,0.25)',
            zIndex: 9999,
            overflow: 'hidden'
          }}
        >
          {/* Dropdown Header */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '14px 18px',
              borderBottom: '1px solid var(--border-color)',
              background: 'var(--bg-navigation)'
            }}
          >
            <div style={{ fontSize: '13.5px', fontWeight: '800', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>Notifications</span>
              {unreadCount > 0 && (
                <span style={{ fontSize: '10px', background: 'var(--accent)', color: 'white', borderRadius: '8px', padding: '2px 6px' }}>
                  {unreadCount} new
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={onMarkAllAsRead}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--accent)',
                  fontSize: '11px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <Checks size={14} />
                <span>Mark All Read</span>
              </button>
            )}
          </div>

          {/* Notification List */}
          <div style={{ maxHeight: '360px', overflowY: 'auto' }}>
            {notifications.length > 0 ? (
              notifications.map(n => (
                <div
                  key={n.id}
                  onClick={() => handleNotificationClick(n)}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '12px',
                    padding: '12px 16px',
                    borderBottom: '1px solid var(--border-color)',
                    background: n.isRead ? 'transparent' : 'rgba(59, 130, 246, 0.06)',
                    cursor: 'pointer',
                    transition: 'background 0.2s ease'
                  }}
                >
                  <div style={{ marginTop: '2px', flexShrink: 0 }}>
                    {getIcon(n.type)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                      <strong style={{ fontSize: '12.5px', color: 'var(--text-primary)', fontWeight: n.isRead ? '600' : '800', display: 'flex', alignItems: 'center' }}>
                        <span>{n.title}</span>
                        {n.priority === 'HIGH' && (
                          <span style={{ fontSize: '9px', fontWeight: '800', background: 'rgba(239, 68, 68, 0.15)', color: '#EF4444', borderRadius: '4px', padding: '1px 5px', marginLeft: '6px' }}>
                            HIGH
                          </span>
                        )}
                      </strong>
                      {!n.isRead && (
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#EF4444', flexShrink: 0 }} />
                      )}
                    </div>
                    <p style={{ fontSize: '11.5px', color: 'var(--text-secondary)', margin: 0, lineHeight: '1.4', whiteSpace: 'pre-line' }}>
                      {n.message}
                    </p>
                    <span style={{ fontSize: '9.5px', color: 'var(--text-tertiary)', marginTop: '4px', display: 'block' }}>
                      {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div style={{ textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '12px', padding: '36px 16px' }}>
                No notifications right now.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default NotificationBell;
