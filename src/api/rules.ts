import apiClient from './client';
import { RulebookAskResponse, RulebookUploadResponse } from '../types/rules';

export const uploadRulebookFileApi = async (file: File): Promise<RulebookUploadResponse> => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await apiClient.post<RulebookUploadResponse>('/rules/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const uploadRulebookTextApi = async (
  contentText: string
): Promise<RulebookUploadResponse> => {
  const response = await apiClient.post<RulebookUploadResponse>('/rules/upload', {
    content_text: contentText,
  });
  return response.data;
};

export const askRulebookApi = async (text: string): Promise<RulebookAskResponse> => {
  const response = await apiClient.post<RulebookAskResponse>('/rules/ask', { text });
  return response.data;
};

