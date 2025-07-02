
import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useUserPermissions } from '@/hooks/useUserPermissions';
import { useDemandNotifications } from '@/hooks/useDemandNotifications';
import {
  LayoutDashboard,
  Users,
  Building2,
  FolderOpen,
  ClipboardList,
  Wrench,
  Calendar,
  DollarSign,
  Settings,
  LogOut,
  Menu,
  X,
  Bell,
  MessageCircle
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

interface NavItem {
  path: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  module: string;
  isPublic?: boolean; // Adicionar esta propriedade para itens públicos
}

const navItems: NavItem[] = [
  {
    path: '/',
    label: 'Dashboard',
    icon: LayoutDashboard,
    module: 'dashboard'
  },
  {
    path: '/consultants',
    label: 'Consultores',
    icon: Users,
    module: 'consultants'
  },
  {
    path: '/clients',
    label: 'Clientes',
    icon: Building2,
    module: 'clients'
  },
  {
    path: '/projects',
    label: 'Projetos',
    icon: FolderOpen,
    module: 'projects'
  },
  {
    path: '/demands',
    label: 'Demandas',
    icon: ClipboardList,
    module: 'demands'
  },
  {
    path: '/services',
    label: 'Serviços',
    icon: Wrench,
    module: 'services'
  },
  {
    path: '/chat',
    label: 'Chat',
    icon: MessageCircle,
    module: 'chat',
    isPublic: true // Marcar como público para todos os usuários
  },
  {
    path: '/calendar',
    label: 'Calendário',
    icon: Calendar,
    module: 'calendar'
  },
  {
    path: '/financial',
    label: 'Financeiro',
    icon: DollarSign,
    module: 'financial'
  },
  {
    path: '/settings',
    label: 'Configurações',
    icon: Settings,
    module: 'settings'
  }
];

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onToggle }) => {
  const { signOut } = useAuth();
  const { hasModulePermission, isLoading } = useUserPermissions();
  const { hasNewDemands, markAllDemandsAsViewed } = useDemandNotifications();
  const location = useLocation();

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleDemandsClick = () => {
    if (hasNewDemands) {
      markAllDemandsAsViewed();
    }
    if (window.innerWidth < 1024) {
      onToggle();
    }
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden" 
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <div className={cn(
        "fixed left-0 top-0 z-50 h-full w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:z-auto",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h1 className="text-xl font-bold text-gray-800">ConsultorPRO</h1>
          <button
            onClick={onToggle}
            className="lg:hidden p-1 rounded-md hover:bg-gray-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-2">
          {isLoading ? (
            <div className="text-center text-gray-500">Carregando...</div>
          ) : (
            navItems
              .filter(item => 
                // Mostrar itens públicos para todos os usuários ou itens com permissão
                item.isPublic || hasModulePermission(item.module, 'view')
              )
              .map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                const isDemands = item.path === '/demands';

                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={cn(
                      "flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors relative",
                      isActive
                        ? "bg-blue-100 text-blue-700"
                        : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                    )}
                    onClick={isDemands ? handleDemandsClick : () => {
                      if (window.innerWidth < 1024) {
                        onToggle();
                      }
                    }}
                  >
                    <Icon className="mr-3 h-5 w-5" />
                    {item.label}
                    
                    {/* Mostrar sino com alerta para demandas */}
                    {isDemands && hasNewDemands && (
                      <div className="ml-auto flex items-center">
                        <div className="relative">
                          <Bell className="h-4 w-4 text-orange-500" />
                          <div className="absolute -top-1 -right-1 h-2 w-2 bg-red-500 rounded-full animate-pulse"></div>
                        </div>
                      </div>
                    )}
                  </NavLink>
                );
              })
          )}
        </nav>

        {/* Footer */}
        <div className="border-t border-gray-200 p-4">
          <button
            onClick={handleSignOut}
            className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-600 rounded-md hover:bg-gray-100 hover:text-gray-900 transition-colors"
          >
            <LogOut className="mr-3 h-5 w-5" />
            Sair
          </button>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
