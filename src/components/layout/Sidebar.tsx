
import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  Users, Briefcase, BarChart2, LineChart, Target, Calendar, 
  FileText, Settings, ChevronLeft, ChevronRight, Layers, Tag,
  Building
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

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

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, setIsOpen }) => {
  const navItems = [
    { to: '/', icon: <BarChart2 size={20} />, label: 'Dashboard' },
    { to: '/consultants', icon: <Users size={20} />, label: 'Consultores' },
    { to: '/clients', icon: <Building size={20} />, label: 'Clientes' },
    { to: '/projects', icon: <Briefcase size={20} />, label: 'Projetos' },
    { to: '/services', icon: <Layers size={20} />, label: 'Serviços' },
    { to: '/tags', icon: <Tag size={20} />, label: 'Tags' },
    { to: '/kpis', icon: <LineChart size={20} />, label: 'KPIs' },
    { to: '/okrs', icon: <Target size={20} />, label: 'OKRs' },
    { to: '/activities', icon: <Calendar size={20} />, label: 'Lançamentos' },
    { to: '/reports', icon: <FileText size={20} />, label: 'Relatórios' },
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
      
      {/* Version info */}
      <div className="p-3 text-white/60 text-xs">
        {isOpen ? 'v1.0.0' : ''}
      </div>
    </aside>
  );
};
