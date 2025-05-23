import { supabase } from '@/integrations/supabase/client';
import { AuthUser, UserProfile, ModulePermission } from '@/types/auth';
import { User } from '@supabase/supabase-js';

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
    const adminEmails = [
      'contato@eron.dev.br', 
      'augusto.andrademelo@gmail.com',
      'pedroaugusto.andrademelo@gmail.com'
    ];
    const password = '123456789';
    
    const results = [];
    
    // Para cada email de administrador
    for (const email of adminEmails) {
      try {
        // First, check if user exists by attempting to sign in
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password
        });

        if (signInError) {
          console.log(`Usuário ${email} não encontrado ou senha incorreta, criando novo usuário...`);
          
          // Create a new user
          const { data: newUser, error: signUpError } = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: {
                full_name: email === 'contato@eron.dev.br' 
                  ? 'Eron Admin' 
                  : email === 'augusto.andrademelo@gmail.com' 
                    ? 'Augusto Admin'
                    : 'Pedro Augusto Admin',
                role: 'admin'
              }
            }
          });
          
          if (signUpError) {
            console.error(`Erro ao criar usuário ${email}:`, signUpError);
            results.push(`Erro ao criar usuário ${email}: ${signUpError.message}`);
          } else {
            results.push(`Novo usuário ${email} criado com sucesso.`);
            
            // Atualizar perfil para administrador
            if (newUser?.user) {
              const { data: existingProfile } = await supabase
                .from('user_profiles')
                .select('*')
                .eq('id', newUser.user.id)
                .single();
                
              if (!existingProfile) {
                await supabase
                  .from('user_profiles')
                  .insert({
                    id: newUser.user.id,
                    full_name: email === 'contato@eron.dev.br' 
                      ? 'Eron Admin' 
                      : email === 'augusto.andrademelo@gmail.com'
                        ? 'Augusto Admin'
                        : 'Pedro Augusto Admin',
                    role: 'admin'
                  });
              }
            }
          }
        } else {
          // User exists, ensure they have admin profile
          if (signInData?.user) {
            console.log(`Usuário ${email} encontrado, verificando perfil...`);
            
            const { data: existingProfile } = await supabase
              .from('user_profiles')
              .select('*')
              .eq('id', signInData.user.id)
              .single();
              
            if (existingProfile) {
              // Atualizar perfil para administrador
              await supabase
                .from('user_profiles')
                .update({ role: 'admin' })
                .eq('id', signInData.user.id);
                
              results.push(`Usuário ${email} atualizado como administrador com sucesso.`);
            } else {
              // Criar perfil de administrador
              await supabase
                .from('user_profiles')
                .insert({
                  id: signInData.user.id,
                  full_name: email === 'contato@eron.dev.br' 
                    ? 'Eron Admin' 
                    : email === 'augusto.andrademelo@gmail.com'
                      ? 'Augusto Admin'
                      : 'Pedro Augusto Admin',
                  role: 'admin'
                });
                
              results.push(`Perfil de administrador criado para ${email} com sucesso.`);
            }
            
            // Configurar permissões para todos os módulos do sistema
            const systemModules = [
              'dashboard', 'consultants', 'clients', 'projects', 'services', 
              'tags', 'kpis', 'okrs', 'financial', 'activities', 
              'notes', 'chat', 'reports', 'settings'
            ];
            
            for (const moduleName of systemModules) {
              const { data: existingPermission } = await supabase
                .from('module_permissions')
                .select('*')
                .eq('user_id', signInData.user.id)
                .eq('module_name', moduleName)
                .maybeSingle();
              
              if (existingPermission) {
                // Atualizar permissão existente
                await supabase
                  .from('module_permissions')
                  .update({
                    can_view: true,
                    can_edit: true
                  })
                  .eq('id', existingPermission.id);
              } else {
                // Criar nova permissão
                await supabase
                  .from('module_permissions')
                  .insert({
                    user_id: signInData.user.id,
                    module_name: moduleName,
                    can_view: true,
                    can_edit: true
                  });
              }
            }
          }
        }
      } catch (userError: any) {
        console.error(`Erro ao configurar usuário ${email}:`, userError);
        results.push(`Erro ao configurar usuário ${email}: ${userError.message || 'Erro desconhecido'}`);
      }
    }
    
    console.log('Resultados da configuração:', results);
    return results;
  } catch (error) {
    console.error('Erro ao configurar usuários administradores:', error);
    throw error;
  }
}
