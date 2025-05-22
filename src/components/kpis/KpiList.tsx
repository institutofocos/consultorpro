
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const KpiList: React.FC = () => {
  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold">KPIs</h1>
        <p className="text-muted-foreground">Indicadores-chave de performance</p>
      </div>
      
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Gerenciamento de KPIs</CardTitle>
        </CardHeader>
        <CardContent className="py-6">
          <p className="text-muted-foreground text-center">
            Funcionalidade em desenvolvimento. <br />
            Em breve você poderá gerenciar todos os seus KPIs aqui.
          </p>
          
          <div className="flex justify-center mt-4 gap-2 flex-wrap">
            <Badge variant="outline" className="bg-blue-50 text-blue-600">Financeiro</Badge>
            <Badge variant="outline" className="bg-green-50 text-green-600">Qualidade</Badge>
            <Badge variant="outline" className="bg-purple-50 text-purple-600">Processos</Badge>
            <Badge variant="outline" className="bg-orange-50 text-orange-600">Pessoas</Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default KpiList;
