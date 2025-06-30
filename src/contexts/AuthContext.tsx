
import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
  checkPermission: (moduleName: string, actionType: 'view' | 'edit') => boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  signOut: async () => {},
  checkPermission: () => true,
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('Configurando autenticação...');
    
    // Verificar sessão atual primeiro
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.error('Erro ao verificar sessão:', error);
      } else {
        console.log('Sessão encontrada:', session?.user?.email || 'nenhuma');
        setSession(session);
        setUser(session?.user ?? null);
      }
      setLoading(false);
    });

    // Configurar listener para mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Estado de auth mudou:', event, session?.user?.email || 'sem usuário');
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    return () => {
      console.log('Limpando subscription de auth');
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    console.log('Fazendo logout...');
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Erro no logout:', error);
    }
  };

  const checkPermission = (moduleName: string, actionType: 'view' | 'edit'): boolean => {
    return !!user;
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      session, 
      loading, 
      signOut,
      checkPermission
    }}>
      {children}
    </AuthContext.Provider>
  );
};
