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
  console.log('Registering user:', { email, userData });
  
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: userData,
        emailRedirectTo: undefined // Disable email confirmation redirect
      }
    });
    
    if (error) {
      console.error('Auth signup error:', error);
      throw error;
    }
    
    console.log('User registered successfully:', data);
    return data;
  } catch (error) {
    console.error('Registration error:', error);
    throw error;
  }
}

interface ModulePermissionInput {
  module_name: string;
  can_view: boolean;
  can_edit: boolean;
}

export async function createUserWithProfile(userData: {
  email: string;
  password: string;
  full_name: string;
  role: 'admin' | 'consultant' | 'manager' | 'financial' | 'client';
  permissions?: ModulePermissionInput[];
}) {
  try {
    console.log('Creating user with data:', userData);

    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: userData.email,
      password: userData.password,
      options: {
        data: {
          full_name: userData.full_name,
          role: userData.role
        }
      }
    });

    if (authError) {
      console.error('Auth signup error:', authError);
      throw authError;
    }

    if (!authData.user) {
      throw new Error('User creation failed - no user returned');
    }

    console.log('Auth user created:', authData.user.id);

    // Create user profile
    const { error: profileError } = await supabase
      .from('user_profiles')
      .insert({
        id: authData.user.id,
        full_name: userData.full_name,
        email: userData.email,
        role: userData.role,
        is_active: true,
        email_confirmed: authData.user.email_confirmed_at !== null
      });

    if (profileError) {
      console.error('Profile creation error:', profileError);
      throw profileError;
    }

    console.log('User profile created');

    // Create module permissions
    if (userData.permissions && userData.permissions.length > 0) {
      const permissionsData = userData.permissions.map(permission => ({
        user_id: authData.user.id,
        module_name: permission.module_name,
        can_view: permission.can_view,
        can_edit: permission.can_edit
      }));

      const { error: permissionsError } = await supabase
        .from('module_permissions')
        .insert(permissionsData);

      if (permissionsError) {
        console.error('Permissions creation error:', permissionsError);
        throw permissionsError;
      }

      console.log('Module permissions created');
    }

    return {
      user: authData.user,
      profile: {
        id: authData.user.id,
        full_name: userData.full_name,
        email: userData.email,
        role: userData.role
      }
    };

  } catch (error) {
    console.error('Error in createUserWithProfile:', error);
    throw error;
  }
}

export async function setupAdminUsers() {
  const adminEmails = [
    'contato@eron.dev.br',
    'augusto.andrademelo@gmail.com',
    'pedroaugusto.andrademelo@gmail.com'
  ];
  
  const defaultPassword = '123456789';
  const results: string[] = [];
  
  for (const email of adminEmails) {
    try {
      console.log(`Configurando admin: ${email}`);
      
      const userData = {
        email,
        password: defaultPassword,
        full_name: 'Administrador',
        role: 'admin' as const,
        permissions: [
          { module_name: 'dashboard', can_view: true, can_edit: true },
          { module_name: 'consultants', can_view: true, can_edit: true },
          { module_name: 'clients', can_view: true, can_edit: true },
          { module_name: 'projects', can_view: true, can_edit: true },
          { module_name: 'services', can_view: true, can_edit: true },
          { module_name: 'demands', can_view: true, can_edit: true },
          { module_name: 'calendar', can_view: true, can_edit: true },
          { module_name: 'financial', can_view: true, can_edit: true },
          { module_name: 'settings', can_view: true, can_edit: true }
        ]
      };

      const result = await createUserWithProfile(userData);
      results.push(`✅ Administrador criado: ${email}`);
      console.log(`Admin criado com sucesso: ${email}`);
    } catch (error: any) {
      const errorMsg = `❌ Erro ao criar ${email}: ${error.message}`;
      results.push(errorMsg);
      console.error(`Erro ao criar admin ${email}:`, error);
    }
  }
  
  return results;
}

export async function updateUserProfile(userId: string, userData: Partial<Omit<UserProfile, 'created_at' | 'updated_at' | 'id'>>) {
  const dbUpdates = {
    ...userData,
    last_login: userData.last_login?.toISOString(),
    updated_at: new Date().toISOString()
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
      .update({
        ...permissions,
        updated_at: new Date().toISOString()
      })
      .eq('id', existingPermission.id);
    
    if (error) throw error;
  } else {
    const { error } = await supabase
      .from('module_permissions')
      .insert([{ 
        user_id: userId, 
        module_name: moduleName, 
        ...permissions,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }]);
    
    if (error) throw error;
  }
}

export function hasPermission(user: AuthUser | null, moduleName: string, actionType: 'view' | 'edit'): boolean {
  if (!user || !user.permissions || !user.profile) return false;
  
  if (user.profile.role === 'admin') return true;
  
  const permission = user.permissions.find(p => p.module_name === moduleName);
  if (!permission) return false;
  
  return actionType === 'view' ? permission.can_view : permission.can_edit;
}
