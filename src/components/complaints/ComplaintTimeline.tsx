import React from 'react';
import {
  CheckCircle2,
  Clock,
  UserCheck,
  Link as LinkIcon,
  AlertTriangle,
  RotateCcw,
  FileText,
} from 'lucide-react';
import { TicketTimelineEvent } from '../../types/complaints';

export const ComplaintTimeline: React.FC<{ events?: TicketTimelineEvent[] }> = ({
  events = [],
}) => {
  if (!events || events.length === 0) {
    return (
      <p className="text-xs text-muted italic py-2">
        No timeline events recorded yet.
      </p>
    );
  }

  const getActionConfig = (action?: string) => {
    switch ((action || '').toLowerCase()) {
      case 'created':
        return {
          icon: <FileText className="w-3.5 h-3.5 text-accent" />,
          bg: 'bg-surface-2 border-border',
          title: 'Ticket Created',
        };
      case 'status_changed':
        return {
          icon: <RotateCcw className="w-3.5 h-3.5 text-status-new-text" />,
          bg: 'bg-status-new-bg border-status-new-text/20',
          title: 'Status Updated',
        };
      case 'assigned':
        return {
          icon: <UserCheck className="w-3.5 h-3.5 text-status-inprogress-text" />,
          bg: 'bg-status-inprogress-bg border-status-inprogress-text/20',
          title: 'Assigned to Staff',
        };
      case 'unassigned':
        return {
          icon: <Clock className="w-3.5 h-3.5 text-muted" />,
          bg: 'bg-surface-2 border-border',
          title: 'Unassigned',
        };
      case 'linked':
        return {
          icon: <LinkIcon className="w-3.5 h-3.5 text-status-inprogress-text" />,
          bg: 'bg-status-inprogress-bg border-status-inprogress-text/20',
          title: 'Linked as Duplicate',
        };
      case 'unlinked':
        return {
          icon: <LinkIcon className="w-3.5 h-3.5 text-muted" />,
          bg: 'bg-surface-2 border-border',
          title: 'Unlinked from Duplicate',
        };
      case 'escalated':
        return {
          icon: <AlertTriangle className="w-3.5 h-3.5 text-status-escalated-text" />,
          bg: 'bg-status-escalated-bg border-status-escalated-text/20',
          title: 'Escalated',
        };
      default:
        return {
          icon: <CheckCircle2 className="w-3.5 h-3.5 text-status-resolved-text" />,
          bg: 'bg-status-resolved-bg border-status-resolved-text/20',
          title: action,
        };
    }
  };

  return (
    <div className="relative pl-6 space-y-5 border-l-2 border-border ml-3 py-1">
      {events.map((e, idx) => {
        const config = getActionConfig(e.action);
        const displayNote = e.note_local || e.note;

        return (
          <div key={e.id || idx} className="relative group">
            {/* Timeline node icon */}
            <div
              className={`absolute -left-[31px] top-0.5 w-6 h-6 rounded-control border flex items-center justify-center shadow-soft ${config.bg}`}
            >
              {config.icon}
            </div>

            <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 mb-0.5">
              <span className="text-xs font-bold text-text">
                {config.title}
                {e.detail && <span className="font-normal text-muted ml-1 font-mono">({e.detail})</span>}
              </span>
              <span className="text-[10px] text-muted font-medium font-mono">
                {e.created_at ? new Date(e.created_at).toLocaleString() : ''}
              </span>
            </div>

            {/* Actor badge */}
            {e.actor_name && (
              <p className="text-[11px] text-muted font-medium font-mono">
                By <span className="font-semibold text-text">{e.actor_name}</span>
                {e.actor_role && <span className="ml-1 uppercase text-[10px]">({e.actor_role})</span>}
              </p>
            )}

            {/* Note */}
            {displayNote && (
              <p className="text-xs text-text mt-1 bg-surface-2 p-2.5 rounded-card border border-border leading-relaxed">
                {displayNote}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
};
