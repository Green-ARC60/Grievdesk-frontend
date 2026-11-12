import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Building2, Menu, PlusCircle, Search } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/Button';
import { ThemeToggle } from '../ui/ThemeToggle';
import { NotificationBell } from '../notifications/NotificationBell';
import { GlobalSearchModal } from '../search/GlobalSearchModal';

interface NavbarProps {
  onOpenSidebar?: () => void;
  onNewChat?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenSidebar, onNewChat }) => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Global Ctrl+K / Cmd+K shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const isHome = location.pathname === '/';

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

  return (
    <header className="sticky top-0 z-30 bg-surface border-b-[1.5px] border-border transition-colors shadow-soft">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-14 sm:h-16 gap-2">
          {/* Left: Menu & Brand */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {isAuthenticated && onOpenSidebar && (
              <button
                type="button"
                onClick={onOpenSidebar}
                className="p-1.5 -ml-1 rounded-control text-muted hover:text-text hover:bg-surface-2 transition-colors duration-200 ease-calm focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/30"
                aria-label="Open sidebar menu"
              >
                <Menu className="w-5 h-5" />
              </button>
            )}

            <Link to="/" className="flex items-center gap-2 group">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-control bg-accent flex items-center justify-center text-accent-text shrink-0">
                <Building2 className="w-4 h-4 text-current" />
              </div>
              <span className="font-heading font-bold text-base sm:text-lg text-text tracking-tight group-hover:text-accent transition-colors">
                GrievDesk
              </span>
            </Link>
          </div>

          {/* Right Controls in a Clean Row */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0">
            {isAuthenticated && user ? (
              <>
                {/* Search field trigger */}
                <button
                  type="button"
                  onClick={() => setIsSearchOpen(true)}
                  className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-control bg-surface-2 text-muted hover:text-text hover:bg-surface border-[1.5px] border-border transition-colors duration-180 ease-calm text-xs font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface min-h-[40px] sm:min-h-[44px] sm:h-11"
                  title="Search society data (Ctrl+K)"
                >
                  <Search className="w-3.5 h-3.5 text-muted shrink-0" />
                  <span className="hidden md:inline">Search...</span>
                  <kbd className="hidden lg:inline-block px-1 py-0.2 text-[9px] font-semibold text-muted bg-surface border border-border rounded font-mono">
                    Ctrl K
                  </kbd>
                </button>

                {/* Theme toggle */}
                <ThemeToggle />

                {/* Notification bell */}
                <NotificationBell />

                {/* New Chat Button: Solid accent with accent-text */}
                {isHome && (
                  <button
                    type="button"
                    onClick={() => {
                      if (onNewChat) {
                        onNewChat();
                      } else {
                        navigate('/', { replace: true });
                        window.location.reload();
                      }
                    }}
                    className="inline-flex items-center gap-1.5 px-3 sm:px-3.5 min-h-[40px] sm:min-h-[44px] sm:h-11 rounded-control text-xs sm:text-sm font-semibold bg-accent text-accent-text hover:bg-accent-hover active:bg-accent-active shadow-soft transition-colors duration-180 ease-calm focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface shrink-0"
                  >
                    <PlusCircle className="w-4 h-4 shrink-0 text-current" />
                    <span className="text-current">New Chat</span>
                  </button>
                )}

                {/* User Name & Plain Role with Dot */}
                <div className="hidden sm:flex items-center gap-1.5 pl-1.5 border-l border-border/80 text-xs text-text">
                  <span className="font-semibold text-text truncate max-w-[120px]">{user.name}</span>
                  <span className="inline-flex items-center gap-1 text-xs text-muted font-normal shrink-0">
                    <span className="text-muted/60">&bull;</span>
                    <span>{getRoleLabel(user.role)}</span>
                  </span>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <ThemeToggle />
                <Link to="/login">
                  <Button variant="ghost" size="sm">
                    Sign In
                  </Button>
                </Link>
                <Link to="/register">
                  <Button variant="primary" size="sm">
                    Register
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Global Search Modal */}
      <GlobalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
      />
    </header>
  );
};
