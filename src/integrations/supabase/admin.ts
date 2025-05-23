
import { supabase } from './client';
import { ModulePermission, UserProfile } from '@/types/auth';

export async function listUsers() {
  const { data, error } = await supabase.auth.admin.listUsers();
  
  if (error) throw error;
  return data;
}

export async function getUserProfiles() {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*');
  
  if (error) throw error;
  return data as UserProfile[];
}

export async function getUserPermissions(userId: string) {
  const { data, error } = await supabase
    .from('module_permissions')
    .select('*')
    .eq('user_id', userId);
  
  if (error) throw error;
  return data as ModulePermission[];
}

export async function createUserPermission(permission: {
  user_id: string;
  module_name: string;
  can_view: boolean;
  can_edit: boolean;
}) {
  const { data, error } = await supabase
    .from('module_permissions')
    .insert([permission]);
  
  if (error) throw error;
  return data;
}

export async function updateUserPermission(
  permissionId: string,
  updates: {
    can_view?: boolean;
    can_edit?: boolean;
  }
) {
  const { data, error } = await supabase
    .from('module_permissions')
    .update(updates)
    .eq('id', permissionId);
  
  if (error) throw error;
  return data;
}

export async function updateUserProfile(
  userId: string,
  updates: {
    full_name?: string;
    role?: 'admin' | 'consultant' | 'client';
    last_login?: Date;
  }
) {
  const { data, error } = await supabase
    .from('user_profiles')
    .update(updates)
    .eq('id', userId);
  
  if (error) throw error;
  return data;
}

export async function updateUserLastLogin(userId: string) {
  return updateUserProfile(userId, { last_login: new Date() });
}
