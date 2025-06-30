
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, BarChart3, Kanban } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import CalendarView from './CalendarView';
import GanttView from './GanttView';
import KanbanView from './KanbanView';

const CalendarPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Extract the current tab from the URL path
  const currentPath = location.pathname.split('/').pop();
  const activeTab = ['calendar', 'gantt', 'kanban'].includes(currentPath || '') ? currentPath : 'gantt';

  const handleTabChange = (value: string) => {
    navigate(`/calendar/${value}`);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Calendário de Tarefas</h1>
        <p className="text-muted-foreground">Gerencie e visualize suas tarefas</p>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="calendar" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Mês
          </TabsTrigger>
          <TabsTrigger value="gantt" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Gantt
          </TabsTrigger>
          <TabsTrigger value="kanban" className="flex items-center gap-2">
            <Kanban className="h-4 w-4" />
            Kanban
          </TabsTrigger>
        </TabsList>

        <Routes>
          {/* Default redirect to gantt */}
          <Route index element={<Navigate to="/calendar/gantt" replace />} />
          
          <Route path="calendar" element={
            <TabsContent value="calendar" className="mt-6">
              <CalendarView />
            </TabsContent>
          } />
          
          <Route path="gantt" element={
            <TabsContent value="gantt" className="mt-6">
              <GanttView />
            </TabsContent>
          } />
          
          <Route path="kanban" element={
            <TabsContent value="kanban" className="mt-6">
              <KanbanView />
            </TabsContent>
          } />
        </Routes>
      </Tabs>
    </div>
  );
};

export default CalendarPage;
