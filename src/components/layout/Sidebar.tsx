
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { 
  Users, 
  FolderOpen, 
  Settings, 
  Briefcase, 
  DollarSign,
  Calendar,
  AlertTriangle,
  BarChart3,
  Home,
  LogOut,
  User
} from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useUserPermissions } from "@/hooks/useUserPermissions";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";

const menuItems = [
  {
    title: "Dashboard",
    icon: Home,
    href: "/dashboard",
    module: "dashboard"
  },
  {
    title: "Projetos",
    icon: FolderOpen,
    href: "/projetos",
    module: "projects"
  },
  {
    title: "Consultores",
    icon: Users,
    href: "/consultores",
    module: "consultants"
  },
  {
    title: "Clientes",
    icon: Briefcase,
    href: "/clientes",
    module: "clients"
  },
  {
    title: "Serviços",
    icon: BarChart3,
    href: "/servicos",
    module: "services"
  },
  {
    title: "Financeiro",
    icon: DollarSign,
    href: "/financeiro",
    module: "financial"
  },
  {
    title: "Demandas",
    icon: AlertTriangle,
    href: "/demandas",
    module: "demands"
  },
  {
    title: "Calendário",
    icon: Calendar,
    href: "/calendario",
    module: "calendar"
  },
  {
    title: "Configurações",
    icon: Settings,
    href: "/configuracoes",
    module: "settings"
  },
];

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { hasModulePermission, isLoading } = useUserPermissions();

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  const getUserInitials = () => {
    if (user?.user_metadata?.full_name) {
      return user.user_metadata.full_name
        .split(' ')
        .map((name: string) => name[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    return user?.email?.[0]?.toUpperCase() || 'U';
  };

  const getUserName = () => {
    return user?.user_metadata?.full_name || 'Usuário';
  };

  // Filtrar itens de menu baseado nas permissões do usuário
  const visibleMenuItems = menuItems.filter(item => {
    // Dashboard sempre visível
    if (item.module === 'dashboard') return true;
    
    // Durante carregamento, mostrar todos os itens
    if (isLoading) return true;
    
    // Verificar permissão de visualização para o módulo
    return hasModulePermission(item.module, 'view');
  });

  return (
    <div className="pb-4 w-64 flex flex-col h-full">
      <div className="flex-1">
        <div className="space-y-4 py-4">
          <div className="px-3 py-2">
            <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
              ConsultorPRO
            </h2>
            <div className="space-y-1">
              {visibleMenuItems.map((item) => (
                <Button
                  key={item.href}
                  variant={location.pathname === item.href ? "secondary" : "ghost"}
                  className={cn(
                    "w-full justify-start",
                    location.pathname === item.href && "bg-secondary"
                  )}
                  asChild
                >
                  <Link to={item.href}>
                    <item.icon className="mr-2 h-4 w-4" />
                    {item.title}
                  </Link>
                </Button>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      {/* User section */}
      <div className="px-3 py-2 border-t">
        <div className="flex items-center space-x-3 p-2">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-primary text-primary-foreground">
              {getUserInitials()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">
              {getUserName()}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {user?.email}
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start mt-2 text-muted-foreground hover:text-foreground"
          onClick={handleLogout}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sair
        </Button>
      </div>
    </div>
  );
}
