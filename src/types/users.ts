import { Role, ApprovalStatus, User } from './auth';

export interface DirectoryUser {
  id: number;
  name: string;
  flat_no: string;
  block_no: string;
  role: Role;
  phone?: string | null;
  gmail?: string;
  preferred_language?: string;
  approval_status?: ApprovalStatus;
  alt_phones?: string[];
}

export interface UpdateProfileRequest {
  name?: string;
  phone?: string;
  preferred_language?: string;
  share_phone?: boolean;
  flat_no?: string;
  block_no?: string;
  current_password?: string;
  new_password?: string;
  confirm_reapproval?: boolean;
}

export interface UpdateProfileResponse {
  message: string;
  user: User;
}

export interface DirectoryUsersResponse {
  users: DirectoryUser[];
}

