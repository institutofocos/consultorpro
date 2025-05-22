
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

// Import components
import ConsultantList from "./components/consultants/ConsultantList";
import ProjectList from "./components/projects/ProjectList";
import KpiList from "./components/kpis/KpiList";
import OkrList from "./components/okrs/OkrList";
import Layout from "./components/layout/Layout";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/consultants" element={
            <Layout>
              <ConsultantList />
            </Layout>
          } />
          <Route path="/projects" element={
            <Layout>
              <ProjectList />
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
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
