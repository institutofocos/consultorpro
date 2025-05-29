
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, BarChart3 } from 'lucide-react';
import ReportsCalendar from './ReportsCalendar';
import ReportsGantt from './ReportsGantt';

const ReportsLayout: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Relatórios</h1>
        <p className="text-muted-foreground">Visualize e analise dados dos projetos</p>
      </div>

      <Tabs defaultValue="calendar" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="calendar" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Calendário
          </TabsTrigger>
          <TabsTrigger value="gantt" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Gantt
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="calendar" className="mt-6">
          <ReportsCalendar />
        </TabsContent>
        
        <TabsContent value="gantt" className="mt-6">
          <ReportsGantt />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ReportsLayout;
