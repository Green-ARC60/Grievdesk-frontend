import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  X,
  Inbox,
  BellRing,
  BookOpen,
  Wrench,
  Loader2,
  Languages,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import { searchUnifiedApi } from '../../api/search';
import { UnifiedSearchResults } from '../../types/search';
import { ComplaintStatusBadge } from '../complaints/ComplaintStatusBadge';
import { StatusBadge } from '../ui/StatusBadge';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
}) => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<UnifiedSearchResults | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<
    'all' | 'complaints' | 'announcements' | 'rules' | 'service_requests'
  >('all');

  const inputRef = useRef<HTMLInputElement>(null);

  const performSearch = useCallback(async (searchTerm: string) => {
    const trimmed = searchTerm.trim();
    if (trimmed.length < 2) {
      setResults(null);
      setError(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const data = await searchUnifiedApi(trimmed, 15);
      setResults(data);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Search failed. Please try a different query.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    } else {
      setQuery('');
      setResults(null);
      setError(null);
    }
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Debounced search
  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setResults(null);
      setError(null);
      return;
    }

    const timer = setTimeout(() => {
      performSearch(trimmed);
    }, 350);

    return () => clearTimeout(timer);
  }, [query, performSearch]);

  if (!isOpen) return null;

  const complaints = results?.results?.complaints ?? [];
  const announcements = results?.results?.announcements ?? [];
  const rules = results?.results?.rules ?? [];
  const serviceRequests = results?.results?.service_requests ?? [];

  const complaintsCount =
    results?.totals?.complaints ?? results?.counts?.complaints ?? complaints.length;
  const announcementsCount =
    results?.totals?.announcements ?? results?.counts?.announcements ?? announcements.length;
  const serviceRequestsCount =
    results?.totals?.service_requests ?? results?.counts?.service_requests ?? serviceRequests.length;
  const rulesCount =
    results?.counts?.rules ?? rules.length;

  const totalResults =
    complaintsCount + announcementsCount + serviceRequestsCount + rulesCount;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-start justify-center p-4 sm:p-6 md:p-10">
      <div
        className="fixed inset-0"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="relative bg-surface rounded-card w-full max-w-2xl shadow-soft border-[1.5px] border-border overflow-hidden flex flex-col max-h-[85vh] z-10">
        {/* Search Header Input */}
        <div className="p-4 sm:p-5 border-b border-border flex items-center gap-3 bg-surface-2">
          <Search className="w-5 h-5 text-muted shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                performSearch(query);
              }
            }}
            placeholder="Search complaints, announcements, rulebook bylaws..."
            className="w-full bg-transparent text-sm sm:text-base font-body text-text placeholder:text-muted focus:outline-none"
          />
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin text-accent shrink-0" />
          ) : query ? (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                setResults(null);
              }}
              className="p-1 rounded-control text-muted hover:text-text hover:bg-surface"
            >
              <X className="w-4 h-4" />
            </button>
          ) : (
            <kbd className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-mono text-muted bg-surface border border-border rounded-control">
              ESC
            </kbd>
          )}
        </div>

        {/* Translation Banner if query translated */}
        {results?.query_english && (
          <div className="px-5 py-2 bg-surface-2 border-b border-border flex items-center gap-2 text-xs text-muted">
            <Languages className="w-3.5 h-3.5 text-accent shrink-0" />
            <span>
              Searching with English translation: <strong className="text-text font-medium">"{results.query_english}"</strong>
            </span>
          </div>
        )}

        {/* Category Tabs */}
        {results && (
          <div className="px-4 py-2 border-b border-border flex items-center gap-1 overflow-x-auto text-xs font-medium bg-surface">
            <button
              type="button"
              onClick={() => setActiveCategory('all')}
              className={`px-3 py-1.5 rounded-control transition-colors duration-180 ease-calm whitespace-nowrap focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface ${
                activeCategory === 'all'
                  ? 'bg-accent text-accent-text font-semibold hover:bg-accent-hover active:bg-accent-active shadow-soft'
                  : 'text-muted hover:text-text hover:bg-surface-2'
              }`}
            >
              <span className={activeCategory === 'all' ? 'text-current' : ''}>All ({totalResults})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveCategory('complaints')}
              className={`px-3 py-1.5 rounded-control transition-colors duration-180 ease-calm whitespace-nowrap focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface ${
                activeCategory === 'complaints'
                  ? 'bg-accent text-accent-text font-semibold hover:bg-accent-hover active:bg-accent-active shadow-soft'
                  : 'text-muted hover:text-text hover:bg-surface-2'
              }`}
            >
              <span className={activeCategory === 'complaints' ? 'text-current' : ''}>Complaints ({complaintsCount})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveCategory('announcements')}
              className={`px-3 py-1.5 rounded-control transition-colors duration-180 ease-calm whitespace-nowrap focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface ${
                activeCategory === 'announcements'
                  ? 'bg-accent text-accent-text font-semibold hover:bg-accent-hover active:bg-accent-active shadow-soft'
                  : 'text-muted hover:text-text hover:bg-surface-2'
              }`}
            >
              <span className={activeCategory === 'announcements' ? 'text-current' : ''}>Announcements ({announcementsCount})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveCategory('rules')}
              className={`px-3 py-1.5 rounded-control transition-colors duration-180 ease-calm whitespace-nowrap focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface ${
                activeCategory === 'rules'
                  ? 'bg-accent text-accent-text font-semibold hover:bg-accent-hover active:bg-accent-active shadow-soft'
                  : 'text-muted hover:text-text hover:bg-surface-2'
              }`}
            >
              <span className={activeCategory === 'rules' ? 'text-current' : ''}>Rulebook ({rulesCount})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveCategory('service_requests')}
              className={`px-3 py-1.5 rounded-control transition-colors duration-180 ease-calm whitespace-nowrap focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface ${
                activeCategory === 'service_requests'
                  ? 'bg-accent text-accent-text font-semibold hover:bg-accent-hover active:bg-accent-active shadow-soft'
                  : 'text-muted hover:text-text hover:bg-surface-2'
              }`}
            >
              <span className={activeCategory === 'service_requests' ? 'text-current' : ''}>Services ({serviceRequestsCount})</span>
            </button>
          </div>
        )}

        {/* Search Results Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {error && (
            <div className="p-3 rounded-control bg-status-escalated-bg text-status-escalated text-xs border border-status-escalated/20">
              {error}
            </div>
          )}

          {!query.trim() ? (
            <div className="py-10 text-center text-muted space-y-2">
              <Search className="w-7 h-7 mx-auto text-muted/60" />
              <p className="text-xs">Type at least 2 characters to search across society records.</p>
              <div className="flex flex-wrap justify-center gap-2 pt-2">
                {['water', 'parking', 'lift', 'maintenance'].map((kw) => (
                  <button
                    key={kw}
                    type="button"
                    onClick={() => setQuery(kw)}
                    className="px-2.5 py-1 rounded-control bg-surface-2 text-xs font-mono text-muted hover:text-text border border-border transition-colors"
                  >
                    {kw}
                  </button>
                ))}
              </div>
            </div>
          ) : results && totalResults === 0 ? (
            <div className="py-10 text-center text-muted space-y-1">
              <p className="text-sm font-medium text-text">No matches found</p>
              <p className="text-xs">No records matched your search term "{query}".</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Complaints Results */}
              {(activeCategory === 'all' || activeCategory === 'complaints') &&
                complaints.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-[11px] font-mono uppercase tracking-wider text-muted flex items-center gap-1.5">
                      <Inbox className="w-3.5 h-3.5" /> Complaints ({complaintsCount})
                    </span>
                    <div className="border border-border rounded-card bg-surface divide-y divide-border overflow-hidden">
                      {complaints.map((c) => (
                        <div
                          key={`c-${c.id}`}
                          onClick={() => {
                            onClose();
                            navigate('/public-inbox');
                          }}
                          className="p-3 hover:bg-surface-2 transition-colors cursor-pointer flex items-center justify-between gap-3"
                        >
                          <div className="space-y-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-mono font-medium text-text">
                                #{c.id} · {c.category}
                              </span>
                              <ComplaintStatusBadge status={c.status} size="sm" />
                            </div>
                            <p className="text-xs text-muted truncate">
                              {c.translated_text_local || c.translated_text}
                            </p>
                          </div>
                          <ExternalLink className="w-4 h-4 text-muted shrink-0" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              {/* Announcements Results */}
              {(activeCategory === 'all' || activeCategory === 'announcements') &&
                announcements.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-[11px] font-mono uppercase tracking-wider text-muted flex items-center gap-1.5">
                      <BellRing className="w-3.5 h-3.5" /> Announcements ({announcementsCount})
                    </span>
                    <div className="border border-border rounded-card bg-surface divide-y divide-border overflow-hidden">
                      {announcements.map((a) => (
                        <div
                          key={`a-${a.id}`}
                          onClick={() => {
                            onClose();
                            navigate('/announcements-dues');
                          }}
                          className="p-3 hover:bg-surface-2 transition-colors cursor-pointer flex items-center justify-between gap-3"
                        >
                          <div className="space-y-1 min-w-0">
                            <h4 className="text-xs font-medium text-text truncate">
                              {a.title_local || a.title}
                            </h4>
                            <p className="text-xs text-muted truncate">
                              {a.message_local || a.message}
                            </p>
                          </div>
                          <ArrowRight className="w-4 h-4 text-muted shrink-0" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              {/* Rulebook Results */}
              {(activeCategory === 'all' || activeCategory === 'rules') &&
                rules.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-[11px] font-mono uppercase tracking-wider text-muted flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5" /> Society Rulebook Bylaws ({rulesCount})
                    </span>
                    <div className="border border-border rounded-card bg-surface divide-y divide-border overflow-hidden">
                      {rules.map((r, i) => (
                        <div
                          key={`r-${i}`}
                          className="p-3 bg-surface-2/40 space-y-1"
                        >
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-control bg-surface text-accent border border-border">
                            Rule Section {r.section}
                          </span>
                          <p className="text-xs text-text font-mono leading-relaxed">
                            {r.snippet_local || r.snippet}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              {/* Service Requests Results */}
              {(activeCategory === 'all' || activeCategory === 'service_requests') &&
                serviceRequests.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-[11px] font-mono uppercase tracking-wider text-muted flex items-center gap-1.5">
                      <Wrench className="w-3.5 h-3.5" /> Service Requests ({serviceRequestsCount})
                    </span>
                    <div className="border border-border rounded-card bg-surface divide-y divide-border overflow-hidden">
                      {serviceRequests.map((s) => (
                        <div
                          key={`s-${s.id}`}
                          className="p-3 flex items-center justify-between gap-3"
                        >
                          <div className="space-y-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-mono font-medium text-text">
                                #{s.id} · {s.service_type}
                              </span>
                              <StatusBadge status={s.status} />
                            </div>
                            <p className="text-xs text-muted truncate">
                              {s.description_local || s.description}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

