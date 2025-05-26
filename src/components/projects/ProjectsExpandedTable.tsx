
import React from 'react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2 } from 'lucide-react';
import { Project } from './types';
import ServiceNameCell from './ServiceNameCell';

interface ProjectsExpandedTableProps {
  projects: Project[];
  onDeleteProject: (id: string) => void;
  onEditProject: (project: Project) => void;
  onRefresh: () => void;
}

const ProjectsExpandedTable: React.FC<ProjectsExpandedTableProps> = ({
  projects,
  onDeleteProject,
  onEditProject,
  onRefresh
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'planned':
        return 'bg-blue-100 text-blue-800';
      case 'active':
      case 'em_producao':
        return 'bg-green-100 text-green-800';
      case 'completed':
      case 'concluido':
        return 'bg-gray-100 text-gray-800';
      case 'cancelled':
      case 'cancelado':
        return 'bg-red-100 text-red-800';
      case 'aguardando_assinatura':
        return 'bg-yellow-100 text-yellow-800';
      case 'aguardando_aprovacao':
        return 'bg-orange-100 text-orange-800';
      case 'aguardando_nota_fiscal':
        return 'bg-purple-100 text-purple-800';
      case 'aguardando_pagamento':
        return 'bg-pink-100 text-pink-800';
      case 'aguardando_repasse':
        return 'bg-indigo-100 text-indigo-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'planned':
        return 'Planejado';
      case 'active':
        return 'Ativo';
      case 'em_producao':
        return 'Em Produção';
      case 'completed':
        return 'Concluído';
      case 'concluido':
        return 'Concluído';
      case 'cancelled':
        return 'Cancelado';
      case 'cancelado':
        return 'Cancelado';
      case 'aguardando_assinatura':
        return 'Aguardando Assinatura';
      case 'aguardando_aprovacao':
        return 'Aguardando Aprovação';
      case 'aguardando_nota_fiscal':
        return 'Aguardando Nota Fiscal';
      case 'aguardando_pagamento':
        return 'Aguardando Pagamento';
      case 'aguardando_repasse':
        return 'Aguardando Repasse';
      default:
        return status;
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Projeto</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Cliente</TableHead>
            <TableHead>Consultor</TableHead>
            <TableHead>Serviço</TableHead>
            <TableHead>Tags</TableHead>
            <TableHead>Valor Total</TableHead>
            <TableHead>Data Início</TableHead>
            <TableHead>Data Fim</TableHead>
            <TableHead>Descrição</TableHead>
            <TableHead>Progresso</TableHead>
            <TableHead>Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {projects.map((project) => (
            <TableRow key={project.id}>
              <TableCell className="font-medium">
                <div>
                  <div className="font-semibold">{project.name}</div>
                  {project.projectId && (
                    <div className="text-sm text-muted-foreground">
                      ID: {project.projectId}
                    </div>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <Badge className={getStatusColor(project.status)}>
                  {getStatusLabel(project.status)}
                </Badge>
              </TableCell>
              <TableCell>{project.clientName || '-'}</TableCell>
              <TableCell>{project.mainConsultantName || '-'}</TableCell>
              <TableCell>
                {project.serviceName ? (
                  <ServiceNameCell serviceName={project.serviceName} />
                ) : (
                  '-'
                )}
              </TableCell>
              <TableCell>
                {project.tags && project.tags.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {project.tags.map((tagName, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {tagName}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  '-'
                )}
              </TableCell>
              <TableCell>{formatCurrency(project.totalValue)}</TableCell>
              <TableCell>{formatDate(project.startDate)}</TableCell>
              <TableCell>{formatDate(project.endDate)}</TableCell>
              <TableCell>
                <div className="max-w-xs truncate" title={project.description}>
                  {project.description || '-'}
                </div>
              </TableCell>
              <TableCell>
                <div className="text-sm">
                  {project.completedStages || 0}/{project.stages?.length || 0}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onEditProject(project)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onDeleteProject(project.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default ProjectsExpandedTable;
