
import { useState } from "react";
import { 
  Home, 
  Users, 
  FileText, 
  Briefcase, 
  DollarSign, 
  BarChart3, 
  MessageSquare,
  Settings,
  Target,
  Tags,
  Calendar,
  ChevronDown,
  ChevronRight
} from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

const Sidebar = () => {
  const location = useLocation();
  const [expandedSections, setExpandedSections] = useState<string[]>(['main']);

  const toggleSection = (section: string) => {
    setExpandedSections(prev => 
      prev.includes(section) 
        ? prev.filter(s => s !== section)
        : [...prev, section]
    );
  };

  const menuItems = [
    {
      section: 'main',
      title: 'Principal',
      items: [
        { name: "Dashboard", path: "/", icon: Home },
        { name: "Clientes", path: "/clients", icon: Users },
        { name: "Consultores", path: "/consultants", icon: Users },
        { name: "Serviços", path: "/services", icon: Briefcase },
        { name: "Projetos", path: "/projects", icon: FileText },
      ]
    },
    {
      section: 'communication',
      title: 'Comunicação',
      items: [
        { name: "Chat", path: "/chat", icon: MessageSquare },
        { name: "Anotações", path: "/notes", icon: FileText },
      ]
    },
    {
      section: 'management',
      title: 'Gestão',
      items: [
        { name: "Financeiro", path: "/financial", icon: DollarSign },
        { name: "Relatórios", path: "/reports", icon: BarChart3 },
        { name: "OKRs", path: "/okrs", icon: Target },
        { name: "Indicadores", path: "/indicators", icon: BarChart3 },
        { name: "Tags", path: "/tags", icon: Tags },
      ]
    },
    {
      section: 'system',
      title: 'Sistema',
      items: [
        { name: "Configurações", path: "/settings", icon: Settings },
      ]
    }
  ];

  return (
    <div className="bg-white border-r border-gray-200 w-64 min-h-screen">
      <div className="p-6">
        <h1 className="text-xl font-bold text-gray-800">Sistema</h1>
      </div>
      
      <nav className="mt-6">
        {menuItems.map((section) => (
          <div key={section.section} className="mb-4">
            <button
              onClick={() => toggleSection(section.section)}
              className="flex items-center justify-between w-full px-6 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50"
            >
              <span>{section.title}</span>
              {expandedSections.includes(section.section) ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </button>
            
            {expandedSections.includes(section.section) && (
              <div className="mt-1">
                {section.items.map((item) => (
                  <NavLink
                    key={item.name}
                    to={item.path}
                    className={({ isActive }) =>
                      cn(
                        "flex items-center px-8 py-2 text-sm font-medium rounded-md transition-colors",
                        isActive
                          ? "bg-blue-50 text-blue-700 border-r-2 border-blue-700"
                          : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                      )
                    }
                  >
                    <item.icon className="mr-3 h-4 w-4" />
                    {item.name}
                  </NavLink>
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>
    </div>
  );
};

export default Sidebar;
