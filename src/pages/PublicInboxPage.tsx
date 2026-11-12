import React, { useState, useEffect, useCallback } from 'react';
import {
  Filter,
  Search,
  RotateCcw,
  EyeOff,
  Link as LinkIcon,
  Users,
  Mic,
  ChevronLeft,
  ChevronRight,
  PlusCircle,
  Clock,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Complaint,
  COMPLAINT_CATEGORIES,
  COMPLAINT_STATUSES,
} from '../types/complaints';
import { getComplaintsApi } from '../api/complaints';
import { StatusBadge, SeverityBadge } from '../components/complaints/ComplaintStatusBadge';
import { ComplaintDetailModal } from '../components/complaints/ComplaintDetailModal';
import { Button } from '../components/ui/Button';
import { Alert } from '../components/ui/Alert';
import { EmptyState } from '../components/ui/EmptyState';
import { TableSkeleton } from '../components/ui/Skeleton';
import { mapBackendError } from '../api/errorMapper';

export const PublicInboxPage: React.FC = () => {
  const { isCommitteeOrAbove } = useAuth();

  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [severityFilter, setSeverityFilter] = useState<string>('');
  const [blockFilter, setBlockFilter] = useState<string>('');

  // Paging
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);

  // Detail Modal
  const [selectedComplaintId, setSelectedComplaintId] = useState<number | null>(null);

  const fetchComplaints = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await getComplaintsApi({
        status: statusFilter || undefined,
        category: categoryFilter || undefined,
        severity: severityFilter || undefined,
        block: blockFilter.trim() || undefined,
        limit,
        offset: (page - 1) * limit,
      });
      setComplaints(res.complaints || []);
      setTotal(res.total || 0);
    } catch (err) {
      setError(mapBackendError(err));
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, categoryFilter, severityFilter, blockFilter, limit, page]);

  useEffect(() => {
    fetchComplaints();
  }, [fetchComplaints]);

  const handleResetFilters = () => {
    setStatusFilter('');
    setCategoryFilter('');
    setSeverityFilter('');
    setBlockFilter('');
    setPage(1);
  };

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <div className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-border">
        <div>
          <h1 className="text-24 sm:text-30 font-heading font-bold text-text tracking-tight">
            Public Inbox
          </h1>
          <div className="w-12 h-1 bg-highlight rounded-full mt-2 mb-2.5" aria-hidden="true" />
          <p className="text-xs sm:text-sm text-muted mt-1">
            Community-wide feed of residential complaints, status tracking, and triage.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link to="/">
            <Button variant="primary" size="sm" leftIcon={<PlusCircle className="w-4 h-4" />}>
              Report an Issue
            </Button>
          </Link>
        </div>
      </div>

      {error && (
        <Alert variant="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Filter Bar */}
      <div className="bg-surface p-4 rounded-card border-[1.5px] border-border space-y-4 shadow-soft">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-muted flex items-center gap-1.5 uppercase font-mono tracking-wider">
            <Filter className="w-3.5 h-3.5 text-accent" />
            <span>Filter Complaints</span>
          </span>

          {(statusFilter || categoryFilter || severityFilter || blockFilter) && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="text-xs font-medium text-status-escalated-text hover:underline flex items-center gap-1 transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset Filters</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {/* Status filter */}
          <div>
            <label className="block text-xs font-semibold text-text mb-1">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="app-input w-full text-xs py-2 px-3 rounded-control"
            >
              <option value="">All Statuses</option>
              {COMPLAINT_STATUSES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          {/* Category filter */}
          <div>
            <label className="block text-xs font-semibold text-text mb-1">Category</label>
            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setPage(1);
              }}
              className="app-input w-full text-xs py-2 px-3 rounded-control"
            >
              <option value="">All Categories</option>
              {COMPLAINT_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Severity filter */}
          <div>
            <label className="block text-xs font-semibold text-text mb-1">Severity</label>
            <select
              value={severityFilter}
              onChange={(e) => {
                setSeverityFilter(e.target.value);
                setPage(1);
              }}
              className="app-input w-full text-xs py-2 px-3 rounded-control"
            >
              <option value="">All Severities</option>
              <option value="low">Low Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="high">High Priority</option>
            </select>
          </div>

          {/* Block filter */}
          <div>
            <label className="block text-xs font-semibold text-text mb-1">
              Block / Tower
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="e.g. Block A"
                value={blockFilter}
                onChange={(e) => {
                  setBlockFilter(e.target.value);
                  setPage(1);
                }}
                className="app-input w-full text-xs py-2 pl-3 pr-8 rounded-control"
              />
              <Search className="w-3.5 h-3.5 text-muted absolute right-2.5 top-2.5" />
            </div>
          </div>
        </div>
      </div>

      {/* Complaints List Feed */}
      <div>
        {isLoading ? (
          <TableSkeleton rows={6} />
        ) : complaints.length === 0 ? (
          <div className="border-[1.5px] border-border rounded-card bg-surface shadow-soft">
            <EmptyState
              message="No complaints match your selected filters."
              action={
                statusFilter || categoryFilter || severityFilter || blockFilter ? (
                  <Button variant="outline" size="sm" onClick={handleResetFilters}>
                    Clear Filters
                  </Button>
                ) : undefined
              }
            />
          </div>
        ) : (
          <div className="border-[1.5px] border-border rounded-card bg-surface divide-y divide-border overflow-hidden shadow-soft">
            {complaints.map((c) => {
              const displaySummary = c.translated_text_local || c.translated_text;

              return (
                <div
                  key={c.id}
                  onClick={() => setSelectedComplaintId(c.id)}
                  className="p-3.5 sm:p-4 hover:bg-surface-2/60 transition-colors duration-150 cursor-pointer space-y-2 group"
                >
                  {/* Top Line: ID, Badges, Date */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono font-semibold text-sm text-accent">
                        #{c.id}
                      </span>
                      <span className="text-[11px] font-medium px-2 py-0.5 rounded-control bg-surface-2 text-muted">
                        {c.category}
                      </span>
                      <SeverityBadge severity={c.severity} size="sm" />
                      <StatusBadge status={c.status} size="sm" />

                      {c.duplicate_of && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-control bg-status-inprogress-bg text-status-inprogress-text">
                          <LinkIcon className="w-3 h-3" /> #{c.duplicate_of}
                        </span>
                      )}

                      {c.reports_count && c.reports_count > 1 && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-control bg-surface-2 text-muted">
                          <Users className="w-3 h-3" /> {c.reports_count}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-muted font-mono">
                      <Clock className="w-3 h-3" />
                      <span>{c.created_at ? new Date(c.created_at).toLocaleDateString() : ''}</span>
                    </div>
                  </div>

                  {/* Body Line */}
                  <p className="text-sm text-text line-clamp-2 leading-relaxed">
                    {displaySummary}
                  </p>

                  {/* Meta Sub-line */}
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted pt-1">
                    <div className="flex items-center gap-3">
                      {c.is_anonymous ? (
                        <span className="inline-flex items-center gap-1">
                          <EyeOff className="w-3.5 h-3.5 text-muted" />
                          <span>
                            {isCommitteeOrAbove && c.flat_no
                              ? `Flat ${c.flat_no}, ${c.block_no} (Anonymous)`
                              : 'Anonymous'}
                          </span>
                        </span>
                      ) : (
                        <span>
                          Flat {c.flat_no || '—'}, {c.block_no || '—'}
                        </span>
                      )}

                      {c.audio_available && (
                        <span className="inline-flex items-center gap-1 text-[11px] text-accent">
                          <Mic className="w-3 h-3" /> Audio
                        </span>
                      )}

                      {c.assigned_to && (
                        <span>
                          Handler: <span className="text-text font-medium">{c.assigned_to}</span>
                        </span>
                      )}
                    </div>

                    <span className="text-xs text-accent font-medium group-hover:underline">
                      View details &rarr;
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Pagination Bar */}
      {!isLoading && total > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-border text-xs text-muted font-mono">
          <div>
            Showing <span className="font-bold text-text">{(page - 1) * limit + 1}</span> to{' '}
            <span className="font-bold text-text">{Math.min(page * limit, total)}</span> of{' '}
            <span className="font-bold text-text">{total}</span>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={limit}
              onChange={(e) => {
                setLimit(Number(e.target.value));
                setPage(1);
              }}
              className="app-input text-xs py-1 px-2 rounded-control"
            >
              <option value={10}>10 per page</option>
              <option value={20}>20 per page</option>
              <option value={50}>50 per page</option>
            </select>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="text-xs"
            >
              <ChevronLeft className="w-3.5 h-3.5 mr-1" /> Prev
            </Button>

            <span className="px-2">
              {page} / {totalPages}
            </span>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="text-xs"
            >
              Next <ChevronRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </div>
        </div>
      )}

      {/* Complaint Detail Modal */}
      {selectedComplaintId && (
        <ComplaintDetailModal
          complaintId={selectedComplaintId}
          onClose={() => setSelectedComplaintId(null)}
          isStaff={isCommitteeOrAbove}
          onComplaintUpdated={fetchComplaints}
        />
      )}
    </div>
  );
};
