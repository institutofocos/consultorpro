
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";

const menuItems = [
  {
    title: "Dashboard",
    icon: Home,
    href: "/dashboard",
  },
  {
    title: "Projetos",
    icon: FolderOpen,
    href: "/projetos",
  },
  {
    title: "Consultores",
    icon: Users,
    href: "/consultores",
  },
  {
    title: "Clientes",
    icon: Briefcase,
    href: "/clientes",
  },
  {
    title: "Serviços",
    icon: BarChart3,
    href: "/servicos",
  },
  {
    title: "Financeiro",
    icon: DollarSign,
    href: "/financeiro",
  },
  {
    title: "Demandas",
    icon: AlertTriangle,
    href: "/demandas",
  },
  {
    title: "Calendário",
    icon: Calendar,
    href: "/calendario",
  },
  {
    title: "Configurações",
    icon: Settings,
    href: "/configuracoes",
  },
];

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

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

  return (
    <div className="pb-4 w-64 flex flex-col h-full">
      <div className="flex-1">
        <div className="space-y-4 py-4">
          <div className="px-3 py-2">
            <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
              ConsultorPRO
            </h2>
            <div className="space-y-1">
              {menuItems.map((item) => (
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
