import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Auth from "./pages/Auth";
import AdminSetup from "./pages/AdminSetup";
import { AuthProvider, useAuth } from "./contexts/AuthContext";

// Import components
import ConsultantList from "./components/consultants/ConsultantList";
import ProjectList from "./components/projects/ProjectList";
import ServiceList from "./components/services/ServiceList";
import Layout from "./components/layout/Layout";
import ActivitiesList from "./components/activities/ActivitiesList";
import SettingsPage from "./components/settings/SettingsPage";
import ClientList from "./components/clients/ClientList";
import FinancialPage from "./components/financial/FinancialPage";
import NotesPage from "./pages/Notes";
import ChatPage from "./components/chat/ChatPage";
import DemandsList from "./components/demands/DemandsList";

// Modified to always render children without authentication check
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  // No authentication check, always render children
  return <>{children}</>;
};

// Modified to always grant permission without checks
const PermissionRoute = ({ 
  children, 
  moduleName, 
  actionType = 'view' 
}: { 
  children: React.ReactNode;
  moduleName: string;
  actionType?: 'view' | 'edit';
}) => {
  // No permission check, always allow access
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
            {/* Redirect from auth to dashboard */}
            <Route path="/auth" element={<Navigate to="/" replace />} />
            <Route path="/admin-setup" element={<Navigate to="/" replace />} />
            
            {/* Always render the dashboard directly */}
            <Route path="/" element={
              <Layout><Index /></Layout>
            } />
            
            {/* Other routes without authentication checks */}
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
            
            <Route path="/notes" element={
              <Layout><NotesPage /></Layout>
            } />
            
            <Route path="/chat" element={
              <Layout><ChatPage /></Layout>
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
