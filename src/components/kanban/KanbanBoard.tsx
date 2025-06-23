
import React, { useState, useEffect, useMemo } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Plus, Filter, Search, Eye, Calendar, User, Clock, Tag } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Project, Stage } from '@/components/projects/types';
import { toast } from 'sonner';
import KanbanCard from './KanbanCard';
import ProjectDetailsModal from './ProjectDetailsModal';

interface KanbanColumn {
  id: string;
  title: string;
  color: string;
  status: string;
}

const defaultColumns: KanbanColumn[] = [
  { id: 'iniciar_projeto', title: 'Iniciar Projeto', color: 'bg-gray-100', status: 'iniciar_projeto' },
  { id: 'em_producao', title: 'Em Produção', color: 'bg-blue-100', status: 'em_producao' },
  { id: 'aguardando_assinatura', title: 'Aguardando Assinatura', color: 'bg-yellow-100', status: 'aguardando_assinatura' },
  { id: 'aguardando_aprovacao', title: 'Aguardando Aprovação', color: 'bg-orange-100', status: 'aguardando_aprovacao' },
  { id: 'aguardando_nota_fiscal', title: 'Aguardando Nota Fiscal', color: 'bg-purple-100', status: 'aguardando_nota_fiscal' },
  { id: 'aguardando_pagamento', title: 'Aguardando Pagamento', color: 'bg-pink-100', status: 'aguardando_pagamento' },
  { id: 'aguardando_repasse', title: 'Aguardando Repasse', color: 'bg-indigo-100', status: 'aguardando_repasse' },
  { id: 'finalizados', title: 'Finalizados', color: 'bg-green-100', status: 'finalizados' },
  { id: 'cancelados', title: 'Cancelados', color: 'bg-red-100', status: 'cancelados' },
];

