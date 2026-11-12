import apiClient from './client';
import {
  ComplaintsFilterParams,
  ComplaintsListResponse,
  Complaint,
  MyTicketsResponse,
  StaffUser,
} from '../types/complaints';

/**
 * Fetch complaints list for Public Inbox with filters and pagination
 */
export async function getComplaintsApi(params: ComplaintsFilterParams): Promise<ComplaintsListResponse> {
  const query = new URLSearchParams();
  if (params.status) query.append('status', params.status);
  if (params.category) query.append('category', params.category);
  if (params.severity) query.append('severity', params.severity);
  if (params.block) query.append('block', params.block);
  if (params.limit !== undefined) query.append('limit', String(params.limit));
  if (params.offset !== undefined) query.append('offset', String(params.offset));

  const response = await apiClient.get<ComplaintsListResponse>(`/complaints?${query.toString()}`);
  return response.data;
}

/**
 * Fetch single complaint details including audit timeline and linked reports
 */
export async function getComplaintDetailApi(id: number): Promise<Complaint> {
  const response = await apiClient.get<Complaint>(`/complaints/${id}`);
  return response.data;
}

/**
 * Staff Control: Update status of a complaint (in_progress, resolved, escalated)
 */
export async function updateComplaintStatusApi(
  id: number,
  status: string,
  notes?: string
): Promise<{ message: string; complaint: Complaint }> {
  const response = await apiClient.patch<{ message: string; complaint: Complaint }>(
    `/complaints/${id}/status`,
    { status, notes }
  );
  return response.data;
}

/**
 * Staff Control: Assign complaint to committee member or secretary (or null to unassign)
 */
export async function assignComplaintApi(
  id: number,
  assigned_to: number | null
): Promise<{ message: string; complaint: Complaint }> {
  const response = await apiClient.patch<{ message: string; complaint: Complaint }>(
    `/complaints/${id}/assign`,
    { assigned_to }
  );
  return response.data;
}

/**
 * Staff Control: Link complaint as duplicate of target ID or unlink (null)
 */
export async function setComplaintDuplicateApi(
  id: number,
  duplicate_of: number | null
): Promise<{ message: string; complaint: Complaint }> {
  const response = await apiClient.patch<{ message: string; complaint: Complaint }>(
    `/complaints/${id}/duplicate`,
    { duplicate_of }
  );
  return response.data;
}

/**
 * Fetch complaint voice recording blob with Bearer token authentication
 */
export async function getComplaintAudioBlobUrl(id: number): Promise<string> {
  const response = await apiClient.get(`/complaints/${id}/audio`, {
    responseType: 'blob',
  });
  return URL.createObjectURL(response.data as Blob);
}

/**
 * Fetch current user's raised tickets and service requests with timelines
 */
export async function getMyTicketsApi(): Promise<MyTicketsResponse> {
  const response = await apiClient.get<MyTicketsResponse>('/my-tickets');
  return response.data;
}

/**
 * Fetch committee & secretary staff members for assignment dropdown
 */
export async function getStaffUsersApi(): Promise<StaffUser[]> {
  try {
    const response = await apiClient.get<{ users: { id: number; name: string; role: string; flat_no: string; block_no: string }[] }>('/users');
    const allUsers = response.data.users || [];
    return allUsers.filter((u) => u.role === 'committee' || u.role === 'secretary') as StaffUser[];
  } catch {
    return [];
  }
}

