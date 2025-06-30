
import { supabase } from "@/integrations/supabase/client";

export async function loginWithEmail(email: string, password: string) {
  console.log('Tentativa de login:', { email });
  
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  
  if (error) {
    console.error('Erro no login:', error);
    throw error;
  }
  
  console.log('Login bem-sucedido:', data);
  return data;
}

export async function logoutUser() {
  console.log('Fazendo logout...');
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.error('Erro no logout:', error);
    throw error;
  }
  console.log('Logout realizado com sucesso');
}

export async function getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) {
    console.error('Erro ao buscar usuário atual:', error);
    throw error;
  }
  return user;
}

export async function registerUser(email: string, password: string, userData?: any) {
  console.log('Tentativa de registro:', { email, userData });
  
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: userData?.fullName || userData?.full_name || '',
        ...userData
      }
    }
  });
  
  if (error) {
    console.error('Erro no registro:', error);
    
    // Melhorar mensagens de erro
    if (error.message.includes('User already registered')) {
      throw new Error('Este email já está cadastrado. Tente fazer login.');
    } else if (error.message.includes('Password should be at least')) {
      throw new Error('A senha deve ter pelo menos 6 caracteres.');
    } else if (error.message.includes('Unable to validate email address')) {
      throw new Error('Email inválido. Verifique o formato do email.');
    } else if (error.message.includes('signup is disabled')) {
      throw new Error('Cadastro de novos usuários está temporariamente desabilitado.');
    } else {
      throw new Error(`Erro no cadastro: ${error.message}`);
    }
  }
  
  console.log('Registro bem-sucedido:', data);
  return data;
}

export async function resetUserPassword(email: string) {
  console.log('Solicitando redefinição de senha para:', email);
  
  const { error } = await supabase.auth.resetPasswordForEmail(email);
  
  if (error) {
    console.error('Erro na redefinição de senha:', error);
    throw error;
  }
  
  console.log('Email de redefinição enviado com sucesso');
}

export function hasPermission(user: any, moduleName: string, actionType: 'view' | 'edit'): boolean {
  // Always allow access for authenticated users in simplified system
  return user !== null;
}
