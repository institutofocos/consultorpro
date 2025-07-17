
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
  Home
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";

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

  return (
    <div className="pb-12 w-64">
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
  );
}
