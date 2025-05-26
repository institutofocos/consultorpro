
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronRight, Edit, Trash2, Zap } from 'lucide-react';
import { Project } from './types';
import { useProjectActions } from '@/hooks/useProjectActions';
import { useProjectHistory } from '@/hooks/useProjectHistory';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ProjectsExpandedTableProps {
  projects: Project[];
  onEdit: (project: Project) => void;
  onDelete: (id: string) => void;
  onProjectUpdated: () => void;
}

const ProjectsExpandedTable: React.FC<ProjectsExpandedTableProps> = ({
  projects,
  onEdit,
  onDelete,
  onProjectUpdated
}) => {
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());
  const { updateStageStatus, isLoading } = useProjectActions();
  const { getStageStatusChangeDate } = useProjectHistory();

  const statusOptions = [
    { value: 'iniciar_projeto', label: 'Iniciar Projeto' },
    { value: 'em_producao', label: 'Em Produção' },
    { value: 'aguardando_assinatura', label: 'Aguardando Assinatura' },
    { value: 'aguardando_aprovacao', label: 'Aguardando Aprovação' },
    { value: 'aguardando_nota_fiscal', label: 'Aguardando Nota Fiscal' },
    { value: 'aguardando_pagamento', label: 'Aguardando Pagamento' },
    { value: 'aguardando_repasse', label: 'Aguardando Repasse' },
    { value: 'concluido', label: 'Concluído' },
    { value: 'cancelado', label: 'Cancelado' }
  ];

  const toggleProject = (projectId: string) => {
    const newExpanded = new Set(expandedProjects);
    if (newExpanded.has(projectId)) {
      newExpanded.delete(projectId);
    } else {
      newExpanded.add(projectId);
    }
    setExpandedProjects(newExpanded);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'em_planejamento':
        return 'bg-blue-100 text-blue-800';
      case 'em_producao':
        return 'bg-yellow-100 text-yellow-800';
      case 'concluido':
        return 'bg-green-100 text-green-800';
      case 'cancelado':
        return 'bg-red-100 text-red-800';
      case 'iniciar_projeto':
        return 'bg-gray-100 text-gray-800';
      case 'aguardando_assinatura':
        return 'bg-orange-100 text-orange-800';
      case 'aguardando_aprovacao':
        return 'bg-purple-100 text-purple-800';
      case 'aguardando_nota_fiscal':
        return 'bg-pink-100 text-pink-800';
      case 'aguardando_pagamento':
        return 'bg-red-100 text-red-800';
      case 'aguardando_repasse':
        return 'bg-indigo-100 text-indigo-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusBulletColor = (status: string) => {
    switch (status) {
      case 'em_planejamento':
        return 'bg-blue-500';
      case 'em_producao':
        return 'bg-yellow-500';
      case 'concluido':
        return 'bg-green-500';
      case 'cancelado':
        return 'bg-red-500';
      case 'iniciar_projeto':
        return 'bg-gray-500';
      case 'aguardando_assinatura':
        return 'bg-orange-500';
      case 'aguardando_aprovacao':
        return 'bg-purple-500';
      case 'aguardando_nota_fiscal':
        return 'bg-pink-500';
      case 'aguardando_pagamento':
        return 'bg-red-500';
      case 'aguardando_repasse':
        return 'bg-indigo-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusLabel = (status: string) => {
    const option = statusOptions.find(opt => opt.value === status);
    return option ? option.label : status;
  };

  const handleStageStatusChange = async (stageId: string, newStatus: string, projectName: string, stageName: string) => {
    try {
      await updateStageStatus(stageId, newStatus);
      toast.success(`Status da etapa "${stageName}" atualizado para "${getStatusLabel(newStatus)}" no projeto "${projectName}"`);
      await onProjectUpdated();
    } catch (error) {
      console.error('Erro ao atualizar status da etapa:', error);
      toast.error('Erro ao atualizar status da etapa');
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value || 0);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    try {
      return new Date(dateString).toLocaleDateString('pt-BR');
    } catch (error) {
      console.error('Error formatting date:', error);
      return '-';
    }
  };

  const formatStatusWithDate = (status: string, stageId: string) => {
    const statusLabel = getStatusLabel(status);
    const changeDate = getStageStatusChangeDate(stageId, status);
    
    if (changeDate) {
      const formattedDate = formatDate(changeDate);
      return `${statusLabel} EM ${formattedDate}`;
    }
    
    return statusLabel;
  };

  // Function to get the first and second name (for display purposes)
  const getFirstAndSecondName = (fullName?: string): string => {
    if (!fullName) return '-';
    
    const names = fullName.split(' ').filter(name => name.length > 0);
    if (names.length === 0) return '-';
    if (names.length === 1) return names[0];
    
    return `${names[0]} ${names[1] || ''}`.trim();
  };

  // Function to get consultant name for a stage
  const getStageConsultantName = (stage: any, project: Project): string => {
    if (stage.consultantId) {
      // If stage has a specific consultant, we need to get their name
      // For now, we'll show the main consultant name if consultantId matches
      if (stage.consultantId === project.mainConsultantId) {
        return getFirstAndSecondName(project.mainConsultantName);
      }
      if (stage.consultantId === project.supportConsultantId) {
        return getFirstAndSecondName(project.supportConsultantName);
      }
      return 'Consultor Específico';
    }
    // If no specific consultant, use project's main consultant
    return getFirstAndSecondName(project.mainConsultantName);
  };

  if (!projects || projects.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Nenhum projeto encontrado.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Projeto</TableHead>
            <TableHead>Cliente</TableHead>
            <TableHead>Consultor Principal</TableHead>
            <TableHead>Serviço</TableHead>
            <TableHead>Data Início</TableHead>
            <TableHead>Data Fim</TableHead>
            <TableHead>Descrição</TableHead>
            <TableHead>Progresso</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {projects.map((project) => (
            <React.Fragment key={project.id}>
              {/* Main project row */}
              <TableRow className="bg-blue-50/50">
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleProject(project.id)}
                      className="h-6 w-6 p-0"
                    >
                      {expandedProjects.has(project.id) ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </Button>
                    <div>
                      <div className="font-semibold text-blue-700">{project.name}</div>
                      {project.projectId && (
                        <div className="text-xs text-blue-600">ID: {project.projectId}</div>
                      )}
                      <Badge 
                        className={getStatusColor(project.status)}
                        variant="secondary"
                      >
                        {getStatusLabel(project.status)}
                      </Badge>
                      {project.tagNames && project.tagNames.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {project.tagNames.map((tagName, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {tagName}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-sm">{project.clientName || '-'}</TableCell>
                <TableCell className="text-sm">
                  {getFirstAndSecondName(project.mainConsultantName)}
                  {project.supportConsultantName && (
                    <div className="text-xs text-muted-foreground">
                      Apoio: {getFirstAndSecondName(project.supportConsultantName)}
                    </div>
                  )}
                </TableCell>
                <TableCell className="text-sm">{project.serviceName || '-'}</TableCell>
                <TableCell className="text-sm">{formatDate(project.startDate)}</TableCell>
                <TableCell className="text-sm">{formatDate(project.endDate)}</TableCell>
                <TableCell className="text-sm max-w-xs">
                  <div className="truncate" title={project.description}>
                    {project.description || '-'}
                  </div>
                </TableCell>
                <TableCell className="text-sm">
                  <div className="text-sm text-muted-foreground">
                    {project.completedStages || 0}/{project.stages?.length || 0}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end space-x-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={isLoading}
                          title="Ações do projeto"
                        >
                          <Zap className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem onClick={() => onEdit(project)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => onDelete(project.id)}
                          className="text-red-600"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </TableCell>
              </TableRow>

              {/* Expanded stages rows */}
              {expandedProjects.has(project.id) && project.stages && project.stages.map((stage, index) => (
                <TableRow key={`${project.id}-stage-${index}`} className="bg-gray-50/50">
                  <TableCell className="pl-12">
                    <div className="flex items-center gap-2">
                      <div 
                        className={`w-3 h-3 rounded-full ${getStatusBulletColor(stage.status)}`}
                      ></div>
                      <span className="text-sm font-medium">{stage.name}</span>
                      {stage.description && (
                        <span className="text-xs text-muted-foreground ml-2">
                          - {stage.description}
                        </span>
                      )}
                    </div>
                    <div className="mt-1 ml-5">
                      <Badge 
                        className={getStatusColor(stage.status)}
                        variant="secondary"
                      >
                        {formatStatusWithDate(stage.status, stage.id)}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">-</TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {getStageConsultantName(stage, project)}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">-</TableCell>
                  <TableCell className="text-muted-foreground text-sm">-</TableCell>
                  <TableCell className="text-muted-foreground text-sm">-</TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    <div className="space-y-1">
                      <div>Valor: {formatCurrency(stage.value)}</div>
                      <div>Duração: {stage.days} dias</div>
                      <div>Horas: {stage.hours}h</div>
                      {stage.startDate && (
                        <div>Início: {formatDate(stage.startDate)}</div>
                      )}
                      {stage.endDate && (
                        <div>Fim: {formatDate(stage.endDate)}</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {stage.completed ? '100%' : '0%'}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-2">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={isLoading}
                            title="Alterar status da etapa"
                          >
                            <Zap className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          {statusOptions.map((option) => (
                            <DropdownMenuItem
                              key={option.value}
                              onClick={() => handleStageStatusChange(stage.id, option.value, project.name, stage.name)}
                            >
                              {option.label}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </React.Fragment>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default ProjectsExpandedTable;
