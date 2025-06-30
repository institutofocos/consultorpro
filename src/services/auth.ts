
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
  
  try {
    // Verificar conectividade com Supabase antes de tentar registrar
    const { data: testData, error: testError } = await supabase.auth.getSession();
    if (testError) {
      console.error('Teste de conectividade falhou:', testError);
      throw new Error('Falha na conexão com o servidor. Verifique sua internet.');
    }
    
    const redirectUrl = `${window.location.origin}/`;
    console.log('URL de redirecionamento:', redirectUrl);
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: userData?.fullName || userData?.full_name || '',
          ...userData
        }
      }
    });
    
    if (error) {
      console.error('Erro detalhado no registro:', {
        message: error.message,
        status: error.status,
        details: error
      });
      
      // Melhorar mensagens de erro
      if (error.message.includes('Invalid API key')) {
        throw new Error('Erro de configuração do sistema. Contate o administrador.');
      } else if (error.message.includes('User already registered')) {
        throw new Error('Este email já está cadastrado. Tente fazer login.');
      } else if (error.message.includes('Password')) {
        throw new Error('A senha deve ter pelo menos 6 caracteres.');
      } else {
        throw new Error(`Erro no cadastro: ${error.message}`);
      }
    }
    
    console.log('Registro bem-sucedido:', data);
    return data;
    
  } catch (error: any) {
    console.error('Erro inesperado no registro:', error);
    throw error;
  }
}

export async function resetUserPassword(email: string) {
  console.log('Solicitando redefinição de senha para:', email);
  
  const redirectUrl = `${window.location.origin}/reset-password`;
  
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: redirectUrl,
  });
  
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
