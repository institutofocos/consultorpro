
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
    console.log('Configurando listener de autenticação...');
    
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email || 'no user');
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.error('Erro ao verificar sessão inicial:', error);
      } else {
        console.log('Sessão inicial:', session?.user?.email || 'no session');
      }
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => {
      console.log('Limpando subscription de auth');
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    console.log('Fazendo signOut...');
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
  };

  const checkPermission = (moduleName: string, actionType: 'view' | 'edit'): boolean => {
    // Since we're using simplified auth, always allow access for authenticated users
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
