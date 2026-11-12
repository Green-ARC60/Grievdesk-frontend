import apiClient from './client';
import { NotificationsResponse } from '../types/announcements';

export async function getMyNotificationsApi(limit = 30, offset = 0): Promise<NotificationsResponse> {
  const response = await apiClient.get<NotificationsResponse>(`/notifications/me?limit=${limit}&offset=${offset}`);
  return response.data;
}

export async function markNotificationReadApi(id: number): Promise<{ message: string }> {
  const response = await apiClient.patch<{ message: string }>(`/notifications/${id}/read`);
  return response.data;
}

export async function markAllNotificationsReadApi(): Promise<{ message: string; marked: number }> {
  const response = await apiClient.post<{ message: string; marked: number }>('/notifications/read-all');
  return response.data;
}

