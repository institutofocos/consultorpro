
import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { 
  Users, Briefcase, BarChart2, LineChart, Target, Calendar, 
  FileText, Settings, ChevronLeft, ChevronRight, Layers, Tag,
  Building, ChevronDown, KanbanSquare, ChartGantt, DollarSign,
  StickyNote, MessageSquare
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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

interface NavDropdownItemProps {
  label: string;
  icon: React.ReactNode;
  options: { label: string; to: string; icon: React.ReactNode }[];
  isOpen: boolean;
}

const NavDropdownItem: React.FC<NavDropdownItemProps> = ({ label, icon, options, isOpen }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  return (
    <div className="relative">
      <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
        <DropdownMenuTrigger asChild>
          <button 
            className={cn(
              "flex items-center gap-3 px-3 py-2 my-1 rounded-xl w-full transition-all",
              "hover:bg-white/10 text-white/80",
              !isOpen && "justify-center px-3"
            )}
          >
            {icon}
            {isOpen && (
              <>
                <span className="text-sm flex-1 text-left">{label}</span>
                <ChevronDown className="h-4 w-4" />
              </>
            )}
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent 
          className="bg-gradient-to-b from-blue-600 to-purple-700 border-white/10"
          align={isOpen ? "end" : "center"}
          side={isOpen ? "bottom" : "right"}
          sideOffset={isOpen ? 2 : 10}
        >
          {options.map((option, idx) => (
            <DropdownMenuItem key={idx} asChild className="focus:bg-white/10 focus:text-white">
              <NavLink 
                to={option.to} 
                className={({ isActive }) => cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg w-full",
                  isActive ? "bg-white/20 text-white" : "text-white/80 hover:bg-white/10 hover:text-white"
                )}
              >
                {option.icon}
                <span className="text-sm">{option.label}</span>
              </NavLink>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
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
    { to: '/financial', icon: <DollarSign size={20} />, label: 'Financeiro' },
    { to: '/notes', icon: <StickyNote size={20} />, label: 'Anotações' },
    { to: '/chat', icon: <MessageSquare size={20} />, label: 'Chat Interno' },
    { to: '/kpis', icon: <LineChart size={20} />, label: 'KPIs' },
    { to: '/okrs', icon: <Target size={20} />, label: 'OKRs' },
    { to: '/activities', icon: <Calendar size={20} />, label: 'Lançamentos' },
    // Reports dropdown moved to separate variable
    { to: '/settings', icon: <Settings size={20} />, label: 'Configurações' }
  ];

  const reportOptions = [
    { label: 'Agenda', to: '/reports/calendar', icon: <Calendar size={16} /> },
    { label: 'Kanban', to: '/reports/kanban', icon: <KanbanSquare size={16} /> },
    { label: 'Gantt', to: '/reports/gantt', icon: <ChartGantt size={16} /> }
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
        
        {/* Reports dropdown */}
        <NavDropdownItem
          label="Relatórios"
          icon={<FileText size={20} />}
          options={reportOptions}
          isOpen={isOpen}
        />
      </nav>
      
      {/* Version info */}
      <div className="p-3 text-white/60 text-xs">
        {isOpen ? 'v1.0.0' : ''}
      </div>
    </aside>
  );
};
