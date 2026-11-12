import React, { ButtonHTMLAttributes } from 'react';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  fullWidth = false,
  leftIcon,
  rightIcon,
  className = '',
  disabled,
  ...props
}) => {
  const baseClasses =
    'inline-flex items-center justify-center font-semibold rounded-control transition-colors duration-180 ease-calm select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg disabled:cursor-not-allowed disabled:shadow-none';

  const sizeClasses = {
    sm: 'text-xs min-h-[36px] px-3 py-1.5 gap-1.5',
    md: 'text-sm min-h-[44px] h-11 px-4 py-2.5 gap-2',
    lg: 'text-base min-h-[48px] h-12 px-5 py-2.5 gap-2.5',
  };

  const variantClasses = {
    primary:
      'bg-accent text-accent-text hover:bg-accent-hover active:bg-accent-active shadow-soft disabled:bg-surface-2 disabled:text-muted disabled:border disabled:border-border disabled:hover:bg-surface-2',
    secondary:
      'bg-surface-2 hover:bg-surface border border-border text-text shadow-soft disabled:bg-surface-2 disabled:text-muted disabled:border-border',
    outline:
      'border border-border bg-transparent hover:bg-surface-2 text-text shadow-soft disabled:border-border disabled:text-muted',
    danger:
      'bg-status-escalated-bg text-status-escalated-text hover:opacity-90 border border-status-escalated-text/20 shadow-soft disabled:opacity-50',
    ghost:
      'bg-transparent text-muted hover:text-text hover:bg-surface-2 active:bg-surface disabled:text-muted',
  };

  const widthClass = fullWidth ? 'w-full' : '';

  return (
    <button
      className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${widthClass} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin text-current shrink-0" />
          <span className="text-current">Processing...</span>
        </>
      ) : (
        <>
          {leftIcon && <span className="inline-flex shrink-0 text-current">{leftIcon}</span>}
          {children}
          {rightIcon && <span className="inline-flex shrink-0 text-current">{rightIcon}</span>}
        </>
      )}
    </button>
  );
};
