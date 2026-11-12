import React from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';
import { useTheme, ThemeMode } from '../../context/ThemeContext';

interface ThemeToggleProps {
  className?: string;
  showLabels?: boolean;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  className = '',
  showLabels = false,
}) => {
  const { theme, resolvedTheme, setTheme } = useTheme();

  const options: {
    mode: ThemeMode;
    label: string;
    title: string;
    icon: (isActive: boolean) => React.ReactNode;
  }[] = [
    {
      mode: 'light',
      label: 'Light',
      title: 'Light mode',
      icon: (isActive: boolean) => (
        <Sun
          className={`w-3.5 h-3.5 transition-colors duration-200 ease-calm ${
            isActive
              ? 'text-accent font-bold'
              : 'text-muted group-hover:text-text'
          }`}
        />
      ),
    },
    {
      mode: 'dark',
      label: 'Dark',
      title: 'Dark mode',
      icon: (isActive: boolean) => (
        <Moon
          className={`w-3.5 h-3.5 transition-colors duration-200 ease-calm ${
            isActive
              ? 'text-accent font-bold'
              : 'text-muted group-hover:text-text'
          }`}
        />
      ),
    },
    {
      mode: 'system',
      label: 'System',
      title: `System preference (${resolvedTheme})`,
      icon: (isActive: boolean) => (
        <Monitor
          className={`w-3.5 h-3.5 transition-colors duration-200 ease-calm ${
            isActive
              ? 'text-accent font-bold'
              : 'text-muted group-hover:text-text'
          }`}
        />
      ),
    },
  ];

  const activeIndex = Math.max(
    0,
    options.findIndex((opt) => opt.mode === theme)
  );

  return (
    <div
      role="radiogroup"
      aria-label="Theme preference switcher"
      className={`relative inline-flex items-center p-0.5 rounded-control bg-surface-2 border border-border select-none ${className}`}
    >
      {/* Sliding Active Pill */}
      <span
        aria-hidden="true"
        className="absolute top-0.5 bottom-0.5 left-0.5 rounded-[6px] bg-surface shadow-soft border border-border transition-transform duration-200 ease-calm motion-reduce:transition-none pointer-events-none"
        style={{
          width: 'calc((100% - 0.25rem) / 3)',
          transform: `translateX(calc(${activeIndex * 100}%))`,
        }}
      />

      {options.map((opt) => {
        const isActive = theme === opt.mode;

        return (
          <button
            key={opt.mode}
            type="button"
            role="radio"
            aria-checked={isActive}
            aria-label={`${opt.label} theme`}
            title={opt.title}
            onClick={() => setTheme(opt.mode)}
            className={`group relative z-10 flex-1 flex items-center justify-center gap-1.5 px-2 py-1 rounded-[6px] text-xs font-medium transition-colors duration-150 select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 ${
              isActive
                ? 'text-text font-semibold'
                : 'text-muted hover:text-text'
            }`}
          >
            {opt.icon(isActive)}
            {showLabels && (
              <span
                className={`text-[11px] transition-colors duration-150 ${
                  isActive ? 'font-semibold text-text' : 'text-muted'
                }`}
              >
                {opt.label}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
