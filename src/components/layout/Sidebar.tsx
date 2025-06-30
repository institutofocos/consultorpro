
import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  Users, Briefcase, BarChart2, 
  FileText, Settings, ChevronLeft, ChevronRight, Layers,
  Building, KanbanSquare, DollarSign, Calendar, LogOut
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from '@/contexts/AuthContext';
import { toast } from "sonner";

interface NavItemProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  isOpen: boolean;
}

const NavItem: React.FC<NavItemProps> = ({ to, icon, label, isOpen }) => {
  return (
    <NavLink 
      to={to} 
      className={({ isActive }) => cn(
        "flex items-center gap-3 px-3 py-2 my-1 rounded-xl transition-all",
        "hover:bg-white/10",
        isActive ? "bg-white/20 text-white font-medium" : "text-white/80",
        !isOpen && "justify-center px-3"
      )}
      end
    >
      {icon}
      {isOpen && <span className="text-sm">{label}</span>}
    </NavLink>
  );
};

export const Sidebar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(true);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut();
      toast.success('Logout realizado com sucesso!');
      navigate('/login');
    } catch (error) {
      toast.error('Erro ao fazer logout');
    }
  };

  const navItems = [
    { to: '/', icon: <BarChart2 size={20} />, label: 'Dashboard' },
    { to: '/consultants', icon: <Users size={20} />, label: 'Consultores' },
    { to: '/clients', icon: <Building size={20} />, label: 'Clientes' },
    { to: '/projects', icon: <Briefcase size={20} />, label: 'Projetos' },
    { to: '/services', icon: <Layers size={20} />, label: 'Serviços' },
    { to: '/demands', icon: <FileText size={20} />, label: 'Demandas' },
    { to: '/calendar', icon: <Calendar size={20} />, label: 'Calendário' },
    { to: '/financial', icon: <DollarSign size={20} />, label: 'Financeiro' },
    { to: '/settings', icon: <Settings size={20} />, label: 'Configurações' }
  ];

  return (
    <aside 
      className={cn(
        "h-screen bg-gradient-to-b from-blue-600 to-purple-700 text-white flex flex-col transition-all duration-300",
        isOpen ? "w-56" : "w-16"
      )}
    >
      {/* Logo area */}
      <div className={cn(
        "flex items-center gap-2 h-16 px-3", 
        isOpen ? "justify-start" : "justify-center"
      )}>
        {isOpen ? (
          <h2 className="font-display font-bold text-xl">Consultor<span className="text-green-400">PRO</span></h2>
        ) : (
          <span className="text-green-400 font-display font-bold text-xl">C</span>
        )}
      </div>
      
      {/* Toggle button */}
      <Button 
        variant="ghost" 
        size="icon"
        onClick={() => setIsOpen(!isOpen)} 
        className="ml-auto mr-2 text-white opacity-80 hover:opacity-100 hover:bg-white/10"
      >
        {isOpen ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
      </Button>
      
      {/* Nav items */}
      <nav className="flex-1 px-2 py-3">
        {navItems.map((item, index) => (
          <NavItem
            key={index}
            to={item.to}
            icon={item.icon}
            label={item.label}
            isOpen={isOpen}
          />
        ))}
      </nav>
      
      {/* User info and logout */}
      <div className="p-3 border-t border-white/10">
        {user && (
          <>
            {isOpen && (
              <div className="text-white/80 text-xs mb-3">
                <p className="truncate">{user.email}</p>
              </div>
            )}
            <Button
              variant="ghost"
              size={isOpen ? "sm" : "icon"}
              onClick={handleLogout}
              className={cn(
                "text-white/80 hover:text-white hover:bg-white/10 transition-colors",
                isOpen ? "w-full justify-start" : "w-8 h-8"
              )}
            >
              <LogOut size={16} />
              {isOpen && <span className="ml-2">Sair</span>}
            </Button>
          </>
        )}
      </div>
      
      {/* Version info */}
      <div className="p-3 text-white/60 text-xs">
        {isOpen ? 'v1.0.0' : ''}
      </div>
    </aside>
  );
};

export default Sidebar;
