export interface AuthUser {
  id: string;
  email: string;
}

export interface UserProfile {
  id: string;
  full_name: string;
  role: string;
  created_at: Date;
  updated_at: Date;
}

export interface ModulePermission {
  id: string;
  user_id: string;
  module_name: string;
  can_view: boolean;
  can_edit: boolean;
}
