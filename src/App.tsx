
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import AdminSetup from "./pages/AdminSetup";
import NotFound from "./pages/NotFound";
import Layout from "./components/layout/Layout";
import { AuthProvider } from "./contexts/AuthContext";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/sonner";
import { WebhookProcessorProvider } from "./contexts/WebhookProcessorContext";
import "./App.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <WebhookProcessorProvider>
          <Router>
            <Routes>
              <Route path="/auth" element={<Auth />} />
              <Route path="/admin-setup" element={<AdminSetup />} />
              <Route path="/*" element={
                <Layout>
                  <Routes>
                    <Route path="/" element={<Navigate to="/dashboard" replace />} />
                    <Route path="/*" element={<Index />} />
                  </Routes>
                </Layout>
              } />
              <Route path="*" element={<NotFound />} />
            </Routes>
            <Toaster />
          </Router>
        </WebhookProcessorProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
