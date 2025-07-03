import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2, Eye, Search, ChevronDown, ChevronRight, Zap, ExternalLink } from 'lucide-react';
import { Project } from './types';
import ServiceNameCell from './ServiceNameCell';
import ProjectDetails from './ProjectDetails';
import ProjectDescriptionModal from './ProjectDescriptionModal';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useProjectActions } from '@/hooks/useProjectActions';
import { useProjectStatuses } from '@/hooks/useProjectStatuses';
import { useUserPermissions } from '@/hooks/useUserPermissions';
import { toast } from 'sonner';

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
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [showProjectDetails, setShowProjectDetails] = useState(false);
  const [showDescriptionModal, setShowDescriptionModal] = useState(false);
  const [selectedProjectForDescription, setSelectedProjectForDescription] = useState<Project | null>(null);
  const [selectedStageForDescription, setSelectedStageForDescription] = useState<{ name: string; description: string } | null>(null);
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());

  const { updateProjectStatus, updateStageStatus, completeStage, uncompleteStage, isLoading } = useProjectActions();
  const { statuses, getStatusDisplay, getStatusBadgeStyle } = useProjectStatuses();
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

  const handleProjectStatusChange = async (projectId: string, newStatus: string) => {
    try {
      await updateProjectStatus(projectId, newStatus);
      toast.success('Status do projeto atualizado com sucesso!');
      await onRefresh();
    } catch (error) {
      console.error('Erro ao atualizar status do projeto:', error);
      toast.error('Erro ao atualizar status do projeto');
    }
  };

  const handleStageStatusChange = async (stageId: string, newStatus: string) => {
    try {
      // Verificar se o novo status é um status de conclusão
      const statusSetting = statuses.find(s => s.name === newStatus);
      
      if (statusSetting?.is_completion_status) {
        await completeStage(stageId);
        toast.success('Etapa concluída com sucesso!');
      } else {
        await updateStageStatus(stageId, newStatus);
        toast.success('Status da etapa atualizado com sucesso!');
      }
      await onRefresh();
    } catch (error) {
      console.error('Erro ao atualizar status da etapa:', error);
      toast.error('Erro ao atualizar status da etapa');
    }
  };

  // Função para calcular o progresso do projeto baseado em status de conclusão
  const calculateProjectProgress = (project: Project) => {
    if (!project.stages || project.stages.length === 0) return { completed: 0, total: 0 };
    
    const completedStages = project.stages.filter(stage => {
      const stageStatus = statuses.find(s => s.name === stage.status);
      return stageStatus?.is_completion_status || false;
    }).length;
    
    return { completed: completedStages, total: project.stages.length };
  };

  // Função para verificar se uma etapa está concluída baseada no status
  const isStageCompleted = (stageStatus: string) => {
    const statusSetting = statuses.find(s => s.name === stageStatus);
    return statusSetting?.is_completion_status || false;
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

  const handleViewProject = (project: Project) => {
    setSelectedProject(project);
    setShowProjectDetails(true);
  };

  const handleCloseProjectDetails = () => {
    setShowProjectDetails(false);
    setSelectedProject(null);
  };

  const handleProjectUpdated = async () => {
    await onRefresh();
  };

  const handleViewDescription = (project: Project) => {
    setSelectedProjectForDescription(project);
    setShowDescriptionModal(true);
  };

  const handleViewStageDescription = (stageName: string, stageDescription: string) => {
    setSelectedStageForDescription({ name: stageName, description: stageDescription });
    setShowDescriptionModal(true);
  };

  const handleCloseDescriptionModal = () => {
    setShowDescriptionModal(false);
    setSelectedProjectForDescription(null);
    setSelectedStageForDescription(null);
  };

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

  if (!projects || projects.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>Nenhum projeto encontrado.</p>
      </div>
    );
  }

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
              <TableHead>Tags</TableHead>
              <TableHead>Valor Total</TableHead>
              <TableHead>Data Início</TableHead>
              <TableHead>Data Fim</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead>Progresso</TableHead>
              <TableHead>URL</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {projects.map((project) => {
              const isExpanded = expandedProjects.has(project.id);
              const hasStages = project.stages && project.stages.length > 0;
              const statusDisplay = getStatusDisplay(project.status);
              const progress = calculateProjectProgress(project);
              
              // Obter etapas na ordem original (sem ordenação)
              const sortedStages = getSortedStages(project.stages || []);
              
              return (
                <React.Fragment key={project.id}>
                  {/* Linha principal do projeto */}
                  <TableRow>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {hasStages ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="p-0 h-6 w-6"
                            onClick={() => toggleProjectExpansion(project.id)}
                          >
                            {isExpanded ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </Button>
                        ) : (
                          <div className="w-6" />
                        )}
                        <div>
                          <div className="font-semibold">{project.name || 'Sem nome'}</div>
                          {project.projectId && (
                            <div className="text-xs text-muted-foreground">
                              ID: {project.projectId}
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge style={getStatusBadgeStyle(project.status)}>
                        {statusDisplay.label}
                      </Badge>
                    </TableCell>
                    <TableCell>{getFirstName(project.clientName)}</TableCell>
                    <TableCell>{getFirstAndSecondName(project.mainConsultantName)}</TableCell>
                    <TableCell>
                      {project.serviceName ? (
                        <ServiceNameCell serviceName={project.serviceName} />
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell>
                      {project.tagNames && project.tagNames.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {project.tagNames.map((tagName, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {tagName}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell>{formatCurrency(project.totalValue)}</TableCell>
                    <TableCell>{formatDate(project.startDate)}</TableCell>
                    <TableCell>{formatDate(project.endDate)}</TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewDescription(project)}
                        title="Ver descrição completa"
                      >
                        <Search className="h-4 w-4" />
                      </Button>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {progress.completed}/{progress.total}
                      </div>
                    </TableCell>
                    <TableCell>
                      {project.url ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(project.url, '_blank')}
                          title="Abrir URL do projeto"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        {/* Botão de alterar status do projeto - oculto para consultores */}
                        {!isConsultant && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                disabled={isLoading}
                                title="Alterar status do projeto"
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
                                    onClick={() => handleProjectStatusChange(project.id, status.name)}
                                    disabled={status.name === project.status}
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
                        
                        {/* Botão de ver detalhes - sempre visível */}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewProject(project)}
                          title="Ver detalhes e etapas"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        
                        {/* Botão de editar projeto - oculto para consultores */}
                        {!isConsultant && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onEditProject(project)}
                            title="Editar projeto"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        )}
                        
                        {/* Botão de excluir projeto - oculto para consultores */}
                        {!isConsultant && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onDeleteProject(project.id)}
                            title="Excluir projeto"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>

                  {/* Linhas das etapas expandidas - usando etapas na ordem original */}
                  {isExpanded && hasStages && sortedStages.map((stage, index) => {
                    const stageStatusDisplay = getStatusDisplay(stage.status);
                    const stageCompleted = isStageCompleted(stage.status);
                    
                    return (
                      <TableRow key={`${project.id}-stage-${stage.id || index}`} className="bg-muted/30">
                        <TableCell className="pl-12">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-muted-foreground/50" />
                            <span className="text-sm font-medium">{stage.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge style={getStatusBadgeStyle(stage.status)} variant="outline">
                            {stageStatusDisplay.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">-</TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {getStageConsultantName(stage, project)}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">-</TableCell>
                        <TableCell className="text-muted-foreground text-sm">-</TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {stage.value ? formatCurrency(stage.value) : '-'}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {stage.startDate ? formatDate(stage.startDate) : '-'}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {stage.endDate ? formatDate(stage.endDate) : '-'}
                        </TableCell>
                        <TableCell>
                          {stage.description ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewStageDescription(stage.name, stage.description || '')}
                              title="Ver descrição da etapa"
                            >
                              <Search className="h-4 w-4" />
                            </Button>
                          ) : (
                            <span className="text-muted-foreground text-sm">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {stageCompleted ? '100%' : '0%'}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">-</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end space-x-2">
                            {/* Botão de alterar status da etapa - oculto para consultores */}
                            {!isConsultant && (
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
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </React.Fragment>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Modal de detalhes do projeto */}
      <Dialog open={showProjectDetails} onOpenChange={setShowProjectDetails}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes do Projeto</DialogTitle>
          </DialogHeader>
          {selectedProject && (
            <ProjectDetails
              project={selectedProject}
              onClose={handleCloseProjectDetails}
              onProjectUpdated={handleProjectUpdated}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de descrição do projeto/etapa */}
      {(selectedProjectForDescription || selectedStageForDescription) && (
        <ProjectDescriptionModal
          isOpen={showDescriptionModal}
          onClose={handleCloseDescriptionModal}
          projectName={
            selectedProjectForDescription ? 
              (selectedProjectForDescription.name || 'Projeto sem nome') : 
              (selectedStageForDescription?.name || 'Etapa sem nome')
          }
          description={
            selectedProjectForDescription ?
              (selectedProjectForDescription.description || '') :
              (selectedStageForDescription?.description || '')
          }
        />
      )}
    </>
  );
};

export default ProjectsExpandedTable;
