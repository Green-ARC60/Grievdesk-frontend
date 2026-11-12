import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Bell,
  CheckCheck,
  Megaphone,
  CreditCard,
  Shield,
  Clock,
} from 'lucide-react';
import { NotificationItem } from '../../types/announcements';
import {
  getMyNotificationsApi,
  markNotificationReadApi,
  markAllNotificationsReadApi,
} from '../../api/notifications';

export const NotificationBell: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await getMyNotificationsApi(20, 0);
      setNotifications(res.notifications || []);
      setUnreadCount(res.unread_count || 0);
    } catch {
      // silently ignore if unauthenticated or offline
    }
  }, []);

  // Poll notifications periodically
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 25000); // 25s polling
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleToggle = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      fetchNotifications();
    }
  };

  const handleMarkRead = async (id: number) => {
    try {
      await markNotificationReadApi(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch {
      // ignore
    }
  };

  const handleMarkAllRead = async () => {
    setIsLoading(true);
    try {
      await markAllNotificationsReadApi();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'announcement':
        return <Megaphone className="w-3.5 h-3.5 text-accent" />;
      case 'due_reminder':
      case 'due_update':
        return <CreditCard className="w-3.5 h-3.5 text-status-inprogress-text" />;
      case 'role_change':
        return <Shield className="w-3.5 h-3.5 text-status-new-text" />;
      default:
        return <Bell className="w-3.5 h-3.5 text-muted" />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        type="button"
        onClick={handleToggle}
        className="relative p-2 rounded-control text-muted hover:text-text hover:bg-surface-2 transition-colors duration-200 ease-calm focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
        aria-label="View notifications"
      >
        <Bell className="w-5 h-5" />

        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex items-center justify-center min-w-[16px] h-[16px] px-1 text-[9px] font-mono font-bold text-highlight-text bg-highlight rounded-full">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Popover */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-surface rounded-card shadow-soft border-[1.5px] border-border z-50 overflow-hidden animate-fadeIn">
          {/* Header */}
          <div className="p-3 px-4 border-b border-border bg-surface-2/60 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-text">Notifications</span>
              {unreadCount > 0 && (
                <span className="text-[10px] font-mono font-bold bg-highlight text-highlight-text px-1.5 py-0.2 rounded-full">
                  {unreadCount} unread
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                disabled={isLoading}
                className="text-xs font-medium text-accent hover:underline flex items-center gap-1 transition-colors"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>Mark all read</span>
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-border">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-muted">
                <p className="text-xs">No notifications yet</p>
              </div>
            ) : (
              notifications.map((n) => {
                const text = n.message_local || n.message;
                return (
                  <div
                    key={n.id}
                    onClick={() => !n.read && handleMarkRead(n.id)}
                    className={`p-3.5 hover:bg-surface-2/60 transition-colors flex items-start gap-3 cursor-pointer ${
                      !n.read ? 'bg-surface-2/40' : 'bg-surface'
                    }`}
                  >
                    <div className="w-7 h-7 rounded-control bg-surface-2 border border-border flex items-center justify-center shrink-0 mt-0.5">
                      {getTypeIcon(n.type)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-xs leading-relaxed ${
                          !n.read ? 'font-medium text-text' : 'text-muted'
                        }`}
                      >
                        {text}
                      </p>
                      <div className="flex items-center gap-2 mt-1 text-[10px] text-muted font-mono">
                        <Clock className="w-3 h-3" />
                        <span>
                          {n.created_at ? new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                        </span>
                        {!n.read && (
                          <span className="w-1.5 h-1.5 rounded-full bg-accent ml-auto shrink-0" />
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

