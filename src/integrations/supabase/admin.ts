
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

export async function resetUserPassword(email: string, newPassword: string) {
  const { data, error } = await supabase.auth.admin.updateUserById(
    'email', // Este valor será ignorado, usaremos o email para buscar o usuário
    {
      email,
      password: newPassword,
    }
  );
  
  if (error) throw error;
  return data;
}

export async function setAdminUsers(emails: string[]) {
  for (const email of emails) {
    // Buscar usuário pelo email
    const { data: userData, error: userError } = await supabase.auth.admin.listUsers();
    
    if (userError) throw userError;
    
    const user = userData.users.find(u => u.email === email);
    
    if (user) {
      // Atualizar perfil para administrador
      await updateUserProfile(user.id, { role: 'admin' });
      
      // Garantir que o usuário tenha todas as permissões de módulo
      const systemModules = [
        'dashboard', 'consultants', 'clients', 'projects', 'services', 
        'tags', 'kpis', 'okrs', 'financial', 'activities', 
        'notes', 'chat', 'reports', 'settings'
      ];
      
      for (const moduleName of systemModules) {
        const { data: existingPermission } = await supabase
          .from('module_permissions')
          .select('*')
          .eq('user_id', user.id)
          .eq('module_name', moduleName)
          .maybeSingle();
        
        if (existingPermission) {
          // Atualizar permissão existente
          await updateUserPermission(existingPermission.id, {
            can_view: true,
            can_edit: true
          });
        } else {
          // Criar nova permissão
          await createUserPermission({
            user_id: user.id,
            module_name: moduleName,
            can_view: true,
            can_edit: true
          });
        }
      }
    }
  }
  
  return true;
}

