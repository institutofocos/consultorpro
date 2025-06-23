
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Auth from "./pages/Auth";
import AdminSetup from "./pages/AdminSetup";
import { AuthProvider } from "./contexts/AuthContext";
import { useWebhookProcessor } from "@/hooks/useWebhookProcessor";
import { useEffect } from "react";

// Import components
import ConsultantList from "./components/consultants/ConsultantList";
import ProjectList from "./components/projects/ProjectList";
import ServiceList from "./components/services/ServiceList";
import Layout from "./components/layout/Layout";
import SettingsPage from "./components/settings/SettingsPage";
import ClientList from "./components/clients/ClientList";
import FinancialPage from "./components/financial/FinancialPage";
import DemandsList from "./components/demands/DemandsList";
import Dashboard from "./components/dashboard/Dashboard";
import CalendarPage from "./components/calendar/CalendarPage";
import KanbanBoard from "./components/kanban/KanbanBoard";

const queryClient = new QueryClient();

// Componente interno para inicializar o processador de webhooks globalmente
const WebhookProcessorProvider = ({ children }: { children: React.ReactNode }) => {
  const { config } = useWebhookProcessor();

  useEffect(() => {
    console.log('Sistema de webhook automático inicializado globalmente:', config);
  }, [config]);

  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <WebhookProcessorProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              {/* Redirect from auth to dashboard */}
              <Route path="/auth" element={<Navigate to="/" replace />} />
              <Route path="/admin-setup" element={<Navigate to="/" replace />} />
              
              {/* Main routes with Layout wrapper */}
              <Route path="/" element={<Layout><Dashboard /></Layout>} />
              
              <Route path="/consultants" element={
                <Layout><ConsultantList /></Layout>
              } />
              
              <Route path="/clients" element={
                <Layout><ClientList /></Layout>
              } />
              
              <Route path="/projects" element={
                <Layout><ProjectList /></Layout>
              } />
              
              <Route path="/services" element={
                <Layout><ServiceList /></Layout>
              } />
              
              <Route path="/demands" element={
                <Layout><DemandsList /></Layout>
              } />
              
              <Route path="/calendar" element={
                <Layout><CalendarPage /></Layout>
              } />
              
              <Route path="/kanban" element={
                <Layout><KanbanBoard /></Layout>
              } />
              
              <Route path="/financial" element={
                <Layout><FinancialPage /></Layout>
              } />
              
              <Route path="/settings" element={
                <Layout><SettingsPage /></Layout>
              } />
              
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </WebhookProcessorProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
