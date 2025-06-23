
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Calendar, Clock, User, Building, Tag, CheckCircle, AlertCircle, DollarSign } from 'lucide-react';
import { Project, Stage } from '@/components/projects/types';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useProjectStatuses } from '@/hooks/useProjectStatuses';

interface KanbanCardProps {
  project?: Project;
  stage?: Stage & { projectName?: string; clientName?: string };
  onClick: () => void;
  type: 'project' | 'stage';
}

const KanbanCard: React.FC<KanbanCardProps> = ({ project, stage, onClick, type }) => {
  const { getStatusDisplay, getStatusBadgeStyle } = useProjectStatuses();

  const getPriorityIcon = (value: number) => {
    if (value >= 50000) return <AlertCircle className="h-3 w-3 text-red-500" />;
    if (value >= 20000) return <AlertCircle className="h-3 w-3 text-yellow-500" />;
    return <CheckCircle className="h-3 w-3 text-green-500" />;
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (date: string) => {
    if (!date) return 'Sem data';
    try {
      return formatDistanceToNow(new Date(date), { 
        addSuffix: true, 
        locale: ptBR 
      });
    } catch {
      return 'Data inválida';
    }
  };

  if (type === 'project' && project) {
    const completedStages = project.stages?.filter(stage => stage.completed).length || 0;
    const totalStages = project.stages?.length || 0;
    const progress = totalStages > 0 ? (completedStages / totalStages) * 100 : 0;
    
    // Garantir que sempre temos um status
    const projectStatus = project.status || 'planned';
    const statusDisplay = getStatusDisplay(projectStatus);
    const statusStyle = getStatusBadgeStyle(projectStatus);

    return (
      <Card 
        className="cursor-pointer hover:shadow-lg transition-all duration-200 border-l-4 border-l-blue-500"
        onClick={onClick}
      >
        <CardContent className="p-4 space-y-3">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h4 className="font-semibold text-sm line-clamp-2 mb-1">
                {project.name}
              </h4>
              <div className="flex gap-1 flex-wrap">
                <Badge style={statusStyle} variant="secondary" className="text-xs">
                  {statusDisplay.label}
                </Badge>
                {project.project_id && (
                  <Badge variant="outline" className="text-xs">
                    {project.project_id}
                  </Badge>
                )}
              </div>
            </div>
            {getPriorityIcon(project.totalValue)}
          </div>

          {/* Valor e Progresso */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <DollarSign className="h-3 w-3 text-gray-500" />
              <span className="text-xs font-medium">
                {formatCurrency(project.totalValue)}
              </span>
            </div>
            
            {totalStages > 0 && (
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-gray-600">
                  <span>Progresso</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5">
                  <div 
                    className="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Informações */}
          <div className="space-y-2">
            {project.clientName && (
              <div className="flex items-center gap-2">
                <Building className="h-3 w-3 text-gray-500" />
                <span className="text-xs text-gray-600 truncate">
                  {project.clientName}
                </span>
              </div>
            )}

            {project.mainConsultantName && (
              <div className="flex items-center gap-2">
                <User className="h-3 w-3 text-gray-500" />
                <span className="text-xs text-gray-600 truncate">
                  {project.mainConsultantName}
                </span>
              </div>
            )}

            {project.endDate && (
              <div className="flex items-center gap-2">
                <Calendar className="h-3 w-3 text-gray-500" />
                <span className="text-xs text-gray-600">
                  {formatDate(project.endDate)}
                </span>
              </div>
            )}
          </div>

          {/* Tags */}
          {project.tags && project.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {project.tags.slice(0, 2).map((tag, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
              {project.tags.length > 2 && (
                <Badge variant="outline" className="text-xs">
                  +{project.tags.length - 2}
                </Badge>
              )}
            </div>
          )}

          {/* Etapas */}
          {totalStages > 0 && (
            <div className="flex items-center gap-2">
              <CheckCircle className="h-3 w-3 text-gray-500" />
              <span className="text-xs text-gray-600">
                {completedStages}/{totalStages} etapas
              </span>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  if (type === 'stage' && stage) {
    // Garantir que sempre temos um status para etapas
    const stageStatus = stage.status || 'iniciar_projeto';
    const statusDisplay = getStatusDisplay(stageStatus);
    const statusStyle = getStatusBadgeStyle(stageStatus);

    return (
      <Card 
        className="cursor-pointer hover:shadow-lg transition-all duration-200 border-l-4 border-l-green-500"
        onClick={onClick}
      >
        <CardContent className="p-4 space-y-3">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h4 className="font-semibold text-sm line-clamp-2 mb-1">
                {stage.name}
              </h4>
              <div className="flex gap-1 flex-wrap">
                <Badge style={statusStyle} variant="secondary" className="text-xs">
                  {statusDisplay.label}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  Etapa
                </Badge>
              </div>
            </div>
            {stage.completed && <CheckCircle className="h-3 w-3 text-green-500" />}
          </div>

          {/* Valor */}
          <div className="flex items-center gap-2">
            <DollarSign className="h-3 w-3 text-gray-500" />
            <span className="text-xs font-medium">
              {formatCurrency(stage.value)}
            </span>
          </div>

          {/* Informações */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Building className="h-3 w-3 text-gray-500" />
              <span className="text-xs text-gray-600 truncate">
                {stage.projectName}
              </span>
            </div>

            {stage.clientName && (
              <div className="flex items-center gap-2">
                <User className="h-3 w-3 text-gray-500" />
                <span className="text-xs text-gray-600 truncate">
                  {stage.clientName}
                </span>
              </div>
            )}

            {stage.endDate && (
              <div className="flex items-center gap-2">
                <Calendar className="h-3 w-3 text-gray-500" />
                <span className="text-xs text-gray-600">
                  {formatDate(stage.endDate)}
                </span>
              </div>
            )}

            <div className="flex items-center gap-2">
              <Clock className="h-3 w-3 text-gray-500" />
              <span className="text-xs text-gray-600">
                {stage.hours}h · {stage.days} dias
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return null;
};

export default KanbanCard;
