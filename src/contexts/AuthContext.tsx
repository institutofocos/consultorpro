
import React, { createContext, useContext, useEffect, useState } from 'react';
import { AuthUser } from '@/types/auth';
import { getCurrentUser, hasPermission } from '@/services/auth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from "@/hooks/use-toast";

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  checkPermission: (moduleName: string, actionType: 'view' | 'edit') => boolean;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  checkPermission: () => false,
  refreshUser: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = async () => {
    try {
      const userData = await getCurrentUser();
      setUser(userData);
    } catch (error) {
      console.error('Erro ao atualizar dados do usuário:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível atualizar os dados do usuário",
      });
    }
  };

  useEffect(() => {
    async function loadUser() {
      try {
        await refreshUser();
      } finally {
        setLoading(false);
      }
    }
    
    loadUser();

    // Configurar listener para alterações na autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event) => {
        if (event === 'SIGNED_IN') {
          await refreshUser();
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const checkPermission = (moduleName: string, actionType: 'view' | 'edit'): boolean => {
    return hasPermission(user, moduleName, actionType);
  };

  return (
    <AuthContext.Provider value={{ user, loading, checkPermission, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};
