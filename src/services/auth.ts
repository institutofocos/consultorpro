
import { supabase } from "@/integrations/supabase/client";

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

export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function registerUser(email: string, password: string, userData?: any) {
  const redirectUrl = `${window.location.origin}/`;
  
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: redirectUrl,
      data: userData
    }
  });
  
  if (error) throw error;
  return data;
}

export async function createUserWithProfile(userData: any) {
  return registerUser(userData.email, userData.password, {
    full_name: userData.full_name,
  });
}

export async function setupAdminUsers() {
  // Not needed anymore with the new auth system
  return true;
}

export async function updateUserProfile(userId: string, userData: any) {
  const { data, error } = await supabase.auth.updateUser({
    data: userData
  });
  
  if (error) throw error;
  return data;
}

export async function resetUserPassword(email: string) {
  const redirectUrl = `${window.location.origin}/`;
  
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: redirectUrl,
  });
  
  if (error) throw error;
}

export async function updateUserPermissions(userId: string, moduleName: string, permissions: any) {
  // Not implemented in simplified auth system
  return true;
}

export function hasPermission(user: any, moduleName: string, actionType: 'view' | 'edit'): boolean {
  // Always allow access for authenticated users in simplified system
  return user !== null;
}