const KanbanBoard: React.FC = () => {
  const [columns, setColumns] = useState<KanbanColumn[]>(defaultColumns);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedConsultant, setSelectedConsultant] = useState<string>('');
  const [selectedService, setSelectedService] = useState<string>('');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [showProjectModal, setShowProjectModal] = useState(false);
  
  const queryClient = useQueryClient();

  // Buscar projetos
  const { data: rawProjects = [], isLoading: projectsLoading } = useQuery({
    queryKey: ['kanban-projects', searchTerm, selectedConsultant, selectedService],
    queryFn: async () => {
      console.log('Buscando projetos para o Kanban...');
      let query = supabase
        .from('projects')
        .select(`
          *,
          clients!projects_client_id_fkey (id, name, contact_name),
          services (id, name)
        `);

      if (searchTerm) {
        query = query.ilike('name', `%${searchTerm}%`);
      }

      if (selectedConsultant) {
        query = query.or(`main_consultant_id.eq.${selectedConsultant},support_consultant_id.eq.${selectedConsultant}`);
      }

      if (selectedService) {
        query = query.eq('service_id', selectedService);
      }

      const { data, error } = await query;
      if (error) {
        console.error('Erro ao buscar projetos:', error);
        throw error;
      }
      
      console.log('Projetos encontrados:', data?.length || 0);
      return data || [];
    },
  });

  // Buscar etapas dos projetos
  const { data: rawStages = [], isLoading: stagesLoading } = useQuery({
    queryKey: ['kanban-stages'],
    queryFn: async () => {
      console.log('Buscando etapas para o Kanban...');
      const { data, error } = await supabase
        .from('project_stages')
        .select(`
          *,
          projects!project_stages_project_id_fkey (
            id, 
            name, 
            client_id,
            clients!projects_client_id_fkey (id, name)
          )
        `);

      if (error) {
        console.error('Erro ao buscar etapas:', error);
        throw error;
      }
      
      console.log('Etapas encontradas:', data?.length || 0);
      return data || [];
    },
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

  // Setup real-time subscriptions para atualização automática
  useEffect(() => {
    const projectsChannel = supabase
      .channel('kanban-projects-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'projects'
        },
        (payload) => {
          console.log('Projeto atualizado via real-time:', payload);
          queryClient.invalidateQueries({ queryKey: ['kanban-projects'] });
        }
      )
      .subscribe();

    const stagesChannel = supabase
      .channel('kanban-stages-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'project_stages'
        },
        (payload) => {
          console.log('Etapa atualizada via real-time:', payload);
          queryClient.invalidateQueries({ queryKey: ['kanban-stages'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(projectsChannel);
      supabase.removeChannel(stagesChannel);
    };
  }, [queryClient]);

  // Processar projetos
  const projects: Project[] = useMemo(() => {
    if (!rawProjects) return [];
    
    return rawProjects.map(project => ({
      id: project.id,
      projectId: project.project_id,
      name: project.name,
      description: project.description,
      serviceId: project.service_id,
      clientId: project.client_id,
      mainConsultantId: project.main_consultant_id,
      mainConsultantCommission: project.main_consultant_commission || 0,
      supportConsultantId: project.support_consultant_id,
      supportConsultantCommission: project.support_consultant_commission || 0,
      startDate: project.start_date,
      endDate: project.end_date,
      totalValue: project.total_value,
      totalHours: project.total_hours,
      hourlyRate: project.hourly_rate,
      taxPercent: project.tax_percent,
      thirdPartyExpenses: project.third_party_expenses,
      consultantValue: project.main_consultant_value,
      supportConsultantValue: project.support_consultant_value,
      managerName: project.manager_name,
      managerEmail: project.manager_email,
      managerPhone: project.manager_phone,
      status: project.status,
      tags: project.tags || [],
      url: project.url,
      createdAt: project.created_at,
      updatedAt: project.updated_at,
      // Mapped fields
      clients: Array.isArray(project.clients) ? project.clients[0] : project.clients,
      services: project.services,
      clientName: Array.isArray(project.clients) 
        ? project.clients[0]?.name 
        : project.clients?.name,
      serviceName: project.services?.name,
    }));
  }, [rawProjects]);

  // Processar etapas
  const stages: (Stage & { projectName?: string; clientName?: string })[] = useMemo(() => {
    if (!rawStages) return [];
    
    return rawStages.map(stage => ({
      id: stage.id,
      projectId: stage.project_id,
      name: stage.name,
      description: stage.description,
      days: stage.days,
      hours: stage.hours,
      value: stage.value,
      startDate: stage.start_date,
      endDate: stage.end_date,
      consultantId: stage.consultant_id,
      completed: stage.completed,
      clientApproved: stage.client_approved,
      managerApproved: stage.manager_approved,
      invoiceIssued: stage.invoice_issued,
      paymentReceived: stage.payment_received,
      consultantsSettled: stage.consultants_settled,
      attachment: stage.attachment,
      stageOrder: stage.stage_order,
      status: stage.status || 'iniciar_projeto',
      valorDeRepasse: stage.valor_de_repasse,
      createdAt: stage.created_at,
      updatedAt: stage.updated_at,
      // Extended properties
      projectName: stage.projects?.name,
      clientName: stage.projects?.clients?.name,
    }));
  }, [rawStages]);

  // Mutation para atualizar status do projeto
  const updateProjectStatusMutation = useMutation({
    mutationFn: async ({ projectId, newStatus }: { projectId: string; newStatus: string }) => {
      console.log('Atualizando status do projeto:', projectId, 'para:', newStatus);
      const { error } = await supabase
        .from('projects')
        .update({ status: newStatus })
        .eq('id', projectId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kanban-projects'] });
      toast.success('Status do projeto atualizado com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao atualizar projeto:', error);
      toast.error('Erro ao atualizar status do projeto');
    },
  });

  // Mutation para atualizar status da etapa
  const updateStageStatusMutation = useMutation({
    mutationFn: async ({ stageId, newStatus }: { stageId: string; newStatus: string }) => {
      console.log('Atualizando status da etapa:', stageId, 'para:', newStatus);
      const { error } = await supabase
        .from('project_stages')
        .update({ status: newStatus })
        .eq('id', stageId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kanban-stages'] });
      toast.success('Status da etapa atualizado com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao atualizar etapa:', error);
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
    console.log('Filtrando projetos para status:', status);
    const filtered = projects.filter(project => project.status === status);
    console.log('Projetos encontrados para', status, ':', filtered.length);
    return filtered;
  };

  const getStagesByStatus = (status: string) => {
    console.log('Filtrando etapas para status:', status);
    const filtered = stages.filter(stage => stage.status === status);
    console.log('Etapas encontradas para', status, ':', filtered.length);
    return filtered;
  };

  const handleProjectClick = (project: Project) => {
    setSelectedProject(project);
    setShowProjectModal(true);
  };

  const isLoading = projectsLoading || stagesLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Carregando dados do Kanban...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 h-full">
      {/* Header */}
      <div className="flex flex-col gap-4 flex-shrink-0">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Kanban Board</h1>
          <Button className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Novo Projeto
          </Button>
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

          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filtros Avançados
          </Button>
        </div>
      </div>

      {/* Kanban Board com rolagem horizontal */}
      <div className="flex-1 overflow-hidden">
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="overflow-x-auto pb-4">
            <div className="flex gap-4 min-w-max" style={{ width: `${columns.length * 320}px` }}>
              {columns.map(column => (
                <Droppable key={column.id} droppableId={column.id}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`w-80 p-4 rounded-lg min-h-[600px] flex-shrink-0 ${column.color} ${
                        snapshot.isDraggingOver ? 'bg-opacity-50' : ''
                      }`}
                    >
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="font-semibold text-sm">{column.title}</h3>
                        <Badge variant="secondary" className="text-xs">
                          {getProjectsByStatus(column.status).length + getStagesByStatus(column.status).length}
                        </Badge>
                      </div>

                      <div className="space-y-3">
                        {/* Projetos */}
                        {getProjectsByStatus(column.status).map((project, index) => (
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
                        {getStagesByStatus(column.status).map((stage, index) => (
                          <Draggable 
                            key={`stage-${stage.id}`} 
                            draggableId={`stage-${stage.id}`} 
                            index={index + getProjectsByStatus(column.status).length}
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
                                  onClick={() => {/* Implementar modal de detalhes da etapa */}}
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
              ))}
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
