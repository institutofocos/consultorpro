
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface Project {
  id: string;
  name: string;
  clientName?: string;
  totalValue?: number;
  endDate?: string;
}

interface Stage {
  id: string;
  name: string;
  projectName?: string;
  value?: number;
  endDate?: string;
  projectId?: string;
}

interface DeliveryTablesProps {
  upcomingProjects: Project[];
  upcomingStages: Stage[];
  formatDate: (dateString: string) => string;
  formatCurrency: (value: number) => string;
}

export const DeliveryTables: React.FC<DeliveryTablesProps> = ({
  upcomingProjects,
  upcomingStages,
  formatDate,
  formatCurrency
}) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Projetos a Serem Entregues ({upcomingProjects.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="max-h-96 overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Projeto</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Entrega</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {upcomingProjects.slice(0, 20).map((project) => (
                  <TableRow key={project.id}>
                    <TableCell className="font-medium">{project.name}</TableCell>
                    <TableCell>{project.clientName || 'N/A'}</TableCell>
                    <TableCell>{formatCurrency(project.totalValue || 0)}</TableCell>
                    <TableCell>{formatDate(project.endDate || '')}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Etapas a Serem Entregues ({upcomingStages.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="max-h-96 overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Etapa</TableHead>
                  <TableHead>Projeto</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Entrega</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {upcomingStages.slice(0, 20).map((stage) => (
                  <TableRow key={`${stage.projectId}-${stage.id}`}>
                    <TableCell className="font-medium">{stage.name}</TableCell>
                    <TableCell>{stage.projectName || 'N/A'}</TableCell>
                    <TableCell>{formatCurrency(stage.value || 0)}</TableCell>
                    <TableCell>{formatDate(stage.endDate || '')}</TableCell>
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
