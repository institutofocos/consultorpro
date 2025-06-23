import React, { useState, useEffect, useMemo } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Plus, Filter, Search, Eye, Calendar, User, Clock, Tag, RefreshCw, AlertTriangle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Project, Stage } from '@/components/projects/types';
import { toast } from 'sonner';
import KanbanCard from './KanbanCard';
import ProjectDetailsModal from './ProjectDetailsModal';
import { fetchProjects } from '@/integrations/supabase/projects';
import { useProjectStatuses } from '@/hooks/useProjectStatuses';

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
  
  const queryClient = useQueryClient();
  const { statuses, getStatusDisplay, isLoading: statusesLoading } = useProjectStatuses();

  // Buscar projetos usando a função do sistema de projetos
  const { data: projects = [], isLoading: projectsLoading, refetch: refetchProjects } = useQuery({
    queryKey: ['kanban-projects', searchTerm, selectedConsultant, selectedService],
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
        
        // Aplicar filtros
        let filteredProjects = allProjects;
        
        if (searchTerm) {
          filteredProjects = filteredProjects.filter(project => 
            project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (project.description && project.description.toLowerCase().includes(searchTerm.toLowerCase()))
          );
        }
        
        if (selectedConsultant) {
          filteredProjects = filteredProjects.filter(project => 
            project.mainConsultantId === selectedConsultant || 
            project.supportConsultantId === selectedConsultant
          );
        }
        
        if (selectedService) {
          filteredProjects = filteredProjects.filter(project => 
            project.serviceId === selectedService
          );
        }
        
        console.log('Projetos após filtros:', filteredProjects.length);
        setLastSyncTime(new Date());
        return filteredProjects;
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

  const getProjectsByStatus = (status: string) => {
    const projectsInStatus = projects.filter(project => project.status === status);
    console.log(`Projetos com status ${status}:`, projectsInStatus.map(p => p.name));
    return projectsInStatus;
  };

  const getStagesByStatus = (status: string) => {
    const allStages: (Stage & { projectName?: string; clientName?: string })[] = [];
    
    projects.forEach(project => {
      if (project.stages) {
        project.stages.forEach(stage => {
          const stageStatus = stage.status || 'iniciar_projeto';
          if (stageStatus === status) {
            allStages.push({
              ...stage,
              projectName: project.name,
              clientName: project.clientName
            });
          }
        });
      }
    });
    
    console.log(`Etapas com status ${status}:`, allStages.map(s => `${s.name} (${s.projectName})`));
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

  const isLoading = projectsLoading || statusesLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Carregando dados do Kanban...</div>
      </div>
    );
  }

  // Verificar se há projetos que não aparecem no Kanban
  const totalProjectsAndStages = projects.length + projects.reduce((acc, p) => acc + (p.stages?.length || 0), 0);
  const totalCardsInKanban = activeColumns.reduce((acc, col) => {
    return acc + getProjectsByStatus(col.status).length + getStagesByStatus(col.status).length;
  }, 0);

  return (
    <div className="space-y-6 p-6 h-full">
      {/* Header */}
      <div className="flex flex-col gap-4 flex-shrink-0">
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

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="text-sm text-blue-800">
            <strong>Colunas baseadas nas Regras de Projetos:</strong> As colunas do Kanban são geradas automaticamente 
            com base nos status configurados na aba "Regras" das configurações, usando os nomes de exibição e cores definidos.
          </div>
        </div>

        {/* Filtros */}
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
              <SelectValue placeholder="Consultor" />
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
              <SelectValue placeholder="Serviço" />
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
        </div>
      </div>

      {/* Kanban Board com rolagem horizontal */}
      <div className="flex-1 overflow-hidden">
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="overflow-x-auto pb-4">
            <div className="flex gap-4 min-w-max" style={{ width: `${Math.max(activeColumns.length * 320, 1200)}px` }}>
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
                        className={`w-80 p-4 rounded-lg min-h-[600px] flex-shrink-0 ${column.color} ${
                          snapshot.isDraggingOver ? 'bg-opacity-50' : ''
                        }`}
                        style={{
                          borderTop: `4px solid ${column.statusColor}` // Usar cor da regra
                        }}
                      >
                        <div className="flex justify-between items-center mb-4">
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

                        <div className="space-y-3">
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
                                  <KanbanCard
                                    project={project}
                                    onClick={() => handleProjectClick(project)}
                                    type="project"
                                  />
                                </div>
                              )}
                            </Draggable>
                          ))}

                          {/* Etapas */}
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
                                  <KanbanCard
                                    stage={stage}
                                    onClick={() => {/* Modal de detalhes da etapa pode ser implementado */}}
                                    type="stage"
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
