import React, { InputHTMLAttributes, forwardRef, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  allowPasswordToggle?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helperText,
      leftIcon,
      rightIcon,
      type = 'text',
      allowPasswordToggle = false,
      className = '',
      id,
      ...props
    },
    ref
  ) => {
    const [showPassword, setShowPassword] = useState(false);
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);
    const isPassword = type === 'password';
    const effectiveType = isPassword && allowPasswordToggle ? (showPassword ? 'text' : 'password') : type;

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-semibold text-text mb-1.5">
            {label}
            {props.required && <span className="text-status-escalated-text ml-1">*</span>}
          </label>
        )}
        <div className="relative rounded-control shadow-soft">
          {leftIcon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted">
              {leftIcon}
            </div>
          )}
          <input
            id={inputId}
            ref={ref}
            type={effectiveType}
            className={`block w-full rounded-control text-sm app-input py-2 transition-colors duration-150
              ${leftIcon ? 'pl-9' : 'pl-3'}
              ${rightIcon || (isPassword && allowPasswordToggle) ? 'pr-9' : 'pr-3'}
              ${
                error
                  ? '!border-status-escalated-text !text-status-escalated-text focus:!ring-status-escalated-text/25'
                  : ''
              }
              ${className}
            `}
            {...props}
          />
          {isPassword && allowPasswordToggle ? (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted hover:text-text focus:outline-none"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          ) : (
            rightIcon && (
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-muted">
                {rightIcon}
              </div>
            )
          )}
        </div>
        {error && <p className="mt-1 text-xs font-medium text-status-escalated-text">{error}</p>}
        {!error && helperText && <p className="mt-1 text-xs text-muted">{helperText}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
