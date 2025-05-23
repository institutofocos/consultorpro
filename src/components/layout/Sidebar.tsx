
import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  Users, Briefcase, BarChart2, LineChart, 
  FileText, Settings, ChevronLeft, ChevronRight, Layers, Tag,
  Building, KanbanSquare, DollarSign,
  CheckSquare, MessageSquare, FileCheck, LogOut
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from '@/contexts/AuthContext';
import { logoutUser } from '@/services/auth';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

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
  const { user, checkPermission } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const handleLogout = async () => {
    try {
      await logoutUser();
      navigate('/auth');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
      toast({
        variant: "destructive",
        title: "Erro ao sair",
        description: "Não foi possível fazer logout. Tente novamente."
      });
    }
  };

  const navItems = [
    { to: '/', icon: <BarChart2 size={20} />, label: 'Dashboard' },
    { to: '/consultants', icon: <Users size={20} />, label: 'Consultores' },
    { to: '/clients', icon: <Building size={20} />, label: 'Clientes' },
    { to: '/projects', icon: <Briefcase size={20} />, label: 'Projetos' },
    { to: '/services', icon: <Layers size={20} />, label: 'Serviços' },
    { to: '/tags', icon: <Tag size={20} />, label: 'Tags' },
    { to: '/demands', icon: <FileCheck size={20} />, label: 'Demandas' },
    { to: '/financial', icon: <DollarSign size={20} />, label: 'Financeiro' },
    { to: '/notes', icon: <CheckSquare size={20} />, label: 'Tarefas' },
    { to: '/chat', icon: <MessageSquare size={20} />, label: 'Chat Interno' },
    { to: '/kpis', icon: <LineChart size={20} />, label: 'KPIs / OKRs' },
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
      
      {/* User profile - Added at the bottom with spacing */}
      {user && (
        <div className="px-2 pb-4 mt-8 border-t border-white/10 pt-4">
          <div className={cn(
            "flex items-center gap-3 px-3 py-3 rounded-xl",
            "text-white/90 bg-white/5",
            !isOpen && "justify-center"
          )}>
            <Avatar className="h-8 w-8 bg-primary/10">
              <AvatarFallback className="text-sm font-medium text-primary">
                {user.profile?.full_name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            
            {isOpen && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user.profile?.full_name}</p>
                <p className="text-xs text-white/70 capitalize truncate">{user.profile?.role}</p>
              </div>
            )}
            
            {isOpen && (
              <Button 
                variant="ghost" 
                size="icon"
                className="h-7 w-7 rounded-full text-white/70 hover:text-white hover:bg-white/10"
                onClick={handleLogout}
                title="Sair"
              >
                <LogOut size={16} />
              </Button>
            )}
          </div>
        </div>
      )}
      
      {/* Version info */}
      <div className="p-3 text-white/60 text-xs">
        {isOpen ? 'v1.0.0' : ''}
      </div>
    </aside>
  );
};

export default Sidebar;
