
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
import { Edit3, Trash2, Calendar, ChevronDown, ChevronRight, FileText, Check, X, Pencil } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { useProjectActions } from '@/hooks/useProjectActions';

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
  main_consultant_name?: string;
  support_consultant_name?: string;
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
  onEditProject?: (project: Project) => void;
  onRefresh?: () => void;
}

const STATUS_COLORS = {
  'planned': 'bg-blue-100 text-blue-800',
  'active': 'bg-green-100 text-green-800',
  'completed': 'bg-gray-100 text-gray-800',
  'cancelled': 'bg-red-100 text-red-800',
  'em_producao': 'bg-yellow-100 text-yellow-800',
  'aguardando_assinatura': 'bg-orange-100 text-orange-800',
  'aguardando_aprovacao': 'bg-purple-100 text-purple-800',
  'aguardando_nota_fiscal': 'bg-pink-100 text-pink-800',
  'aguardando_pagamento': 'bg-indigo-100 text-indigo-800',
  'aguardando_repasse': 'bg-cyan-100 text-cyan-800',
  'finalizados': 'bg-green-100 text-green-800',
  'concluido': 'bg-green-100 text-green-800',
  'cancelado': 'bg-red-100 text-red-800',
};

const STATUS_LABELS = {
  'planned': 'Planejado',
  'active': 'Ativo',
  'completed': 'Concluído',
  'cancelled': 'Cancelado',
  'em_producao': 'Em Produção',
  'aguardando_assinatura': 'Aguardando Assinatura',
  'aguardando_aprovacao': 'Aguardando Aprovação',
  'aguardando_nota_fiscal': 'Aguardando Nota Fiscal',
  'aguardando_pagamento': 'Aguardando Pagamento',
  'aguardando_repasse': 'Aguardando Repasse',
  'finalizados': 'Finalizados',
  'concluido': 'Concluído',
  'cancelado': 'Cancelado',
};

const AVAILABLE_STATUS_OPTIONS = [
  'em_producao',
  'aguardando_assinatura',
  'aguardando_aprovacao',
  'aguardando_nota_fiscal',
  'aguardando_pagamento',
  'aguardando_repasse',
];

