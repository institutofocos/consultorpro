
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

// Import components
import ConsultantList from "./components/consultants/ConsultantList";
import ProjectList from "./components/projects/ProjectList";
import ServiceList from "./components/services/ServiceList";
import Layout from "./components/layout/Layout";
import SettingsPage from "./components/settings/SettingsPage";
import ClientList from "./components/clients/ClientList";
import FinancialPage from "./components/financial/FinancialPage";
import DemandsList from "./components/demands/DemandsList";
import ReportsLayout from "./components/reports/ReportsLayout";
import ReportsCalendar from "./components/reports/ReportsCalendar";
import ReportsGantt from "./components/reports/ReportsGantt";
import Dashboard from "./components/dashboard/Dashboard";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
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
            
            <Route path="/financial" element={
              <Layout><FinancialPage /></Layout>
            } />
            
            {/* Reports routes with proper nesting */}
            <Route path="/reports/*" element={
              <Layout><ReportsLayout /></Layout>
            } />
            
            <Route path="/settings" element={
              <Layout><SettingsPage /></Layout>
            } />
            
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
