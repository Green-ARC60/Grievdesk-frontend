import apiClient from './client';
import {
  SendMessagePayload,
  SendVoiceMessagePayload,
  ChatMessageResponse,
  RecentThread,
  ThreadDetailResponse,
} from '../types/chat';

/**
 * Send text message to POST /api/chat/message (JSON)
 */
export async function sendChatMessageApi(payload: SendMessagePayload): Promise<ChatMessageResponse> {
  const response = await apiClient.post<ChatMessageResponse>('/chat/message', payload);
  return response.data;
}

/**
 * Send audio voice recording to POST /api/chat/message (multipart/form-data)
 */
export async function sendChatVoiceApi(payload: SendVoiceMessagePayload): Promise<ChatMessageResponse> {
  const formData = new FormData();

  // Resolve file extension based on mime type for backend speech.py detection
  let filename = 'voice_note.webm';
  const mime = payload.audio.type.toLowerCase();
  if (mime.includes('ogg')) {
    filename = 'voice_note.ogg';
  } else if (mime.includes('mp4') || mime.includes('m4a')) {
    filename = 'voice_note.m4a';
  } else if (mime.includes('wav')) {
    filename = 'voice_note.wav';
  } else if (mime.includes('mp3') || mime.includes('mpeg')) {
    filename = 'voice_note.mp3';
  }

  formData.append('audio', payload.audio, filename);
  formData.append('selected_type', payload.selected_type);

  if (payload.session_id) {
    formData.append('session_id', payload.session_id);
  }
  if (payload.anonymous !== undefined) {
    formData.append('anonymous', String(payload.anonymous));
  }
  if (payload.action) {
    formData.append('action', payload.action);
  }
  if (payload.pin !== undefined) {
    formData.append('pin', String(payload.pin));
  }
  if (payload.flat_no) {
    formData.append('flat_no', payload.flat_no);
  }
  if (payload.block_no) {
    formData.append('block_no', payload.block_no);
  }

  const response = await apiClient.post<ChatMessageResponse>('/chat/message', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
}

/**
 * Fetch list of recent chat threads from /api/chat/recents (last 7 days)
 */
export async function getRecentThreadsApi(): Promise<RecentThread[]> {
  const response = await apiClient.get<{ threads: RecentThread[] }>('/chat/recents');
  return response.data.threads || [];
}

/**
 * Fetch messages for a specific session thread from /api/chat/recents/:sessionId
 */
export async function getThreadDetailApi(sessionId: string): Promise<ThreadDetailResponse> {
  const response = await apiClient.get<ThreadDetailResponse>(`/chat/recents/${sessionId}`);
  return response.data;
}
