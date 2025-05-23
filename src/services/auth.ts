
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
      role: profile.role as 'admin' | 'consultant' | 'client',
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

export async function updateUserProfile(userId: string, userData: Partial<Omit<UserProfile, 'created_at' | 'updated_at' | 'id'>>) {
  // Convert Date objects to ISO strings for Supabase
  const dbUpdates = {
    ...userData,
    last_login: userData.last_login?.toISOString()
  };
  
  const { data, error } = await supabase
    .from('user_profiles')
    .update(dbUpdates)
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

// Função para configurar usuários administradores com senhas específicas
export async function setupAdminUsers() {
  try {
    // Lista de emails de administradores e suas senhas
    const adminEmails = ['contato@eron.dev.br', 'augusto.andrademelo@gmail.com'];
    const password = '123456789';
    
    // Para cada email de administrador
    for (const email of adminEmails) {
      // Buscar usuário pelo email
      const { data } = await supabase.auth.admin.listUsers();
      
      // Fix: proper typing to find the user by email
      const user = data?.users?.find(u => u.email === email);
      
      if (user) {
        // Atualizar senha do usuário
        await supabase.auth.admin.updateUserById(
          user.id,
          { password }
        );
        
        // Atualizar perfil para administrador
        await supabase
          .from('user_profiles')
          .update({ role: 'admin' })
          .eq('id', user.id);
        
        console.log(`Usuário ${email} configurado como administrador com sucesso.`);
      } else {
        // If user doesn't exist, let's create it
        const { data: newUser, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: email === 'contato@eron.dev.br' ? 'Eron Admin' : 'Augusto Admin',
              role: 'admin'
            }
          }
        });
        
        if (signUpError) {
          console.error(`Erro ao criar usuário ${email}:`, signUpError);
        } else {
          console.log(`Novo usuário ${email} criado com sucesso.`);
        }
      }
    }
    
    return true;
  } catch (error) {
    console.error('Erro ao configurar usuários administradores:', error);
    throw error;
  }
}
