
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Target } from "lucide-react";

export const OkrList: React.FC = () => {
  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold">OKRs</h1>
        <p className="text-muted-foreground">Objetivos e Resultados-Chave</p>
      </div>
      
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Target className="mr-2 h-5 w-5 text-purple-500" />
            Gerenciamento de OKRs
          </CardTitle>
        </CardHeader>
        <CardContent className="py-6">
          <p className="text-muted-foreground text-center">
            Funcionalidade em desenvolvimento. <br />
            Em breve você poderá gerenciar todos os seus OKRs aqui.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default OkrList;
