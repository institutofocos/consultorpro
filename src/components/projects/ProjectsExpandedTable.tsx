
import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  Edit, 
  Trash2, 
  Eye, 
  Calendar, 
  User, 
  DollarSign,
  Clock,
  AlertTriangle,
  CheckCircle2,
  FileText
} from 'lucide-react';
import { format, isAfter, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Project } from './types';
import { useUserPermissions } from '@/hooks/useUserPermissions';
import ProjectDescriptionModal from './ProjectDescriptionModal';
import { useProjectStatuses } from '@/hooks/useProjectStatuses';

interface ProjectsExpandedTableProps {
  projects: Project[];
  onDeleteProject: (id: string) => void;
  onEditProject: (project: Project) => void;
  onRefresh: () => Promise<any>;
  showCheckboxes?: boolean;
  onProjectSelection?: (projectId: string, checked: boolean) => void;
  selectedProjectIds?: string[];
}

const ProjectsExpandedTable: React.FC<ProjectsExpandedTableProps> = ({
  projects,
  onDeleteProject,
  onEditProject,
  onRefresh,
  showCheckboxes = false,
  onProjectSelection,
  selectedProjectIds = []
}) => {
  const { userProfile } = useUserPermissions();
  const isConsultant = userProfile?.profile_name === 'Consultor';
  const { statuses } = useProjectStatuses();
  const [selectedProject, setSelectedProject] = React.useState<Project | null>(null);
  const [isDescriptionModalOpen, setIsDescriptionModalOpen] = React.useState(false);

  // Helper function to get first name only
  const getFirstName = (fullName: string | null | undefined): string => {
    if (!fullName) return '-';
    return fullName.split(' ')[0];
  };

  // Helper function to get first and second names
  const getFirstAndSecondName = (fullName: string | null | undefined): string => {
    if (!fullName) return '-';
    const names = fullName.split(' ');
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

  const getStatusInfo = (status: string) => {
    const statusConfig = statuses.find(s => s.name === status);
    if (statusConfig) {
      return {
        name: statusConfig.display_name,
        color: statusConfig.color
      };
    }
    
    // Fallback para status não configurados
    const statusMap: { [key: string]: { name: string; color: string } } = {
      'iniciar_projeto': { name: 'Iniciar Projeto', color: '#f59e0b' },
      'em_planejamento': { name: 'Em Planejamento', color: '#f59e0b' },
      'em_producao': { name: 'Em Produção', color: '#3b82f6' },
      'concluido': { name: 'Concluído', color: '#10b981' },
      'cancelado': { name: 'Cancelado', color: '#ef4444' },
      'pausado': { name: 'Pausado', color: '#6b7280' }
    };
    
    return statusMap[status] || { name: status, color: '#6b7280' };
  };

  const isProjectOverdue = (project: Project) => {
    if (!project.endDate) return false;
    const today = new Date();
    const endDate = parseISO(project.endDate);
    const statusInfo = statuses.find(s => s.name === project.status);
    const isCompleted = statusInfo?.is_completion_status || project.status === 'concluido';
    return !isCompleted && isAfter(today, endDate);
  };

  const hasOverdueStages = (project: Project) => {
    if (!project.stages) return false;
    const today = new Date();
    
    return project.stages.some(stage => {
      if (!stage.endDate || stage.completed) return false;
      const stageEndDate = parseISO(stage.endDate);
      const stageStatusInfo = statuses.find(s => s.name === stage.status);
      const isStageCompleted = stageStatusInfo?.is_completion_status || stage.status === 'concluido';
      return !isStageCompleted && isAfter(today, stageEndDate);
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    try {
      return format(parseISO(dateString), 'dd/MM/yyyy', { locale: ptBR });
    } catch {
      return '-';
    }
  };

  const handleViewDescription = (project: Project) => {
    setSelectedProject(project);
    setIsDescriptionModalOpen(true);
  };

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            {showCheckboxes && (
              <TableHead className="w-12">
                <span className="sr-only">Selecionar</span>
              </TableHead>
            )}
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
            <TableHead>URL</TableHead>
            <TableHead>Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {projects.map((project) => {
            const statusInfo = getStatusInfo(project.status);
            const isOverdue = isProjectOverdue(project);
            const hasStagesOverdue = hasOverdueStages(project);
            const showOverdueWarning = isOverdue || hasStagesOverdue;
            
            return (
              <TableRow 
                key={project.id}
                className={showOverdueWarning ? 'bg-red-50 border-l-4 border-l-red-500' : ''}
              >
                {showCheckboxes && (
                  <TableCell>
                    <Checkbox
                      checked={selectedProjectIds.includes(project.id)}
                      onCheckedChange={(checked) => {
                        onProjectSelection?.(project.id, checked as boolean);
                      }}
                    />
                  </TableCell>
                )}
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    {showOverdueWarning && (
                      <AlertTriangle className="h-4 w-4 text-red-500" />
                    )}
                    <span>{project.name}</span>
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
                  >
                    {statusInfo.name}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <User className="h-3 w-3 text-gray-400" />
                    <span className="text-sm">{project.clientName || 'Sem cliente'}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <User className="h-3 w-3 text-gray-400" />
                    <span className="text-sm">{project.mainConsultantName || 'Não atribuído'}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="text-sm">{project.serviceName || 'Não especificado'}</span>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {project.tags && project.tags.length > 0 ? (
                      project.tags.slice(0, 2).map((tag, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-sm text-gray-400">-</span>
                    )}
                    {project.tags && project.tags.length > 2 && (
                      <Badge variant="outline" className="text-xs">
                        +{project.tags.length - 2}
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <DollarSign className="h-3 w-3 text-gray-400" />
                    <span className="text-sm font-medium">{formatCurrency(project.totalValue)}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3 text-gray-400" />
                    <span className="text-sm">{formatDate(project.startDate)}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3 text-gray-400" />
                    <span className="text-sm">{formatDate(project.endDate)}</span>
                  </div>
                </TableCell>
                <TableCell>
                  {project.description ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleViewDescription(project)}
                      className="p-1 h-6 w-6"
                    >
                      <FileText className="h-3 w-3" />
                    </Button>
                  ) : (
                    <span className="text-sm text-gray-400">-</span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3 text-gray-400" />
                      <span className="text-xs">
                        {project.completedStages || 0}/{project.stages?.length || 0}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3 text-gray-400" />
                      <span className="text-xs">{project.totalHours || 0}h</span>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  {project.url ? (
                    <a 
                      href={project.url} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      Link
                    </a>
                  ) : (
                    <span className="text-sm text-gray-400">-</span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    {!isConsultant && (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onEditProject(project)}
                          className="p-1 h-6 w-6"
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onDeleteProject(project.id)}
                          className="p-1 h-6 w-6 text-red-500 hover:bg-red-50"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      {selectedProject && (
        <ProjectDescriptionModal
          isOpen={isDescriptionModalOpen}
          onClose={() => {
            setIsDescriptionModalOpen(false);
            setSelectedProject(null);
          }}
          projectName={selectedProject.name}
          description={selectedProject.description || ''}
        />
      )}
    </>
  );
};

export default ProjectsExpandedTable;
