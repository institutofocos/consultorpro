
import React, { createContext, useContext } from 'react';

// Simplified auth context that always returns null/false since user management is removed
interface AuthContextType {
  user: null;
  loading: boolean;
  checkPermission: (moduleName: string, actionType: 'view' | 'edit') => boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: false,
  checkPermission: () => true, // Always allow access since no user management
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <AuthContext.Provider value={{ 
      user: null, 
      loading: false, 
      checkPermission: () => true // Always allow access
    }}>
      {children}
    </AuthContext.Provider>
  );
};