const ProjectsExpandedTable: React.FC<ProjectsExpandedTableProps> = ({
  projects,
  onUpdateProject,
  onDeleteProject,
  onEditProject,
  onRefresh,
}) => {
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());
  const [descriptionDialog, setDescriptionDialog] = useState<{ open: boolean; content: string; title: string }>({
    open: false,
    content: '',
    title: '',
  });

  const {
    updateProjectStatus,
    updateStageStatus,
    completeProject,
    completeStage,
    uncompleteStage,
    cancelProject,
    deleteStage,
  } = useProjectActions();

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

  const getShortName = (fullName?: string) => {
    if (!fullName) return '-';
    const names = fullName.trim().split(' ');
    if (names.length === 1) return names[0];
    return `${names[0]} ${names[1] || ''}`.trim();
  };

  const handleStatusChange = async (projectId: string, newStatus: string, isStage = false, stageId?: string) => {
    if (isStage && stageId) {
      await updateStageStatus(stageId, newStatus);
    } else {
      await updateProjectStatus(projectId, newStatus);
    }
    onRefresh?.();
  };

  const handleCompleteProject = async (projectId: string, isStage = false, stageId?: string) => {
    if (isStage && stageId) {
      const project = projects.find(p => p.id === projectId);
      const stage = project?.stages?.find(s => s.id === stageId);
      
      if (stage?.completed) {
        await uncompleteStage(stageId);
      } else {
        await completeStage(stageId);
      }
    } else {
      const project = projects.find(p => p.id === projectId);
      const allStagesCompleted = project?.stages?.every(stage => stage.completed) ?? true;
      
      if (!allStagesCompleted) {
        alert('Todas as etapas devem estar concluídas antes de concluir o projeto.');
        return;
      }
      
      await completeProject(projectId);
    }
    onRefresh?.();
  };

  const handleCancelProject = async (projectId: string) => {
    if (window.confirm('Tem certeza que deseja cancelar este projeto?')) {
      await cancelProject(projectId);
      onRefresh?.();
    }
  };

  const handleDeleteStage = async (stageId: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta etapa?')) {
      await deleteStage(stageId);
      onRefresh?.();
    }
  };

  const handleEditProject = (project: Project) => {
    if (onEditProject) {
      onEditProject(project);
    }
  };

  const openDescriptionModal = (content: string, title: string) => {
    setDescriptionDialog({ open: true, content, title });
  };

  const renderProjectRow = (project: Project) => {
    const isExpanded = expandedProjects.has(project.id);
    const completedStages = project.stages?.filter(s => s.completed).length || 0;
    const totalStages = project.stages?.length || 0;
    const progressText = totalStages > 0 ? `${completedStages}/${totalStages}` : '0/0';

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
            <Select 
              value={project.status} 
              onValueChange={(value) => handleStatusChange(project.id, value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue>
                  <Badge 
                    variant="outline"
                    className={cn("", getStatusColor(project.status))}
                  >
                    {getStatusLabel(project.status)}
                  </Badge>
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {AVAILABLE_STATUS_OPTIONS.map((status) => (
                  <SelectItem key={status} value={status}>
                    {getStatusLabel(status)}
                  </SelectItem>
                ))}
                {project.status === 'concluido' && (
                  <SelectItem value="concluido">Concluído</SelectItem>
                )}
                {project.status === 'cancelado' && (
                  <SelectItem value="cancelado">Cancelado</SelectItem>
                )}
              </SelectContent>
            </Select>
          </TableCell>
          <TableCell>{getShortName(project.client_name)}</TableCell>
          <TableCell>{getShortName(project.main_consultant_name)}</TableCell>
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
            {project.description ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => openDescriptionModal(project.description!, project.name)}
                className="h-8 w-8 p-0"
              >
                <FileText className="h-4 w-4" />
              </Button>
            ) : (
              '-'
            )}
          </TableCell>
          <TableCell>
            <span className="text-sm font-medium">{progressText}</span>
          </TableCell>
          <TableCell className="text-right">
            <div className="flex justify-end gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleEditProject(project)}
                className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700"
                title="Editar projeto"
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleCompleteProject(project.id)}
                className="h-8 w-8 p-0 text-green-600 hover:text-green-700"
                title="Concluir projeto"
              >
                <Check className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleCancelProject(project.id)}
                className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                title="Cancelar projeto"
              >
                <X className="h-4 w-4" />
              </Button>
              {onDeleteProject && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDeleteProject(project.id)}
                  className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                  title="Excluir projeto"
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
              <Select 
                value={stage.status} 
                onValueChange={(value) => handleStatusChange(project.id, value, true, stage.id)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue>
                    <Badge 
                      variant="outline"
                      className={cn("", getStatusColor(stage.status))}
                    >
                      {getStatusLabel(stage.status)}
                    </Badge>
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {AVAILABLE_STATUS_OPTIONS.map((status) => (
                    <SelectItem key={status} value={status}>
                      {getStatusLabel(status)}
                    </SelectItem>
                  ))}
                  {stage.status === 'finalizados' && (
                    <SelectItem value="finalizados">Finalizados</SelectItem>
                  )}
                  {stage.status === 'cancelados' && (
                    <SelectItem value="cancelados">Cancelados</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </TableCell>
            <TableCell>-</TableCell>
            <TableCell>{getShortName(stage.consultant_name)}</TableCell>
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
              {stage.description ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => openDescriptionModal(stage.description!, stage.name)}
                  className="h-8 w-8 p-0"
                >
                  <FileText className="h-4 w-4" />
                </Button>
              ) : (
                '-'
              )}
            </TableCell>
            <TableCell>
              {stage.completed_at && (
                <div className="text-xs text-green-600">
                  Concluído em {format(new Date(stage.completed_at), "dd/MM/yyyy", { locale: ptBR })}
                </div>
              )}
            </TableCell>
            <TableCell>
              <div className="flex justify-end gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleCompleteProject(project.id, true, stage.id)}
                  className="h-8 w-8 p-0 text-green-600 hover:text-green-700"
                  title={stage.completed ? 'Desfazer conclusão' : 'Concluir etapa'}
                >
                  <Check className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteStage(stage.id)}
                  className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                  title="Excluir etapa"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </React.Fragment>
    );
  };

  return (
    <>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Projeto</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Consultor</TableHead>
              <TableHead>Serviço</TableHead>
              <TableHead>Valor Total</TableHead>
              <TableHead>Data Início</TableHead>
              <TableHead>Data Fim</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead>Progresso</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {projects.length > 0 ? (
              projects.map(renderProjectRow)
            ) : (
              <TableRow>
                <TableCell colSpan={11} className="text-center py-4 text-muted-foreground">
                  Nenhum projeto encontrado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={descriptionDialog.open} onOpenChange={(open) => setDescriptionDialog(prev => ({ ...prev, open }))}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{descriptionDialog.title}</DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            <p className="text-sm text-gray-700 whitespace-pre-wrap">
              {descriptionDialog.content}
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ProjectsExpandedTable;
