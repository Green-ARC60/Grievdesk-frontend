import React, { useState, useEffect, useCallback } from 'react';
import {
  Megaphone,
  CreditCard,
  Pin,
  PinOff,
  Edit3,
  Trash2,
  PlusCircle,
  BellRing,
  CheckCircle2,
  AlertCircle,
  Filter,
  Languages,
  Send,
  Loader2,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Announcement,
  Due,
  DuesFilterParams,
} from '../types/announcements';
import { DirectoryUser } from '../types/users';
import { getDirectoryUsersApi } from '../api/users';
import {
  getAnnouncementsApi,
  pinAnnouncementApi,
  editAnnouncementApi,
  deleteAnnouncementApi,
  getMyDuesApi,
  getStaffDuesApi,
  createDueApi,
  markDuePaidApi,
  remindDueApi,
} from '../api/announcements';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Alert } from '../components/ui/Alert';
import { EmptyState } from '../components/ui/EmptyState';
import { TableSkeleton } from '../components/ui/Skeleton';
import { mapBackendError } from '../api/errorMapper';

export const AnnouncementsDuesPage: React.FC = () => {
  const { isCommitteeOrAbove } = useAuth();

  const [activeTab, setActiveTab] = useState<'announcements' | 'dues'>('announcements');

  // ----------------------------------------------------
  // Announcements State
  // ----------------------------------------------------
  const [pinnedAnnouncements, setPinnedAnnouncements] = useState<Announcement[]>([]);
  const [generalAnnouncements, setGeneralAnnouncements] = useState<Announcement[]>([]);
  const [generalTotal, setGeneralTotal] = useState(0);
  const [isLoadingAnnouncements, setIsLoadingAnnouncements] = useState(true);
  const [announcementError, setAnnouncementError] = useState<string | null>(null);
  const [announcementSuccess, setAnnouncementSuccess] = useState<string | null>(null);

  // Edit Announcement Modal
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editMessage, setEditMessage] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Localized English toggle map: { announcementId: boolean }
  const [showEnglishMap, setShowEnglishMap] = useState<Record<number, boolean>>({});

  // ----------------------------------------------------
  // Dues State
  // ----------------------------------------------------
  const [myDues, setMyDues] = useState<Due[]>([]);
  const [totalUnpaidMyDues, setTotalUnpaidMyDues] = useState('0');
  const [unpaidCountMyDues, setUnpaidCountMyDues] = useState(0);

  const [staffDues, setStaffDues] = useState<Due[]>([]);
  const [totalUnpaidSociety, setTotalUnpaidSociety] = useState('0');
  const [staffDuesCount, setStaffDuesCount] = useState(0);

  const [isLoadingDues, setIsLoadingDues] = useState(true);
  const [duesError, setDuesError] = useState<string | null>(null);
  const [duesSuccess, setDuesSuccess] = useState<string | null>(null);

  // Staff Dues Filters
  const [statusFilter, setStatusFilter] = useState('');
  const [monthFilter, setMonthFilter] = useState('');
  const [flatFilter, setFlatFilter] = useState('');
  const [blockFilter, setBlockFilter] = useState('');

  // Create Due Modal
  const [isCreateDueOpen, setIsCreateDueOpen] = useState(false);
  const [directoryResidents, setDirectoryResidents] = useState<DirectoryUser[]>([]);
  const [selectedResidentId, setSelectedResidentId] = useState<number | ''>('');
  const [newDueMonth, setNewDueMonth] = useState(() => new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [newDueAmount, setNewDueAmount] = useState('');
  const [newDueDueDate, setNewDueDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 15);
    return d.toISOString().slice(0, 10);
  });
  const [newDueFlat, setNewDueFlat] = useState('');
  const [newDueBlock, setNewDueBlock] = useState('');
  const [isCreatingDue, setIsCreatingDue] = useState(false);

  // Send Reminder Modal
  const [remindingDue, setRemindingDue] = useState<Due | null>(null);
  const [reminderNote, setReminderNote] = useState('');
  const [isSendingReminder, setIsSendingReminder] = useState(false);

  // Action busy states
  const [actionBusyId, setActionBusyId] = useState<number | null>(null);

  // ----------------------------------------------------
  // Fetch Announcements
  // ----------------------------------------------------
  const fetchAnnouncements = useCallback(async () => {
    setIsLoadingAnnouncements(true);
    setAnnouncementError(null);
    try {
      const res = await getAnnouncementsApi(50, 0);
      setPinnedAnnouncements(res.pinned || []);
      setGeneralAnnouncements(res.general || []);
      setGeneralTotal(res.general_total || 0);
    } catch (err) {
      setAnnouncementError(mapBackendError(err));
    } finally {
      setIsLoadingAnnouncements(false);
    }
  }, []);

  // ----------------------------------------------------
  // Fetch Dues
  // ----------------------------------------------------
  const fetchDues = useCallback(async () => {
    setIsLoadingDues(true);
    setDuesError(null);
    try {
      if (isCommitteeOrAbove) {
        const params: DuesFilterParams = {
          status: statusFilter || undefined,
          month: monthFilter || undefined,
          flat_no: flatFilter.trim() || undefined,
          block_no: blockFilter.trim() || undefined,
        };
        const res = await getStaffDuesApi(params);
        setStaffDues(res.dues || []);
        setTotalUnpaidSociety(res.total_unpaid || '0');
        setStaffDuesCount(res.count || 0);
      } else {
        const res = await getMyDuesApi();
        setMyDues(res.dues || []);
        setTotalUnpaidMyDues(res.total_unpaid || '0');
        setUnpaidCountMyDues(res.unpaid_count || 0);
      }
    } catch (err) {
      setDuesError(mapBackendError(err));
    } finally {
      setIsLoadingDues(false);
    }
  }, [isCommitteeOrAbove, statusFilter, monthFilter, flatFilter, blockFilter]);

  useEffect(() => {
    if (activeTab === 'announcements') {
      fetchAnnouncements();
    } else {
      fetchDues();
    }
  }, [activeTab, fetchAnnouncements, fetchDues]);

  // Load approved residents for the Create Due modal if user is staff (Committee or Secretary)
  useEffect(() => {
    if (isCommitteeOrAbove) {
      getDirectoryUsersApi('approved')
        .then((users) => {
          setDirectoryResidents(Array.isArray(users) ? users : []);
        })
        .catch(() => {
          setDirectoryResidents([]);
        });
    }
  }, [isCommitteeOrAbove]);

  // ----------------------------------------------------
  // Announcement Actions (Staff)
  // ----------------------------------------------------
  const handleTogglePin = async (announcement: Announcement) => {
    setActionBusyId(announcement.id);
    try {
      await pinAnnouncementApi(announcement.id, !announcement.is_pinned);
      setAnnouncementSuccess(announcement.is_pinned ? 'Circular unpinned.' : 'Circular pinned to top.');
      fetchAnnouncements();
    } catch (err) {
      setAnnouncementError(mapBackendError(err));
    } finally {
      setActionBusyId(null);
    }
  };

  const handleDeleteAnnouncement = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this society notice?')) return;
    setActionBusyId(id);
    try {
      await deleteAnnouncementApi(id);
      setAnnouncementSuccess('Notice deleted.');
      fetchAnnouncements();
    } catch (err) {
      setAnnouncementError(mapBackendError(err));
    } finally {
      setActionBusyId(null);
    }
  };

  const handleOpenEdit = (a: Announcement) => {
    setEditingAnnouncement(a);
    setEditTitle(a.title);
    setEditMessage(a.message);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAnnouncement) return;
    setIsSavingEdit(true);
    try {
      await editAnnouncementApi(editingAnnouncement.id, {
        title: editTitle.trim(),
        message: editMessage.trim(),
      });
      setAnnouncementSuccess('Notice updated.');
      setEditingAnnouncement(null);
      fetchAnnouncements();
    } catch (err) {
      setAnnouncementError(mapBackendError(err));
    } finally {
      setIsSavingEdit(false);
    }
  };

  // ----------------------------------------------------
  const handleTogglePaid = async (due: Due) => {
    setActionBusyId(due.id);
    setDuesError(null);
    try {
      const willBePaid = due.paid_status === 'unpaid';
      await markDuePaidApi(due.id, willBePaid);
      setDuesSuccess(willBePaid ? `Marked Flat ${due.flat_no} due as paid.` : `Marked due as unpaid.`);
      fetchDues();
    } catch (err) {
      setDuesError(mapBackendError(err));
    } finally {
      setActionBusyId(null);
    }
  };

  const handleCreateDueSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreatingDue(true);
    setDuesError(null);
    try {
      const cleanBlock = newDueBlock.replace(/^block\s+/i, '').trim();
      await createDueApi({
        user_id: typeof selectedResidentId === 'number' ? selectedResidentId : undefined,
        month: newDueMonth.trim(),
        amount: parseFloat(newDueAmount),
        due_date: newDueDueDate,
        flat_no: newDueFlat.trim(),
        block_no: cleanBlock,
      });
      setDuesSuccess('Maintenance due record created.');
      setIsCreateDueOpen(false);
      setSelectedResidentId('');
      setNewDueAmount('');
      setNewDueFlat('');
      setNewDueBlock('');
      fetchDues();
    } catch (err) {
      setDuesError(mapBackendError(err));
    } finally {
      setIsCreatingDue(false);
    }
  };

  const handleSendReminderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!remindingDue) return;
    setIsSendingReminder(true);
    setDuesError(null);
    try {
      const res = await remindDueApi(remindingDue.id, reminderNote.trim() || undefined);
      setDuesSuccess(res.message);
      setRemindingDue(null);
      setReminderNote('');
    } catch (err) {
      setDuesError(mapBackendError(err));
    } finally {
      setIsSendingReminder(false);
    }
  };

  return (
    <div className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-border">
        <div>
          <h1 className="text-24 sm:text-30 font-heading font-bold text-text tracking-tight">
            Announcements &amp; Dues
          </h1>
          <div className="w-12 h-1 bg-highlight rounded-full mt-2 mb-2.5" aria-hidden="true" />
          <p className="text-xs sm:text-sm text-muted mt-1">
            Society circulars, notices, and maintenance payment management.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="inline-flex rounded-control bg-surface-2 p-1 border-[1.5px] border-border">
          <button
            type="button"
            onClick={() => setActiveTab('announcements')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-control text-xs sm:text-sm transition-colors duration-180 ease-calm focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface ${
              activeTab === 'announcements'
                ? 'bg-accent text-accent-text font-semibold hover:bg-accent-hover active:bg-accent-active shadow-soft'
                : 'text-muted hover:text-text font-medium'
            }`}
          >
            <Megaphone className="w-4 h-4 text-current shrink-0" />
            <span className={activeTab === 'announcements' ? 'text-current' : ''}>Announcements</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('dues')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-control text-xs sm:text-sm transition-colors duration-180 ease-calm focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface ${
              activeTab === 'dues'
                ? 'bg-accent text-accent-text font-semibold hover:bg-accent-hover active:bg-accent-active shadow-soft'
                : 'text-muted hover:text-text font-medium'
            }`}
          >
            <CreditCard className="w-4 h-4 text-current shrink-0" />
            <span className={activeTab === 'dues' ? 'text-current' : ''}>{isCommitteeOrAbove ? 'Dues Management' : 'My Dues'}</span>
          </button>
        </div>
      </div>

      {/* ==================================================== */}
      {/* TAB 1: ANNOUNCEMENTS & CIRCULARS */}
      {/* ==================================================== */}
      {activeTab === 'announcements' && (
        <div className="space-y-8 animate-fadeIn">
          {announcementError && (
            <Alert variant="error" onClose={() => setAnnouncementError(null)}>
              {announcementError}
            </Alert>
          )}

          {announcementSuccess && (
            <Alert variant="success" onClose={() => setAnnouncementSuccess(null)}>
              {announcementSuccess}
            </Alert>
          )}

          {/* Staff AI Draft Notice Banner */}
          {isCommitteeOrAbove && (
            <div className="p-4 sm:p-5 rounded-card bg-surface-2 border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-soft">
              <div className="flex items-start gap-3">
                <BellRing className="w-5 h-5 text-accent shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-text uppercase tracking-wide font-mono">
                    Staff Notice Publishing
                  </h4>
                  <p className="text-xs text-muted mt-0.5 leading-relaxed">
                    Announcements are authored with GrievDesk AI to generate formal phrasing and notify all residents.
                  </p>
                </div>
              </div>

              <Link to="/?session=new" className="shrink-0">
                <Button variant="secondary" size="sm" leftIcon={<BellRing className="w-4 h-4" />} className="text-xs">
                  Draft Notice with AI
                </Button>
              </Link>
            </div>
          )}

          {isLoadingAnnouncements ? (
            <TableSkeleton rows={4} />
          ) : (
            <>
              {/* 1. PINNED CIRCULARS SECTION */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-xs font-semibold text-accent font-mono uppercase tracking-wider">
                  <Pin className="w-4 h-4 fill-accent" />
                  <span>Pinned Circulars ({pinnedAnnouncements.length})</span>
                </div>

                {pinnedAnnouncements.length === 0 ? (
                  <div className="border border-border rounded-card bg-surface">
                    <EmptyState message="No pinned circulars at this time." />
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {pinnedAnnouncements.map((a) => {
                      const hasTranslation = !!a.message_local && a.message_local !== a.message;
                      const showEnglish = !!showEnglishMap[a.id];
                      const title = showEnglish ? a.title : a.title_local || a.title;
                      const msg = showEnglish ? a.message : a.message_local || a.message;

                      return (
                        <div
                          key={a.id}
                          className="bg-surface p-4 sm:p-5 rounded-card border-l-2 border-l-accent border-y border-r border-border shadow-soft space-y-2.5 relative overflow-hidden"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-control bg-accent text-accent-text font-mono">
                                <Pin className="w-3 h-3 fill-current text-current shrink-0" /> <span className="text-current">Pinned</span>
                              </span>
                              <span className="text-[11px] text-muted font-mono">
                                {new Date(a.created_at).toLocaleDateString()}
                              </span>
                            </div>

                            {/* Staff Pin / Edit / Delete */}
                            {isCommitteeOrAbove && (
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => handleTogglePin(a)}
                                  disabled={actionBusyId === a.id}
                                  title="Unpin"
                                  className="p-1 rounded-control text-muted hover:text-text hover:bg-surface-2 transition-colors"
                                >
                                  <PinOff className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleOpenEdit(a)}
                                  title="Edit"
                                  className="p-1 rounded-control text-muted hover:text-text hover:bg-surface-2 transition-colors"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteAnnouncement(a.id)}
                                  disabled={actionBusyId === a.id}
                                  title="Delete"
                                  className="p-1 rounded-control text-muted hover:text-status-escalated-text hover:bg-status-escalated-bg transition-colors"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            )}
                          </div>

                          <h3 className="font-heading font-semibold text-text text-base leading-snug">
                            {title}
                          </h3>

                          <p className="text-sm text-text leading-relaxed whitespace-pre-wrap">
                            {msg}
                          </p>

                          <div className="flex items-center justify-between pt-2 border-t border-border text-xs text-muted">
                            <span>Posted by {a.posted_by_name || 'Society Staff'}</span>
                            {hasTranslation && (
                              <button
                                type="button"
                                onClick={() =>
                                  setShowEnglishMap((prev) => ({ ...prev, [a.id]: !prev[a.id] }))
                                }
                                className="text-accent font-medium hover:underline flex items-center gap-1"
                              >
                                <Languages className="w-3 h-3" />
                                <span>{showEnglish ? 'Translated' : 'Original English'}</span>
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* 2. GENERAL CIRCULARS SECTION */}
              <div className="space-y-4 pt-4 border-t border-border">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-semibold text-muted font-mono uppercase tracking-wider">
                    <Megaphone className="w-4 h-4 text-muted" />
                    <span>General Circulars ({generalTotal || generalAnnouncements.length})</span>
                  </div>
                </div>

                {generalAnnouncements.length === 0 ? (
                  <div className="border border-border rounded-card bg-surface">
                    <EmptyState message="No general circulars posted yet." />
                  </div>
                ) : (
                  <div className="border border-border rounded-card bg-surface divide-y divide-border overflow-hidden">
                    {generalAnnouncements.map((a) => {
                      const hasTranslation = !!a.message_local && a.message_local !== a.message;
                      const showEnglish = !!showEnglishMap[a.id];
                      const title = showEnglish ? a.title : a.title_local || a.title;
                      const msg = showEnglish ? a.message : a.message_local || a.message;

                      return (
                        <div
                          key={a.id}
                          className="p-4 sm:p-5 hover:bg-surface-2/60 transition-colors duration-150 space-y-2"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs text-muted font-mono">
                              {new Date(a.created_at).toLocaleDateString()}
                            </span>

                            {isCommitteeOrAbove && (
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => handleTogglePin(a)}
                                  disabled={actionBusyId === a.id}
                                  title="Pin to top"
                                  className="p-1 rounded-control text-muted hover:text-text hover:bg-surface-2 transition-colors"
                                >
                                  <Pin className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleOpenEdit(a)}
                                  title="Edit"
                                  className="p-1 rounded-control text-muted hover:text-text hover:bg-surface-2 transition-colors"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteAnnouncement(a.id)}
                                  disabled={actionBusyId === a.id}
                                  title="Delete"
                                  className="p-1 rounded-control text-muted hover:text-status-escalated-text hover:bg-status-escalated-bg transition-colors"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            )}
                          </div>

                          <h4 className="font-heading font-semibold text-text text-sm sm:text-base">{title}</h4>
                          <p className="text-sm text-text leading-relaxed whitespace-pre-wrap">
                            {msg}
                          </p>

                          <div className="flex items-center justify-between pt-2 border-t border-border text-xs text-muted">
                            <span>Posted by {a.posted_by_name || 'Society Staff'}</span>
                            {hasTranslation && (
                              <button
                                type="button"
                                onClick={() =>
                                  setShowEnglishMap((prev) => ({ ...prev, [a.id]: !prev[a.id] }))
                                }
                                className="text-accent font-medium hover:underline flex items-center gap-1"
                              >
                                <Languages className="w-3 h-3" />
                                <span>{showEnglish ? 'Translated' : 'Original English'}</span>
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}

          {/* Edit Modal */}
          {editingAnnouncement && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
              <div className="bg-surface w-full max-w-lg rounded-card p-6 shadow-soft border border-border space-y-4 animate-scaleUp">
                <div className="flex items-center justify-between pb-2 border-b border-border">
                  <h3 className="font-bold text-text-primary text-base">Edit Announcement</h3>
                  <button
                    type="button"
                    onClick={() => setEditingAnnouncement(null)}
                    className="text-text-muted hover:text-text-primary"
                  >
                    &times;
                  </button>
                </div>

                <form onSubmit={handleSaveEdit} className="space-y-4">
                  <Input
                    label="Notice Title"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    required
                  />

                  <div>
                    <label className="block text-sm font-semibold text-text mb-1.5">
                      Message Content <span className="text-status-escalated-text">*</span>
                    </label>
                    <textarea
                      rows={4}
                      value={editMessage}
                      onChange={(e) => setEditMessage(e.target.value)}
                      className="app-input w-full text-xs p-3 rounded-control"
                      required
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingAnnouncement(null)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" variant="primary" size="sm" isLoading={isSavingEdit}>
                      Save Changes
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ==================================================== */}
      {/* TAB 2: SOCIETY DUES */}
      {/* ==================================================== */}
      {activeTab === 'dues' && (
        <div className="space-y-6 animate-fadeIn">
          {duesError && (
            <Alert variant="error" onClose={() => setDuesError(null)}>
              {duesError}
            </Alert>
          )}

          {duesSuccess && (
            <Alert variant="success" onClose={() => setDuesSuccess(null)}>
              {duesSuccess}
            </Alert>
          )}

          {/* 1. RESIDENT DUES VIEW */}
          {!isCommitteeOrAbove ? (
            <div className="space-y-6">
              {/* Summary Card */}
              <div className="bg-surface-2 border border-border p-6 sm:p-8 rounded-card text-text shadow-soft space-y-4">
                <span className="text-xs font-bold text-muted uppercase tracking-widest block font-mono">
                  Personal Maintenance Account
                </span>
                <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4">
                  <div>
                    <span className="text-28 sm:text-40 font-mono font-bold tracking-tight text-text">
                      ₹{parseFloat(totalUnpaidMyDues).toLocaleString()}
                    </span>
                    <span className="text-xs text-muted block mt-1">Total Outstanding Dues</span>
                  </div>

                  <div>
                    {unpaidCountMyDues === 0 ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-control bg-status-resolved-bg text-status-resolved-text border border-status-resolved-text/20 text-xs font-bold">
                        <CheckCircle2 className="w-4 h-4" /> All Dues Cleared
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-control bg-status-escalated-bg text-status-escalated-text border border-status-escalated-text/20 text-xs font-bold">
                        <AlertCircle className="w-4 h-4" /> {unpaidCountMyDues} Month(s) Pending
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Dues History Table */}
              <div className="bg-surface rounded-card border border-border overflow-hidden shadow-xs">
                <div className="p-4 sm:p-5 border-b border-border flex items-center justify-between">
                  <h3 className="font-bold text-text-primary text-sm">Monthly Dues &amp; Receipts</h3>
                </div>

                {isLoadingDues ? (
                  <div className="p-12 text-center text-text-muted">
                    <Loader2 className="w-7 h-7 animate-spin mx-auto mb-2 text-primary" />
                    <p className="text-xs">Loading dues record...</p>
                  </div>
                ) : myDues.length === 0 ? (
                  <p className="p-8 text-center text-xs text-text-muted italic">
                    No maintenance dues on record for your flat.
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-text-secondary">
                      <thead className="bg-surface-elevated border-b border-border text-text-muted uppercase tracking-wider font-semibold">
                        <tr>
                          <th className="py-3 px-4">Billing Month</th>
                          <th className="py-3 px-4">Amount</th>
                          <th className="py-3 px-4">Due Date</th>
                          <th className="py-3 px-4">Status</th>
                          <th className="py-3 px-4">Payment Receipt</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {myDues.map((d) => (
                          <tr key={d.id} className="hover:bg-surface-elevated/70 transition-colors">
                            <td className="py-3.5 px-4 font-bold text-text-primary">{d.month}</td>
                            <td className="py-3.5 px-4 font-semibold text-text-primary">
                              ₹{parseFloat(String(d.amount)).toLocaleString()}
                            </td>
                            <td className="py-3.5 px-4 text-text-secondary">{d.due_date}</td>
                            <td className="py-3.5 px-4">
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded-full font-bold text-[10px] uppercase ${
                                  d.paid_status === 'paid'
                                    ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-200'
                                    : 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-200'
                                }`}
                              >
                                {d.paid_status}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-text-muted text-[11px]">
                              {d.paid_at ? `Paid on ${new Date(d.paid_at).toLocaleDateString()}` : '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* 2. STAFF DUES MANAGEMENT VIEW */
            <div className="space-y-6">
              {/* Staff Stats & Action Header */}
              <div className="bg-surface p-6 rounded-card border border-border shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="text-xs font-bold text-text-muted uppercase tracking-wider block mb-1">
                    Society Total Unpaid Maintenance
                  </span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-extrabold text-text-primary">
                      ₹{parseFloat(totalUnpaidSociety).toLocaleString()}
                    </span>
                    <span className="text-xs text-text-muted font-medium">
                      across {staffDuesCount} records
                    </span>
                  </div>
                </div>

                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setIsCreateDueOpen(true)}
                  leftIcon={<PlusCircle className="w-4 h-4" />}
                  className="text-xs"
                >
                  Create Monthly Due
                </Button>
              </div>

              {/* Filter Bar */}
              <div className="bg-surface p-4 rounded-2xl border border-border space-y-3">
                <span className="text-xs font-bold text-text-primary flex items-center gap-1.5 uppercase tracking-wide">
                  <Filter className="w-3.5 h-3.5 text-primary" />
                  <span>Filter Dues Records</span>
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-text-muted mb-1">Status</label>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="app-input w-full text-xs py-2 px-3 rounded-lg"
                    >
                      <option value="">All Statuses</option>
                      <option value="unpaid">Unpaid Only</option>
                      <option value="paid">Paid Only</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-text-muted mb-1">Month (YYYY-MM)</label>
                    <input
                      type="text"
                      placeholder="e.g. 2026-10"
                      value={monthFilter}
                      onChange={(e) => setMonthFilter(e.target.value)}
                      className="app-input w-full text-xs py-2 px-3 rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-text-muted mb-1">Flat No</label>
                    <input
                      type="text"
                      placeholder="e.g. 402"
                      value={flatFilter}
                      onChange={(e) => setFlatFilter(e.target.value)}
                      className="app-input w-full text-xs py-2 px-3 rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-text-muted mb-1">Block / Tower</label>
                    <input
                      type="text"
                      placeholder="e.g. Block A"
                      value={blockFilter}
                      onChange={(e) => setBlockFilter(e.target.value)}
                      className="app-input w-full text-xs py-2 px-3 rounded-lg"
                    />
                  </div>
                </div>
              </div>

              {/* Staff Dues Table */}
              <div className="bg-surface rounded-card border border-border overflow-hidden shadow-xs">
                {isLoadingDues ? (
                  <div className="p-16 text-center text-text-muted">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-primary" />
                    <p className="text-xs font-medium">Loading society dues records...</p>
                  </div>
                ) : staffDues.length === 0 ? (
                  <p className="p-12 text-center text-xs text-text-muted italic">
                    No dues match the specified criteria.
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-text-secondary">
                      <thead className="bg-surface-elevated border-b border-border text-text-muted uppercase tracking-wider font-semibold">
                        <tr>
                          <th className="py-3 px-4">Flat / Resident</th>
                          <th className="py-3 px-4">Month</th>
                          <th className="py-3 px-4">Amount</th>
                          <th className="py-3 px-4">Due Date</th>
                          <th className="py-3 px-4">Status</th>
                          <th className="py-3 px-4 text-right">Staff Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {staffDues.map((d) => (
                          <tr key={d.id} className="hover:bg-surface-elevated/70 transition-colors">
                            <td className="py-3.5 px-4 font-bold text-text-primary">
                              Flat {d.flat_no}, {d.block_no}
                              {d.resident_name && (
                                <span className="text-[11px] font-normal text-text-muted block">
                                  {d.resident_name}
                                </span>
                              )}
                            </td>
                            <td className="py-3.5 px-4 font-bold text-text-primary">{d.month}</td>
                            <td className="py-3.5 px-4 font-semibold text-text-primary">
                              ₹{parseFloat(String(d.amount)).toLocaleString()}
                            </td>
                            <td className="py-3.5 px-4 text-text-secondary">{d.due_date}</td>
                            <td className="py-3.5 px-4">
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded-full font-bold text-[10px] uppercase ${
                                  d.paid_status === 'paid'
                                    ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-200'
                                    : 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-200'
                                }`}
                              >
                                {d.paid_status}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-right space-x-1.5">
                              {/* Toggle Paid Button */}
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleTogglePaid(d)}
                                disabled={actionBusyId === d.id}
                                className={`text-[11px] py-1 px-2.5 ${
                                  d.paid_status === 'unpaid'
                                    ? 'border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                                    : 'border-border text-text-secondary'
                                }`}
                              >
                                {d.paid_status === 'unpaid' ? 'Mark Paid' : 'Mark Unpaid'}
                              </Button>

                              {/* AI Reminder Button */}
                              {d.paid_status === 'unpaid' && (
                                <Button
                                  variant="secondary"
                                  size="sm"
                                  onClick={() => {
                                    setRemindingDue(d);
                                    setReminderNote('');
                                  }}
                                  leftIcon={<Send className="w-3 h-3" />}
                                  className="text-[11px] py-1 px-2.5"
                                >
                                  AI Remind
                                </Button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Create Due Modal */}
              {isCreateDueOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
                  <div className="bg-surface w-full max-w-md rounded-card p-6 shadow-soft border border-border space-y-4 animate-fadeIn">
                    <div className="flex items-center justify-between pb-3 border-b border-border">
                      <h3 className="font-heading font-semibold text-text text-base">Create Maintenance Due</h3>
                      <button
                        type="button"
                        onClick={() => {
                          setIsCreateDueOpen(false);
                          setSelectedResidentId('');
                          setDuesError(null);
                        }}
                        className="text-muted hover:text-text p-1 rounded-control"
                      >
                        &times;
                      </button>
                    </div>

                    {duesError && (
                      <Alert variant="error" onClose={() => setDuesError(null)}>
                        {duesError}
                      </Alert>
                    )}

                    <form onSubmit={handleCreateDueSubmit} className="space-y-3.5">
                      {directoryResidents.length > 0 && (
                        <div>
                          <label className="block text-xs font-medium text-muted mb-1">
                            Select Resident (Optional)
                          </label>
                          <select
                            value={selectedResidentId}
                            onChange={(e) => {
                              const val = e.target.value;
                              if (val === '') {
                                setSelectedResidentId('');
                              } else {
                                const idNum = Number(val);
                                setSelectedResidentId(idNum);
                                const found = directoryResidents.find((r) => r.id === idNum);
                                if (found) {
                                  setNewDueFlat(found.flat_no || '');
                                  setNewDueBlock(found.block_no || '');
                                }
                              }
                            }}
                            className="w-full px-3 py-2 text-sm bg-surface border border-border rounded-control text-text focus:outline-none focus:border-accent"
                          >
                            <option value="">-- Choose a resident or enter below --</option>
                            {directoryResidents.map((r) => (
                              <option key={r.id} value={r.id}>
                                {r.name} (Flat {r.flat_no}, Block {r.block_no})
                              </option>
                            ))}
                          </select>
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-3">
                        <Input
                          label="Target Flat"
                          placeholder="e.g. 402"
                          value={newDueFlat}
                          onChange={(e) => setNewDueFlat(e.target.value)}
                          required
                        />
                        <Input
                          label="Target Block"
                          placeholder="e.g. A"
                          value={newDueBlock}
                          onChange={(e) => setNewDueBlock(e.target.value)}
                          required
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Input
                            label="Month (YYYY-MM)"
                            placeholder="2026-11"
                            value={newDueMonth}
                            onChange={(e) => setNewDueMonth(e.target.value)}
                            required
                          />
                          <p className="text-[11px] text-muted mt-1">One due per flat per month (e.g. 2026-12).</p>
                        </div>
                        <Input
                          label="Amount (₹)"
                          type="number"
                          placeholder="2500"
                          value={newDueAmount}
                          onChange={(e) => setNewDueAmount(e.target.value)}
                          required
                        />
                      </div>

                      <Input
                        label="Payment Due Date"
                        type="date"
                        value={newDueDueDate}
                        onChange={(e) => setNewDueDueDate(e.target.value)}
                        required
                      />

                      <div className="flex justify-end gap-2 pt-3">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setIsCreateDueOpen(false);
                            setSelectedResidentId('');
                            setDuesError(null);
                          }}
                        >
                          Cancel
                        </Button>
                        <Button type="submit" variant="primary" size="sm" isLoading={isCreatingDue}>
                          Create Due
                        </Button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {/* Send AI Reminder Modal */}
              {remindingDue && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
                  <div className="bg-surface w-full max-w-md rounded-card p-6 shadow-soft border border-border space-y-4 animate-fadeIn">
                    <div className="flex items-center justify-between pb-3 border-b border-border">
                      <div className="flex items-center gap-2">
                        <BellRing className="w-4 h-4 text-accent" />
                        <h3 className="font-heading font-semibold text-text text-base">Send AI Dues Reminder</h3>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setRemindingDue(null);
                          setDuesError(null);
                        }}
                        className="text-muted hover:text-text p-1 rounded-control"
                      >
                        &times;
                      </button>
                    </div>

                    {duesError && (
                      <Alert variant="error" onClose={() => setDuesError(null)}>
                        {duesError}
                      </Alert>
                    )}

                    <div className="p-3 rounded-control bg-surface-2 border border-border text-xs text-muted">
                      <p>
                        Target: <strong className="text-text font-medium">Flat {remindingDue.flat_no}, {remindingDue.block_no}</strong> ({remindingDue.resident_name || 'Resident'})
                      </p>
                      <p className="mt-0.5">
                        Amount: <strong className="text-text font-medium font-mono">₹{parseFloat(String(remindingDue.amount)).toLocaleString()}</strong> for <strong className="text-text font-medium font-mono">{remindingDue.month}</strong>
                      </p>
                    </div>

                    <form onSubmit={handleSendReminderSubmit} className="space-y-3">
                      <div>
                        <label className="block text-xs font-semibold text-text mb-1">
                          Optional Custom Note for AI Drafter
                        </label>
                        <textarea
                          rows={2}
                          placeholder="e.g. Please clear before Friday AGM meeting"
                          value={reminderNote}
                          onChange={(e) => setReminderNote(e.target.value)}
                          className="app-input w-full text-xs p-2.5 rounded-control"
                        />
                        <p className="text-[11px] text-muted mt-1">
                          Gemini will draft a courteous, personalized notification delivered privately to this resident only.
                        </p>
                      </div>

                      <div className="flex justify-end gap-2 pt-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setRemindingDue(null)}
                        >
                          Cancel
                        </Button>
                        <Button type="submit" variant="primary" size="sm" isLoading={isSendingReminder} leftIcon={<Send className="w-3.5 h-3.5" />}>
                          Draft &amp; Send
                        </Button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
