import React from 'react';
import { SeverityLevel, ComplaintStatusType } from '../../types/complaints';

export const StatusBadge: React.FC<{ status: ComplaintStatusType | string; size?: 'sm' | 'md' }> = ({
  status,
  size = 'md',
}) => {
  const styles: Record<string, { bg: string; text: string; dot: string; label: string }> = {
    new: {
      bg: 'bg-status-new-bg',
      text: 'text-status-new-text',
      dot: 'bg-status-new-text',
      label: 'New',
    },
    in_progress: {
      bg: 'bg-status-inprogress-bg',
      text: 'text-status-inprogress-text',
      dot: 'bg-status-inprogress-text',
      label: 'In Progress',
    },
    resolved: {
      bg: 'bg-status-resolved-bg',
      text: 'text-status-resolved-text',
      dot: 'bg-status-resolved-text',
      label: 'Resolved',
    },
    escalated: {
      bg: 'bg-status-escalated-bg',
      text: 'text-status-escalated-text',
      dot: 'bg-status-escalated-text',
      label: 'Escalated',
    },
  };

  const s = (status || '').toLowerCase().replace(/\s+/g, '_');
  const current = styles[s] || {
    bg: 'bg-surface-2',
    text: 'text-muted',
    dot: 'bg-muted',
    label: status || 'Unknown',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-control font-medium ${
        size === 'sm' ? 'text-[11px] px-2 py-0.5' : 'text-xs px-2.5 py-1'
      } ${current.bg} ${current.text}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${current.dot} flex-shrink-0`} aria-hidden="true" />
      <span>{current.label}</span>
    </span>
  );
};

export const SeverityBadge: React.FC<{ severity: SeverityLevel | string; size?: 'sm' | 'md' }> = ({
  severity,
  size = 'md',
}) => {
  const styles: Record<string, { bg: string; text: string; dot: string }> = {
    high: {
      bg: 'bg-status-escalated-bg',
      text: 'text-status-escalated-text',
      dot: 'bg-status-escalated-text',
    },
    medium: {
      bg: 'bg-status-inprogress-bg',
      text: 'text-status-inprogress-text',
      dot: 'bg-status-inprogress-text',
    },
    low: {
      bg: 'bg-status-resolved-bg',
      text: 'text-status-resolved-text',
      dot: 'bg-status-resolved-text',
    },
  };

  const s = (severity || '').toLowerCase();
  const current = styles[s] || {
    bg: 'bg-surface-2',
    text: 'text-muted',
    dot: 'bg-muted',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-control font-mono font-semibold uppercase ${
        size === 'sm' ? 'text-[10px] px-1.5 py-0.5' : 'text-[11px] px-2 py-0.5'
      } ${current.bg} ${current.text}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${current.dot} flex-shrink-0`} aria-hidden="true" />
      <span>{severity || 'NORMAL'}</span>
    </span>
  );
};

export const ComplaintStatusBadge = StatusBadge;
