
import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { useAuth } from '@/contexts/AuthContext';

export const Layout: React.FC = () => {
  const { user } = useAuth();
  
  return (
    <div className="h-screen flex overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-auto p-6 md:p-8 pt-6">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
