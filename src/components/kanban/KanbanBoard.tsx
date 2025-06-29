import React, { useState, useEffect, useMemo } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Plus, Filter, Search, Eye, Calendar, User, Clock, Tag, RefreshCw, AlertTriangle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Project, Stage } from '@/components/projects/types';
import { toast } from 'sonner';
import CollapsibleKanbanCard from './CollapsibleKanbanCard';
import ProjectDetailsModal from './ProjectDetailsModal';
import { fetchProjects } from '@/integrations/supabase/projects';
import { useProjectStatuses } from '@/hooks/useProjectStatuses';
import { format } from 'date-fns';

interface KanbanColumn {
  id: string;
  title: string;
  color: string;
  status: string;
}

const KanbanBoard: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedConsultant, setSelectedConsultant] = useState<string>('');
  const [selectedService, setSelectedService] = useState<string>('');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date>(new Date());
  const [highlightedProjectId, setHighlightedProjectId] = useState<string | null>(null);
  const [showStages, setShowStages] = useState<boolean>(true);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [showOverdueOnly, setShowOverdueOnly] = useState<boolean>(false);
  
  const queryClient = useQueryClient();
  const { statuses, getStatusDisplay, isLoading: statusesLoading } = useProjectStatuses();

  // Buscar projetos usando a função do sistema de projetos
  const { data: allProjects = [], isLoading: projectsLoading, refetch: refetchProjects } = useQuery({
    queryKey: ['kanban-projects'],
    queryFn: async () => {
      console.log('=== BUSCANDO PROJETOS PARA KANBAN ===');
      try {
        const allProjects = await fetchProjects();
        console.log('Projetos encontrados no total:', allProjects.length);
        
        // Log detalhado de cada projeto
        allProjects.forEach(project => {
          console.log(`Projeto: ${project.name} (ID: ${project.id}) - Status: ${project.status}`);
          if (project.stages && project.stages.length > 0) {
            project.stages.forEach(stage => {
              console.log(`  -> Etapa: ${stage.name} - Status: ${stage.status || 'sem status'}`);
            });
          }
        });
        
        setLastSyncTime(new Date());
        return allProjects;
      } catch (error) {
        console.error('Erro ao buscar projetos para Kanban:', error);
        toast.error('Erro ao carregar projetos para o Kanban');
        return [];
      }
    },
    staleTime: 0,
    refetchOnWindowFocus: true,
    refetchInterval: 5000, // Refetch a cada 5 segundos para garantir sincronia
  });

  // Aplicar todos os filtros aos projetos
  const projects = useMemo(() => {
    let filteredProjects = allProjects;

    // Filtro por termo de busca
    if (searchTerm) {
      filteredProjects = filteredProjects.filter(project => 
        project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (project.description && project.description.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Filtro por consultor
    if (selectedConsultant) {
      filteredProjects = filteredProjects.filter(project => 
        project.mainConsultantId === selectedConsultant || 
        project.supportConsultantId === selectedConsultant ||
        (project.stages && project.stages.some(stage => stage.consultantId === selectedConsultant))
      );
    }

    // Filtro por serviço
    if (selectedService) {
      filteredProjects = filteredProjects.filter(project => 
        project.serviceId === selectedService
      );
    }

    // Filtro por data de início
    if (startDate) {
      filteredProjects = filteredProjects.filter(project => {
        if (!project.startDate) return false;
        return new Date(project.startDate) >= new Date(startDate);
      });
    }

    // Filtro por data de fim
    if (endDate) {
      filteredProjects = filteredProjects.filter(project => {
        if (!project.endDate) return false;
        return new Date(project.endDate) <= new Date(endDate);
      });
    }

    // Filtro para cards vencidos
    if (showOverdueOnly) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      filteredProjects = filteredProjects.filter(project => {
        // Verificar se o projeto está vencido
        if (project.endDate && new Date(project.endDate) < today) {
          return true;
        }
        
        // Verificar se alguma etapa está vencida
        if (project.stages) {
          return project.stages.some(stage => 
            stage.endDate && new Date(stage.endDate) < today && !stage.completed
          );
        }
        
        return false;
      });
    }

    console.log('Projetos após filtros:', filteredProjects.length);
    return filteredProjects;
  }, [allProjects, searchTerm, selectedConsultant, selectedService, startDate, endDate, showOverdueOnly]);

  // Buscar consultores
  const { data: consultants = [] } = useQuery({
    queryKey: ['consultants'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('consultants')
        .select('id, name')
        .order('name');
      if (error) throw error;
      return data;
    },
  });

  // Buscar serviços
  const { data: services = [] } = useQuery({
    queryKey: ['services'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('services')
        .select('id, name')
        .order('name');
      if (error) throw error;
      return data;
    },
  });

  // Determinar colunas baseado APENAS nos status configurados nas regras
  const activeColumns = useMemo(() => {
    console.log('=== DETERMINANDO COLUNAS BASEADAS NAS REGRAS DE PROJETOS ===');
    
    // Usar APENAS os status configurados nas regras de projetos
    const columnsFromRules = statuses.map(status => ({
      id: status.name,
      title: status.display_name, // Usar o nome de exibição das regras
      color: 'bg-gray-50',
      status: status.name,
      statusColor: status.color // Preservar a cor da regra
    }));
    
    console.log('Colunas baseadas nas regras:', columnsFromRules);
    return columnsFromRules;
  }, [statuses]);

  // Setup real-time subscriptions para atualização automática
  useEffect(() => {
    console.log('Configurando real-time subscriptions para o Kanban...');
    
    const projectsChannel = supabase
      .channel('kanban-projects-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'projects'
        },
        (payload) => {
          console.log('Projeto atualizado via real-time (Kanban):', payload);
          queryClient.invalidateQueries({ queryKey: ['kanban-projects'] });
          queryClient.invalidateQueries({ queryKey: ['projects'] });
        }
      )
      .subscribe();

    const stagesChannel = supabase
      .channel('kanban-stages-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'project_stages'
        },
        (payload) => {
          console.log('Etapa atualizada via real-time (Kanban):', payload);
          queryClient.invalidateQueries({ queryKey: ['kanban-projects'] });
          queryClient.invalidateQueries({ queryKey: ['projects'] });
        }
      )
      .subscribe();

    return () => {
      console.log('Removendo real-time subscriptions do Kanban...');
      supabase.removeChannel(projectsChannel);
      supabase.removeChannel(stagesChannel);
    };
  }, [queryClient]);

  // Mutation para atualizar status do projeto via drag and drop
  const updateProjectStatusMutation = useMutation({
    mutationFn: async ({ projectId, newStatus }: { projectId: string; newStatus: string }) => {
      console.log('Atualizando status do projeto via Kanban:', projectId, 'para:', newStatus);
      const { error } = await supabase
        .from('projects')
        .update({ status: newStatus })
        .eq('id', projectId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kanban-projects'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success('Status do projeto atualizado com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao atualizar projeto via Kanban:', error);
      toast.error('Erro ao atualizar status do projeto');
    },
  });

  // Mutation para atualizar status da etapa via drag and drop
  const updateStageStatusMutation = useMutation({
    mutationFn: async ({ stageId, newStatus }: { stageId: string; newStatus: string }) => {
      console.log('Atualizando status da etapa via Kanban:', stageId, 'para:', newStatus);
      const { error } = await supabase
        .from('project_stages')
        .update({ status: newStatus })
        .eq('id', stageId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kanban-projects'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success('Status da etapa atualizado com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao atualizar etapa via Kanban:', error);
      toast.error('Erro ao atualizar status da etapa');
    },
  });

  const handleDragEnd = (result: any) => {
    if (!result.destination) return;

    const { source, destination, draggableId } = result;
    
    if (source.droppableId === destination.droppableId) return;

    const newStatus = destination.droppableId;
    const [type, id] = draggableId.split('-');

    if (type === 'project') {
      updateProjectStatusMutation.mutate({ projectId: id, newStatus });
    } else if (type === 'stage') {
      updateStageStatusMutation.mutate({ stageId: id, newStatus });
    }
  };

  // Funções para gerenciar destaque
  const handleHighlight = (projectId: string) => {
    setHighlightedProjectId(projectId);
    toast.success('Projeto destacado com sucesso!');
  };

  const handleRemoveHighlight = () => {
    setHighlightedProjectId(null);
    toast.success('Destaque removido com sucesso!');
  };

  // Verificar se um item deve ser destacado
  const isHighlighted = (itemId: string, itemType: 'project' | 'stage') => {
    if (!highlightedProjectId) return false;
    
    if (itemType === 'project') {
      return itemId === highlightedProjectId;
    } else {
      // Para etapas, verificar se pertencem ao projeto destacado
      const stage = projects
        .flatMap(p => p.stages || [])
        .find(s => s.id === itemId);
      return stage?.projectId === highlightedProjectId;
    }
  };

  // Função para verificar se um projeto deve aparecer na coluna "Iniciar Projeto"
  const shouldShowInIniciarProjeto = (project: Project) => {
    // Projetos com status 'iniciar_projeto' ou projetos que não foram iniciados
    return project.status === 'iniciar_projeto' || 
           project.status === 'planned' || 
           (!project.status) ||
           (project.stages && project.stages.length > 0 && 
            project.stages.every(stage => !stage.completed && !stage.startDate));
  };

  // Função para verificar se uma etapa deve aparecer na coluna "Iniciar Projeto"
  const shouldShowStageInIniciarProjeto = (stage: Stage) => {
    // Etapas com status 'iniciar_projeto' ou etapas que não foram iniciadas
    return stage.status === 'iniciar_projeto' || 
           (!stage.status) ||
           (!stage.startDate && !stage.completed);
  };

  const getProjectsByStatus = (status: string) => {
    if (status === 'iniciar_projeto') {
      // Para a coluna "Iniciar Projeto", mostrar projetos que ainda não foram iniciados
      const projectsToShow = projects.filter(shouldShowInIniciarProjeto);
      console.log(`Projetos para "Iniciar Projeto":`, projectsToShow.map(p => p.name));
      return projectsToShow;
    }
    
    const projectsInStatus = projects.filter(project => project.status === status);
    console.log(`Projetos com status ${status}:`, projectsInStatus.map(p => p.name));
    return projectsInStatus;
  };

  const getStagesByStatus = (status: string) => {
    // Se showStages estiver desativado, não retornar nenhuma etapa
    if (!showStages) {
      return [];
    }

    const allStages: (Stage & { projectName?: string; clientName?: string; consultantName?: string; serviceName?: string })[] = [];
    
    projects.forEach(project => {
      if (project.stages) {
        project.stages.forEach(stage => {
          let shouldInclude = false;
          
          if (status === 'iniciar_projeto') {
            // Para a coluna "Iniciar Projeto", mostrar etapas que ainda não foram iniciadas
            shouldInclude = shouldShowStageInIniciarProjeto(stage);
          } else {
            // Para outras colunas, usar o status da etapa
            const stageStatus = stage.status || 'iniciar_projeto';
            shouldInclude = stageStatus === status;
          }
          
          if (shouldInclude) {
            // Buscar o nome do consultor responsável pela etapa
            let consultantName = '';
            if (stage.consultantId) {
              const consultant = consultants.find(c => c.id === stage.consultantId);
              consultantName = consultant?.name || '';
            }

            allStages.push({
              ...stage,
              projectName: project.name,
              clientName: project.clientName,
              consultantName: consultantName,
              serviceName: project.serviceName
            });
          }
        });
      }
    });
    
    console.log(`Etapas com status ${status}:`, allStages.map(s => `${s.name} (${s.projectName}) - Consultor: ${s.consultantName} - Serviço: ${s.serviceName}`));
    return allStages;
  };

  const handleProjectClick = (project: Project) => {
    setSelectedProject(project);
    setShowProjectModal(true);
  };

  const handleRefresh = () => {
    console.log('=== FORÇANDO ATUALIZAÇÃO COMPLETA DO KANBAN ===');
    refetchProjects();
    queryClient.invalidateQueries({ queryKey: ['projects'] });
    queryClient.invalidateQueries({ queryKey: ['kanban-projects'] });
    setLastSyncTime(new Date());
    toast.success('Kanban sincronizado com sucesso!');
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedConsultant('');
    setSelectedService('');
    setStartDate('');
    setEndDate('');
    setShowOverdueOnly(false);
    toast.success('Filtros limpos com sucesso!');
  };

  const isLoading = projectsLoading || statusesLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Carregando dados do Kanban...</div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 flex-shrink-0 mb-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Kanban Board</h1>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleRefresh}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Sincronizar
            </Button>
            <div className="text-sm text-muted-foreground">
              {projects.length} projetos · Última sync: {lastSyncTime.toLocaleTimeString('pt-BR')}
            </div>
          </div>
        </div>

        {/* Filtros principais */}
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4" />
            <Input
              placeholder="Buscar projetos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-64"
            />
          </div>

          <Select value={selectedConsultant} onValueChange={setSelectedConsultant}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Todos os consultores" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todos os consultores</SelectItem>
              {consultants.map(consultant => (
                <SelectItem key={consultant.id} value={consultant.id}>
                  {consultant.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedService} onValueChange={setSelectedService}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Todos os serviços" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todos os serviços</SelectItem>
              {services.map(service => (
                <SelectItem key={service.id} value={service.id}>
                  {service.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button variant="outline" size="sm" onClick={clearFilters}>
            <Filter className="h-4 w-4 mr-2" />
            Limpar Filtros
          </Button>
        </div>

        {/* Filtros avançados */}
        <div className="flex flex-wrap gap-4 items-center">
          {/* Filtros de data */}
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <Label htmlFor="start-date" className="text-sm font-medium">
              Data Início:
            </Label>
            <Input
              id="start-date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-40"
            />
          </div>

          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <Label htmlFor="end-date" className="text-sm font-medium">
              Data Fim:
            </Label>
            <Input
              id="end-date"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-40"
            />
          </div>

          {/* Toggle para cards vencidos */}
          <div className="flex items-center space-x-2 border rounded-lg px-3 py-2 bg-white">
            <AlertTriangle className="h-4 w-4 text-red-500" />
            <Label htmlFor="overdue-cards" className="text-sm font-medium">
              Cards Vencidos
            </Label>
            <Switch
              id="overdue-cards"
              checked={showOverdueOnly}
              onCheckedChange={setShowOverdueOnly}
            />
          </div>

          {/* Toggle para mostrar/ocultar etapas */}
          <div className="flex items-center space-x-2 border rounded-lg px-3 py-2 bg-white">
            <Label htmlFor="show-stages" className="text-sm font-medium">
              Mostrar etapas
            </Label>
            <Switch
              id="show-stages"
              checked={showStages}
              onCheckedChange={setShowStages}
            />
          </div>
        </div>
      </div>

      {/* Kanban Board - ocupar todo o espaço restante */}
      <div className="flex-1 overflow-hidden">
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="h-full overflow-x-auto">
            <div className="flex gap-6 h-full pb-4" style={{ minWidth: `${activeColumns.length * 400}px` }}>
              {activeColumns.map(column => {
                const projectsInColumn = getProjectsByStatus(column.status);
                const stagesInColumn = getStagesByStatus(column.status);
                const totalItems = projectsInColumn.length + stagesInColumn.length;
                
                return (
                  <Droppable key={column.id} droppableId={column.status}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`w-96 p-4 rounded-lg flex-shrink-0 ${column.color} ${
                          snapshot.isDraggingOver ? 'bg-opacity-50' : ''
                        } flex flex-col`}
                        style={{
                          borderTop: `4px solid ${column.statusColor}`,
                          height: 'calc(100vh - 200px)'
                        }}
                      >
                        <div className="flex justify-between items-center mb-4 flex-shrink-0">
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-3 h-3 rounded-full" 
                              style={{ backgroundColor: column.statusColor }}
                            />
                            <h3 className="font-semibold text-sm">{column.title}</h3>
                          </div>
                          <Badge variant="secondary" className="text-xs">
                            {totalItems}
                          </Badge>
                        </div>

                        <div className="space-y-3 overflow-y-auto flex-1">
                          {/* Projetos */}
                          {projectsInColumn.map((project, index) => (
                            <Draggable key={`project-${project.id}`} draggableId={`project-${project.id}`} index={index}>
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  className={snapshot.isDragging ? 'rotate-2' : ''}
                                >
                                  <CollapsibleKanbanCard
                                    project={project}
                                    onClick={() => handleProjectClick(project)}
                                    type="project"
                                    isHighlighted={isHighlighted(project.id, 'project')}
                                    onHighlight={handleHighlight}
                                    onRemoveHighlight={handleRemoveHighlight}
                                  />
                                </div>
                              )}
                            </Draggable>
                          ))}

                          {/* Etapas - só mostrar se showStages estiver ativo */}
                          {stagesInColumn.map((stage, index) => (
                            <Draggable 
                              key={`stage-${stage.id}`} 
                              draggableId={`stage-${stage.id}`} 
                              index={index + projectsInColumn.length}
                            >
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  className={snapshot.isDragging ? 'rotate-2' : ''}
                                >
                                  <CollapsibleKanbanCard
                                    stage={stage}
                                    onClick={() => {/* Modal de detalhes da etapa pode ser implementado */}}
                                    type="stage"
                                    isHighlighted={isHighlighted(stage.id, 'stage')}
                                    onHighlight={handleHighlight}
                                    onRemoveHighlight={handleRemoveHighlight}
                                  />
                                </div>
                              )}
                            </Draggable>
                          ))}
                        </div>
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                );
              })}
            </div>
          </div>
        </DragDropContext>
      </div>

      {/* Modal de Detalhes do Projeto */}
      {selectedProject && (
        <ProjectDetailsModal
          project={selectedProject}
          open={showProjectModal}
          onOpenChange={setShowProjectModal}
        />
      )}
    </div>
  );
};

export default KanbanBoard;
