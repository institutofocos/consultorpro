
import React, { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Edit3, Trash2, Calendar, ChevronDown, ChevronRight, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Project {
  id: string;
  name: string;
  description?: string;
  status: string;
  start_date?: string;
  end_date?: string;
  client_name?: string;
  service_name?: string;
  total_value?: number;
  stages?: ProjectStage[];
}

interface ProjectStage {
  id: string;
  name: string;
  description?: string;
  status: string;
  start_date?: string;
  end_date?: string;
  completed: boolean;
  completed_at?: string;
  value?: number;
  consultant_name?: string;
}

interface ProjectsExpandedTableProps {
  projects: Project[];
  onUpdateProject?: (project: Project) => Promise<void>;
  onDeleteProject?: (id: string) => Promise<void>;
}

const STATUS_COLORS = {
  'planned': 'bg-blue-100 text-blue-800',
  'active': 'bg-green-100 text-green-800',
  'completed': 'bg-gray-100 text-gray-800',
  'cancelled': 'bg-red-100 text-red-800',
  'iniciar_projeto': 'bg-blue-100 text-blue-800',
  'em_producao': 'bg-yellow-100 text-yellow-800',
  'aguardando_assinatura': 'bg-orange-100 text-orange-800',
  'aguardando_aprovacao': 'bg-purple-100 text-purple-800',
  'finalizados': 'bg-green-100 text-green-800',
  'cancelados': 'bg-red-100 text-red-800',
};

const STATUS_LABELS = {
  'planned': 'Planejado',
  'active': 'Ativo',
  'completed': 'Concluído',
  'cancelled': 'Cancelado',
  'iniciar_projeto': 'Iniciar Projeto',
  'em_producao': 'Em Produção',
  'aguardando_assinatura': 'Aguardando Assinatura',
  'aguardando_aprovacao': 'Aguardando Aprovação',
  'finalizados': 'Finalizados',
  'cancelados': 'Cancelados',
};

const ProjectsExpandedTable: React.FC<ProjectsExpandedTableProps> = ({
  projects,
  onUpdateProject,
  onDeleteProject,
}) => {
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());

  const toggleProjectExpansion = (projectId: string) => {
    const newExpanded = new Set(expandedProjects);
    if (newExpanded.has(projectId)) {
      newExpanded.delete(projectId);
    } else {
      newExpanded.add(projectId);
    }
    setExpandedProjects(newExpanded);
  };

  const getStatusColor = (status: string) => {
    return STATUS_COLORS[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusLabel = (status: string) => {
    return STATUS_LABELS[status] || status;
  };

  const formatCurrency = (value?: number) => {
    if (!value) return '-';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const renderProjectRow = (project: Project) => {
    const isExpanded = expandedProjects.has(project.id);
    const completedStages = project.stages?.filter(s => s.completed).length || 0;
    const totalStages = project.stages?.length || 0;

    return (
      <React.Fragment key={project.id}>
        <TableRow className="bg-blue-50/50">
          <TableCell className="font-medium">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => toggleProjectExpansion(project.id)}
                className="h-6 w-6 p-0"
              >
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </Button>
              <span className="font-semibold text-blue-700">{project.name}</span>
            </div>
          </TableCell>
          <TableCell>
            <Badge 
              variant="outline"
              className={cn("", getStatusColor(project.status))}
            >
              {getStatusLabel(project.status)}
            </Badge>
          </TableCell>
          <TableCell>{project.client_name || '-'}</TableCell>
          <TableCell>{project.service_name || '-'}</TableCell>
          <TableCell>{formatCurrency(project.total_value)}</TableCell>
          <TableCell>
            {project.start_date ? (
              <div className="flex items-center gap-1 text-xs">
                <Calendar className="h-3 w-3" />
                {format(new Date(project.start_date), "dd/MM/yyyy", { locale: ptBR })}
              </div>
            ) : (
              '-'
            )}
          </TableCell>
          <TableCell>
            {project.end_date ? (
              <div className="flex items-center gap-1 text-xs">
                <Calendar className="h-3 w-3" />
                {format(new Date(project.end_date), "dd/MM/yyyy", { locale: ptBR })}
              </div>
            ) : (
              '-'
            )}
          </TableCell>
          <TableCell>
            <div className="text-sm text-muted-foreground">
              {totalStages > 0 && (
                <div className="text-xs">
                  {completedStages}/{totalStages} etapas concluídas
                </div>
              )}
              {project.description && (
                <div className="mt-1">
                  {project.description.substring(0, 30) + (project.description.length > 30 ? '...' : '')}
                </div>
              )}
            </div>
          </TableCell>
          <TableCell className="text-right">
            <div className="flex justify-end gap-2">
              {onUpdateProject && (
                <Button variant="ghost" size="sm">
                  <Edit3 className="h-4 w-4" />
                </Button>
              )}
              {onDeleteProject && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDeleteProject(project.id)}
                  className="text-red-500 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </TableCell>
        </TableRow>
        
        {isExpanded && project.stages?.map((stage, index) => (
          <TableRow key={`${project.id}-stage-${index}`} className="bg-gray-50/50">
            <TableCell className="pl-12">
              <div className="flex items-center gap-2">
                <div className={`w-4 h-4 rounded-full border-2 ${
                  stage.completed 
                    ? 'bg-green-500 border-green-500' 
                    : 'border-gray-300'
                }`}>
                  {stage.completed && (
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    </div>
                  )}
                </div>
                <FileText className="h-3 w-3 text-gray-500" />
                <span className="text-sm">{stage.name}</span>
              </div>
            </TableCell>
            <TableCell>
              <Badge 
                variant="outline"
                className={cn("", getStatusColor(stage.status))}
              >
                {getStatusLabel(stage.status)}
              </Badge>
            </TableCell>
            <TableCell>-</TableCell>
            <TableCell>-</TableCell>
            <TableCell>{formatCurrency(stage.value)}</TableCell>
            <TableCell>
              {stage.start_date ? (
                <div className="flex items-center gap-1 text-xs">
                  <Calendar className="h-3 w-3" />
                  {format(new Date(stage.start_date), "dd/MM/yyyy", { locale: ptBR })}
                </div>
              ) : (
                '-'
              )}
            </TableCell>
            <TableCell>
              {stage.end_date ? (
                <div className="flex items-center gap-1 text-xs">
                  <Calendar className="h-3 w-3" />
                  {format(new Date(stage.end_date), "dd/MM/yyyy", { locale: ptBR })}
                </div>
              ) : (
                '-'
              )}
            </TableCell>
            <TableCell>
              <div className="text-sm text-muted-foreground">
                {stage.description || '-'}
                {stage.completed_at && (
                  <div className="text-xs text-green-600 mt-1">
                    Concluído em {format(new Date(stage.completed_at), "dd/MM/yyyy", { locale: ptBR })}
                  </div>
                )}
              </div>
            </TableCell>
            <TableCell>
              <div className="flex justify-end gap-2">
                <Button variant="ghost" size="sm" className="text-xs">
                  {stage.completed ? 'Desfazer' : 'Concluir'}
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </React.Fragment>
    );
  };

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Projeto</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Cliente</TableHead>
            <TableHead>Serviço</TableHead>
            <TableHead>Valor Total</TableHead>
            <TableHead>Data Início</TableHead>
            <TableHead>Data Fim</TableHead>
            <TableHead>Descrição / Progresso</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {projects.length > 0 ? (
            projects.map(renderProjectRow)
          ) : (
            <TableRow>
              <TableCell colSpan={9} className="text-center py-4 text-muted-foreground">
                Nenhum projeto encontrado.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default ProjectsExpandedTable;
