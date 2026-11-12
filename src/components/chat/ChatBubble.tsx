import React, { useState } from 'react';
import {
  Languages,
  CheckCircle2,
  Pin,
  EyeOff,
  Link as LinkIcon,
  Mic,
  Headphones,
} from 'lucide-react';
import { LocalMessage } from '../../types/chat';

interface ChatBubbleProps {
  message: LocalMessage;
  userPreferredLang?: string;
  isNewest?: boolean;
}

export const ChatBubble: React.FC<ChatBubbleProps> = React.memo(({ message, isNewest = false }) => {
  const isUser = message.role === 'user';
  const [showOriginalEnglish, setShowOriginalEnglish] = useState(false);

  // If local translated text exists and differs from canonical English text
  const hasLocalTranslation = !!message.text_local && message.text_local !== message.text;
  const displayText = hasLocalTranslation
    ? showOriginalEnglish
      ? message.text
      : message.text_local
    : message.text;

  const typeLabels: Record<string, { label: string; color: string }> = {
    complaint: { label: 'Complaint', color: 'bg-status-escalated-bg text-status-escalated-text' },
    service: { label: 'Service Request', color: 'bg-status-inprogress-bg text-status-inprogress-text' },
    rules: { label: 'Rules Q&A', color: 'bg-status-new-bg text-status-new-text' },
    committee_action: { label: 'Committee Action', color: 'bg-surface-2 text-text border border-border' },
  };

  const activeType = message.selected_type ? typeLabels[message.selected_type] : null;
  const typeBadgeLabel = activeType?.label || message.selected_type || 'Message';
  const typeBadgeColor = activeType?.color || 'bg-surface-2 text-muted';

  if (isUser) {
    return (
      <div className={`flex justify-end mb-4 ${isNewest ? 'animate-message-enter' : ''}`}>
        <div className="max-w-[85%] sm:max-w-[75%] flex flex-col items-end">
          {/* Metadata pill above user message */}
          <div className="flex items-center gap-1.5 mb-1.5 text-[11px] text-muted font-medium font-mono">
            <span
              className={`px-2 py-0.5 rounded-control font-bold uppercase tracking-wider text-[10px] ${typeBadgeColor}`}
            >
              {typeBadgeLabel}
            </span>

            {message.input_mode === 'voice' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-control bg-surface-2 text-accent text-[10px] font-bold border border-border">
                <Mic className="w-3 h-3 text-accent" />
                <span>Voice Note</span>
              </span>
            )}

            {message.isAnonymous && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-control bg-surface-2 text-muted text-[10px] font-semibold border border-border">
                <EyeOff className="w-3 h-3" /> Anonymous
              </span>
            )}
            <span>{message.timestamp}</span>
          </div>

          {/* User Bubble: solid Sapphire tint */}
          <div className="bg-accent/10 text-text rounded-card rounded-tr-xs px-4 py-3 shadow-soft border-[1.5px] border-accent/25 text-sm leading-relaxed whitespace-pre-wrap">
            {message.text}

            {/* If local audio playback available */}
            {message.audioUrl && (
              <div className="mt-2 pt-2 border-t border-accent/20">
                <audio controls src={message.audioUrl} className="h-8 max-w-full rounded-control" />
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Assistant: Bordered surface card with a small label
  return (
    <div className={`mb-6 max-w-[92%] sm:max-w-[85%] ${isNewest ? 'animate-message-enter' : ''}`}>
      {/* Small Label */}
      <div className="flex items-center gap-2 mb-1.5 text-xs text-muted font-medium font-mono">
        <span className="font-semibold text-text uppercase tracking-wider text-[11px]">Assistant</span>
        <span>&bull;</span>
        <span className="text-[11px]">{message.timestamp}</span>

        {hasLocalTranslation && (
          <span className="inline-flex items-center gap-1 text-[10px] bg-surface-2 border-[1.5px] border-border text-muted px-2 py-0.5 rounded-control font-semibold">
            <Languages className="w-3 h-3 text-accent" />
            <span>Translated ({message.language?.toUpperCase()})</span>
          </span>
        )}
      </div>

      {/* Assistant Content: Bordered surface card */}
      <div className="bg-surface border-[1.5px] border-border rounded-card px-4 py-3.5 shadow-soft space-y-2.5 text-sm leading-relaxed text-text">
        {/* Phase 3 "I heard..." Callout Banner for Voice Input */}
        {message.transcript && (
          <div className="p-2.5 rounded-control bg-surface-2 border-[1.5px] border-border text-xs text-text flex items-start gap-2 animate-fadeIn transition-opacity duration-220 ease-calm">
            <Headphones className="w-3.5 h-3.5 text-accent shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-text block text-[10px] uppercase tracking-wide font-mono">
                I heard:
              </span>
              <p className="italic text-muted mt-0.5">"{message.transcript}"</p>
            </div>
          </div>
        )}

        {/* Main message text */}
        <p className="whitespace-pre-wrap">{displayText}</p>

        {/* Language Toggle Link if translation exists */}
        {hasLocalTranslation && (
          <div>
            <button
              type="button"
              onClick={() => setShowOriginalEnglish(!showOriginalEnglish)}
              className="text-xs font-semibold text-accent hover:underline inline-flex items-center gap-1 transition-colors"
            >
              <Languages className="w-3 h-3" />
              <span>
                {showOriginalEnglish
                  ? `Switch back to translated view (${message.language?.toUpperCase()})`
                  : 'Show canonical English record'}
              </span>
            </button>
          </div>
        )}

        {/* Structured Result: Complaint Card */}
        {message.metadata?.complaint && (
          <div className="mt-2.5 p-3.5 rounded-control bg-surface-2 border-[1.5px] border-border text-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-text font-mono">
                Complaint #{message.metadata.complaint.id}
              </span>
              <span
                className={`px-2 py-0.5 rounded-control font-bold uppercase text-[10px] font-mono ${
                  message.metadata.complaint.severity === 'high'
                    ? 'bg-status-escalated-bg text-status-escalated-text'
                    : message.metadata.complaint.severity === 'medium'
                    ? 'bg-status-inprogress-bg text-status-inprogress-text'
                    : 'bg-status-resolved-bg text-status-resolved-text'
                }`}
              >
                {message.metadata.complaint.severity} Priority
              </span>
            </div>
            <div className="text-muted grid grid-cols-2 gap-2">
              <div>
                <span className="font-semibold text-text">Category:</span>{' '}
                {message.metadata.complaint.category}
              </div>
              <div>
                <span className="font-semibold text-text">Status:</span>{' '}
                <span className="capitalize">{message.metadata.complaint.status}</span>
              </div>
            </div>

            {message.metadata.duplicate_of && (
              <div className="mt-2 flex items-center gap-1.5 text-status-inprogress-text bg-status-inprogress-bg p-2 rounded-control border border-status-inprogress-text/20">
                <LinkIcon className="w-3.5 h-3.5 shrink-0" />
                <span>
                  Linked as duplicate of open complaint #{message.metadata.duplicate_of}.
                </span>
              </div>
            )}
          </div>
        )}

        {/* Structured Result: Service Request Card */}
        {message.metadata?.service_request && (
          <div className="mt-2.5 p-3.5 rounded-control bg-surface-2 border-[1.5px] border-border text-xs space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-text font-mono">
                Service Request #{message.metadata.service_request.id}
              </span>
              <span className="bg-status-inprogress-bg text-status-inprogress-text px-2 py-0.5 rounded-control font-bold uppercase text-[10px] font-mono">
                {message.metadata.service_request.status}
              </span>
            </div>
            <div className="text-muted">
              <span className="font-semibold text-text">Service:</span>{' '}
              <span className="capitalize">{message.metadata.service_request.service_type}</span>
            </div>
          </div>
        )}

        {/* Structured Result: Announcement Card */}
        {message.metadata?.announcement && (
          <div className="mt-2.5 p-3.5 rounded-control bg-surface-2 border-[1.5px] border-border text-xs space-y-1">
            <div className="flex items-center gap-1.5 text-text font-bold">
              <CheckCircle2 className="w-4 h-4 text-status-resolved-text" />
              <span>Notice Published to Society</span>
              {message.metadata.announcement.is_pinned && (
                <span className="ml-auto inline-flex items-center gap-1 text-[10px] bg-accent/15 text-accent px-1.5 py-0.5 rounded-control font-bold font-mono">
                  <Pin className="w-3 h-3" /> Pinned
                </span>
              )}
            </div>
            <p className="font-semibold text-text">{message.metadata.announcement.title}</p>
          </div>
        )}
      </div>
    </div>
  );
});

ChatBubble.displayName = 'ChatBubble';
