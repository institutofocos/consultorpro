
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Layout from "@/components/layout/Layout";
import Index from "./pages/Index";
import Login from "./pages/Login";
import ResetPassword from "./pages/ResetPassword";
import NotFound from "./pages/NotFound";
import ChatPage from "./components/chat/ChatPage";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <Toaster />
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/" element={
                <Layout>
                  <Index />
                </Layout>
              } />
              <Route path="/chat" element={
                <Layout>
                  <ChatPage />
                </Layout>
              } />
              <Route path="/calendar" element={
                <Layout>
                  <div className="p-6">
                    <h1 className="text-2xl font-bold mb-6">Calendário</h1>
                    <p className="text-gray-600">Página do calendário em desenvolvimento...</p>
                  </div>
                </Layout>
              } />
              <Route path="/consultants" element={
                <Layout>
                  <div className="p-6">
                    <h1 className="text-2xl font-bold mb-6">Consultores</h1>
                    <p className="text-gray-600">Página de consultores em desenvolvimento...</p>
                  </div>
                </Layout>
              } />
              <Route path="/clients" element={
                <Layout>
                  <div className="p-6">
                    <h1 className="text-2xl font-bold mb-6">Clientes</h1>
                    <p className="text-gray-600">Página de clientes em desenvolvimento...</p>
                  </div>
                </Layout>
              } />
              <Route path="/projects" element={
                <Layout>
                  <div className="p-6">
                    <h1 className="text-2xl font-bold mb-6">Projetos</h1>
                    <p className="text-gray-600">Página de projetos em desenvolvimento...</p>
                  </div>
                </Layout>
              } />
              <Route path="/demands" element={
                <Layout>
                  <div className="p-6">
                    <h1 className="text-2xl font-bold mb-6">Demandas</h1>
                    <p className="text-gray-600">Página de demandas em desenvolvimento...</p>
                  </div>
                </Layout>
              } />
              <Route path="/services" element={
                <Layout>
                  <div className="p-6">
                    <h1 className="text-2xl font-bold mb-6">Serviços</h1>
                    <p className="text-gray-600">Página de serviços em desenvolvimento...</p>
                  </div>
                </Layout>
              } />
              <Route path="/financial" element={
                <Layout>
                  <div className="p-6">
                    <h1 className="text-2xl font-bold mb-6">Financeiro</h1>
                    <p className="text-gray-600">Página financeira em desenvolvimento...</p>
                  </div>
                </Layout>
              } />
              <Route path="/settings" element={
                <Layout>
                  <div className="p-6">
                    <h1 className="text-2xl font-bold mb-6">Configurações</h1>
                    <p className="text-gray-600">Página de configurações em desenvolvimento...</p>
                  </div>
                </Layout>
              } />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
