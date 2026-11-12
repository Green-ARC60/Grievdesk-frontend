import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams, useOutletContext } from 'react-router-dom';
import {
  AlertCircle,
  Wrench,
  BookOpen,
  RotateCcw,
  Check,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { TypeChips } from '../components/chat/TypeChips';
import { ChatBubble } from '../components/chat/ChatBubble';
import { ChatInput } from '../components/chat/ChatInput';
import { AILoadingIndicator } from '../components/chat/AILoadingIndicator';
import { Alert } from '../components/ui/Alert';
import {
  SelectedType,
  CommitteeAction,
  LocalMessage,
} from '../types/chat';
import { sendChatMessageApi, sendChatVoiceApi, getThreadDetailApi } from '../api/chat';
import { mapBackendError } from '../api/errorMapper';
import { LayoutContextType } from '../components/layout/Layout';
import { useAudioRecorder } from '../hooks/useAudioRecorder';

const SAMPLE_STARTERS = [
  {
    type: 'complaint' as SelectedType,
    text: 'Water leakage in corridor of Block B on 3rd floor',
    label: 'Plumbing Complaint',
    icon: <AlertCircle className="w-3.5 h-3.5 text-status-escalated-text" />,
  },
  {
    type: 'service' as SelectedType,
    text: 'Need an electrician to inspect master bedroom AC power point',
    label: 'Electrician Request',
    icon: <Wrench className="w-3.5 h-3.5 text-status-inprogress-text" />,
  },
  {
    type: 'rules' as SelectedType,
    text: 'What are the rules and timings for clubhouse and gym usage?',
    label: 'Bylaws Question',
    icon: <BookOpen className="w-3.5 h-3.5 text-status-new-text" />,
  },
];

export const HomePage: React.FC = () => {
  const { user, isCommitteeOrAbove } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const outletContext = useOutletContext<LayoutContextType>();

  // MediaRecorder audio hook
  const audioRecorder = useAudioRecorder();

  // Session state
  const [sessionId, setSessionId] = useState<string>(() => {
    return searchParams.get('session') || crypto.randomUUID();
  });

  // Selected intent & options
  const [selectedType, setSelectedType] = useState<SelectedType | null>(null);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [committeeAction, setCommitteeAction] = useState<CommitteeAction>('announcement');
  const [isPinned, setIsPinned] = useState(false);
  const [targetFlat, setTargetFlat] = useState('');
  const [targetBlock, setTargetBlock] = useState('');

  // Chat message thread
  const [messages, setMessages] = useState<LocalMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isVoiceLoading, setIsVoiceLoading] = useState(false);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastLoadedSessionRef = useRef<string | null>(null);

  // Sync recorder error to banner
  useEffect(() => {
    if (audioRecorder.error) {
      setErrorBanner(audioRecorder.error);
    }
  }, [audioRecorder.error]);

  // Auto-scroll to bottom of chat only when messages change or loading
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages.length, isLoading, audioRecorder.isRecording, scrollToBottom]);

  // Load existing session if ?session= is in URL
  useEffect(() => {
    const urlSession = searchParams.get('session');
    if (urlSession && lastLoadedSessionRef.current !== urlSession) {
      lastLoadedSessionRef.current = urlSession;
      setSessionId(urlSession);
      const fetchThread = async () => {
        setIsLoading(true);
        try {
          const detail = await getThreadDetailApi(urlSession);
          const loaded: LocalMessage[] = (detail?.messages || []).map((m, idx) => ({
            id: `loaded-${idx}`,
            role: m.role,
            selected_type: m.selected_type,
            text: m.content_text,
            text_local: m.content_text_local,
            language: detail?.language,
            timestamp: m.created_at
              ? new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              : '',
          }));
          setMessages(loaded);
        } catch {
          setErrorBanner('Could not load existing chat thread.');
        } finally {
          setIsLoading(false);
        }
      };
      fetchThread();
    }
  }, [searchParams]);

  const startNewChat = useCallback(() => {
    if (audioRecorder.isRecording) {
      audioRecorder.cancelRecording();
    }
    const newId = crypto.randomUUID();
    lastLoadedSessionRef.current = null;
    setSessionId(newId);
    setMessages([]);
    setInputText('');
    setSelectedType(null);
    setIsAnonymous(false);
    setIsPinned(false);
    setTargetFlat('');
    setTargetBlock('');
    setErrorBanner(null);
    setSearchParams({}, { replace: true });
  }, [audioRecorder, setSearchParams]);

  // Handle New Chat triggered from Navbar
  useEffect(() => {
    if (outletContext?.newChatSignal) {
      startNewChat();
    }
  }, [outletContext?.newChatSignal, startNewChat]);

  // 1. Text Message Handler
  const handleSendMessage = useCallback(async () => {
    if (!selectedType || !inputText.trim() || isLoading) return;
    setErrorBanner(null);

    // Validation for dues reminder
    if (selectedType === 'committee_action' && committeeAction === 'dues_reminder') {
      if (!targetFlat.trim() || !targetBlock.trim()) {
        setErrorBanner('Please specify both the Target Flat No and Block/Tower for the dues reminder.');
        return;
      }
    }

    const currentText = inputText.trim();
    const timeString = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Append user message to thread
    const userMsg: LocalMessage = {
      id: `usr-${Date.now()}`,
      role: 'user',
      selected_type: selectedType,
      text: currentText,
      timestamp: timeString,
      isAnonymous: selectedType === 'complaint' && isAnonymous,
      action: selectedType === 'committee_action' ? committeeAction : undefined,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsLoading(true);
    setIsVoiceLoading(false);

    try {
      const response = await sendChatMessageApi({
        selected_type: selectedType,
        text: currentText,
        session_id: sessionId,
        anonymous: selectedType === 'complaint' ? isAnonymous : undefined,
        action: selectedType === 'committee_action' ? committeeAction : undefined,
        pin: selectedType === 'committee_action' && committeeAction === 'announcement' ? isPinned : undefined,
        flat_no: selectedType === 'committee_action' && committeeAction === 'dues_reminder' ? targetFlat.trim() : undefined,
        block_no: selectedType === 'committee_action' && committeeAction === 'dues_reminder' ? targetBlock.trim() : undefined,
      });

      // Update URL with session ID if not present
      if (!searchParams.get('session')) {
        setSearchParams({ session: sessionId }, { replace: true });
      }

      // Append assistant message to thread with translated text (*_local)
      const assistantMsg: LocalMessage = {
        id: `asst-${Date.now()}`,
        role: 'assistant',
        selected_type: selectedType,
        text: response.reply,
        text_local: response.reply_local,
        language: response.language,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        understood: response.understood,
        metadata: {
          complaint: response.complaint,
          service_request: response.service_request,
          announcement: response.announcement,
          reminders: response.reminders,
          duplicate_of: response.duplicate_of,
        },
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: unknown) {
      setErrorBanner(mapBackendError(err));
    } finally {
      setIsLoading(false);
    }
  }, [
    selectedType,
    inputText,
    isLoading,
    committeeAction,
    targetFlat,
    targetBlock,
    isAnonymous,
    sessionId,
    isPinned,
    searchParams,
    setSearchParams,
  ]);

  // 2. Voice Recording Handlers (Phase 3)
  const handleStartRecording = useCallback(() => {
    setErrorBanner(null);
    if (!selectedType) {
      setErrorBanner('Please select an intent chip above before recording your voice note.');
      return;
    }
    audioRecorder.startRecording();
  }, [selectedType, audioRecorder]);

  const handleStopAndSendRecording = useCallback(async () => {
    if (!selectedType) return;
    setErrorBanner(null);

    // Validation for dues reminder
    if (selectedType === 'committee_action' && committeeAction === 'dues_reminder') {
      if (!targetFlat.trim() || !targetBlock.trim()) {
        audioRecorder.cancelRecording();
        setErrorBanner('Please specify both the Target Flat No and Block/Tower for the dues reminder.');
        return;
      }
    }

    try {
      const recording = await audioRecorder.stopRecording();
      if (!recording.blob || recording.blob.size === 0) {
        setErrorBanner('No audio data was recorded. Please check your microphone.');
        return;
      }

      const timeString = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      // Append voice note to user messages
      const userMsg: LocalMessage = {
        id: `usr-voice-${Date.now()}`,
        role: 'user',
        selected_type: selectedType,
        text: `Spoken Voice Note (${audioRecorder.formattedDuration})`,
        input_mode: 'voice',
        audioUrl: recording.url,
        timestamp: timeString,
        isAnonymous: selectedType === 'complaint' && isAnonymous,
        action: selectedType === 'committee_action' ? committeeAction : undefined,
      };

      setMessages((prev) => [...prev, userMsg]);
      setIsLoading(true);
      setIsVoiceLoading(true);

      // Multipart upload
      const response = await sendChatVoiceApi({
        selected_type: selectedType,
        audio: recording.blob,
        session_id: sessionId,
        anonymous: selectedType === 'complaint' ? isAnonymous : undefined,
        action: selectedType === 'committee_action' ? committeeAction : undefined,
        pin: selectedType === 'committee_action' && committeeAction === 'announcement' ? isPinned : undefined,
        flat_no: selectedType === 'committee_action' && committeeAction === 'dues_reminder' ? targetFlat.trim() : undefined,
        block_no: selectedType === 'committee_action' && committeeAction === 'dues_reminder' ? targetBlock.trim() : undefined,
      });

      // Update URL with session ID if not present
      if (!searchParams.get('session')) {
        setSearchParams({ session: sessionId }, { replace: true });
      }

      // Assistant message with "I heard..." transcript and translated reply
      const assistantMsg: LocalMessage = {
        id: `asst-${Date.now()}`,
        role: 'assistant',
        selected_type: selectedType,
        text: response.reply,
        text_local: response.reply_local,
        language: response.language,
        input_mode: 'voice',
        transcript: response.transcript, // The transcribed English statement
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        understood: response.understood,
        metadata: {
          complaint: response.complaint,
          service_request: response.service_request,
          announcement: response.announcement,
          reminders: response.reminders,
          duplicate_of: response.duplicate_of,
        },
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: unknown) {
      setErrorBanner(mapBackendError(err));
    } finally {
      setIsLoading(false);
    }
  }, [
    selectedType,
    committeeAction,
    targetFlat,
    targetBlock,
    audioRecorder,
    isAnonymous,
    sessionId,
    isPinned,
    searchParams,
    setSearchParams,
  ]);

  // Derived 3-step progress
  const step1Done = selectedType !== null;
  const step1Current = !step1Done;
  const step2Done = step1Done && (inputText.trim().length > 0 || audioRecorder.isRecording);
  const step2Current = step1Done && !step2Done;
  const step3Done = messages.length > 0 && !isLoading;
  const step3Current = step2Done && !step3Done;

  return (
    <div className="flex-1 flex flex-col max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Session Header / New Chat Pill */}
      <div className="flex items-center justify-between pb-3 mb-4 border-b border-border text-xs text-muted">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-text">AI Assistant Desk</span>
          <span className="text-border">&bull;</span>
          <span className="font-mono text-[11px] text-muted">
            Session: {sessionId.slice(0, 8)}...
          </span>
        </div>

        {messages.length > 0 && (
          <button
            type="button"
            onClick={startNewChat}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-control text-muted hover:text-accent hover:bg-surface-2 border border-border transition-colors font-medium text-xs"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Chat</span>
          </button>
        )}
      </div>

      {errorBanner && (
        <div className="mb-4 animate-fadeIn">
          <Alert variant="error" onClose={() => setErrorBanner(null)}>
            {errorBanner}
          </Alert>
        </div>
      )}

      {/* Chat Messages Feed / Empty State */}
      <div className="flex-1 overflow-y-auto space-y-4 min-h-[350px] pb-6">
        {messages.length === 0 ? (
          /* Empty State: Compact Noticeboard Greeting, 3-Step Strip & Quick Starters */
          <div className="h-full flex flex-col justify-center py-4 px-2 sm:px-4 max-w-xl mx-auto w-full animate-fadeIn">
            <div className="mb-5">
              <h1 className="text-24 sm:text-30 font-heading font-bold text-text tracking-tight">
                {(() => {
                  const hour = new Date().getHours();
                  if (hour < 12) return 'Good morning';
                  if (hour < 17) return 'Good afternoon';
                  return 'Good evening';
                })()}, {user?.name ? user.name.split(' ')[0] : 'Resident'}
              </h1>
              <div className="w-12 h-1 bg-highlight rounded-full mt-2 mb-2.5" aria-hidden="true" />
              <p className="text-xs sm:text-sm text-muted leading-normal">
                Submit a grievance, request society service, or query bylaws.
              </p>
            </div>

            {/* 3-step numbered strip */}
            <nav aria-label="Submission steps" className="mb-5 p-2 sm:p-2.5 rounded-card bg-surface border-[1.5px] border-border shadow-soft">
              <ol className="flex items-center justify-between text-xs">
                {/* Step 1 */}
                <li className="flex items-center gap-2 flex-1 min-w-0">
                  <span className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center text-[11px] sm:text-xs shrink-0 ${
                    step1Done 
                      ? 'bg-accent text-accent-text font-bold' 
                      : step1Current 
                      ? 'bg-highlight text-highlight-text font-bold' 
                      : 'bg-surface-2 text-muted border border-border'
                  }`}>
                    {step1Done ? <Check className="w-3 sm:w-3.5 h-3 sm:h-3.5 text-current" /> : '1'}
                  </span>
                  <span className={`text-[11px] sm:text-xs truncate ${step1Current ? 'font-bold text-text' : step1Done ? 'font-medium text-text' : 'text-muted'}`}>
                    Choose category
                  </span>
                </li>

                <div className="w-3 sm:w-6 h-[1.5px] bg-border shrink-0 mx-1 sm:mx-1.5" />

                {/* Step 2 */}
                <li className="flex items-center gap-2 flex-1 min-w-0">
                  <span className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center text-[11px] sm:text-xs shrink-0 ${
                    step2Done 
                      ? 'bg-accent text-accent-text font-bold' 
                      : step2Current 
                      ? 'bg-highlight text-highlight-text font-bold' 
                      : 'bg-surface-2 text-muted border border-border'
                  }`}>
                    {step2Done ? <Check className="w-3 sm:w-3.5 h-3 sm:h-3.5 text-current" /> : '2'}
                  </span>
                  <span className={`text-[11px] sm:text-xs truncate ${step2Current ? 'font-bold text-text' : step2Done ? 'font-medium text-text' : 'text-muted'}`}>
                    Describe or speak
                  </span>
                </li>

                <div className="w-3 sm:w-6 h-[1.5px] bg-border shrink-0 mx-1 sm:mx-1.5" />

                {/* Step 3 */}
                <li className="flex items-center gap-2 flex-1 min-w-0">
                  <span className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center text-[11px] sm:text-xs shrink-0 ${
                    step3Done 
                      ? 'bg-accent text-accent-text font-bold' 
                      : step3Current 
                      ? 'bg-highlight text-highlight-text font-bold' 
                      : 'bg-surface-2 text-muted border border-border'
                  }`}>
                    {step3Done ? <Check className="w-3 sm:w-3.5 h-3 sm:h-3.5 text-current" /> : '3'}
                  </span>
                  <span className={`text-[11px] sm:text-xs truncate ${step3Current ? 'font-bold text-text' : step3Done ? 'font-medium text-text' : 'text-muted'}`}>
                    Send
                  </span>
                </li>
              </ol>
            </nav>

            {/* Quick starters: ONE bordered card with header badge and divided rows */}
            <div className="border-[1.5px] border-border rounded-card divide-y divide-border overflow-hidden bg-surface shadow-soft mb-5">
              <div className="flex items-center justify-between px-3.5 py-2.5 bg-surface-2/60 border-b border-border">
                <span className="text-xs font-semibold text-text uppercase tracking-wider font-mono">
                  Quick Starters
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-control bg-tan text-tan-text uppercase tracking-wider font-mono">
                  Try an example
                </span>
              </div>
              {SAMPLE_STARTERS.map((starter, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    setSelectedType(starter.type);
                    setInputText(starter.text);
                  }}
                  className="group relative w-full p-3.5 text-left bg-surface hover:bg-surface-2 focus-visible:bg-surface-2 active:bg-surface-2/80 transition-colors duration-200 ease-calm flex items-center justify-between focus:outline-none focus-visible:ring-1 focus-visible:ring-accent/40"
                >
                  {/* Left edge 2px accent bar: fades in opacity 0 to 1 */}
                  <span
                    className="absolute left-0 top-0 bottom-0 w-[2px] bg-accent opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity duration-200 ease-calm pointer-events-none"
                    aria-hidden="true"
                  />

                  <div className="min-w-0 pr-3 flex items-start gap-2.5">
                    <span className="mt-0.5 shrink-0">{starter.icon}</span>
                    <div className="min-w-0">
                      <span className="text-xs font-semibold text-text block mb-0.5">
                        {starter.label}
                      </span>
                      <p className="text-xs text-muted truncate">
                        "{starter.text}"
                      </p>
                    </div>
                  </div>

                  {/* Arrow nudges 3px right and eases from muted to accent */}
                  <span
                    className="text-xs text-muted group-hover:text-accent group-focus-visible:text-accent group-hover:translate-x-[3px] group-focus-visible:translate-x-[3px] group-active:translate-x-[3px] transition-all duration-200 ease-calm font-mono shrink-0"
                    aria-hidden="true"
                  >
                    &rarr;
                  </span>
                </button>
              ))}
            </div>

            <p className="text-[11px] text-muted font-mono">
              Records are maintained in English; replies are translated into your preferred language ({user?.preferred_language.toUpperCase()}).
            </p>
          </div>
        ) : (
          /* Active Thread Feed */
          <div className="space-y-4">
            {messages.map((msg, index) => (
              <ChatBubble
                key={msg.id}
                message={msg}
                userPreferredLang={user?.preferred_language}
                isNewest={index === messages.length - 1}
              />
            ))}

            {isLoading && (
              <AILoadingIndicator isVoiceLoading={isVoiceLoading} />
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Sticky Bottom Area: Type Selector Chips + Input Bar */}
      <div className="sticky bottom-0 bg-bg pt-2 pb-2 space-y-2.5">
        <TypeChips
          selectedType={selectedType}
          onSelectType={setSelectedType}
          isStaff={isCommitteeOrAbove}
          isAnonymous={isAnonymous}
          onToggleAnonymous={setIsAnonymous}
          committeeAction={committeeAction}
          onSelectCommitteeAction={setCommitteeAction}
          isPinned={isPinned}
          onTogglePin={setIsPinned}
          targetFlat={targetFlat}
          onChangeTargetFlat={setTargetFlat}
          targetBlock={targetBlock}
          onChangeTargetBlock={setTargetBlock}
        />

        <ChatInput
          text={inputText}
          onChangeText={setInputText}
          onSend={handleSendMessage}
          isLoading={isLoading}
          selectedType={selectedType}
          committeeAction={committeeAction}
          isRecording={audioRecorder.isRecording}
          recordingDuration={audioRecorder.formattedDuration}
          onStartRecording={handleStartRecording}
          onStopAndSendRecording={handleStopAndSendRecording}
          onCancelRecording={audioRecorder.cancelRecording}
        />
      </div>
    </div>
  );
};
