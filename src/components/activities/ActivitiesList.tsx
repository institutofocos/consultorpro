
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

const ActivitiesList: React.FC = () => {
  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold">Lançamentos</h1>
        <p className="text-muted-foreground">Gerenciamento de lançamentos e atividades</p>
      </div>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Lista de Lançamentos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-40">
            <p className="text-muted-foreground">Recurso em desenvolvimento</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ActivitiesList;
