
import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  return (
    <div className="min-h-screen bg-background">
      <div className="flex h-screen overflow-hidden">
        <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
        
        <div className="flex flex-col flex-1 w-full">
          {/* Header */}
          <header className="h-16 px-4 border-b flex items-center justify-between bg-white dark:bg-gray-900">
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
          
          {/* Main content */}
          <main className="flex-1 overflow-y-auto p-6">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
};

export default Layout;
