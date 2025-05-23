
export interface UserProfile {
  id: string;
  full_name: string;
  role: 'admin' | 'consultant' | 'client' | 'manager' | 'commercial' | 'financial' | 'marketing' | 'intern';
  created_at: Date;
  updated_at: Date;
  last_login?: Date;
}

export interface ModulePermission {
  id: string;
  user_id: string;
  module_name: string;
  can_view: boolean;
  can_edit: boolean;
}

export interface AuthUser {
  id: string;
  email: string;
  profile?: UserProfile;
  permissions?: ModulePermission[];
}

export interface Module {
  id: string;
  name: string;
  description?: string;
  path: string;
}
