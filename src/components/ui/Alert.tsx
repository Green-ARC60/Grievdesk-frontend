import React from 'react';
import { AlertCircle, CheckCircle2, Info, AlertTriangle, X } from 'lucide-react';

interface AlertProps {
  variant?: 'error' | 'warning' | 'success' | 'info';
  title?: string;
  children: React.ReactNode;
  onClose?: () => void;
  className?: string;
}

export const Alert: React.FC<AlertProps> = ({
  variant = 'info',
  title,
  children,
  onClose,
  className = '',
}) => {
  const styles = {
    error: {
      container: 'bg-status-escalated-bg border border-status-escalated-text/20 text-status-escalated-text',
      icon: <AlertCircle className="w-4 h-4 text-status-escalated-text shrink-0 mt-0.5" />,
      closeBtn: 'text-status-escalated-text hover:bg-status-escalated-text/10',
    },
    warning: {
      container: 'bg-status-inprogress-bg border border-status-inprogress-text/20 text-status-inprogress-text',
      icon: <AlertTriangle className="w-4 h-4 text-status-inprogress-text shrink-0 mt-0.5" />,
      closeBtn: 'text-status-inprogress-text hover:bg-status-inprogress-text/10',
    },
    success: {
      container: 'bg-status-resolved-bg border border-status-resolved-text/20 text-status-resolved-text',
      icon: <CheckCircle2 className="w-4 h-4 text-status-resolved-text shrink-0 mt-0.5" />,
      closeBtn: 'text-status-resolved-text hover:bg-status-resolved-text/10',
    },
    info: {
      container: 'bg-status-new-bg border border-status-new-text/20 text-status-new-text',
      icon: <Info className="w-4 h-4 text-status-new-text shrink-0 mt-0.5" />,
      closeBtn: 'text-status-new-text hover:bg-status-new-text/10',
    },
  };

  const current = styles[variant];

  return (
    <div
      className={`flex items-start gap-3 p-3.5 rounded-card text-sm leading-relaxed transition-colors shadow-soft animate-fadeIn ${current.container} ${className}`}
      role="alert"
    >
      {current.icon}
      <div className="flex-1">
        {title && <h5 className="font-semibold text-sm mb-0.5">{title}</h5>}
        <div className="text-sm font-normal">{children}</div>
      </div>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className={`p-1 rounded-control transition-colors ${current.closeBtn}`}
          aria-label="Dismiss alert"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
};
