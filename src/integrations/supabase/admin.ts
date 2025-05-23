
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
  
  // Convert string dates to Date objects
  return (data as any[]).map(profile => ({
    ...profile,
    created_at: new Date(profile.created_at),
    updated_at: new Date(profile.updated_at),
    last_login: profile.last_login ? new Date(profile.last_login) : undefined
  })) as UserProfile[];
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
  // Convert Date objects to ISO strings for Supabase
  const dbUpdates = {
    ...updates,
    last_login: updates.last_login?.toISOString()
  };
  
  const { data, error } = await supabase
    .from('user_profiles')
    .update(dbUpdates)
    .eq('id', userId);
  
  if (error) throw error;
  return data;
}

export async function updateUserLastLogin(userId: string) {
  return updateUserProfile(userId, { last_login: new Date() });
}
