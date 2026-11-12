import React, { useRef, useEffect } from 'react';
import { Send, Mic, Loader2, Square, Trash2 } from 'lucide-react';
import { SelectedType, CommitteeAction } from '../../types/chat';

interface ChatInputProps {
  text: string;
  onChangeText: (val: string) => void;
  onSend: () => void;
  isLoading: boolean;
  selectedType: SelectedType | null;
  committeeAction: CommitteeAction;

  // Voice recording props
  isRecording: boolean;
  recordingDuration: string;
  onStartRecording: () => void;
  onStopAndSendRecording: () => void;
  onCancelRecording: () => void;
}

export const ChatInput: React.FC<ChatInputProps> = React.memo(({
  text,
  onChangeText,
  onSend,
  isLoading,
  selectedType,
  committeeAction,
  isRecording,
  recordingDuration,
  onStartRecording,
  onStopAndSendRecording,
  onCancelRecording,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea height smoothly
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    if (!text) {
      el.style.height = '44px';
      return;
    }
    const rafId = requestAnimationFrame(() => {
      if (!el) return;
      el.style.height = 'auto';
      const targetHeight = Math.min(Math.max(el.scrollHeight, 44), 180);
      el.style.height = `${targetHeight}px`;
    });
    return () => cancelAnimationFrame(rafId);
  }, [text]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!isLoading && text.trim() && selectedType) {
        onSend();
      }
    }
  };

  const getPlaceholder = (): string => {
    if (!selectedType) {
      return 'Select an intent category above before writing or speaking...';
    }

    switch (selectedType) {
      case 'complaint':
        return 'Describe the problem clearly (e.g. Water leakage in master bathroom, block pipe)...';
      case 'service':
        return 'Which service do you need? (e.g. Need an electrician to check tripping MCB tomorrow)...';
      case 'rules':
        return 'Ask a question about society bylaws (e.g. What are the rules for clubhouse booking and noise limits?)...';
      case 'committee_action':
        return committeeAction === 'announcement'
          ? 'Write or speak the announcement note (e.g. Lift maintenance scheduled for Friday 10 AM to 1 PM)...'
          : 'Write or speak note for the dues reminder (e.g. Please pay the maintenance dues for October)...';
    }
  };

  const isSendDisabled = !selectedType || !text.trim() || isLoading;

  return (
    <div className="relative bg-surface rounded-card border-[1.5px] border-border shadow-soft hover:border-accent/40 focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/25 transition-[border-color,box-shadow] duration-200 ease-calm p-2.5">
      {/* 1. Active Recording Mode UI */}
      {isRecording ? (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-surface-2 border-[1.5px] border-accent/30 rounded-control gap-3 animate-fadeIn">
          <div className="flex items-center gap-3">
            {/* Recording Indicator with soft pulsing accent ring */}
            <div className="relative flex items-center justify-center w-5 h-5 shrink-0">
              <span className="absolute inset-0 rounded-full border border-accent/50 animate-mic-ring pointer-events-none" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-accent" />
            </div>

            {/* Timer and Waveform in JetBrains Mono */}
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-accent tracking-wider font-mono">
                  REC {recordingDuration}
                </span>
                <span className="text-[11px] text-muted font-medium">
                  &bull; Recording voice note for {selectedType}
                </span>
              </div>
              <p className="text-[11px] text-muted">
                Speak in your preferred language (Hindi, Odia, English, etc.)
              </p>
            </div>
          </div>

          {/* Recording Controls */}
          <div className="flex items-center gap-2 self-end sm:self-auto">
            {/* Cancel Recording */}
            <button
              type="button"
              onClick={onCancelRecording}
              className="min-h-[40px] px-3.5 rounded-control text-xs font-semibold text-muted hover:text-status-escalated-text hover:bg-surface focus-visible:bg-surface border-[1.5px] border-border transition-colors duration-200 ease-calm flex items-center gap-1.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Cancel</span>
            </button>

            {/* Stop & Send Recording */}
            <button
              type="button"
              onClick={onStopAndSendRecording}
              className="min-h-[44px] h-11 px-4 rounded-control text-xs sm:text-sm font-semibold text-accent-text bg-accent hover:bg-accent-hover active:bg-accent-active shadow-soft flex items-center gap-1.5 transition-colors duration-180 ease-calm focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
            >
              <Square className="w-3.5 h-3.5 fill-current text-current shrink-0" />
              <span className="text-current">Stop &amp; Send</span>
            </button>
          </div>
        </div>
      ) : (
        /* 2. Standard Text Typing Mode UI */
        <>
          <textarea
            ref={textareaRef}
            rows={1}
            value={text}
            onChange={(e) => onChangeText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={getPlaceholder()}
            disabled={isLoading}
            className="w-full resize-none border-0 bg-transparent px-2 py-1 text-sm text-text placeholder:text-muted focus:outline-none focus:ring-0 max-h-44 disabled:opacity-50"
          />

          <div className="flex items-center justify-between pt-2 border-t border-border/70 px-1">
            {/* Left toolbar: Mic button */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onStartRecording}
                disabled={isLoading || !selectedType}
                title={
                  !selectedType
                    ? 'Select an intent chip above first to record voice'
                    : 'Click to record a voice note in any language'
                }
                className={`min-h-[44px] px-3.5 rounded-control transition-all duration-200 ease-calm inline-flex items-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 ${
                  !selectedType
                    ? 'text-muted/40 cursor-not-allowed'
                    : 'text-muted hover:text-accent hover:bg-surface-2 focus-visible:text-accent focus-visible:bg-surface-2'
                }`}
              >
                <Mic className="w-4 h-4 transition-colors duration-200 ease-calm" />
                <span className="text-xs font-semibold">Voice Note</span>
              </button>

              <span className="text-[11px] text-muted font-medium hidden md:inline font-mono">
                Press <kbd className="px-1.5 py-0.5 rounded bg-surface-2 text-text border border-border text-[10px]">Enter</kbd> to send
              </span>
            </div>

            {/* Right: Send button */}
            <button
              type="button"
              onClick={onSend}
              disabled={isSendDisabled}
              className={`min-h-[44px] h-11 px-4 rounded-control transition-colors duration-180 ease-calm inline-flex items-center justify-center gap-1.5 shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface font-semibold text-xs sm:text-sm ${
                isSendDisabled
                  ? 'bg-surface-2 text-muted cursor-not-allowed border-[1.5px] border-border disabled:hover:bg-surface-2'
                  : 'bg-accent text-accent-text hover:bg-accent-hover active:bg-accent-active shadow-soft'
              }`}
              aria-label="Send Message"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin text-current shrink-0" />
              ) : (
                <>
                  <Send className="w-4 h-4 text-current shrink-0" />
                  <span className="hidden sm:inline text-current">Send</span>
                </>
              )}
            </button>
          </div>
        </>
      )}
    </div>
  );
});

ChatInput.displayName = 'ChatInput';
