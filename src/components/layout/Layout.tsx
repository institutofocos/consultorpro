
import React, { useState } from 'react';
import Sidebar from './Sidebar';
import { useAuth } from '@/contexts/AuthContext';
import { Menu } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  if (!user) {
    return <div>{children}</div>;
  }
  
  return (
    <div className="h-screen flex overflow-hidden bg-gray-50">
      {/* Mobile menu button */}
      <button
        onClick={toggleSidebar}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white border border-gray-200 rounded-md shadow-md hover:bg-gray-50 transition-colors"
        aria-label="Toggle menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      <Sidebar isOpen={isSidebarOpen} onToggle={toggleSidebar} />
      
      <main className="flex-1 overflow-auto">
        <div className="p-6 md:p-8 pt-16 lg:pt-6">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
