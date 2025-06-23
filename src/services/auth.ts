
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
        data: userData
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

export async function createUserWithProfile(userData: {
  email: string;
  password: string;
  full_name: string;
  role: 'admin' | 'consultant' | 'client';
  permissions?: ModulePermission[];
}) {
  console.log('Creating user with profile:', userData);
  
  try {
    // Create the user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: userData.email,
      password: userData.password,
      email_confirm: true,
      user_metadata: {
        full_name: userData.full_name,
        role: userData.role
      }
    });

    if (authError) {
      console.error('Auth user creation error:', authError);
      throw authError;
    }

    if (!authData.user) {
      throw new Error('Usuário não foi criado corretamente');
    }

    console.log('Auth user created:', authData.user.id);

    // Create user profile
    const { error: profileError } = await supabase
      .from('user_profiles')
      .insert({
        id: authData.user.id,
        full_name: userData.full_name,
        role: userData.role,
        email: userData.email,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

    if (profileError) {
      console.error('Profile creation error:', profileError);
      // Try to clean up the auth user
      try {
        await supabase.auth.admin.deleteUser(authData.user.id);
      } catch (cleanupError) {
        console.error('Failed to cleanup auth user:', cleanupError);
      }
      throw profileError;
    }

    console.log('User profile created successfully');

    // Create module permissions if provided
    if (userData.permissions && userData.permissions.length > 0) {
      const permissionsToInsert = userData.permissions.map(permission => ({
        user_id: authData.user!.id,
        module_name: permission.module_name,
        can_view: permission.can_view,
        can_edit: permission.can_edit,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }));

      const { error: permissionsError } = await supabase
        .from('module_permissions')
        .insert(permissionsToInsert);

      if (permissionsError) {
        console.error('Permissions creation error:', permissionsError);
        // Don't fail the entire process for permissions errors
      } else {
        console.log('Module permissions created successfully');
      }
    }

    return {
      user: authData.user,
      profile: {
        id: authData.user.id,
        full_name: userData.full_name,
        role: userData.role,
        email: userData.email
      }
    };
  } catch (error) {
    console.error('Create user with profile error:', error);
    throw error;
  }
}

export async function updateUserProfile(userId: string, userData: Partial<Omit<UserProfile, 'created_at' | 'updated_at' | 'id'>>) {
  // Convert Date objects to ISO strings for Supabase
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
  
  // Administradores sempre têm todas as permissões
  if (user.profile.role === 'admin') return true;
  
  const permission = user.permissions.find(p => p.module_name === moduleName);
  if (!permission) return false;
  
  return actionType === 'view' ? permission.can_view : permission.can_edit;
}
