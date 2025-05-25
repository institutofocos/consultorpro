
import React from 'react';
import { Sidebar } from './Sidebar';
import { useAuth } from '@/contexts/AuthContext';
import ChatNotification from "@/components/chat/ChatNotification";

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user } = useAuth();
  
  return (
    <div className="h-screen flex overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-auto p-6 md:p-8 pt-6">
        {children}
      </main>
      
      {/* Adiciona o componente de notificação */}
      <ChatNotification userId={user?.id} />
    </div>
  );
};

export default Layout;
