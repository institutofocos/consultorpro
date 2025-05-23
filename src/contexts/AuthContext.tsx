
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
  // Create a default admin user to bypass login
  const defaultUser: AuthUser = {
    id: 'default-admin-id',
    email: 'admin@example.com',
    profile: {
      id: 'default-admin-id',
      full_name: 'Admin User',
      role: 'admin',
      created_at: new Date(),
      updated_at: new Date()
    },
    permissions: [
      // Add permissions for all modules
      ...['dashboard', 'consultants', 'clients', 'projects', 'services', 
          'tags', 'kpis', 'okrs', 'financial', 'activities', 
          'notes', 'chat', 'reports', 'settings', 'demands'].map(module => ({
        id: `${module}-permission`,
        user_id: 'default-admin-id',
        module_name: module,
        can_view: true,
        can_edit: true,
        created_at: new Date(),
        updated_at: new Date()
      }))
    ]
  };
  
  const [user, setUser] = useState<AuthUser | null>(defaultUser);
  const [loading, setLoading] = useState(false); // Set loading to false immediately

  const refreshUser = async () => {
    // In bypass mode, always return the default user
    return defaultUser;
  };

  // No need to listen for auth state changes or load user data
  // We're bypassing authentication entirely

  const checkPermission = (moduleName: string, actionType: 'view' | 'edit'): boolean => {
    // In bypass mode, all permissions are granted
    return true;
  };

  return (
    <AuthContext.Provider value={{ user, loading, checkPermission, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};
