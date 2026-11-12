import React from 'react';
import { Role, ApprovalStatus } from '../../types/auth';

interface BadgeProps {
  children?: React.ReactNode;
  variant?: 'primary' | 'success' | 'warning' | 'danger' | 'neutral';
  role?: Role;
  approvalStatus?: ApprovalStatus;
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  role,
  approvalStatus,
  size = 'md',
}) => {
  let effectiveVariant = variant;
  let text = children;

  if (role) {
    switch (role) {
      case 'secretary':
        effectiveVariant = 'danger';
        text = 'Secretary';
        break;
      case 'committee':
        effectiveVariant = 'primary';
        text = 'Committee';
        break;
      case 'resident':
        effectiveVariant = 'neutral';
        text = 'Resident';
        break;
    }
  } else if (approvalStatus) {
    switch (approvalStatus) {
      case 'approved':
        effectiveVariant = 'success';
        text = 'Approved';
        break;
      case 'pending':
        effectiveVariant = 'warning';
        text = 'Pending Approval';
        break;
    }
  }

  const variantStyles = {
    primary: {
      bg: 'bg-status-new-bg',
      text: 'text-status-new-text',
      dot: 'bg-status-new-text',
    },
    success: {
      bg: 'bg-status-resolved-bg',
      text: 'text-status-resolved-text',
      dot: 'bg-status-resolved-text',
    },
    warning: {
      bg: 'bg-status-inprogress-bg',
      text: 'text-status-inprogress-text',
      dot: 'bg-status-inprogress-text',
    },
    danger: {
      bg: 'bg-status-escalated-bg',
      text: 'text-status-escalated-text',
      dot: 'bg-status-escalated-text',
    },
    neutral: {
      bg: 'bg-surface-2',
      text: 'text-muted',
      dot: 'bg-muted',
    },
  };

  const sizeStyles = {
    sm: 'text-[11px] px-2 py-0.5 gap-1.5',
    md: 'text-xs font-medium px-2.5 py-1 gap-1.5',
  };

  const style = variantStyles[effectiveVariant];

  return (
    <span
      className={`inline-flex items-center rounded-control font-medium ${style.bg} ${style.text} ${sizeStyles[size]}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${style.dot} flex-shrink-0`} aria-hidden="true" />
      <span>{text}</span>
    </span>
  );
};

export { StatusBadge } from './StatusBadge';
