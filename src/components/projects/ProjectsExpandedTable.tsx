import React from 'react';
import { TableRow, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2, Eye, MoreHorizontal } from 'lucide-react';
import { Project } from './types';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import ServiceNameCell from './ServiceNameCell';
import { Progress } from '@/components/ui/progress';
import ProjectDescriptionModal from './ProjectDescriptionModal';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useProjectStatuses } from '@/hooks/useProjectStatuses';

interface ProjectsExpandedTableProps {
  projects: Project[];
  onDeleteProject: (id: string) => void;
  onEditProject: (project: Project) => void;
  onRefresh: () => void;
  selectedProjects: Set<string>;
  onProjectSelect: (projectId: string, checked: boolean) => void;
  showCheckbox?: boolean;
  isGroupedProject?: boolean; // Nova prop para indicar se é um projeto de grupo expandido
}

const ProjectsExpandedTable: React.FC<ProjectsExpandedTableProps> = ({
  projects,
  onDeleteProject,
  onEditProject,
  onRefresh,
  selectedProjects,
  onProjectSelect,
  showCheckbox = false,
  isGroupedProject = false, // Valor padrão false
}) => {
  const [selectedDescription, setSelectedDescription] = React.useState<string | null>(null);
  const [isDescriptionModalOpen, setIsDescriptionModalOpen] = React.useState(false);

  // Hook para buscar status dinâmicos
  const { statuses } = useProjectStatuses();

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clients')
        .select('id, name');
      
      if (error) {
        console.error('Erro ao buscar clientes:', error);
        return [];
      }
      
      return data || [];
    },
  });

  const { data: consultants = [] } = useQuery({
    queryKey: ['consultants'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('consultants')
        .select('id, name');
      
      if (error) {
        console.error('Erro ao buscar consultores:', error);
        return [];
      }
      
      return data || [];
    },
  });

  const { data: tags = [] } = useQuery({
    queryKey: ['project_tags'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('project_tags')
        .select('id, name, color');
      
      if (error) {
        console.error('Erro ao buscar tags:', error);
        return [];
      }
      
      return data || [];
    },
  });

  const getClientName = (clientId: string | null) => {
    if (!clientId) return '-';
    const client = clients.find(c => c.id === clientId);
    return client ? client.name : '-';
  };

  const getConsultantName = (consultantId: string | null) => {
    if (!consultantId) return '-';
    const consultant = consultants.find(c => c.id === consultantId);
    return consultant ? consultant.name : '-';
  };

  const getStatusInfo = (status: string) => {
    const statusInfo = statuses.find(s => s.name === status);
    if (statusInfo) {
      return {
        displayName: statusInfo.display_name,
        color: statusInfo.color
      };
    }
    return { displayName: status, color: '#6B7280' };
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const calculateProgress = (project: Project) => {
    if (!project.stages || project.stages.length === 0) return 0;
    
    const completedStages = project.stages.filter(stage => stage.completed).length;
    return Math.round((completedStages / project.stages.length) * 100);
  };

  const isOverdue = (endDate: string | null) => {
    if (!endDate) return false;
    const today = new Date();
    const targetDate = new Date(endDate);
    return targetDate < today;
  };

  const isCompletedStatus = (status: string) => {
    const completionStatuses = statuses.filter(s => s.is_completion_status);
    return completionStatuses.some(s => s.name === status) || status === 'concluido';
  };

  const getProjectTags = (project: Project) => {
    if (!project.tagIds || project.tagIds.length === 0) return [];
    
    return project.tagIds
      .map(tagId => tags.find(tag => tag.id === tagId))
      .filter(Boolean);
  };

  const showDescription = (description: string) => {
    setSelectedDescription(description);
    setIsDescriptionModalOpen(true);
  };

  return (
    <>
      {projects.map((project) => {
        const statusInfo = getStatusInfo(project.status);
        const progress = calculateProgress(project);
        const projectTags = getProjectTags(project);
        const projectOverdue = !isCompletedStatus(project.status) && isOverdue(project.endDate);
        
        // Definir a classe de background baseada se é um projeto de grupo expandido
        const rowClassName = isGroupedProject 
          ? "bg-blue-25 hover:bg-blue-50 border-l-4 border-l-blue-200" 
          : "hover:bg-muted/50";

        return (
          <TableRow 
            key={project.id} 
            className={rowClassName}
          >
            {showCheckbox && (
              <TableCell className="w-12">
                <input
                  type="checkbox"
                  checked={selectedProjects.has(project.id)}
                  onChange={(e) => onProjectSelect(project.id, e.target.checked)}
                  className="rounded border-gray-300"
                />
              </TableCell>
            )}
            
            <TableCell className="font-medium">
              <div className="flex items-center gap-2">
                {isGroupedProject && <span className="text-blue-600">└─</span>}
                <span className={projectOverdue ? 'text-red-600 font-semibold' : ''}>
                  {project.name}
                </span>
              </div>
            </TableCell>
            
            <TableCell>
              <Badge 
                variant="secondary" 
                style={{ 
                  backgroundColor: `${statusInfo.color}20`,
                  color: statusInfo.color,
                  borderColor: statusInfo.color
                }}
                className="border"
              >
                {statusInfo.displayName}
              </Badge>
            </TableCell>
            
            <TableCell>{getClientName(project.clientId)}</TableCell>
            
            <TableCell>
              <div className="space-y-1">
                <div className="text-sm">
                  <strong>Principal:</strong> {getConsultantName(project.mainConsultantId)}
                </div>
                {project.supportConsultantId && (
                  <div className="text-sm text-muted-foreground">
                    <strong>Apoio:</strong> {getConsultantName(project.supportConsultantId)}
                  </div>
                )}
              </div>
            </TableCell>
            
            <TableCell>
              <ServiceNameCell serviceId={project.serviceId} />
            </TableCell>
            
            <TableCell>
              <div className="flex flex-wrap gap-1">
                {projectTags.length > 0 ? (
                  projectTags.map((tag) => (
                    <Badge 
                      key={tag.id} 
                      variant="outline" 
                      className="text-xs"
                      style={{ 
                        backgroundColor: `${tag.color}20`,
                        borderColor: tag.color,
                        color: tag.color
                      }}
                    >
                      {tag.name}
                    </Badge>
                  ))
                ) : (
                  <span className="text-muted-foreground">-</span>
                )}
              </div>
            </TableCell>
            
            <TableCell className="font-semibold">
              {formatCurrency(project.totalValue)}
            </TableCell>
            
            <TableCell>{formatDate(project.startDate)}</TableCell>
            
            <TableCell className={projectOverdue ? 'text-red-600 font-semibold' : ''}>
              {formatDate(project.endDate)}
            </TableCell>
            
            <TableCell>
              <div className="max-w-xs">
                {project.description ? (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => showDescription(project.description!)}
                    className="p-1 h-auto text-left justify-start"
                  >
                    <Eye className="h-3 w-3 mr-1" />
                    <span className="truncate text-xs">
                      {project.description.substring(0, 30)}...
                    </span>
                  </Button>
                ) : (
                  <span className="text-muted-foreground">-</span>
                )}
              </div>
            </TableCell>
            
            <TableCell>
              <div className="flex items-center gap-2 min-w-[100px]">
                <Progress value={progress} className="flex-1" />
                <span className="text-xs font-medium">{progress}%</span>
              </div>
            </TableCell>
            
            <TableCell>
              {project.url ? (
                <Button variant="ghost" size="sm" asChild>
                  <a href={project.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800">
                    Link
                  </a>
                </Button>
              ) : (
                <span className="text-muted-foreground">-</span>
              )}
            </TableCell>
            
            <TableCell>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 p-0"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                    <span className="sr-only">Abrir menu</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={() => onEditProject(project)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Editar
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => onDeleteProject(project.id)}
                    className="text-red-600"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Excluir
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        );
      })}
      
      <ProjectDescriptionModal
        isOpen={isDescriptionModalOpen}
        onClose={() => setIsDescriptionModalOpen(false)}
        description={selectedDescription || ''}
      />
    </>
  );
};

export default ProjectsExpandedTable;
