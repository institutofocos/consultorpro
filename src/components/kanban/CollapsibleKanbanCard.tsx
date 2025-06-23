
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Calendar, DollarSign, MoreVertical, ChevronDown, ChevronUp, Building, User, Clock, ExternalLink, TrendingUp } from 'lucide-react';
import { Project, Stage } from '@/components/projects/types';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useProjectStatuses } from '@/hooks/useProjectStatuses';

interface CollapsibleKanbanCardProps {
  project?: Project;
  stage?: Stage & { projectName?: string; clientName?: string };
  onClick: () => void;
  type: 'project' | 'stage';
}

const CollapsibleKanbanCard: React.FC<CollapsibleKanbanCardProps> = ({ 
  project, 
  stage, 
  onClick, 
  type 
}) => {
  const [isCollapsed, setIsCollapsed] = useState(true);
  const { getStatusDisplay, getStatusBadgeStyle } = useProjectStatuses();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (date: string) => {
    if (!date) return 'Não definido';
    try {
      return formatDistanceToNow(new Date(date), { 
        addSuffix: true, 
        locale: ptBR 
      });
    } catch {
      return 'Data inválida';
    }
  };

  const handleMenuClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  const handleToggleCollapse = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsCollapsed(!isCollapsed);
  };

  if (type === 'project' && project) {
    const progressPercentage = project.stages && project.stages.length > 0 
      ? Math.round((project.stages.filter(s => s.completed).length / project.stages.length) * 100)
      : 0;

    return (
      <Card 
        className="cursor-pointer hover:shadow-lg transition-all duration-200 border-l-4 border-l-blue-500"
        onClick={onClick}
      >
        <CardContent className="p-4 space-y-3">
          {/* Header com título e menu */}
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-sm line-clamp-2 mb-2">
                {project.name}
              </h4>
              <div className="flex gap-1 flex-wrap mb-2">
                {project.projectId && (
                  <Badge variant="outline" className="text-xs">
                    {project.projectId}
                  </Badge>
                )}
              </div>
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={handleMenuClick}>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 flex-shrink-0">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleToggleCollapse}>
                  {isCollapsed ? (
                    <>
                      <ChevronDown className="h-4 w-4 mr-2" />
                      Expandir
                    </>
                  ) : (
                    <>
                      <ChevronUp className="h-4 w-4 mr-2" />
                      Colapsar
                    </>
                  )}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Informações sempre visíveis */}
          <div className="space-y-2">
            {/* Serviço */}
            {project.serviceName && (
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  {project.serviceName}
                </Badge>
              </div>
            )}
            
            {/* Datas */}
            <div className="flex justify-between text-xs text-gray-600">
              <span>Início: {formatDate(project.startDate)}</span>
              <span>Fim: {formatDate(project.endDate)}</span>
            </div>

            {/* Consultores (sempre visíveis) */}
            <div className="space-y-1">
              {project.mainConsultantName && (
                <div className="flex items-center gap-2">
                  <User className="h-3 w-3 text-blue-500" />
                  <span className="text-xs text-gray-600 truncate">
                    Principal: {project.mainConsultantName}
                  </span>
                </div>
              )}

              {project.supportConsultantName && (
                <div className="flex items-center gap-2">
                  <User className="h-3 w-3 text-green-500" />
                  <span className="text-xs text-gray-600 truncate">
                    Apoio: {project.supportConsultantName}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Informações Expandidas */}
          {!isCollapsed && (
            <div className="space-y-3 border-t pt-3">
              {/* Valores e Progresso */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-3 w-3 text-gray-500" />
                    <span className="text-xs font-medium">
                      {formatCurrency(project.totalValue)}
                    </span>
                  </div>
                  
                  {project.totalHours && project.hourlyRate && (
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Clock className="h-3 w-3 text-gray-500" />
                        <span className="text-xs text-gray-600">
                          {project.totalHours}h · {formatCurrency(project.hourlyRate)}/h
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  {project.stages && project.stages.length > 0 && (
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-3 w-3 text-gray-500" />
                        <span className="text-xs text-gray-600">
                          Progresso: {progressPercentage}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1.5">
                        <div 
                          className="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
                          style={{ width: `${progressPercentage}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Cliente e Gestor */}
              <div className="space-y-2">
                {project.clientName && (
                  <div className="flex items-center gap-2">
                    <Building className="h-3 w-3 text-gray-500" />
                    <span className="text-xs text-gray-600 truncate">
                      Cliente: {project.clientName}
                    </span>
                  </div>
                )}

                {project.managerName && (
                  <div className="flex items-center gap-2">
                    <User className="h-3 w-3 text-purple-500" />
                    <span className="text-xs text-gray-600 truncate">
                      Gestor: {project.managerName}
                    </span>
                  </div>
                )}

                {project.url && (
                  <div className="flex items-center gap-2">
                    <ExternalLink className="h-3 w-3 text-gray-500" />
                    <a 
                      href={project.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:underline truncate"
                      onClick={(e) => e.stopPropagation()}
                    >
                      Acessar projeto
                    </a>
                  </div>
                )}
              </div>

              {/* Tags */}
              {project.tags && project.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {project.tags.slice(0, 3).map((tag, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                  {project.tags.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{project.tags.length - 3}
                    </Badge>
                  )}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  if (type === 'stage' && stage) {
    const margin = stage.value && stage.valorDeRepasse ? stage.value - stage.valorDeRepasse : 0;
    const marginPercentage = stage.value ? Math.round((margin / stage.value) * 100) : 0;

    return (
      <Card 
        className="cursor-pointer hover:shadow-lg transition-all duration-200 border-l-4 border-l-green-500"
        onClick={onClick}
      >
        <CardContent className="p-4 space-y-3">
          {/* Header com título e menu */}
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-sm line-clamp-2 mb-1">
                {stage.name}
              </h4>
              <div className="text-xs text-gray-500 mb-2 truncate">
                Projeto: {stage.projectName}
              </div>
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={handleMenuClick}>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 flex-shrink-0">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleToggleCollapse}>
                  {isCollapsed ? (
                    <>
                      <ChevronDown className="h-4 w-4 mr-2" />
                      Expandir
                    </>
                  ) : (
                    <>
                      <ChevronUp className="h-4 w-4 mr-2" />
                      Colapsar
                    </>
                  )}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Informações sempre visíveis */}
          <div className="space-y-2">
            {/* Datas */}
            <div className="flex justify-between text-xs text-gray-600">
              <span>Início: {formatDate(stage.startDate)}</span>
              <span>Fim: {formatDate(stage.endDate)}</span>
            </div>

            {/* Cliente sempre visível */}
            <div className="space-y-1">
              {stage.clientName && (
                <div className="flex items-center gap-2">
                  <Building className="h-3 w-3 text-gray-500" />
                  <span className="text-xs text-gray-600 truncate">
                    Cliente: {stage.clientName}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Informações Expandidas */}
          {!isCollapsed && (
            <div className="space-y-3 border-t pt-3">
              {/* Valores e Métricas */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-3 w-3 text-gray-500" />
                    <span className="text-xs font-medium">
                      {formatCurrency(stage.value)}
                    </span>
                  </div>
                  
                  {stage.valorDeRepasse && (
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-3 w-3 text-green-500" />
                      <span className="text-xs text-gray-600">
                        Repasse: {formatCurrency(stage.valorDeRepasse)}
                      </span>
                    </div>
                  )}

                  {margin > 0 && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-600">
                        Margem: {formatCurrency(margin)} ({marginPercentage}%)
                      </span>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Clock className="h-3 w-3 text-gray-500" />
                    <span className="text-xs text-gray-600">
                      {stage.hours}h · {stage.days} dias
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Calendar className="h-3 w-3 text-gray-500" />
                    <span className="text-xs text-gray-600">
                      {stage.completed ? 'Concluída' : 'Em andamento'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return null;
};

export default CollapsibleKanbanCard;
