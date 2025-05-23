
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Auth from "./pages/Auth";
import { AuthProvider, useAuth } from "./contexts/AuthContext";

// Import components
import ConsultantList from "./components/consultants/ConsultantList";
import ProjectList from "./components/projects/ProjectList";
import ServiceList from "./components/services/ServiceList";
import TagList from "./components/tags/TagList";
import KpiList from "./components/kpis/KpiList";
import OkrList from "./components/okrs/OkrList";
import Layout from "./components/layout/Layout";
import ActivitiesList from "./components/activities/ActivitiesList";
import SettingsPage from "./components/settings/SettingsPage";
import ClientList from "./components/clients/ClientList";
import FinancialPage from "./components/financial/FinancialPage";
import NotesPage from "./pages/Notes";
import ChatPage from "./components/chat/ChatPage";

// Import reports components
import ReportsLayout from "./components/reports/ReportsLayout";
import ReportsCalendar from "./components/reports/ReportsCalendar";
import ReportsKanban from "./components/reports/ReportsKanban";
import ReportsGantt from "./components/reports/ReportsGantt";

// Componente de proteção de rotas que verifica autenticação
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

// Componente de verificação de permissão para módulos específicos
const PermissionRoute = ({ 
  children, 
  moduleName, 
  actionType = 'view' 
}: { 
  children: React.ReactNode;
  moduleName: string;
  actionType?: 'view' | 'edit';
}) => {
  const { checkPermission, user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  // Se não estiver autenticado, redireciona para login
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Verifica permissão para o módulo
  const hasPermission = checkPermission(moduleName, actionType);

  if (!hasPermission) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center h-[60vh] text-center">
          <h2 className="text-2xl font-bold mb-2">Acesso restrito</h2>
          <p className="text-muted-foreground mb-4">
            Você não possui permissão para acessar este módulo.
          </p>
        </div>
      </Layout>
    );
  }

  return <>{children}</>;
};

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Rota de autenticação pública */}
            <Route path="/auth" element={<Auth />} />
            
            {/* Rotas protegidas */}
            <Route path="/" element={
              <ProtectedRoute>
                <Layout><Index /></Layout>
              </ProtectedRoute>
            } />
            
            <Route path="/consultants" element={
              <PermissionRoute moduleName="consultants">
                <Layout>
                  <ConsultantList />
                </Layout>
              </PermissionRoute>
            } />
            
            <Route path="/clients" element={
              <PermissionRoute moduleName="clients">
                <Layout>
                  <ClientList />
                </Layout>
              </PermissionRoute>
            } />
            
            <Route path="/projects" element={
              <PermissionRoute moduleName="projects">
                <Layout>
                  <ProjectList />
                </Layout>
              </PermissionRoute>
            } />
            
            <Route path="/services" element={
              <PermissionRoute moduleName="services">
                <Layout>
                  <ServiceList />
                </Layout>
              </PermissionRoute>
            } />
            
            <Route path="/tags" element={
              <PermissionRoute moduleName="tags">
                <Layout>
                  <TagList />
                </Layout>
              </PermissionRoute>
            } />
            
            <Route path="/kpis" element={
              <PermissionRoute moduleName="kpis">
                <Layout>
                  <KpiList />
                </Layout>
              </PermissionRoute>
            } />
            
            <Route path="/okrs" element={
              <PermissionRoute moduleName="okrs">
                <Layout>
                  <OkrList />
                </Layout>
              </PermissionRoute>
            } />
            
            <Route path="/financial" element={
              <PermissionRoute moduleName="financial">
                <Layout>
                  <FinancialPage />
                </Layout>
              </PermissionRoute>
            } />
            
            <Route path="/activities" element={
              <PermissionRoute moduleName="activities">
                <Layout>
                  <ActivitiesList />
                </Layout>
              </PermissionRoute>
            } />
            
            <Route path="/notes" element={
              <PermissionRoute moduleName="notes">
                <Layout>
                  <NotesPage />
                </Layout>
              </PermissionRoute>
            } />
            
            <Route path="/chat" element={
              <PermissionRoute moduleName="chat">
                <Layout>
                  <ChatPage />
                </Layout>
              </PermissionRoute>
            } />
            
            {/* Reports routes */}
            <Route path="/reports" element={
              <PermissionRoute moduleName="reports">
                <Layout><ReportsLayout /></Layout>
              </PermissionRoute>
            }>
              <Route index element={<Navigate to="/reports/calendar" replace />} />
              <Route path="calendar" element={<ReportsCalendar />} />
              <Route path="kanban" element={<ReportsKanban />} />
              <Route path="gantt" element={<ReportsGantt />} /> 
            </Route>
            
            <Route path="/settings" element={
              <PermissionRoute moduleName="settings">
                <Layout>
                  <SettingsPage />
                </Layout>
              </PermissionRoute>
            } />
            
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
