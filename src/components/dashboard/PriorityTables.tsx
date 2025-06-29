
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertTriangle } from "lucide-react";

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
  clientName?: string;
  consultantName?: string;
  value?: number;
  endDate?: string;
  projectId?: string;
}

interface PriorityTablesProps {
  projectsToDeliver: Project[];
  stagesToDeliver: Stage[];
  overdueStages: Stage[];
  formatDate: (dateString: string) => string;
  formatCurrency: (value: number) => string;
}

export const PriorityTables: React.FC<PriorityTablesProps> = ({
  projectsToDeliver,
  stagesToDeliver,
  overdueStages,
  formatDate,
  formatCurrency
}) => {
  return (
    <>
      {/* Priority Tables - Projetos e Etapas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Projetos a Serem Entregues ({projectsToDeliver.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-h-64 overflow-y-auto">
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
                  {projectsToDeliver.slice(0, 10).map((project) => (
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
            <CardTitle>Etapas a Serem Entregues ({stagesToDeliver.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-h-64 overflow-y-auto">
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
                  {stagesToDeliver.slice(0, 10).map((stage) => (
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
      
      {/* Etapas Atrasadas */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            Etapas Atrasadas ({overdueStages.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="max-h-64 overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Etapa</TableHead>
                  <TableHead>Projeto</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Vencimento</TableHead>
                  <TableHead>Consultor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {overdueStages.slice(0, 15).map((stage) => (
                  <TableRow key={`${stage.projectId}-${stage.id}`} className="text-red-600">
                    <TableCell className="font-medium">{stage.name}</TableCell>
                    <TableCell>{stage.projectName || 'N/A'}</TableCell>
                    <TableCell>{stage.clientName || 'N/A'}</TableCell>
                    <TableCell>{formatCurrency(stage.value || 0)}</TableCell>
                    <TableCell className="font-medium">{formatDate(stage.endDate || '')}</TableCell>
                    <TableCell>{stage.consultantName || 'N/A'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </>
  );
};
