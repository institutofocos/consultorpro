
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, Circle, Calendar, User, DollarSign, Zap } from 'lucide-react';
import { Project } from './types';
import { useProjectActions } from '@/hooks/useProjectActions';
import { useProjectHistory } from '@/hooks/useProjectHistory';
import { useProjectStatuses } from '@/hooks/useProjectStatuses';
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
  readOnly?: boolean;
}

const ProjectStagesList: React.FC<ProjectStagesListProps> = ({ 
  project, 
  onProjectUpdated,
  readOnly = false
}) => {
  const { updateStageStatus, isLoading } = useProjectActions();
  const { getStageStatusChangeDate } = useProjectHistory(project.id);
  const { statuses, getStatusDisplay, getStatusBadgeStyle } = useProjectStatuses();

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

  // Função para manter ordem original das etapas - NUNCA reordenar
  const getSortedStages = (stages: any[]) => {
    if (!stages || stages.length === 0) return [];
    
    // Retorna sempre a ordem original do array sem qualquer alteração
    return [...stages];
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
    const statusDisplay = getStatusDisplay(status);
    const changeDate = getStageStatusChangeDate(stageId, status);
    
    if (changeDate) {
      const formattedDate = formatDate(changeDate);
      return `${statusDisplay.label} EM ${formattedDate}`;
    }
    
    return statusDisplay.label;
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

  // Obter etapas na ordem original (sem ordenação)
  const sortedStages = getSortedStages(project.stages);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">
          Etapas do Projeto ({sortedStages.length})
        </h3>
        <div className="text-sm text-muted-foreground">
          {project.completedStages || 0} de {sortedStages.length} concluídas
        </div>
      </div>

      {sortedStages.map((stage, index) => {
        const statusDisplay = getStatusDisplay(stage.status);
        const isCompleted = statuses.find(s => s.name === stage.status)?.is_completion_status || false;
        
        return (
          <Card key={stage.id}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-1">
                    {isCompleted ? (
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
                    <Badge style={getStatusBadgeStyle(stage.status)} variant="secondary">
                      {formatStatusWithDate(stage.status, stage.id)}
                    </Badge>
                  </div>
                </div>
                
                {!readOnly && (
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
                    <DropdownMenuContent className="bg-white border shadow-lg z-50">
                      {statuses.length === 0 ? (
                        <DropdownMenuItem disabled className="text-muted-foreground">
                          Nenhum status disponível
                        </DropdownMenuItem>
                      ) : (
                        statuses.map((status) => (
                          <DropdownMenuItem
                            key={status.id}
                            onClick={() => handleStageStatusChange(stage.id, status.name)}
                            disabled={status.name === stage.status}
                            className="cursor-pointer hover:bg-gray-100"
                          >
                            <div className="flex items-center gap-2">
                              <div 
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: status.color }}
                              />
                              {status.display_name}
                            </div>
                          </DropdownMenuItem>
                        ))
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
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
        );
      })}
    </div>
  );
};

export default ProjectStagesList;
