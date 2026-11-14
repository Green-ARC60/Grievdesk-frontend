export interface VendorTask {
  id: number;
  vendor_id: number;
  complaint_id: number;
  notes?: string | null;
  status: string;
  assigned_by: string;
  assigned_by_id: number;
  complaint_summary?: string | null;
  complaint_category?: string | null;
  complaint_status?: string | null;
  flat_no?: string | null;
  block_no?: string | null;
  created_at?: string | null;
}

export interface Vendor {
  id: number;
  name: string;
  profession: string;
  email: string;
  phone: string;
  address: string;
  notes?: string | null;
  tasks_count: number;
  tasks?: VendorTask[];
  created_at?: string | null;
  updated_at?: string | null;
}

export interface CreateVendorPayload {
  name: string;
  profession: string;
  email: string;
  phone: string;
  address: string;
  notes?: string;
}

export interface UpdateVendorPayload {
  name?: string;
  profession?: string;
  email?: string;
  phone?: string;
  address?: string;
  notes?: string;
}

export interface AssignVendorTaskPayload {
  complaint_id: number;
  notes?: string;
}

export interface AssignVendorTaskResponse {
  message: string;
  vendor_task: VendorTask;
  complaint_status: string;
  email_sent: boolean;
}
