
import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import ChatNotification from "@/components/chat/ChatNotification";

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <header className="border-b bg-card h-16 z-10 sticky top-0 flex items-center px-6 md:px-8">
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="mr-4"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-display font-semibold">Consultor<span className="text-blue-600">PRO</span></h1>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Placeholder for user profile/settings */}
          <div className="bg-blue-100 dark:bg-blue-900 h-8 w-8 rounded-full flex items-center justify-center">
            <span className="text-sm font-medium text-blue-600 dark:text-blue-400">AD</span>
          </div>
        </div>
      </header>
      
      <div className="flex flex-1 overflow-hidden">
        <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
        <main className="flex-1 overflow-auto p-6 md:p-8 pt-6">
          {children}
        </main>
      </div>
      
      {/* Adiciona o componente de notificação */}
      <ChatNotification />
    </div>
  );
};

export default Layout;
