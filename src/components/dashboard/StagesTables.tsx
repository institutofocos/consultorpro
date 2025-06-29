
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface Stage {
  id?: string;
  name: string;
  projectName: string;
  value?: number;
}

interface StagesTablesProps {
  openStages: Stage[];
  completedStages: Stage[];
  formatCurrency: (value: number) => string;
}

export const StagesTables: React.FC<StagesTablesProps> = ({
  openStages,
  completedStages,
  formatCurrency
}) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Etapas em Aberto ({openStages.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="max-h-64 overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Etapa</TableHead>
                  <TableHead>Projeto</TableHead>
                  <TableHead>Valor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {openStages.slice(0, 10).map((stage, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="font-medium">{stage.name}</TableCell>
                    <TableCell>{stage.projectName}</TableCell>
                    <TableCell>{formatCurrency(stage.value || 0)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Etapas Finalizadas ({completedStages.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="max-h-64 overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Etapa</TableHead>
                  <TableHead>Projeto</TableHead>
                  <TableHead>Valor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {completedStages.slice(0, 10).map((stage, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="font-medium">{stage.name}</TableCell>
                    <TableCell>{stage.projectName}</TableCell>
                    <TableCell>{formatCurrency(stage.value || 0)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
