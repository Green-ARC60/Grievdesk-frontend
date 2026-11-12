import { SelectHTMLAttributes, forwardRef } from 'react';

interface SelectOption {
  value: string;
  label: string;
  secondaryLabel?: string;
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: SelectOption[];
  error?: string;
  helperText?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, options, error, helperText, className = '', id, ...props }, ref) => {
    const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={selectId} className="block text-sm font-semibold text-text mb-1.5">
            {label}
            {props.required && <span className="text-status-escalated-text ml-1">*</span>}
          </label>
        )}
        <select
          id={selectId}
          ref={ref}
          className={`block w-full rounded-control py-2 px-3 text-sm transition-colors shadow-soft app-input
            ${
              error
                ? '!border-status-escalated-text !text-status-escalated-text focus:!ring-status-escalated-text/25'
                : ''
            }
            ${className}
          `}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} className="bg-surface text-text">
              {opt.label} {opt.secondaryLabel ? `(${opt.secondaryLabel})` : ''}
            </option>
          ))}
        </select>
        {error && <p className="mt-1 text-xs font-medium text-status-escalated-text">{error}</p>}
        {!error && helperText && <p className="mt-1 text-xs text-muted">{helperText}</p>}
      </div>
    );
  }
);

Select.displayName = 'Select';
