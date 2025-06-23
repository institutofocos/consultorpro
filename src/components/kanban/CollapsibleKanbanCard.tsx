
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Calendar, DollarSign, MoreVertical, ChevronDown, ChevronUp, Building, User } from 'lucide-react';
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
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { getStatusDisplay, getStatusBadgeStyle } = useProjectStatuses();

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

  const handleMenuClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  const handleToggleCollapse = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsCollapsed(!isCollapsed);
  };

  if (type === 'project' && project) {
    const projectStatus = project.status || 'planned';
    const statusDisplay = getStatusDisplay(projectStatus);
    const statusStyle = getStatusBadgeStyle(projectStatus);

    return (
      <Card 
        className="cursor-pointer hover:shadow-lg transition-all duration-200 border-l-4 border-l-blue-500"
        onClick={onClick}
      >
        <CardContent className="p-4 space-y-3">
          {/* Header com Menu */}
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h4 className="font-semibold text-sm line-clamp-2 mb-1">
                {project.name}
              </h4>
              <div className="flex gap-1 flex-wrap">
                <Badge style={statusStyle} variant="secondary" className="text-xs">
                  {statusDisplay.label}
                </Badge>
                {project.projectId && (
                  <Badge variant="outline" className="text-xs">
                    {project.projectId}
                  </Badge>
                )}
              </div>
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={handleMenuClick}>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
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

          {/* Informações Essenciais (sempre visíveis) */}
          <div className="space-y-2">
            {project.serviceName && (
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  {project.serviceName}
                </Badge>
              </div>
            )}
            
            <div className="flex justify-between text-xs text-gray-600">
              <span>Início: {project.startDate ? formatDate(project.startDate) : 'Não definido'}</span>
              <span>Fim: {project.endDate ? formatDate(project.endDate) : 'Não definido'}</span>
            </div>
          </div>

          {/* Informações Expandidas */}
          {!isCollapsed && (
            <>
              {/* Valor e Progresso */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-3 w-3 text-gray-500" />
                  <span className="text-xs font-medium">
                    {formatCurrency(project.totalValue)}
                  </span>
                </div>
                
                {project.stages && project.stages.length > 0 && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-gray-600">
                      <span>Progresso</span>
                      <span>
                        {Math.round((project.stages.filter(s => s.completed).length / project.stages.length) * 100)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <div 
                        className="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
                        style={{ 
                          width: `${(project.stages.filter(s => s.completed).length / project.stages.length) * 100}%` 
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Informações Adicionais */}
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
            </>
          )}
        </CardContent>
      </Card>
    );
  }

  if (type === 'stage' && stage) {
    const stageStatus = stage.status || 'iniciar_projeto';
    const statusDisplay = getStatusDisplay(stageStatus);
    const statusStyle = getStatusBadgeStyle(stageStatus);

    return (
      <Card 
        className="cursor-pointer hover:shadow-lg transition-all duration-200 border-l-4 border-l-green-500"
        onClick={onClick}
      >
        <CardContent className="p-4 space-y-3">
          {/* Header com Menu */}
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
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={handleMenuClick}>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
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

          {/* Informações Essenciais */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Building className="h-3 w-3 text-gray-500" />
              <span className="text-xs text-gray-600 truncate">
                {stage.projectName}
              </span>
            </div>
            
            <div className="flex justify-between text-xs text-gray-600">
              <span>Início: {stage.startDate ? formatDate(stage.startDate) : 'Não definido'}</span>
              <span>Fim: {stage.endDate ? formatDate(stage.endDate) : 'Não definido'}</span>
            </div>
          </div>

          {/* Informações Expandidas */}
          {!isCollapsed && (
            <>
              <div className="flex items-center gap-2">
                <DollarSign className="h-3 w-3 text-gray-500" />
                <span className="text-xs font-medium">
                  {formatCurrency(stage.value)}
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

              <div className="flex items-center gap-2">
                <Calendar className="h-3 w-3 text-gray-500" />
                <span className="text-xs text-gray-600">
                  {stage.hours}h · {stage.days} dias
                </span>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    );
  }

  return null;
};

export default CollapsibleKanbanCard;
