import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Eye, 
  Edit, 
  Trash2, 
  Calendar,
  ExternalLink,
  ChevronDown,
  ChevronRight,
  Settings
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Project } from './types';
import ProjectDetails from './ProjectDetails';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import ServiceNameCell from './ServiceNameCell';
import { useProjectActions } from '@/hooks/useProjectActions';
import { useProjectStatuses } from '@/hooks/useProjectStatuses';
import { useUserPermissions } from '@/hooks/useUserPermissions';

interface ProjectsExpandedTableProps {
  projects: Project[];
  onDeleteProject: (id: string) => void;
  onEditProject: (project: Project) => void;
  onRefresh: () => void;
}

const ProjectsExpandedTable: React.FC<ProjectsExpandedTableProps> = ({
  projects,
  onDeleteProject,
  onEditProject,
  onRefresh
}) => {
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  
  const { updateProjectStatus } = useProjectActions();
  const { statuses } = useProjectStatuses();
  const { userProfile, isLoading: permissionsLoading } = useUserPermissions();

  // Verificar se é consultor
  const isConsultant = userProfile?.profile_name === 'Consultor';

  const toggleProjectExpansion = (projectId: string) => {
    const newExpanded = new Set(expandedProjects);
    if (newExpanded.has(projectId)) {
      newExpanded.delete(projectId);
    } else {
      newExpanded.add(projectId);
    }
    setExpandedProjects(newExpanded);
  };

  const handleViewDetails = (project: Project) => {
    setSelectedProject(project);
    setIsDetailsOpen(true);
  };

  const formatCurrency = (value: number | null | undefined): string => {
    if (!value) return 'R$ 0,00';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string | null | undefined): string => {
    if (!dateString) return '-';
    try {
      return format(new Date(dateString), 'dd/MM/yyyy', { locale: ptBR });
    } catch {
      return '-';
    }
  };

  const getStatusColor = (status: string): string => {
    const statusConfig = statuses.find(s => s.name === status);
    return statusConfig?.color || '#3b82f6';
  };

  const getStatusDisplayName = (status: string): string => {
    const statusConfig = statuses.find(s => s.name === status);
    return statusConfig?.display_name || status;
  };

  const handleStatusChange = async (projectId: string, newStatus: string) => {
    try {
      await updateProjectStatus(projectId, newStatus);
      onRefresh();
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
    }
  };

  if (projects.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Nenhum projeto encontrado com os filtros aplicados.
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-8"></TableHead>
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
            {projects.map((project) => (
              <React.Fragment key={project.id}>
                <TableRow className="hover:bg-muted/50">
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleProjectExpansion(project.id)}
                      className="p-1"
                    >
                      {expandedProjects.has(project.id) ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </Button>
                  </TableCell>
                  <TableCell className="font-medium">
                    {project.name}
                  </TableCell>
                  <TableCell>
                    <Badge 
                      style={{ 
                        backgroundColor: getStatusColor(project.status),
                        color: 'white'
                      }}
                    >
                      {getStatusDisplayName(project.status)}
                    </Badge>
                  </TableCell>
                  <TableCell>{project.clientName || '-'}</TableCell>
                  <TableCell>{project.mainConsultantName || '-'}</TableCell>
                  <TableCell>
                    <ServiceNameCell 
                      serviceName={project.serviceName} 
                      serviceUrl={project.serviceUrl} 
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {project.tagNames && project.tagNames.length > 0 ? (
                        project.tagNames.map((tag, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))
                      ) : (
                        '-'
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{formatCurrency(project.totalValue)}</TableCell>
                  <TableCell>{formatDate(project.startDate)}</TableCell>
                  <TableCell>{formatDate(project.endDate)}</TableCell>
                  <TableCell className="max-w-xs">
                    <div className="truncate" title={project.description || ''}>
                      {project.description || '-'}
                    </div>
                  </TableCell>
                  <TableCell>
                    {project.stages && project.stages.length > 0 ? (
                      `${project.stages.filter(s => s.completed).length}/${project.stages.length}`
                    ) : (
                      '0/0'
                    )}
                  </TableCell>
                  <TableCell>
                    {project.url ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.open(project.url, '_blank')}
                        className="p-1"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewDetails(project)}
                        className="p-1"
                        title="Ver detalhes"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      
                      {/* Ocultar botões para consultores */}
                      {!isConsultant && !permissionsLoading && (
                        <>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="p-1"
                                title="Alterar status"
                              >
                                <Settings className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {statuses.map((status) => (
                                <DropdownMenuItem
                                  key={status.name}
                                  onClick={() => handleStatusChange(project.id, status.name)}
                                  className="cursor-pointer"
                                >
                                  <div className="flex items-center gap-2">
                                    <div 
                                      className="w-3 h-3 rounded-full" 
                                      style={{ backgroundColor: status.color }}
                                    />
                                    {status.display_name}
                                  </div>
                                </DropdownMenuItem>
                              ))}
                            </DropdownMenuContent>
                          </DropdownMenu>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onEditProject(project)}
                            className="p-1"
                            title="Editar projeto"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onDeleteProject(project.id)}
                            className="p-1 text-red-600 hover:text-red-700"
                            title="Excluir projeto"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
                
                {/* Linha expandida com as etapas */}
                {expandedProjects.has(project.id) && project.stages && (
                  <TableRow>
                    <TableCell colSpan={14} className="bg-muted/20 p-0">
                      <div className="p-4">
                        <h4 className="font-semibold mb-3 flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          Etapas do Projeto
                        </h4>
                        <div className="overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Etapa</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Valor</TableHead>
                                <TableHead>Horas</TableHead>
                                <TableHead>Dias</TableHead>
                                <TableHead>Data Início</TableHead>
                                <TableHead>Data Fim</TableHead>
                                <TableHead>Consultor</TableHead>
                                <TableHead>Concluída</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {project.stages.map((stage) => (
                                <TableRow key={stage.id}>
                                  <TableCell className="font-medium">{stage.name}</TableCell>
                                  <TableCell>
                                    <Badge 
                                      style={{ 
                                        backgroundColor: getStatusColor(stage.status || 'iniciar_projeto'),
                                        color: 'white'
                                      }}
                                    >
                                      {getStatusDisplayName(stage.status || 'iniciar_projeto')}
                                    </Badge>
                                  </TableCell>
                                  <TableCell>{formatCurrency(stage.value)}</TableCell>
                                  <TableCell>{stage.hours}h</TableCell>
                                  <TableCell>{stage.days} dias</TableCell>
                                  <TableCell>{formatDate(stage.startDate)}</TableCell>
                                  <TableCell>{formatDate(stage.endDate)}</TableCell>
                                  <TableCell>{stage.consultantName || '-'}</TableCell>
                                  <TableCell>
                                    <Badge variant={stage.completed ? "default" : "secondary"}>
                                      {stage.completed ? 'Sim' : 'Não'}
                                    </Badge>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </React.Fragment>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Modal de detalhes do projeto */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent size="full" className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes do Projeto</DialogTitle>
          </DialogHeader>
          {selectedProject && (
            <ProjectDetails 
              project={selectedProject} 
              onRefresh={onRefresh}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ProjectsExpandedTable;
