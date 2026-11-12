import React, { useEffect, useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  Inbox,
  BellRing,
  Ticket,
  Users,
  UserCheck,
  CalendarDays,
  Info,
  HelpCircle,
  X,
  Home,
  LogOut,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getRecentThreadsApi } from '../../api/chat';
import { RecentThread } from '../../types/chat';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectRecentThread?: (sessionId: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  onSelectRecentThread,
}) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [recentThreads, setRecentThreads] = useState<RecentThread[]>([]);
  const [isLoadingRecents, setIsLoadingRecents] = useState(false);

  // Load recents when sidebar is opened
  useEffect(() => {
    if (isOpen) {
      const loadRecents = async () => {
        setIsLoadingRecents(true);
        try {
          const threads = await getRecentThreadsApi();
          setRecentThreads(threads);
        } catch {
          // silently fail if recents cannot be loaded
        } finally {
          setIsLoadingRecents(false);
        }
      };
      loadRecents();
    }
  }, [isOpen]);

  const navItems = [
    {
      to: '/',
      label: 'Home (Noticeboard)',
      icon: <Home className="w-4 h-4 shrink-0" />,
      exact: true,
    },
    {
      to: '/public-inbox',
      label: 'Public Inbox',
      icon: <Inbox className="w-4 h-4 shrink-0" />,
    },
    {
      to: '/announcements-dues',
      label: 'Announcements & Dues',
      icon: <BellRing className="w-4 h-4 shrink-0" />,
    },
    {
      to: '/my-tickets',
      label: 'My Tickets',
      icon: <Ticket className="w-4 h-4 shrink-0" />,
    },
    {
      to: '/directory',
      label: 'Resident Directory',
      icon: <Users className="w-4 h-4 shrink-0" />,
    },
    {
      to: '/profile',
      label: 'Profile',
      icon: <UserCheck className="w-4 h-4 shrink-0" />,
    },
    {
      to: '/amenities',
      label: 'Amenity Booking',
      icon: <CalendarDays className="w-4 h-4 shrink-0" />,
    },
    {
      to: '/about',
      label: 'About Us',
      icon: <Info className="w-4 h-4 shrink-0" />,
    },
    {
      to: '/help',
      label: 'Help & FAQ',
      icon: <HelpCircle className="w-4 h-4 shrink-0" />,
    },
  ];

  const handleRecentClick = (sessionId: string) => {
    onClose();
    if (onSelectRecentThread) {
      onSelectRecentThread(sessionId);
    } else {
      navigate(`/?session=${sessionId}`);
    }
  };

  const handleLogout = () => {
    onClose();
    logout();
    navigate('/login');
  };

  const getRoleLabel = (role?: string) => {
    switch (role) {
      case 'secretary':
        return 'Secretary';
      case 'committee':
        return 'Committee';
      case 'resident':
      default:
        return 'Resident';
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Sibling 1: Solid Backdrop at z-40 */}
      <div
        className="fixed inset-0 bg-black/50 z-40 transition-opacity duration-150 animate-fadeIn motion-reduce:animate-none"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sibling 2: Sidebar Panel strictly at z-50, ONE solid surface for the whole panel */}
      <aside
        className="fixed left-0 top-0 h-full w-[85%] max-w-xs sm:max-w-sm z-50 bg-surface border-r-[1.5px] border-border text-text shadow-soft flex flex-col transform transition-transform duration-150 ease-out animate-slideRight motion-reduce:animate-none motion-reduce:transition-none"
        aria-label="Navigation Menu"
      >
        {/* Sidebar Header */}
        <div className="px-4 py-3.5 border-b border-border flex items-center justify-between">
          <span className="text-sm font-heading font-bold text-text tracking-tight">Navigation</span>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-control text-muted hover:text-text transition-colors focus:outline-none focus:ring-2 focus:ring-accent/40"
            aria-label="Close sidebar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* User Line: Solid surface, plain role with dot */}
        {user && (
          <div className="px-4 py-3 border-b border-border">
            <div className="flex items-center gap-1.5 text-xs">
              <span className="font-semibold text-text">{user.name}</span>
              <span className="text-muted font-normal inline-flex items-center gap-1">
                <span>&bull;</span>
                <span>{getRoleLabel(user.role)}</span>
              </span>
            </div>
            <p className="text-[11px] text-muted font-mono mt-0.5">
              Flat {user.flat_no}, Block {user.block_no}
            </p>
          </div>
        )}

        {/* Navigation Links Area */}
        <div className="flex-1 overflow-y-auto py-3 space-y-6">
          <nav className="space-y-0.5">
            {navItems.map((item) => {
              const isActive = item.exact
                ? location.pathname === item.to
                : location.pathname.startsWith(item.to) && item.to !== '/';

              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={onClose}
                  className={`flex items-center gap-2.5 px-3.5 mx-2 py-2 rounded-control text-xs sm:text-sm font-medium transition-colors duration-180 ease-calm focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface ${
                    isActive
                      ? 'bg-accent text-accent-text font-semibold hover:bg-accent-hover active:bg-accent-active'
                      : 'text-muted hover:text-text hover:bg-surface-2 focus-visible:bg-surface-2 focus-visible:text-text'
                  }`}
                >
                  <span className={`transition-colors duration-180 ease-calm shrink-0 ${isActive ? 'text-accent-text' : 'text-muted'}`}>
                    {React.isValidElement(item.icon)
                      ? React.cloneElement(item.icon as React.ReactElement<{ className?: string }>, {
                          className: 'w-4 h-4 text-current',
                        })
                      : item.icon}
                  </span>
                  <span className={isActive ? 'text-current' : ''}>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>

          {/* Recents: Heading in muted small caps, no chevrons */}
          <div className="pt-3 border-t border-border">
            <div className="flex items-center justify-between px-4 mb-2">
              <span className="text-[11px] font-mono uppercase tracking-wider text-muted">
                Recents
              </span>
              {isLoadingRecents && <RefreshCw className="w-3 h-3 animate-spin text-muted" />}
            </div>

            {recentThreads.length === 0 ? (
              <p className="text-xs text-muted italic px-4 py-1">
                No recent conversations found.
              </p>
            ) : (
              <div className="space-y-0.5">
                {recentThreads.slice(0, 5).map((thread) => (
                  <button
                    key={thread.session_id}
                    type="button"
                    onClick={() => handleRecentClick(thread.session_id)}
                    className="w-full text-left px-4 py-1.5 text-xs transition-colors duration-200 ease-calm border-l-2 border-transparent hover:bg-surface-2 focus-visible:bg-surface-2 block group focus:outline-none focus-visible:ring-1 focus-visible:ring-accent/40"
                  >
                    <p className="font-medium text-muted group-hover:text-text truncate transition-colors duration-200 ease-calm">
                      {thread.title || `Chat (${thread.selected_type})`}
                    </p>
                    <span className="text-[10px] text-muted/70 font-mono block">
                      {thread.selected_type} &bull; {thread.message_count} msgs
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-border mt-auto">
          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-status-escalated-text hover:bg-status-escalated-bg/50 rounded-control transition-colors duration-200 ease-calm focus:outline-none focus-visible:ring-2 focus-visible:ring-status-escalated-text/40"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
};
