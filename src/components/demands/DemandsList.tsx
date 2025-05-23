
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { FileCheck } from 'lucide-react';

const DemandsList = () => {
  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold">Demandas</h1>
        <p className="text-muted-foreground">Gerencie todas as demandas de clientes</p>
      </div>
      
      <Card className="shadow-card">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xl">
            <div className="flex items-center">
              <FileCheck className="h-5 w-5 mr-2" />
              <span>Lista de Demandas</span>
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
};

export default DemandsList;
