
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { KanbanSquare } from 'lucide-react';

export default function ReportsKanban() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold">Relatórios - Kanban</h1>
        <p className="text-muted-foreground">Visualize os projetos em formato de kanban</p>
      </div>
      
      <Card className="shadow-card">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xl">
            <div className="flex items-center">
              <KanbanSquare className="h-5 w-5 mr-2" />
              <span>Kanban de Projetos</span>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-40">
            <p className="text-muted-foreground">Funcionalidade em desenvolvimento</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
