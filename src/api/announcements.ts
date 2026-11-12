import apiClient from './client';
import {
  AnnouncementsResponse,
  Announcement,
  ResidentDuesResponse,
  StaffDuesResponse,
  Due,
  CreateDuePayload,
  DuesFilterParams,
} from '../types/announcements';

// ----------------------------------------------------
// Announcements APIs
// ----------------------------------------------------

export async function getAnnouncementsApi(limit = 20, offset = 0): Promise<AnnouncementsResponse> {
  const response = await apiClient.get<AnnouncementsResponse>(`/announcements?limit=${limit}&offset=${offset}`);
  return response.data;
}

export async function pinAnnouncementApi(id: number, pinned: boolean): Promise<{ message: string; announcement: Announcement }> {
  const response = await apiClient.patch<{ message: string; announcement: Announcement }>(
    `/announcements/${id}/pin`,
    { pinned }
  );
  return response.data;
}

export async function editAnnouncementApi(
  id: number,
  data: { title?: string; message?: string }
): Promise<{ message: string; announcement: Announcement }> {
  const response = await apiClient.patch<{ message: string; announcement: Announcement }>(
    `/announcements/${id}`,
    data
  );
  return response.data;
}

export async function deleteAnnouncementApi(id: number): Promise<{ message: string }> {
  const response = await apiClient.delete<{ message: string }>(`/announcements/${id}`);
  return response.data;
}

// ----------------------------------------------------
// Dues APIs
// ----------------------------------------------------

export async function getMyDuesApi(): Promise<ResidentDuesResponse> {
  const response = await apiClient.get<ResidentDuesResponse>('/dues/me');
  return response.data;
}

export async function getStaffDuesApi(params?: DuesFilterParams): Promise<StaffDuesResponse> {
  const query = new URLSearchParams();
  if (params?.status) query.append('status', params.status);
  if (params?.month) query.append('month', params.month);
  if (params?.flat_no) query.append('flat_no', params.flat_no);
  if (params?.block_no) query.append('block_no', params.block_no);

  const response = await apiClient.get<StaffDuesResponse>(`/dues?${query.toString()}`);
  return response.data;
}

export async function createDueApi(payload: CreateDuePayload): Promise<{ message: string; due: Due }> {
  const response = await apiClient.post<{ message: string; due: Due }>('/dues', payload);
  return response.data;
}

export async function markDuePaidApi(id: number, paid: boolean): Promise<{ message: string; due: Due }> {
  const response = await apiClient.patch<{ message: string; due: Due }>(`/dues/${id}/mark-paid`, { paid });
  return response.data;
}

export async function remindDueApi(id: number, note?: string): Promise<{ message: string; reminder: string }> {
  const response = await apiClient.post<{ message: string; reminder: string }>(`/dues/${id}/remind`, { note });
  return response.data;
}

