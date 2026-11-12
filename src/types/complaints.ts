export type SeverityLevel = 'low' | 'medium' | 'high';
export type ComplaintStatusType = 'new' | 'in_progress' | 'resolved' | 'escalated';

export const COMPLAINT_CATEGORIES = [
  'Plumbing',
  'Electrical',
  'Water Supply',
  'Sanitation',
  'Parking',
  'Noise',
  'Security',
  'Other',
] as const;

export type ComplaintCategoryType = (typeof COMPLAINT_CATEGORIES)[number];

export const COMPLAINT_STATUSES: { value: ComplaintStatusType; label: string }[] = [
  { value: 'new', label: 'New' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'escalated', label: 'Escalated' },
];

export interface TicketTimelineEvent {
  id: number;
  ticket_type: string;
  ticket_id: number;
  action: string;
  detail?: string | null;
  actor_name?: string | null;
  actor_role?: string | null;
  note?: string | null;
  note_local?: string | null;
  created_at: string;
}

export interface Complaint {
  id: number;
  flat_no: string | null;
  block_no: string | null;
  submitted_by: string | null;
  is_anonymous: boolean;
  category: string;
  severity: SeverityLevel;
  status: ComplaintStatusType;
  translated_text: string;
  translated_text_local?: string;
  duplicate_of: number | null;
  reports_count?: number | null;
  assigned_to: string | null;
  resolution_notes: string | null;
  resolution_notes_local?: string | null;
  audio_available: boolean;
  created_at: string;
  timeline?: TicketTimelineEvent[];
  linked_reports?: number[];
}

export interface ComplaintsFilterParams {
  status?: string;
  category?: string;
  severity?: string;
  block?: string;
  limit?: number;
  offset?: number;
}

export interface ComplaintsListResponse {
  complaints: Complaint[];
  total: number;
  limit: number;
  offset: number;
  language?: string;
  translation?: string;
}

export interface ServiceRequestTicket {
  id: number;
  user_id: number;
  service_type: string;
  description: string;
  description_local?: string;
  preferred_time?: string | null;
  status: string;
  created_at: string;
  timeline?: TicketTimelineEvent[];
}

export interface MyTicketsResponse {
  complaints: Complaint[];
  service_requests: ServiceRequestTicket[];
  language?: string;
  translation?: string;
}

export interface StaffUser {
  id: number;
  name: string;
  role: 'secretary' | 'committee';
  flat_no: string;
  block_no: string;
}

