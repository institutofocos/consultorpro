
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import Dashboard from '@/components/dashboard/Dashboard';
import ConsultantList from '@/components/consultants/ConsultantList';
import ClientList from '@/components/clients/ClientList';
import ProjectList from '@/components/projects/ProjectList';
import ServiceList from '@/components/services/ServiceList';
import DemandsList from '@/components/demands/DemandsList';
import FinancialPage from '@/components/financial/FinancialPage';
import SettingsPage from '@/components/settings/SettingsPage';
import ReportsLayout from '@/components/reports/ReportsLayout';
import ReportsCalendar from '@/components/reports/ReportsCalendar';
import ReportsGantt from '@/components/reports/ReportsGantt';

export default function Index() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/consultants" element={<ConsultantList />} />
        <Route path="/clients" element={<ClientList />} />
        <Route path="/projects" element={<ProjectList />} />
        <Route path="/services" element={<ServiceList />} />
        <Route path="/demands" element={<DemandsList />} />
        <Route path="/financial" element={<FinancialPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/reports" element={<ReportsLayout />}>
          <Route index element={<Navigate to="/reports/calendar" replace />} />
          <Route path="calendar" element={<ReportsCalendar />} />
          <Route path="gantt" element={<ReportsGantt />} />
        </Route>
      </Routes>
    </Layout>
  );
}
