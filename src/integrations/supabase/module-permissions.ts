
import { supabase } from './client';

export interface ModulePermission {
  id: string;
  user_id: string;
  module_name: string;
  can_view: boolean;
  can_edit: boolean;
  created_at: string;
  updated_at: string;
}

export async function getUserModulePermissions(userId: string) {
  const { data, error } = await supabase
    .from('module_permissions')
    .select('*')
    .eq('user_id', userId);
  
  if (error) throw error;
  return data as ModulePermission[];
}

export async function createModulePermissions(permissions: Omit<ModulePermission, 'id' | 'created_at' | 'updated_at'>[]) {
  const { data, error } = await supabase
    .from('module_permissions')
    .insert(permissions)
    .select();
  
  if (error) throw error;
  return data;
}

export async function updateModulePermission(
  permissionId: string,
  updates: Partial<Pick<ModulePermission, 'can_view' | 'can_edit'>>
) {
  const { data, error } = await supabase
    .from('module_permissions')
    .update(updates)
    .eq('id', permissionId)
    .select();
  
  if (error) throw error;
  return data;
}

export async function deleteModulePermissions(userId: string, moduleNames?: string[]) {
  let query = supabase
    .from('module_permissions')
    .delete()
    .eq('user_id', userId);
  
  if (moduleNames && moduleNames.length > 0) {
    query = query.in('module_name', moduleNames);
  }
  
  const { error } = await query;
  if (error) throw error;
}
