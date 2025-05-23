
import { supabase } from '@/integrations/supabase/client';
import { AuthUser, UserProfile, ModulePermission } from '@/types/auth';

export async function loginWithEmail(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  
  if (error) throw error;
  return data;
}

export async function logoutUser() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session?.user) return null;
  
  const user: AuthUser = {
    id: session.user.id,
    email: session.user.email ?? '',
  };
  
  // Buscar perfil do usuário
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', user.id)
    .single();
    
  if (profile) {
    user.profile = {
      ...profile,
      created_at: new Date(profile.created_at),
      updated_at: new Date(profile.updated_at),
      last_login: profile.last_login ? new Date(profile.last_login) : undefined
    };
  }
  
  // Buscar permissões do usuário
  const { data: permissions } = await supabase
    .from('module_permissions')
    .select('*')
    .eq('user_id', user.id);
    
  if (permissions) {
    user.permissions = permissions;
  }
  
  return user;
}

export async function registerUser(email: string, password: string, userData: {
  full_name: string;
  role: 'admin' | 'consultant' | 'client';
}) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: userData
    }
  });
  
  if (error) throw error;
  return data;
}

export async function updateUserProfile(userId: string, userData: Partial<UserProfile>) {
  const { data, error } = await supabase
    .from('user_profiles')
    .update(userData)
    .eq('id', userId);
  
  if (error) throw error;
  return data;
}

export async function resetUserPassword(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  });
  
  if (error) throw error;
  return true;
}

export async function updateUserPermissions(userId: string, moduleName: string, permissions: {
  can_view: boolean;
  can_edit: boolean;
}) {
  const { data: existingPermission } = await supabase
    .from('module_permissions')
    .select('*')
    .eq('user_id', userId)
    .eq('module_name', moduleName)
    .single();

  if (existingPermission) {
    const { error } = await supabase
      .from('module_permissions')
      .update(permissions)
      .eq('id', existingPermission.id);
    
    if (error) throw error;
  } else {
    const { error } = await supabase
      .from('module_permissions')
      .insert([{ user_id: userId, module_name: moduleName, ...permissions }]);
    
    if (error) throw error;
  }
}

export function hasPermission(user: AuthUser | null, moduleName: string, actionType: 'view' | 'edit'): boolean {
  if (!user || !user.permissions || !user.profile) return false;
  
  // Administradores sempre têm todas as permissões
  if (user.profile.role === 'admin') return true;
  
  const permission = user.permissions.find(p => p.module_name === moduleName);
  if (!permission) return false;
  
  return actionType === 'view' ? permission.can_view : permission.can_edit;
}
