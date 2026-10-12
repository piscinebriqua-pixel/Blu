export interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: 'admin' | 'technician' | 'client' | string;
  is_approved: boolean;
  created_at: string;
  technician_id?: string | null;
  client_id?: string | null;
}

export interface Technician {
  id: string;
  full_name: string;
  email: string | null;
}

export interface Client {
  id: string;
  full_name?: string;
  first_name: string;
  last_name: string;
  email: string | null;
}

export type AdminRoleFilter = 'all' | 'pending' | 'technician' | 'client' | 'admin';

export type AdminActionType =
  | 'link_technician'
  | 'link_client'
  | 'create_technician'
  | 'create_client'
  | 'make_admin'
  | 'edit_profile'
  | 'reset_password'
  | 'create_user'
  | null;
