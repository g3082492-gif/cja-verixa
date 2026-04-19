import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type UserRole = 'owner' | 'staff' | 'team_leader' | 'viewer';

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  created_at: string;
}

export interface Task {
  id: string;
  serial_number: string;
  client_name: string;
  gst_number?: string;
  pan_number?: string;
  work_type: string;
  assigned_to_id?: string;
  team_leader_id?: string;
  received_date: string;
  due_date: string;
  status: 'pending' | 'in-progress' | 'completed';
  delay_reason?: string;
  remarks?: string;
  created_by: string;
  created_at: string;
}
