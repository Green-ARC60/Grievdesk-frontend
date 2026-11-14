import apiClient from './client';
import {
  Vendor,
  CreateVendorPayload,
  UpdateVendorPayload,
  AssignVendorTaskPayload,
  AssignVendorTaskResponse,
} from '../types/vendors';

export async function getVendorsApi(params?: {
  profession?: string;
  search?: string;
}): Promise<Vendor[]> {
  const response = await apiClient.get<Vendor[]>('/vendors', { params });
  return response.data;
}

export async function getProfessionsApi(): Promise<string[]> {
  const response = await apiClient.get<string[]>('/vendors/professions');
  return response.data;
}

export async function getVendorDetailsApi(id: number): Promise<Vendor> {
  const response = await apiClient.get<Vendor>(`/vendors/${id}`);
  return response.data;
}

export async function createVendorApi(
  payload: CreateVendorPayload
): Promise<{ message: string; vendor: Vendor }> {
  const response = await apiClient.post<{ message: string; vendor: Vendor }>(
    '/vendors',
    payload
  );
  return response.data;
}

export async function updateVendorApi(
  id: number,
  payload: UpdateVendorPayload
): Promise<{ message: string; vendor: Vendor }> {
  const response = await apiClient.patch<{ message: string; vendor: Vendor }>(
    `/vendors/${id}`,
    payload
  );
  return response.data;
}

export async function deleteVendorApi(
  id: number
): Promise<{ message: string }> {
  const response = await apiClient.delete<{ message: string }>(`/vendors/${id}`);
  return response.data;
}

export async function assignVendorTaskApi(
  vendorId: number,
  payload: AssignVendorTaskPayload
): Promise<AssignVendorTaskResponse> {
  const response = await apiClient.post<AssignVendorTaskResponse>(
    `/vendors/${vendorId}/assign`,
    payload
  );
  return response.data;
}
