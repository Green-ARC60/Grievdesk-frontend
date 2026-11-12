export type SelectedType = 'complaint' | 'service' | 'rules' | 'committee_action';
export type CommitteeAction = 'announcement' | 'dues_reminder';

export interface SendMessagePayload {
  selected_type: SelectedType;
  text: string;
  session_id?: string;
  anonymous?: boolean;
  action?: CommitteeAction;
  pin?: boolean;
  flat_no?: string;
  block_no?: string;
}

export interface SendVoiceMessagePayload {
  selected_type: SelectedType;
  audio: Blob;
  session_id?: string;
  anonymous?: boolean;
  action?: CommitteeAction;
  pin?: boolean;
  flat_no?: string;
  block_no?: string;
}

export interface ComplaintData {
  id: number;
  category: string;
  severity: 'low' | 'medium' | 'high' | string;
  status: string;
  formal_summary?: string;
  is_anonymous: boolean;
  duplicate_of?: number | null;
  created_at?: string;
}

export interface ServiceRequestData {
  id: number;
  service_type: string;
  description: string;
  status: string;
  created_at?: string;
}

export interface AnnouncementData {
  id: number;
  title: string;
  message: string;
  is_pinned: boolean;
  created_at?: string;
}

export interface DuesReminderData {
  name: string;
  reminder: string;
}

export interface ChatMessageResponse {
  reply: string;
  session_id: string;
  reply_local?: string;
  language?: string;
  translation?: string;
  understood?: boolean;
  status?: number;
  input_mode?: 'text' | 'voice';
  transcript?: string;
  complaint?: ComplaintData;
  service_request?: ServiceRequestData;
  announcement?: AnnouncementData;
  reminders?: DuesReminderData[];
  duplicate_of?: number | null;
  error?: string;
  message?: string;
  detail?: string;
}

export interface LocalMessage {
  id: string;
  role: 'user' | 'assistant';
  selected_type: SelectedType;
  text: string;
  text_local?: string;
  language?: string;
  timestamp: string;
  input_mode?: 'text' | 'voice';
  transcript?: string;
  audioUrl?: string;
  understood?: boolean;
  isAnonymous?: boolean;
  action?: CommitteeAction;
  metadata?: {
    complaint?: ComplaintData;
    service_request?: ServiceRequestData;
    announcement?: AnnouncementData;
    reminders?: DuesReminderData[];
    duplicate_of?: number | null;
  };
}

export interface RecentThread {
  session_id: string;
  selected_type: SelectedType;
  title: string | null;
  message_count: number;
  last_message_at: string | null;
}

export interface ThreadMessageItem {
  selected_type: SelectedType;
  role: 'user' | 'assistant';
  content_text: string;
  content_text_local?: string;
  created_at: string | null;
}

export interface ThreadDetailResponse {
  session_id: string;
  messages: ThreadMessageItem[];
  language?: string;
  translation?: string;
}
