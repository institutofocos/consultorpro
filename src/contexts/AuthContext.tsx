
import React, { createContext, useContext, useEffect, useState } from 'react';
import { AuthUser } from '@/types/auth';
import { getCurrentUser, hasPermission } from '@/services/auth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from "@/hooks/use-toast";

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  checkPermission: (moduleName: string, actionType: 'view' | 'edit') => boolean;
  refreshUser: () => Promise<AuthUser | null>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  checkPermission: () => false,
  refreshUser: async () => null,
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = async () => {
    try {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
      return currentUser;
    } catch (error) {
      console.error('Error refreshing user:', error);
      setUser(null);
      return null;
    }
  };

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.id);
        
        if (session?.user) {
          // User is signed in, fetch their profile
          setTimeout(async () => {
            try {
              const currentUser = await getCurrentUser();
              setUser(currentUser);
            } catch (error) {
              console.error('Error getting current user:', error);
              setUser(null);
            } finally {
              setLoading(false);
            }
          }, 0);
        } else {
          // User is signed out
          setUser(null);
          setLoading(false);
        }
      }
    );

    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const currentUser = await getCurrentUser();
          setUser(currentUser);
        }
      } catch (error) {
        console.error('Error getting initial session:', error);
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    return () => subscription.unsubscribe();
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
