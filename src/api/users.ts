import apiClient from './client';
import { User } from '../types/auth';
import {
  DirectoryUser,
  DirectoryUsersResponse,
  UpdateProfileRequest,
  UpdateProfileResponse,
} from '../types/users';

export const getUserProfileApi = async (): Promise<User> => {
  const response = await apiClient.get<{ user: User }>('/users/me');
  return response.data.user;
};

export const updateUserProfileApi = async (
  data: UpdateProfileRequest
): Promise<UpdateProfileResponse> => {
  const response = await apiClient.put<UpdateProfileResponse>('/users/me', data);
  return response.data;
};

export const getDirectoryUsersApi = async (
  status: string = 'approved'
): Promise<DirectoryUser[]> => {
  const response = await apiClient.get<DirectoryUsersResponse>('/users', {
    params: { status },
  });
  return response.data?.users || [];
};

export const approveUserApi = async (
  userId: number
): Promise<{ message: string; user: DirectoryUser }> => {
  const response = await apiClient.patch<{ message: string; user: DirectoryUser }>(
    `/users/${userId}/approve`
  );
  return response.data;
};

export const promoteToCommitteeApi = async (
  userId: number
): Promise<{ message: string; user: DirectoryUser }> => {
  const response = await apiClient.patch<{ message: string; user: DirectoryUser }>(
    `/users/${userId}/promote-to-committee`
  );
  return response.data;
};

export const demoteUserApi = async (
  userId: number
): Promise<{ message: string; user: DirectoryUser }> => {
  const response = await apiClient.patch<{ message: string; user: DirectoryUser }>(
    `/users/${userId}/demote`
  );
  return response.data;
};

export const transferSecretaryApi = async (
  userId: number
): Promise<{ message: string; new_secretary: DirectoryUser; you: DirectoryUser }> => {
  const response = await apiClient.patch<{
    message: string;
    new_secretary: DirectoryUser;
    you: DirectoryUser;
  }>(`/users/${userId}/transfer-secretary`, { confirm: true });
  return response.data;
};

