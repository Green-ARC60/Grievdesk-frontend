import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Search,
  RotateCcw,
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ShieldAlert,
  Loader2,
  Users,
  ShieldCheck,
  Building,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { DirectoryUser } from '../types/users';
import {
  getDirectoryUsersApi,
  promoteToCommitteeApi,
  demoteUserApi,
  transferSecretaryApi,
} from '../api/users';
import { Button } from '../components/ui/Button';
import { Alert } from '../components/ui/Alert';
import { useToast } from '../components/ui/Toast';
import { ResidentContactCard } from '../components/directory/ResidentContactCard';
import { mapBackendError } from '../api/errorMapper';

export const ResidentDirectoryPage: React.FC = () => {
  const { user: currentUser, isSecretary, isCommitteeOrAbove, refreshUser } = useAuth();
  const { showToast } = useToast();

  const [users, setUsers] = useState<DirectoryUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Toolbar filters
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'committee' | 'resident'>('all');
  const [blockFilter, setBlockFilter] = useState<string>('all');

  // Collapsible block sections (open by default, remember nothing between sessions)
  const [collapsedBlocks, setCollapsedBlocks] = useState<Record<string, boolean>>({});

  // Action states for governance
  const [actionBusyId, setActionBusyId] = useState<number | null>(null);
  const [transferConfirmUser, setTransferConfirmUser] = useState<DirectoryUser | null>(null);
  const [isTransferring, setIsTransferring] = useState(false);

  // Debounce search input (180ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 180);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const fetchDirectory = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getDirectoryUsersApi('approved');
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(mapBackendError(err));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDirectory();
  }, [fetchDirectory]);

  // Copy with navigator.clipboard and toast notification
  const handleCopy = useCallback((text: string, label: string) => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(text).then(
        () => showToast(`Copied ${label} to clipboard`, 'success'),
        () => showToast(`Unable to copy to clipboard`, 'error')
      );
    } else {
      try {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        showToast(`Copied ${label} to clipboard`, 'success');
      } catch {
        showToast(`Unable to copy to clipboard`, 'error');
      }
    }
  }, [showToast]);

  // Staff action: Promote to Committee
  const handlePromote = useCallback(async (target: DirectoryUser) => {
    if (!window.confirm(`Are you sure you want to promote ${target.name} to the Management Committee?`)) {
      return;
    }
    setActionBusyId(target.id);
    setError(null);
    setSuccess(null);
    try {
      const res = await promoteToCommitteeApi(target.id);
      setSuccess(res.message || `${target.name} has been promoted to Committee.`);
      await fetchDirectory();
    } catch (err) {
      setError(mapBackendError(err));
    } finally {
      setActionBusyId(null);
    }
  }, [fetchDirectory]);

  // Staff action: Demote Committee back to Resident
  const handleDemote = useCallback(async (target: DirectoryUser) => {
    if (!window.confirm(`Are you sure you want to demote ${target.name} back to regular Resident?`)) {
      return;
    }
    setActionBusyId(target.id);
    setError(null);
    setSuccess(null);
    try {
      const res = await demoteUserApi(target.id);
      setSuccess(res.message || `${target.name} has been demoted to Resident.`);
      await fetchDirectory();
    } catch (err) {
      setError(mapBackendError(err));
    } finally {
      setActionBusyId(null);
    }
  }, [fetchDirectory]);

  // Staff action: Transfer Secretary title
  const handleConfirmTransfer = async () => {
    if (!transferConfirmUser) return;
    setIsTransferring(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await transferSecretaryApi(transferConfirmUser.id);
      setSuccess(res.message || `Secretary role transferred to ${transferConfirmUser.name}.`);
      setTransferConfirmUser(null);
      await refreshUser();
      await fetchDirectory();
    } catch (err) {
      setError(mapBackendError(err));
    } finally {
      setIsTransferring(false);
    }
  };

  // Toggle collapsible block group
  const toggleBlockCollapse = (blockName: string) => {
    setCollapsedBlocks((prev) => ({
      ...prev,
      [blockName]: !prev[blockName],
    }));
  };

  const isFilterActive =
    searchTerm.trim() !== '' || blockFilter !== 'all' || roleFilter !== 'all';

  const handleClearFilters = () => {
    setSearchTerm('');
    setDebouncedSearch('');
    setBlockFilter('all');
    setRoleFilter('all');
  };

  // Memoize filtered and grouped members
  const { committeeUsers, residentBlocks, totalFilteredCount, uniqueBlocks } = useMemo(() => {
    const userList = Array.isArray(users) ? users : [];
    const term = debouncedSearch.trim().toLowerCase();

    // 1. Collect all unique blocks for dropdown
    const blocksSet = new Set<string>();
    userList.forEach((u) => {
      if (u?.block_no) blocksSet.add(u.block_no.trim());
    });
    const sortedUniqueBlocks = Array.from(blocksSet).sort((a, b) =>
      a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' })
    );

    // 2. Natural sort comparator: sort by flat_no (so 2 comes before 10), then name
    const naturalSortUsers = (a: DirectoryUser, b: DirectoryUser) => {
      const flatComp = (a?.flat_no || '').localeCompare(b?.flat_no || '', undefined, {
        numeric: true,
        sensitivity: 'base',
      });
      if (flatComp !== 0) return flatComp;
      return (a?.name || '').localeCompare(b?.name || '');
    };

    // 3. Filter predicate
    const matchesFilter = (u: DirectoryUser) => {
      if (!u) return false;

      // Search matches name, flat_no, block_no
      if (term) {
        const nameMatch = (u.name || '').toLowerCase().includes(term);
        const flatMatch = (u.flat_no || '').toLowerCase().includes(term);
        const blockMatch = (u.block_no || '').toLowerCase().includes(term);
        const phoneMatch = u.phone ? u.phone.includes(term) : false;
        const altPhoneMatch = Array.isArray(u.alt_phones)
          ? u.alt_phones.some((p) => p && p.includes(term))
          : false;

        if (!nameMatch && !flatMatch && !blockMatch && !phoneMatch && !altPhoneMatch) {
          return false;
        }
      }

      // Block filter
      if (blockFilter !== 'all' && u.block_no !== blockFilter) {
        return false;
      }

      return true;
    };

    const matchedUsers = userList.filter(matchesFilter);

    // 4. Section 1: Society Committee (Secretary & Committee members pinned at top)
    let committeeList: DirectoryUser[] = [];
    if (roleFilter === 'all' || roleFilter === 'committee') {
      committeeList = matchedUsers
        .filter((u) => u?.role === 'secretary' || u?.role === 'committee')
        .sort((a, b) => {
          // Secretary pinned first within committee section
          if (a.role === 'secretary' && b.role !== 'secretary') return -1;
          if (b.role === 'secretary' && a.role !== 'secretary') return 1;
          return naturalSortUsers(a, b);
        });
    }

    // 5. Section 2: Residents grouped by block
    const blockGroups: Record<string, DirectoryUser[]> = {};
    if (roleFilter === 'all' || roleFilter === 'resident') {
      const regularResidents = matchedUsers.filter((u) => u?.role === 'resident');
      regularResidents.forEach((res) => {
        const blockKey = res.block_no || 'Unassigned';
        if (!blockGroups[blockKey]) {
          blockGroups[blockKey] = [];
        }
        blockGroups[blockKey].push(res);
      });

      // Sort members within each block naturally
      Object.keys(blockGroups).forEach((key) => {
        blockGroups[key].sort(naturalSortUsers);
      });
    }

    // Count of all visible members
    const residentTotal = Object.values(blockGroups).reduce(
      (sum, list) => sum + list.length,
      0
    );
    const totalCount = committeeList.length + residentTotal;

    return {
      committeeUsers: committeeList,
      residentBlocks: blockGroups,
      totalFilteredCount: totalCount,
      uniqueBlocks: sortedUniqueBlocks,
    };
  }, [users, debouncedSearch, blockFilter, roleFilter]);

  // Sorted list of resident block keys
  const residentBlockKeys = useMemo(() => {
    return Object.keys(residentBlocks).sort((a, b) =>
      a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' })
    );
  }, [residentBlocks]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-fadeIn">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-border">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-24 sm:text-32 font-heading font-bold text-text tracking-tight">
              Directory
            </h1>
            <span className="text-xs font-mono font-medium px-2.5 py-1 rounded-control bg-surface-2 border border-border text-muted select-none">
              {totalFilteredCount} {totalFilteredCount === 1 ? 'member' : 'members'}
            </span>
          </div>
          <div className="w-12 h-1 bg-highlight rounded-full mt-2 mb-2" aria-hidden="true" />
          <p className="text-xs sm:text-sm text-muted">
            Verified residents, flat allocations, and society committee members.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={fetchDirectory}
          disabled={isLoading}
          leftIcon={<RotateCcw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />}
          className="self-start sm:self-auto min-h-[44px]"
        >
          Refresh
        </Button>
      </div>

      {/* Alerts */}
      {error && (
        <div className="p-4 rounded-card border-[1.5px] border-status-escalated-text/30 bg-status-escalated-bg text-status-escalated-text flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-soft">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 shrink-0 text-status-escalated-text" />
            <p className="text-xs sm:text-sm font-medium">{error}</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchDirectory}
            className="shrink-0 min-h-[36px] border-status-escalated-text/30 text-status-escalated-text hover:bg-surface"
          >
            Retry
          </Button>
        </div>
      )}

      {success && (
        <Alert variant="success" className="flex items-center gap-2" onClose={() => setSuccess(null)}>
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{success}</span>
        </Alert>
      )}

      {/* Toolbar: Search, Block Filter, Role Segmented Control, Clear Filters */}
      <div className="bg-surface p-3.5 sm:p-4 rounded-card border-[1.5px] border-border shadow-soft flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
        {/* Search input with icon */}
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
          <input
            type="text"
            placeholder="Search by name, flat (e.g. 302), block..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-11 pl-10 pr-3 rounded-control bg-surface-2/60 border border-border text-xs sm:text-sm text-text placeholder:text-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-accent transition-colors duration-180 ease-calm"
            aria-label="Search directory"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {/* Block filter dropdown */}
          <div className="min-w-[130px] flex-1 sm:flex-initial">
            <select
              value={blockFilter}
              onChange={(e) => setBlockFilter(e.target.value)}
              aria-label="Filter by block"
              className="w-full h-11 px-3 rounded-control bg-surface-2/60 border border-border text-xs sm:text-sm font-medium text-text focus:outline-none focus-visible:ring-2 focus-visible:ring-accent transition-colors duration-180 ease-calm"
            >
              <option value="all">All blocks</option>
              {uniqueBlocks.map((b) => (
                <option key={b} value={b}>
                  Block {b}
                </option>
              ))}
            </select>
          </div>

          {/* Role segmented control */}
          <div
            role="group"
            aria-label="Filter by role"
            className="inline-flex items-center p-1 rounded-control bg-surface-2 border border-border min-h-[44px]"
          >
            {(['all', 'committee', 'resident'] as const).map((r) => {
              const labels: Record<string, string> = {
                all: 'All',
                committee: 'Committee',
                resident: 'Residents',
              };
              const isActive = roleFilter === r;
              return (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRoleFilter(r)}
                  className={`min-h-[36px] px-3 sm:px-4 py-1 text-xs font-medium rounded-control transition-colors duration-180 ease-calm focus:outline-none focus-visible:ring-2 focus-visible:ring-accent select-none ${
                    isActive
                      ? 'bg-surface text-text font-semibold shadow-soft border border-border'
                      : 'text-muted hover:text-text'
                  }`}
                >
                  {labels[r]}
                </button>
              );
            })}
          </div>

          {/* Clear filters link */}
          {isFilterActive && (
            <button
              type="button"
              onClick={handleClearFilters}
              className="text-xs font-semibold text-accent hover:underline min-h-[44px] px-2 flex items-center justify-center rounded-control focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      {isLoading ? (
        /* Loading Skeleton Cards */
        <div className="space-y-6">
          <div className="space-y-3">
            <div className="h-5 w-40 bg-surface-2 rounded-control animate-pulse" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="bg-surface rounded-card border-[1.5px] border-border p-4 shadow-soft space-y-4 animate-pulse"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-control bg-surface-2 shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-3/5 bg-surface-2 rounded-control" />
                      <div className="h-3 w-2/5 bg-surface-2 rounded-control" />
                    </div>
                  </div>
                  <div className="space-y-2 pt-2 border-t border-border/60">
                    <div className="h-3 w-4/5 bg-surface-2 rounded-control" />
                    <div className="h-3 w-3/5 bg-surface-2 rounded-control" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : totalFilteredCount === 0 ? (
        /* Empty State */
        <div className="p-10 sm:p-14 text-center bg-surface rounded-card border-[1.5px] border-border shadow-soft space-y-4">
          <div className="w-12 h-12 rounded-full bg-surface-2 border border-border flex items-center justify-center mx-auto text-muted">
            <Users className="w-6 h-6" />
          </div>
          <p className="text-sm text-muted max-w-sm mx-auto">
            No residents found matching your search or filter criteria.
          </p>
          {isFilterActive && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearFilters}
              className="min-h-[44px]"
            >
              Clear filters
            </Button>
          )}
        </div>
      ) : (
        /* Active Directory List */
        <div className="space-y-8">
          {/* Section 1: Society Committee (Pinned at top) */}
          {committeeUsers.length > 0 && (
            <section aria-labelledby="committee-heading" className="space-y-3">
              <div className="flex items-center justify-between pb-2.5 border-b border-border">
                <div className="flex items-center gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-accent" />
                  <h2
                    id="committee-heading"
                    className="text-xs sm:text-sm font-heading font-bold text-text uppercase tracking-wider"
                  >
                    Society Committee
                  </h2>
                  <span className="text-xs font-mono px-2 py-0.5 rounded-control bg-surface-2 border border-border text-muted">
                    {committeeUsers.length}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {committeeUsers.map((member) => (
                  <ResidentContactCard
                    key={member.id}
                    user={member}
                    isSelf={currentUser?.id === member.id}
                    canManage={Boolean(isCommitteeOrAbove)}
                    isSecretaryViewer={Boolean(isSecretary)}
                    actionBusyId={actionBusyId}
                    onCopy={handleCopy}
                    onPromote={handlePromote}
                    onDemote={handleDemote}
                    onTransfer={(u) => setTransferConfirmUser(u)}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Section 2: Residents grouped by block */}
          {residentBlockKeys.length > 0 && (
            <section aria-label="Residents by Block" className="space-y-6">
              {residentBlockKeys.map((blockKey) => {
                const members = residentBlocks[blockKey] || [];
                const isCollapsed = Boolean(collapsedBlocks[blockKey]);

                return (
                  <div key={blockKey} className="space-y-3">
                    {/* Sticky Block Header */}
                    <div className="sticky top-0 z-10 bg-bg border-b border-border py-2 px-1 flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => toggleBlockCollapse(blockKey)}
                        className="flex items-center gap-2 text-left min-h-[44px] px-2 rounded-control focus:outline-none focus-visible:ring-2 focus-visible:ring-accent group"
                        aria-expanded={!isCollapsed}
                      >
                        {isCollapsed ? (
                          <ChevronRight className="w-4 h-4 text-muted group-hover:text-text transition-colors" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-muted group-hover:text-text transition-colors" />
                        )}

                        <div className="flex items-center gap-1.5">
                          <Building className="w-3.5 h-3.5 text-muted" />
                          <span className="font-heading font-semibold text-text text-sm sm:text-base">
                            Block {blockKey}
                          </span>
                        </div>

                        <span className="text-xs font-mono px-2 py-0.5 rounded-control bg-surface-2 border border-border text-muted ml-1">
                          {members.length} {members.length === 1 ? 'resident' : 'residents'}
                        </span>
                      </button>

                      <span className="text-[11px] font-mono text-muted pr-2">
                        {isCollapsed ? 'Click to expand' : 'Click to collapse'}
                      </span>
                    </div>

                    {/* Block Group Cards Grid */}
                    {!isCollapsed && (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-1">
                        {members.map((resident) => (
                          <ResidentContactCard
                            key={resident.id}
                            user={resident}
                            isSelf={currentUser?.id === resident.id}
                            canManage={Boolean(isCommitteeOrAbove)}
                            isSecretaryViewer={Boolean(isSecretary)}
                            actionBusyId={actionBusyId}
                            onCopy={handleCopy}
                            onPromote={handlePromote}
                            onDemote={handleDemote}
                            onTransfer={(u) => setTransferConfirmUser(u)}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </section>
          )}
        </div>
      )}

      {/* Transfer Secretary Confirmation Modal */}
      {transferConfirmUser && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-surface rounded-card max-w-md w-full p-6 shadow-soft border border-border space-y-4 animate-fadeIn">
            <div className="flex items-center gap-2.5 pb-2 border-b border-border">
              <ShieldAlert className="w-5 h-5 text-accent" />
              <h3 className="font-heading font-semibold text-text text-base">
                Transfer Secretary Role?
              </h3>
            </div>

            <p className="text-xs sm:text-sm text-muted leading-relaxed">
              You are about to transfer the official <strong className="text-text">Secretary</strong> title to{' '}
              <strong className="text-text">{transferConfirmUser.name}</strong> (Flat{' '}
              {transferConfirmUser.flat_no}, Block {transferConfirmUser.block_no}).
            </p>

            <div className="p-3 rounded-control bg-status-inprogress-bg border border-status-inprogress-text/20 text-xs text-status-inprogress-text leading-relaxed">
              <strong>Notice:</strong> You will step down to a Committee member role. You will no
              longer have exclusive Secretary authority (e.g. approving resident registrations or demoting
              members) unless transferred back.
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setTransferConfirmUser(null)}
                disabled={isTransferring}
                className="min-h-[44px]"
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleConfirmTransfer}
                disabled={isTransferring}
                className="min-h-[44px]"
              >
                {isTransferring ? (
                  <span className="flex items-center gap-1.5">
                    <Loader2 className="w-4 h-4 animate-spin" /> Transferring...
                  </span>
                ) : (
                  'Confirm Transfer'
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
