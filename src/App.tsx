
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

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

// Import reports components
import ReportsLayout from "./components/reports/ReportsLayout";
import ReportsCalendar from "./components/reports/ReportsCalendar";
import ReportsKanban from "./components/reports/ReportsKanban";
import ReportsGantt from "./components/reports/ReportsGantt";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout><Index /></Layout>} />
          <Route path="/consultants" element={
            <Layout>
              <ConsultantList />
            </Layout>
          } />
          <Route path="/clients" element={
            <Layout>
              <ClientList />
            </Layout>
          } />
          <Route path="/projects" element={
            <Layout>
              <ProjectList />
            </Layout>
          } />
          <Route path="/services" element={
            <Layout>
              <ServiceList />
            </Layout>
          } />
          <Route path="/tags" element={
            <Layout>
              <TagList />
            </Layout>
          } />
          <Route path="/kpis" element={
            <Layout>
              <KpiList />
            </Layout>
          } />
          <Route path="/okrs" element={
            <Layout>
              <OkrList />
            </Layout>
          } />
          <Route path="/financial" element={
            <Layout>
              <FinancialPage />
            </Layout>
          } />
          <Route path="/activities" element={
            <Layout>
              <ActivitiesList />
            </Layout>
          } />
          
          {/* Reports routes */}
          <Route path="/reports" element={<Layout><ReportsLayout /></Layout>}>
            <Route index element={<Navigate to="/reports/calendar" replace />} />
            <Route path="calendar" element={<ReportsCalendar />} />
            <Route path="kanban" element={<ReportsKanban />} />
            <Route path="gantt" element={<ReportsGantt />} /> 
          </Route>
          
          <Route path="/settings" element={
            <Layout>
              <SettingsPage />
            </Layout>
          } />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
