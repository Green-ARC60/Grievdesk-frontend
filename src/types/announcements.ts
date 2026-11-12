export interface Announcement {
  id: number;
  title: string;
  title_local?: string;
  message: string;
  message_local?: string;
  is_pinned: boolean;
  posted_by_name?: string;
  created_at: string;
}

export interface AnnouncementsResponse {
  pinned: Announcement[];
  general: Announcement[];
  general_total: number;
  limit: number;
  offset: number;
  language?: string;
  translation?: string;
}

export type PaidStatusType = 'paid' | 'unpaid';

export interface Due {
  id: number;
  user_id: number;
  resident_name?: string;
  flat_no?: string;
  block_no?: string;
  month: string; // YYYY-MM
  amount: string | number;
  due_date: string; // YYYY-MM-DD
  paid_status: PaidStatusType;
  paid_at?: string | null;
}

export interface ResidentDuesResponse {
  dues: Due[];
  total_unpaid: string;
  unpaid_count: number;
}

export interface StaffDuesResponse {
  dues: Due[];
  total_unpaid: string;
  count: number;
}

export interface CreateDuePayload {
  month: string;
  amount: number | string;
  due_date: string;
  flat_no?: string;
  block_no?: string;
  user_id?: number;
}

export interface DuesFilterParams {
  status?: string;
  month?: string;
  flat_no?: string;
  block_no?: string;
}

export interface NotificationItem {
  id: number;
  type: 'announcement' | 'due_reminder' | 'role_change' | 'due_update' | string;
  message: string;
  message_local?: string;
  target_user_id?: number | null;
  read: boolean;
  created_at: string;
}

export interface NotificationsResponse {
  notifications: NotificationItem[];
  unread_count: number;
  total: number;
  limit: number;
  offset: number;
  language?: string;
  translation?: string;
}

