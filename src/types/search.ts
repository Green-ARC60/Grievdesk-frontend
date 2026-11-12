import { Complaint } from './complaints';
import { Announcement } from './announcements';

export interface ServiceRequestItem {
  id: number;
  user_id: number;
  service_type: string;
  description: string;
  description_local?: string;
  status: string;
  created_at: string;
}

export interface RuleSearchResult {
  section: number;
  snippet: string;
  snippet_local?: string;
}

export interface UnifiedSearchResults {
  query: string;
  query_english?: string | null;
  results?: {
    complaints?: Complaint[];
    service_requests?: ServiceRequestItem[];
    announcements?: Announcement[];
    rules?: RuleSearchResult[];
  };
  totals?: {
    complaints?: number;
    service_requests?: number;
    announcements?: number;
  };
  counts?: {
    complaints?: number;
    service_requests?: number;
    announcements?: number;
    rules?: number;
  };
}

