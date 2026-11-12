import React, { useState, useEffect } from 'react';

interface AILoadingIndicatorProps {
  isVoiceLoading?: boolean;
}

export const AILoadingIndicator: React.FC<AILoadingIndicatorProps> = React.memo(({
  isVoiceLoading = false,
}) => {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    const startTime = Date.now();
    const timer = setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - startTime) / 1000));
    }, 500);

    return () => clearInterval(timer);
  }, []);

  const getStatusText = (): string => {
    if (isVoiceLoading) {
      return 'Listening to your voice note…';
    }
    if (elapsedSeconds < 4) {
      return 'Reading your message…';
    }
    if (elapsedSeconds < 10) {
      return 'Working on it…';
    }
    return 'Still working, this can take a few seconds';
  };

  const statusText = getStatusText();

  return (
    <div
      role="status"
      aria-live="polite"
      className="mb-6 max-w-[92%] sm:max-w-[85%] animate-message-enter"
    >
      {/* Label & Pulsing Dots Row */}
      <div className="flex items-center gap-2 mb-2 text-xs font-mono text-muted">
        <span className="font-semibold text-text uppercase tracking-wider text-[11px]">
          Assistant
        </span>
        <span className="text-muted/60">&bull;</span>

        {/* 3 small dots (6px) pulsing softly one after another (opacity 0.3 to 1, 1.2s loop, 150ms stagger) */}
        <div className="inline-flex items-center gap-1.5 py-0.5" aria-hidden="true">
          <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse-dot" />
          <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse-dot [animation-delay:150ms]" />
          <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse-dot [animation-delay:300ms]" />
        </div>
      </div>

      {/* Elapsed-time status text with smooth crossfade */}
      <div className="min-h-[1.25rem] mb-3">
        <p
          key={statusText}
          className="text-xs text-muted font-medium animate-fadeIn transition-opacity duration-260 ease-calm"
        >
          {statusText}
        </p>
      </div>

      {/* Low-contrast Skeleton text lines (surface-2 to border shimmer, 1.8s loop) */}
      <div className="space-y-2 max-w-sm sm:max-w-md pt-0.5" aria-hidden="true">
        <div className="h-3 w-4/5 rounded-control animate-shimmer-subtle" />
        <div className="h-3 w-full rounded-control animate-shimmer-subtle [animation-delay:200ms]" />
        <div className="h-3 w-2/3 rounded-control animate-shimmer-subtle [animation-delay:400ms]" />
      </div>
    </div>
  );
});

AILoadingIndicator.displayName = 'AILoadingIndicator';

