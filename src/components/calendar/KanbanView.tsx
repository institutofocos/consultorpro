
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Kanban } from 'lucide-react';

const KanbanView: React.FC = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Kanban className="h-5 w-5" />
          Visualização Kanban
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center py-12 text-muted-foreground">
          <Kanban className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Visualização Kanban será implementada em breve</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default KanbanView;
