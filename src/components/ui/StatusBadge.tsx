import React from 'react';

export type StatusVariant = 'new' | 'in_progress' | 'resolved' | 'escalated' | 'neutral';

interface StatusBadgeProps {
  status: string;
  variant?: StatusVariant;
  size?: 'sm' | 'md';
  className?: string;
  count?: number | string;
  ticketId?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  variant,
  size = 'md',
  className = '',
  count,
  ticketId,
}) => {
  const normalized = (status || '').toLowerCase().replace(/\s+/g, '_');

  const resolvedVariant: StatusVariant =
    variant ||
    (normalized === 'new' || normalized === 'open'
      ? 'new'
      : normalized === 'in_progress' || normalized === 'pending'
      ? 'in_progress'
      : normalized === 'resolved' || normalized === 'approved' || normalized === 'closed' || normalized === 'paid'
      ? 'resolved'
      : normalized === 'escalated' || normalized === 'rejected' || normalized === 'overdue' || normalized === 'high'
      ? 'escalated'
      : 'neutral');

  const styles: Record<StatusVariant, { text: string; bg: string; dot: string; label: string }> = {
    new: {
      text: 'text-status-new-text',
      bg: 'bg-status-new-bg',
      dot: 'bg-status-new-text',
      label: 'New',
    },
    in_progress: {
      text: 'text-status-inprogress-text',
      bg: 'bg-status-inprogress-bg',
      dot: 'bg-status-inprogress-text',
      label: 'In Progress',
    },
    resolved: {
      text: 'text-status-resolved-text',
      bg: 'bg-status-resolved-bg',
      dot: 'bg-status-resolved-text',
      label: 'Resolved',
    },
    escalated: {
      text: 'text-status-escalated-text',
      bg: 'bg-status-escalated-bg',
      dot: 'bg-status-escalated-text',
      label: 'Escalated',
    },
    neutral: {
      text: 'text-muted',
      bg: 'bg-surface-2',
      dot: 'bg-muted',
      label: status || 'Neutral',
    },
  };

  const current = styles[resolvedVariant];
  const displayLabel = status || current.label;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-control font-medium ${current.bg} ${current.text} ${
        size === 'sm' ? 'text-[11px] px-2 py-0.5' : 'text-xs px-2.5 py-1'
      } ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${current.dot} flex-shrink-0`} aria-hidden="true" />
      <span>{displayLabel}</span>
      {ticketId && <span className="font-mono text-[11px] opacity-75 ml-1">#{ticketId}</span>}
      {count !== undefined && <span className="font-mono text-[11px] font-bold ml-1">({count})</span>}
    </span>
  );
};

export default StatusBadge;

