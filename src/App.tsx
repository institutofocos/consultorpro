
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/sonner';
import { AuthProvider } from '@/contexts/AuthContext';
import Layout from '@/components/layout/Layout';
import Auth from '@/pages/Auth';
import Index from '@/pages/Index';
import AdminSetup from '@/pages/AdminSetup';
import NotFound from '@/pages/NotFound';
import ProjectNew from '@/pages/ProjectNew';
import ProjectEdit from '@/pages/ProjectEdit';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/admin-setup" element={<AdminSetup />} />
            <Route path="/" element={<Layout />}>
              <Route index element={<Index />} />
              <Route path="projects/new" element={<ProjectNew />} />
              <Route path="projects/edit/:id" element={<ProjectEdit />} />
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </Router>
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
