import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2, Eye, Search, ChevronDown, ChevronRight, Zap } from 'lucide-react';
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

  const statusOptions = [
    { value: 'em_producao', label: 'Em produção' },
    { value: 'aguardando_assinatura', label: 'Aguardando Assinatura' },
    { value: 'aguardando_aprovacao', label: 'Aguardando Aprovação' },
    { value: 'aguardando_nota_fiscal', label: 'Aguardando Nota Fiscal' },
    { value: 'aguardando_repasse', label: 'Aguardando Repasse' },
    { value: 'aguardando_pagamento', label: 'Aguardando Pagamento' },
    { value: 'concluido', label: 'Concluído' },
    { value: 'cancelado', label: 'Cancelado' }
  ];

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
      if (newStatus === 'concluido') {
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'em_planejamento':
        return 'bg-blue-100 text-blue-800';
      case 'em_producao':
        return 'bg-yellow-100 text-yellow-800';
      case 'concluido':
        return 'bg-green-100 text-green-800';
      case 'cancelado':
        return 'bg-red-100 text-red-800';
      // Keep existing legacy statuses for backward compatibility
      case 'planned':
        return 'bg-blue-100 text-blue-800';
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'aguardando_assinatura':
        return 'bg-yellow-100 text-yellow-800';
      case 'aguardando_aprovacao':
        return 'bg-orange-100 text-orange-800';
      case 'aguardando_nota_fiscal':
        return 'bg-purple-100 text-purple-800';
      case 'aguardando_pagamento':
        return 'bg-pink-100 text-pink-800';
      case 'aguardando_repasse':
        return 'bg-indigo-100 text-indigo-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'em_planejamento':
        return 'Em Planejamento';
      case 'em_producao':
        return 'Em Produção';
      case 'concluido':
        return 'Concluído';
      case 'cancelado':
        return 'Cancelado';
      // Keep existing legacy statuses for backward compatibility
      case 'planned':
        return 'Planejado';
      case 'active':
        return 'Ativo';
      case 'completed':
        return 'Concluído';
      case 'cancelled':
        return 'Cancelado';
      case 'aguardando_assinatura':
        return 'Aguardando Assinatura';
      case 'aguardando_aprovacao':
        return 'Aguardando Aprovação';
      case 'aguardando_nota_fiscal':
        return 'Aguardando Nota Fiscal';
      case 'aguardando_pagamento':
        return 'Aguardando Pagamento';
      case 'aguardando_repasse':
        return 'Aguardando Repasse';
      default:
        return status;
    }
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

  const calculateDynamicStatus = (project: Project) => {
    // Rule 1: If no consultant assigned, status should be "Em Planejamento"
    if (!project.mainConsultantId) {
      return 'em_planejamento';
    }
    
    // Rule 2: If consultant assigned but not all stages completed, status should be "Em Produção"
    if (project.mainConsultantId && project.stages && project.stages.length > 0) {
      const completedStages = project.stages.filter(stage => stage.completed).length;
      
      // Rule 3: If all stages are completed, status should be "Concluído"
      if (completedStages === project.stages.length) {
        return 'concluido';
      }
      
      return 'em_producao';
    }
    
    // If consultant assigned but no stages, status should be "Em Produção"
    return 'em_producao';
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
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {projects.map((project) => {
              const dynamicStatus = calculateDynamicStatus(project);
              const isExpanded = expandedProjects.has(project.id);
              const hasStages = project.stages && project.stages.length > 0;
              
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
                      <Badge className={getStatusColor(dynamicStatus)}>
                        {getStatusLabel(dynamicStatus)}
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
                        {project.completedStages || 0}/{project.stages?.length || 0}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
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
                          <DropdownMenuContent>
                            {statusOptions.map((option) => (
                              <DropdownMenuItem
                                key={option.value}
                                onClick={() => handleProjectStatusChange(project.id, option.value)}
                              >
                                {option.label}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewProject(project)}
                          title="Ver detalhes e etapas"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onEditProject(project)}
                          title="Editar projeto"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onDeleteProject(project.id)}
                          title="Excluir projeto"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>

                  {/* Linhas das etapas expandidas */}
                  {isExpanded && hasStages && project.stages?.map((stage, index) => (
                    <TableRow key={`${project.id}-stage-${index}`} className="bg-muted/30">
                      <TableCell className="pl-12">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-muted-foreground/50" />
                          <span className="text-sm font-medium">{stage.name}</span>
                          {stage.completed && (
                            <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">
                              Concluída
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(stage.status)} variant="outline">
                          {getStatusLabel(stage.status)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">-</TableCell>
                      <TableCell className="text-muted-foreground text-sm">-</TableCell>
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
                        {stage.completed ? '100%' : '0%'}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
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
                      </TableCell>
                    </TableRow>
                  ))}
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
