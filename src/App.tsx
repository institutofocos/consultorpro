
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/auth/ProtectedRoute";
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
              {/* Public routes */}
              <Route path="/login" element={<Login />} />
              
              {/* Protected routes with Layout wrapper */}
              <Route path="/" element={
                <ProtectedRoute>
                  <Layout><Dashboard /></Layout>
                </ProtectedRoute>
              } />
              
              <Route path="/consultants" element={
                <ProtectedRoute>
                  <Layout><ConsultantList /></Layout>
                </ProtectedRoute>
              } />
              
              <Route path="/clients" element={
                <ProtectedRoute>
                  <Layout><ClientList /></Layout>
                </ProtectedRoute>
              } />
              
              <Route path="/projects" element={
                <ProtectedRoute>
                  <Layout><ProjectList /></Layout>
                </ProtectedRoute>
              } />
              
              <Route path="/services" element={
                <ProtectedRoute>
                  <Layout><ServiceList /></Layout>
                </ProtectedRoute>
              } />
              
              <Route path="/demands" element={
                <ProtectedRoute>
                  <Layout><DemandsList /></Layout>
                </ProtectedRoute>
              } />
              
              {/* Redirect calendar to gantt view by default */}
              <Route path="/calendar" element={<Navigate to="/calendar/gantt" replace />} />
              <Route path="/calendar/*" element={
                <ProtectedRoute>
                  <Layout><CalendarPage /></Layout>
                </ProtectedRoute>
              } />
              
              <Route path="/kanban" element={
                <ProtectedRoute>
                  <Layout><KanbanBoard /></Layout>
                </ProtectedRoute>
              } />
              
              <Route path="/financial" element={
                <ProtectedRoute>
                  <Layout><FinancialPage /></Layout>
                </ProtectedRoute>
              } />
              
              <Route path="/settings" element={
                <ProtectedRoute>
                  <Layout><SettingsPage /></Layout>
                </ProtectedRoute>
              } />
              
              {/* Legacy routes - redirect to login */}
              <Route path="/auth" element={<Navigate to="/login" replace />} />
              <Route path="/admin-setup" element={<Navigate to="/login" replace />} />
              
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </WebhookProcessorProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
