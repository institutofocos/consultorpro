
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import ResetPassword from "./pages/ResetPassword";
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

// Create a query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

// Component to process webhooks
const WebhookProcessorProvider = ({ children }: { children: React.ReactNode }) => {
  const { processConsolidatedWebhooks, processStatusChangeWebhooks } = useWebhookProcessor();
  
  useEffect(() => {
    // Initialize webhook processing
    console.log('Sistema de webhook automático inicializado globalmente:', {
      consolidationEnabled: true,
      statusChangeEnabled: true
    });
    
    // Process webhooks periodically
    const interval = setInterval(() => {
      processConsolidatedWebhooks();
      processStatusChangeWebhooks();
    }, 30000); // Every 30 seconds
    
    return () => clearInterval(interval);
  }, [processConsolidatedWebhooks, processStatusChangeWebhooks]);
  
  return <>{children}</>;
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <AuthProvider>
          <WebhookProcessorProvider>
            <BrowserRouter>
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/" element={
                  <ProtectedRoute>
                    <Layout>
                      <Dashboard />
                    </Layout>
                  </ProtectedRoute>
                } />
                <Route path="/dashboard" element={
                  <ProtectedRoute>
                    <Layout>
                      <Dashboard />
                    </Layout>
                  </ProtectedRoute>
                } />
                <Route path="/consultores" element={
                  <ProtectedRoute>
                    <Layout>
                      <ConsultantList />
                    </Layout>
                  </ProtectedRoute>
                } />
                <Route path="/projetos" element={
                  <ProtectedRoute>
                    <Layout>
                      <ProjectList />
                    </Layout>
                  </ProtectedRoute>
                } />
                <Route path="/servicos" element={
                  <ProtectedRoute>
                    <Layout>
                      <ServiceList />
                    </Layout>
                  </ProtectedRoute>
                } />
                <Route path="/clientes" element={
                  <ProtectedRoute>
                    <Layout>
                      <ClientList />
                    </Layout>
                  </ProtectedRoute>
                } />
                <Route path="/configuracoes" element={
                  <ProtectedRoute>
                    <Layout>
                      <SettingsPage />
                    </Layout>
                  </ProtectedRoute>
                } />
                <Route path="/financeiro" element={
                  <ProtectedRoute>
                    <Layout>
                      <FinancialPage />
                    </Layout>
                  </ProtectedRoute>
                } />
                <Route path="/demandas" element={
                  <ProtectedRoute>
                    <Layout>
                      <DemandsList />
                    </Layout>
                  </ProtectedRoute>
                } />
                <Route path="/calendario" element={
                  <ProtectedRoute>
                    <Layout>
                      <CalendarPage />
                    </Layout>
                  </ProtectedRoute>
                } />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </WebhookProcessorProvider>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
