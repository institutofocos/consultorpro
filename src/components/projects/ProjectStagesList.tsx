import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, Circle, Calendar, User, DollarSign, Zap } from 'lucide-react';
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

interface ProjectStagesListProps {
  project: Project;
  onProjectUpdated: () => void;
}

const ProjectStagesList: React.FC<ProjectStagesListProps> = ({ 
  project, 
  onProjectUpdated 
}) => {
  const { updateStageStatus, isLoading } = useProjectActions();
  const { getStageStatusChangeDate } = useProjectHistory(project.id);

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

  const handleStageStatusChange = async (stageId: string, newStatus: string) => {
    try {
      await updateStageStatus(stageId, newStatus);
      toast.success('Status da etapa atualizado com sucesso!');
      await onProjectUpdated();
    } catch (error) {
      console.error('Erro ao atualizar status da etapa:', error);
      toast.error('Erro ao atualizar status da etapa');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'iniciar_projeto':
        return 'bg-gray-100 text-gray-800';
      case 'em_producao':
        return 'bg-yellow-100 text-yellow-800';
      case 'concluido':
        return 'bg-green-100 text-green-800';
      case 'cancelado':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  const getStatusLabel = (status: string) => {
    const option = statusOptions.find(opt => opt.value === status);
    return option ? option.label : status;
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

  if (!project.stages || project.stages.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Etapas do Projeto</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            Este projeto não possui etapas cadastradas.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">
          Etapas do Projeto ({project.stages.length})
        </h3>
        <div className="text-sm text-muted-foreground">
          {project.completedStages || 0} de {project.stages.length} concluídas
        </div>
      </div>

      {project.stages.map((stage, index) => (
        <Card key={stage.id}>
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-1">
                  {stage.completed ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <Circle className="h-5 w-5 text-gray-400" />
                  )}
                </div>
                <div>
                  <h4 className="font-medium text-lg mb-1">
                    {stage.name}
                  </h4>
                  {stage.description && (
                    <p className="text-sm text-muted-foreground mb-2">
                      {stage.description}
                    </p>
                  )}
                  <Badge className={getStatusColor(stage.status)} variant="secondary">
                    {formatStatusWithDate(stage.status, stage.id)}
                  </Badge>
                </div>
              </div>
              
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
                      onClick={() => handleStageStatusChange(stage.id, option.value)}
                    >
                      {option.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="text-muted-foreground">Valor</div>
                  <div className="font-medium">{formatCurrency(stage.value)}</div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="text-muted-foreground">Início</div>
                  <div className="font-medium">{formatDate(stage.startDate || '')}</div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="text-muted-foreground">Fim</div>
                  <div className="font-medium">{formatDate(stage.endDate || '')}</div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="text-muted-foreground">Duração</div>
                  <div className="font-medium">{stage.days} dias / {stage.hours}h</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default ProjectStagesList;
