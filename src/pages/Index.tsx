
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ReportsCalendar from '@/components/reports/ReportsCalendar';
import ReportsGantt from '@/components/reports/ReportsGantt';

export default function Index() {
  return (
    <Routes>
      <Route index element={<Navigate to="/reports/gantt" replace />} />
      <Route path="calendar" element={<ReportsCalendar />} />
      <Route path="gantt" element={<ReportsGantt />} />
    </Routes>
  );
}
