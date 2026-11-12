import React, { useState, useEffect } from 'react';
import {
  Wrench,
  AlertCircle,
  Mic,
  Volume2,
  ChevronDown,
  ChevronUp,
  PlusCircle,
  EyeOff,
  Link as LinkIcon,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Complaint, ServiceRequestTicket } from '../types/complaints';
import { getMyTicketsApi, getComplaintAudioBlobUrl } from '../api/complaints';
import { StatusBadge, SeverityBadge } from '../components/complaints/ComplaintStatusBadge';
import { ComplaintTimeline } from '../components/complaints/ComplaintTimeline';
import { Button } from '../components/ui/Button';
import { Alert } from '../components/ui/Alert';
import { EmptyState } from '../components/ui/EmptyState';
import { TableSkeleton } from '../components/ui/Skeleton';
import { mapBackendError } from '../api/errorMapper';

export const MyTicketsPage: React.FC = () => {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [serviceRequests, setServiceRequests] = useState<ServiceRequestTicket[]>([]);
  const [activeTab, setActiveTab] = useState<'complaints' | 'services'>('complaints');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Expanded timelines map: { ticketId: boolean }
  const [expandedTimelines, setExpandedTimelines] = useState<Record<string, boolean>>({});

  // Audio player map: { complaintId: audioUrl }
  const [audioUrls, setAudioUrls] = useState<Record<number, string>>({});
  const [loadingAudioId, setLoadingAudioId] = useState<number | null>(null);

  useEffect(() => {
    let isMounted = true;
    const fetchTickets = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await getMyTicketsApi();
        if (isMounted) {
          setComplaints(res.complaints || []);
          setServiceRequests(res.service_requests || []);
        }
      } catch (err) {
        if (isMounted) setError(mapBackendError(err));
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchTickets();
    return () => {
      isMounted = false;
    };
  }, []);

  const toggleTimeline = (key: string) => {
    setExpandedTimelines((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handlePlayAudio = async (complaintId: number) => {
    if (audioUrls[complaintId]) return;
    setLoadingAudioId(complaintId);
    try {
      const url = await getComplaintAudioBlobUrl(complaintId);
      setAudioUrls((prev) => ({ ...prev, [complaintId]: url }));
    } catch {
      setError('Unable to stream recording.');
    } finally {
      setLoadingAudioId(null);
    }
  };

  return (
    <div className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-border">
        <div>
          <h1 className="text-24 sm:text-30 font-heading font-bold text-text tracking-tight">
            My Tickets
          </h1>
          <div className="w-12 h-1 bg-highlight rounded-full mt-2 mb-2.5" aria-hidden="true" />
          <p className="text-xs sm:text-sm text-muted mt-1">
            Track status progression and audit timelines of your complaints and service requests.
          </p>
        </div>

        <Link to="/">
          <Button variant="primary" size="sm" leftIcon={<PlusCircle className="w-4 h-4" />}>
            New Request
          </Button>
        </Link>
      </div>

      {error && (
        <Alert variant="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Tabs */}
      <div className="flex border-b border-border">
        <button
          type="button"
          onClick={() => setActiveTab('complaints')}
          className={`flex items-center gap-2 pb-2.5 px-3 text-sm transition-colors border-b-2 ${
            activeTab === 'complaints'
              ? 'border-accent text-accent font-semibold'
              : 'border-transparent text-muted hover:text-text font-medium'
          }`}
        >
          <AlertCircle className="w-4 h-4" />
          <span>Complaints</span>
          <span className="font-mono text-xs">({complaints.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('services')}
          className={`flex items-center gap-2 pb-2.5 px-3 text-sm transition-colors border-b-2 ${
            activeTab === 'services'
              ? 'border-accent text-accent font-semibold'
              : 'border-transparent text-muted hover:text-text font-medium'
          }`}
        >
          <Wrench className="w-4 h-4" />
          <span>Service Requests</span>
          <span className="font-mono text-xs">({serviceRequests.length})</span>
        </button>
      </div>

      {/* Content */}
      {isLoading ? (
        <TableSkeleton rows={4} />
      ) : activeTab === 'complaints' ? (
        /* Complaints Tab */
        complaints.length === 0 ? (
          <div className="border-[1.5px] border-border rounded-card bg-surface shadow-soft">
            <EmptyState
              message="No complaints raised yet."
              action={
                <Link to="/">
                  <Button variant="primary" size="sm">
                    Go to AI Desk
                  </Button>
                </Link>
              }
            />
          </div>
        ) : (
          <div className="border-[1.5px] border-border rounded-card bg-surface divide-y divide-border overflow-hidden shadow-soft">
            {complaints.map((c) => {
              const timelineKey = `complaint-${c.id}`;
              const isTimelineOpen = !!expandedTimelines[timelineKey];
              const displaySummary = c.translated_text_local || c.translated_text;

              return (
                <div key={c.id} className="p-3.5 sm:p-4 space-y-2.5">
                  {/* Top metadata */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono font-semibold text-sm text-accent">#{c.id}</span>
                      <span className="text-[11px] font-medium px-2 py-0.5 rounded-control bg-surface-2 text-muted">
                        {c.category}
                      </span>
                      <SeverityBadge severity={c.severity} size="sm" />
                      <StatusBadge status={c.status} size="sm" />

                      {c.is_anonymous && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-control bg-surface-2 text-muted">
                          <EyeOff className="w-3 h-3" /> Anonymous
                        </span>
                      )}

                      {c.duplicate_of && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-control bg-status-inprogress-bg text-status-inprogress-text">
                          <LinkIcon className="w-3 h-3" /> #{c.duplicate_of}
                        </span>
                      )}
                    </div>

                    <span className="text-xs text-muted font-mono">
                      {c.created_at ? new Date(c.created_at).toLocaleString() : ''}
                    </span>
                  </div>

                  {/* Body text */}
                  <p className="text-sm text-text leading-relaxed">{displaySummary}</p>

                  {/* Audio player if voice note */}
                  {c.audio_available && (
                    <div className="p-2.5 rounded-control bg-surface-2 border border-border flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs font-medium text-text">
                        <Mic className="w-3.5 h-3.5 text-accent" />
                        <span>Voice Note Attached</span>
                      </div>

                      {audioUrls[c.id] ? (
                        <audio controls src={audioUrls[c.id]} className="h-7 rounded" />
                      ) : (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handlePlayAudio(c.id)}
                          isLoading={loadingAudioId === c.id}
                          leftIcon={<Volume2 className="w-3.5 h-3.5" />}
                          className="text-xs"
                        >
                          Listen
                        </Button>
                      )}
                    </div>
                  )}

                  {/* Resolution notes if resolved */}
                  {c.resolution_notes && (
                    <div className="p-3 rounded-control bg-status-resolved-bg text-status-resolved-text border border-status-resolved-text/20 text-xs">
                      <span className="font-semibold block mb-0.5">Resolution Notes:</span>
                      <p>{c.resolution_notes_local || c.resolution_notes}</p>
                    </div>
                  )}

                  {/* Timeline toggle button */}
                  <div className="pt-2 border-t border-border flex justify-between items-center text-xs text-muted">
                    <span>
                      {c.assigned_to ? (
                        <>
                          Handler: <strong className="text-text font-medium">{c.assigned_to}</strong>
                        </>
                      ) : (
                        'Awaiting Handler Assignment'
                      )}
                    </span>

                    <button
                      type="button"
                      onClick={() => toggleTimeline(timelineKey)}
                      className="font-medium text-accent hover:underline flex items-center gap-1 transition-colors"
                    >
                      <span>{isTimelineOpen ? 'Hide Status Timeline' : 'View Status Timeline'}</span>
                      {isTimelineOpen ? (
                        <ChevronUp className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>

                  {/* Expandable Timeline */}
                  {isTimelineOpen && (
                    <div className="pt-3 border-t border-border bg-surface-2 p-3.5 rounded-control">
                      <ComplaintTimeline events={c.timeline} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )
      ) : (
        /* Service Requests Tab */
        serviceRequests.length === 0 ? (
          <div className="border-[1.5px] border-border rounded-card bg-surface shadow-soft">
            <EmptyState
              message="No service requests yet."
              action={
                <Link to="/">
                  <Button variant="primary" size="sm">
                    Request a Service
                  </Button>
                </Link>
              }
            />
          </div>
        ) : (
          <div className="border-[1.5px] border-border rounded-card bg-surface divide-y divide-border overflow-hidden shadow-soft">
            {serviceRequests.map((sr) => {
              const timelineKey = `service-${sr.id}`;
              const isTimelineOpen = !!expandedTimelines[timelineKey];

              return (
                <div key={sr.id} className="p-3.5 sm:p-4 space-y-2.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-semibold text-sm text-accent">Request #{sr.id}</span>
                      <span className="text-[11px] font-medium px-2 py-0.5 rounded-control bg-surface-2 text-muted capitalize">
                        {sr.service_type}
                      </span>
                      <StatusBadge status={sr.status} size="sm" />
                    </div>
                    <span className="text-xs text-muted font-mono">
                      {sr.created_at ? new Date(sr.created_at).toLocaleString() : ''}
                    </span>
                  </div>

                  <p className="text-sm text-text leading-relaxed">
                    {sr.description_local || sr.description}
                  </p>

                  <div className="pt-2 border-t border-border flex justify-between items-center text-xs text-muted">
                    <span>
                      {sr.preferred_time ? `Preferred Time: ${sr.preferred_time}` : 'Standard Queue'}
                    </span>

                    <button
                      type="button"
                      onClick={() => toggleTimeline(timelineKey)}
                      className="font-medium text-accent hover:underline flex items-center gap-1 transition-colors"
                    >
                      <span>{isTimelineOpen ? 'Hide Timeline' : 'View Timeline'}</span>
                      {isTimelineOpen ? (
                        <ChevronUp className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>

                  {isTimelineOpen && (
                    <div className="pt-3 border-t border-border bg-surface-2 p-3.5 rounded-control">
                      <ComplaintTimeline events={sr.timeline} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )
      )}
    </div>
  );
};
