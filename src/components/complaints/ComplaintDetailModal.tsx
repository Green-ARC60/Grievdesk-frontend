import React, { useState, useEffect } from 'react';
import {
  X,
  Languages,
  EyeOff,
  Link as LinkIcon,
  Users,
  Mic,
  Volume2,
  Loader2,
  ShieldAlert,
  CheckCircle2,
  UserCheck,
} from 'lucide-react';
import {
  Complaint,
  StaffUser,
  COMPLAINT_STATUSES,
  ComplaintStatusType,
} from '../../types/complaints';
import { StatusBadge, SeverityBadge } from './ComplaintStatusBadge';
import { ComplaintTimeline } from './ComplaintTimeline';
import {
  getComplaintDetailApi,
  updateComplaintStatusApi,
  assignComplaintApi,
  setComplaintDuplicateApi,
  getComplaintAudioBlobUrl,
  getStaffUsersApi,
} from '../../api/complaints';
import { Button } from '../ui/Button';
import { Alert } from '../ui/Alert';
import { mapBackendError } from '../../api/errorMapper';

interface ComplaintDetailModalProps {
  complaintId: number | null;
  onClose: () => void;
  isStaff: boolean;
  onComplaintUpdated?: () => void;
}

export const ComplaintDetailModal: React.FC<ComplaintDetailModalProps> = ({
  complaintId,
  onClose,
  isStaff,
  onComplaintUpdated,
}) => {
  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  // Audio state
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);

  // Translation toggle
  const [showOriginalEnglish, setShowOriginalEnglish] = useState(false);

  // Staff Controls State
  const [newStatus, setNewStatus] = useState<ComplaintStatusType>('in_progress');
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const [staffList, setStaffList] = useState<StaffUser[]>([]);
  const [selectedAssignee, setSelectedAssignee] = useState<string>('');
  const [isUpdatingAssignee, setIsUpdatingAssignee] = useState(false);

  const [targetDuplicateId, setTargetDuplicateId] = useState('');
  const [isUpdatingDuplicate, setIsUpdatingDuplicate] = useState(false);

  // Load complaint data
  useEffect(() => {
    if (!complaintId) return;

    let isMounted = true;
    const fetchDetail = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await getComplaintDetailApi(complaintId);
        if (isMounted) {
          setComplaint(data);
          setNewStatus(data.status);
          setResolutionNotes(data.resolution_notes || '');
        }
      } catch (err) {
        if (isMounted) setError(mapBackendError(err));
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchDetail();

    // Fetch staff users for assign dropdown if viewer is staff
    if (isStaff) {
      getStaffUsersApi().then((list) => {
        if (isMounted) setStaffList(list);
      });
    }

    return () => {
      isMounted = false;
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [complaintId, isStaff]);

  if (!complaintId) return null;

  // Audio player loader
  const handleLoadAudio = async () => {
    if (audioUrl) return;
    setIsLoadingAudio(true);
    try {
      const url = await getComplaintAudioBlobUrl(complaintId);
      setAudioUrl(url);
    } catch {
      setError('Unable to load audio recording.');
    } finally {
      setIsLoadingAudio(false);
    }
  };

  // Staff Action: Update Status
  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!complaint) return;
    setIsUpdatingStatus(true);
    setError(null);
    setSuccessNotice(null);

    try {
      const res = await updateComplaintStatusApi(complaint.id, newStatus, resolutionNotes.trim() || undefined);
      setComplaint(res.complaint);
      setSuccessNotice('Complaint status updated successfully.');
      if (onComplaintUpdated) onComplaintUpdated();
      // Reload detail to fetch updated timeline
      const fresh = await getComplaintDetailApi(complaint.id);
      setComplaint(fresh);
    } catch (err) {
      setError(mapBackendError(err));
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Staff Action: Update Assignee
  const handleUpdateAssignee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!complaint) return;
    setIsUpdatingAssignee(true);
    setError(null);
    setSuccessNotice(null);

    try {
      const assigneeId = selectedAssignee === '' ? null : parseInt(selectedAssignee, 10);
      const res = await assignComplaintApi(complaint.id, assigneeId);
      setComplaint(res.complaint);
      setSuccessNotice('Assignment updated.');
      if (onComplaintUpdated) onComplaintUpdated();
      const fresh = await getComplaintDetailApi(complaint.id);
      setComplaint(fresh);
    } catch (err) {
      setError(mapBackendError(err));
    } finally {
      setIsUpdatingAssignee(false);
    }
  };

  // Staff Action: Set / Unset Duplicate
  const handleUpdateDuplicate = async (unlink: boolean) => {
    if (!complaint) return;
    setIsUpdatingDuplicate(true);
    setError(null);
    setSuccessNotice(null);

    try {
      const target = unlink ? null : parseInt(targetDuplicateId, 10);
      if (!unlink && (!target || isNaN(target))) {
        setError('Please enter a valid original complaint ID to link as duplicate.');
        setIsUpdatingDuplicate(false);
        return;
      }

      const res = await setComplaintDuplicateApi(complaint.id, target);
      setComplaint(res.complaint);
      setTargetDuplicateId('');
      setSuccessNotice(unlink ? 'Unlinked from duplicate.' : `Linked as duplicate of #${target}.`);
      if (onComplaintUpdated) onComplaintUpdated();
      const fresh = await getComplaintDetailApi(complaint.id);
      setComplaint(fresh);
    } catch (err) {
      setError(mapBackendError(err));
    } finally {
      setIsUpdatingDuplicate(false);
    }
  };

  const hasTranslation = !!complaint?.translated_text_local && complaint.translated_text_local !== complaint.translated_text;
  const displayText = hasTranslation
    ? showOriginalEnglish
      ? complaint?.translated_text
      : complaint?.translated_text_local
    : complaint?.translated_text;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 transition-opacity animate-fadeIn"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-2xl bg-surface rounded-card shadow-soft border border-border overflow-hidden z-10 max-h-[90vh] flex flex-col animate-slideUp">
        {/* Header */}
        <div className="px-6 py-5 border-b border-border bg-surface flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="font-extrabold text-lg text-text font-mono">
              Complaint #{complaintId}
            </span>
            {complaint && (
              <>
                <StatusBadge status={complaint.status} />
                <SeverityBadge severity={complaint.severity} />
              </>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-elevated hover:rotate-90 transition-all duration-200"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && (
            <Alert variant="error" onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          {successNotice && (
            <Alert variant="success" onClose={() => setSuccessNotice(null)}>
              {successNotice}
            </Alert>
          )}

          {isLoading ? (
            <div className="py-16 text-center text-muted flex flex-col items-center">
              <Loader2 className="w-8 h-8 animate-spin text-accent mb-2" />
              <p className="text-xs font-medium">Loading ticket details &amp; audit history...</p>
            </div>
          ) : complaint ? (
            <>
              {/* Duplicate Banner */}
              {complaint.duplicate_of && (
                <div className="p-3.5 rounded-control bg-status-inprogress-bg border border-status-inprogress-text/20 text-status-inprogress-text flex items-start gap-2.5 text-xs">
                  <LinkIcon className="w-4 h-4 text-status-inprogress-text mt-0.5 shrink-0" />
                  <div>
                    <span className="font-bold">Duplicate Ticket:</span> This complaint has been linked
                    as a duplicate of root complaint #{complaint.duplicate_of}. Its resolution moves
                    together with the original ticket.
                  </div>
                </div>
              )}

              {/* Reports Count Pill */}
              {complaint.reports_count && complaint.reports_count > 1 && (
                <div className="p-3 rounded-control bg-surface-2 border border-border text-text flex items-center gap-2 text-xs font-semibold">
                  <Users className="w-4 h-4 text-accent shrink-0" />
                  <span>
                    Community Impact: {complaint.reports_count} residents in this block have reported
                    this issue.
                  </span>
                </div>
              )}

              {/* Metadata Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 rounded-control bg-surface-2 border border-border">
                  <span className="text-[10px] font-bold text-muted uppercase tracking-wide block mb-0.5">
                    Category
                  </span>
                  <span className="font-bold text-text">{complaint.category}</span>
                </div>

                <div className="p-3 rounded-control bg-surface-2 border border-border">
                  <span className="text-[10px] font-bold text-muted uppercase tracking-wide block mb-0.5">
                    Location
                  </span>
                  <span className="font-bold text-text">
                    {complaint.is_anonymous && !isStaff && !complaint.flat_no
                      ? 'Hidden (Anonymous)'
                      : `Flat ${complaint.flat_no || '—'}, ${complaint.block_no || '—'}`}
                  </span>
                </div>

                <div className="p-3 rounded-control bg-surface-2 border border-border">
                  <span className="text-[10px] font-bold text-muted uppercase tracking-wide block mb-0.5">
                    Assigned Handler
                  </span>
                  <span className="font-bold text-accent">
                    {complaint.assigned_to || 'Unassigned'}
                  </span>
                </div>

                <div className="p-3 rounded-control bg-surface-2 border border-border">
                  <span className="text-[10px] font-bold text-muted uppercase tracking-wide block mb-0.5">
                    Privacy
                  </span>
                  {complaint.is_anonymous ? (
                    <span className="inline-flex items-center gap-1 text-status-escalated-text font-bold">
                      <EyeOff className="w-3.5 h-3.5" /> Anonymous
                    </span>
                  ) : (
                    <span className="font-semibold text-muted">Public Record</span>
                  )}
                </div>
              </div>

              {/* Staff-Only Submitter Reveal */}
              {isStaff && complaint.submitted_by && (
                <div className="p-3 rounded-control bg-surface-2 border border-border text-xs text-text flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-accent shrink-0" />
                    <span>
                      Staff-Only Verification: Raised by{' '}
                      <span className="font-bold">{complaint.submitted_by}</span> (Flat{' '}
                      {complaint.flat_no}, Block {complaint.block_no})
                    </span>
                  </div>
                  {complaint.is_anonymous && (
                    <span className="text-[10px] uppercase font-bold bg-surface border border-border text-muted px-2 py-0.5 rounded-control">
                      Masked to Residents
                    </span>
                  )}
                </div>
              )}

              {/* Complaint Description */}
              <div className="p-4 rounded-card bg-surface border border-border shadow-soft space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-muted uppercase tracking-wide">
                  <span>Issue Description</span>
                  {hasTranslation && (
                    <button
                      type="button"
                      onClick={() => setShowOriginalEnglish(!showOriginalEnglish)}
                      className="text-accent hover:underline normal-case font-semibold flex items-center gap-1 transition-colors"
                    >
                      <Languages className="w-3 h-3" />
                      <span>{showOriginalEnglish ? 'View Translated' : 'View Canonical English'}</span>
                    </button>
                  )}
                </div>
                <p className="text-sm text-text leading-relaxed whitespace-pre-wrap">
                  {displayText}
                </p>
              </div>

              {/* Voice Note Audio Playback */}
              {complaint.audio_available && (
                <div className="p-4 rounded-card bg-surface-2 border border-border space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-bold text-text">
                      <Mic className="w-4 h-4 text-accent" />
                      <span>Original Voice Note Attached</span>
                    </div>

                    {!audioUrl && (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={handleLoadAudio}
                        isLoading={isLoadingAudio}
                        leftIcon={<Volume2 className="w-3.5 h-3.5" />}
                        className="text-xs"
                      >
                        Play Recording
                      </Button>
                    )}
                  </div>

                  {audioUrl && (
                    <div className="pt-2">
                      <audio controls src={audioUrl} className="w-full h-9 rounded-lg" />
                    </div>
                  )}
                </div>
              )}

              {/* Resolution Notes if Resolved */}
              {complaint.resolution_notes && (
                <div className="p-4 rounded-card bg-status-resolved-bg border border-status-resolved-text/20 space-y-1">
                  <span className="text-xs font-bold text-status-resolved-text flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-status-resolved-text" />
                    <span>Resolution Notes from Society Staff</span>
                  </span>
                  <p className="text-xs text-status-resolved-text leading-relaxed opacity-90">
                    {complaint.resolution_notes_local || complaint.resolution_notes}
                  </p>
                </div>
              )}

              {/* Status Audit Timeline */}
              <div className="pt-2 border-t border-border">
                <h4 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-4">
                  Audit History &amp; Status Timeline
                </h4>
                <ComplaintTimeline events={complaint.timeline} />
              </div>

              {/* Staff Controls Section (Committee & Secretary Only) */}
              {isStaff && (
                <div className="mt-6 pt-6 border-t-[1.5px] border-border bg-surface-2 -mx-6 -mb-6 p-6 space-y-6">
                  <div className="flex items-center gap-2 text-sm font-bold text-text">
                    <ShieldAlert className="w-4 h-4 text-accent" />
                    <span>Staff Management Controls (Committee &amp; Secretary)</span>
                  </div>

                  {/* 1. Status Change Form */}
                  <form onSubmit={handleUpdateStatus} className="space-y-3 bg-surface p-4 rounded-card border-[1.5px] border-border shadow-soft">
                    <span className="text-xs font-bold text-text block">
                      1. Change Complaint Status
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-muted mb-1">
                          New Status
                        </label>
                        <select
                          value={newStatus}
                          onChange={(e) => setNewStatus(e.target.value as ComplaintStatusType)}
                          className="app-input w-full text-xs py-2 px-3 rounded-lg"
                        >
                          {COMPLAINT_STATUSES.map((st) => (
                            <option key={st.value} value={st.value}>
                              {st.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-text-muted mb-1">
                          Resolution / Status Notes
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Plumber dispatched, leak fixed"
                          value={resolutionNotes}
                          onChange={(e) => setResolutionNotes(e.target.value)}
                          className="app-input w-full text-xs py-2 px-3 rounded-lg"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end pt-1">
                      <Button
                        type="submit"
                        variant="primary"
                        size="sm"
                        isLoading={isUpdatingStatus}
                        className="text-xs"
                      >
                        Save Status
                      </Button>
                    </div>
                  </form>

                  {/* 2. Assign Handler Form */}
                  <form onSubmit={handleUpdateAssignee} className="space-y-3 bg-surface p-4 rounded-card border-[1.5px] border-border shadow-soft">
                    <span className="text-xs font-bold text-text block">
                      2. Assign to Staff Member
                    </span>
                    <div className="flex items-center gap-3">
                      <select
                        value={selectedAssignee}
                        onChange={(e) => setSelectedAssignee(e.target.value)}
                        className="app-input flex-1 text-xs py-2 px-3 rounded-control"
                      >
                        <option value="">-- Unassigned (None) --</option>
                        {staffList.map((st) => (
                          <option key={st.id} value={st.id}>
                            {st.name} ({st.role.toUpperCase()} - Flat {st.flat_no})
                          </option>
                        ))}
                      </select>

                      <Button
                        type="submit"
                        variant="secondary"
                        size="sm"
                        isLoading={isUpdatingAssignee}
                        leftIcon={<UserCheck className="w-3.5 h-3.5" />}
                        className="text-xs shrink-0"
                      >
                        Assign Handler
                      </Button>
                    </div>
                  </form>

                  {/* 3. Mark / Unmark Duplicate Form */}
                  <div className="bg-surface p-4 rounded-card border-[1.5px] border-border shadow-soft space-y-3">
                    <span className="text-xs font-bold text-text block">
                      3. Duplicate Report Management
                    </span>

                    {complaint.duplicate_of ? (
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-status-inprogress-text font-medium">
                          Currently linked to root complaint #{complaint.duplicate_of}.
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleUpdateDuplicate(true)}
                          isLoading={isUpdatingDuplicate}
                          className="text-xs text-status-escalated-text border-[1.5px] border-status-escalated-text/30 hover:bg-status-escalated-bg"
                        >
                          Unlink Duplicate
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3">
                        <input
                          type="number"
                          placeholder="Original Complaint ID (e.g. 5)"
                          value={targetDuplicateId}
                          onChange={(e) => setTargetDuplicateId(e.target.value)}
                          className="app-input flex-1 text-xs py-2 px-3 rounded-lg"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleUpdateDuplicate(false)}
                          isLoading={isUpdatingDuplicate}
                          leftIcon={<LinkIcon className="w-3.5 h-3.5" />}
                          className="text-xs shrink-0"
                        >
                          Link as Duplicate
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
};
