import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Filter, Calendar } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { 
  fetchProjects, 
  deleteProject, 
  fetchTags, 
  fetchConsultants, 
  fetchServices 
} from '@/integrations/supabase/projects';
import ProjectsExpandedTable from './ProjectsExpandedTable';
import ProjectForm from './ProjectForm';
import SearchableSelect from '@/components/ui/searchable-select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Project } from './types';
import { useProjectStatuses } from '@/hooks/useProjectStatuses';

const ProjectList: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [clientFilter, setClientFilter] = useState<string>('');
  const [serviceFilter, setServiceFilter] = useState<string>('');
  const [tagFilter, setTagFilter] = useState<string[]>([]);
  const [consultantFilter, setConsultantFilter] = useState<string>('');
  const [startDateFilter, setStartDateFilter] = useState<string>('');
  const [endDateFilter, setEndDateFilter] = useState<string>('');
  const [clients, setClients] = useState<Array<{id: string, name: string}>>([]);
  const [tags, setTags] = useState<Array<{id: string, name: string}>>([]);
  const [consultants, setConsultants] = useState<Array<{id: string, name: string}>>([]);
  const [services, setServices] = useState<Array<{id: string, name: string}>>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<any>(null);

  // Hook para buscar status dinâmicos
  const { statuses } = useProjectStatuses();

  useEffect(() => {
    const fetchFilterData = async () => {
      try {
        // Fetch clients
        const { data: clientsData, error: clientsError } = await supabase
          .from('clients')
          .select('id, name')
          .order('name');
        
        if (clientsError) {
          console.error('Erro ao buscar clientes:', clientsError);
          toast.error('Erro ao carregar clientes');
        } else if (clientsData) {
          setClients(clientsData);
        }

        // Fetch tags using project_tags table
        const tagsData = await fetchTags();
        setTags(tagsData);

        // Fetch consultants
        const consultantsData = await fetchConsultants();
        setConsultants(consultantsData);

        // Fetch services
        const servicesData = await fetchServices();
        setServices(servicesData);
      } catch (error) {
        console.error('Erro ao buscar dados para filtros:', error);
        toast.error('Erro ao carregar dados para filtros');
      }
    };
    
    fetchFilterData();
  }, []);

  console.log('=== PROJECTLIST COMPONENT INICIADO ===');

  const { 
    data: projects = [], 
    isLoading, 
    isError, 
    refetch,
    error
  } = useQuery({
    queryKey: ['projects'],
    queryFn: fetchProjects,
  });

  console.log('=== PROJECTLIST USEQUERY RESULTADO ===');
  console.log('isLoading:', isLoading);
  console.log('isError:', isError);
  console.log('error:', error);
  console.log('projects (raw):', projects);
  console.log('projects type:', typeof projects);
  console.log('projects is array:', Array.isArray(projects));
  console.log('projects length:', projects?.length || 0);
  
  if (Array.isArray(projects) && projects.length > 0) {
    console.log('=== DETALHES DOS PROJETOS RECEBIDOS ===');
    projects.forEach((project, index) => {
      console.log(`Projeto ${index + 1}:`, {
        id: project.id,
        name: project.name,
        status: project.status,
        clientName: project.clientName,
        startDate: project.startDate,
        endDate: project.endDate
      });
    });
  }

  console.log('=== PROJECTLIST RENDER ===');
  console.log('isLoading:', isLoading);
  console.log('isError:', isError);
  console.log('projects:', projects);
  console.log('projects.length:', projects?.length || 0);

  // Função helper para verificar se uma data está atrasada
  const isOverdue = (endDate: string | null) => {
    if (!endDate) return false;
    const today = new Date();
    const targetDate = new Date(endDate);
    return targetDate < today;
  };

  // Função helper para verificar se um status indica conclusão
  const isCompletedStatus = (status: string) => {
    const completionStatuses = statuses.filter(s => s.is_completion_status);
    return completionStatuses.some(s => s.name === status) || status === 'concluido';
  };

  const filteredProjects = (projects as Project[]).filter((project: Project) => {
    console.log('=== FILTRANDO PROJETO ===');
    console.log('Projeto:', project.name);
    console.log('Filtros ativos:', {
      searchTerm,
      statusFilter,
      clientFilter,
      serviceFilter,
      tagFilter,
      consultantFilter,
      startDateFilter,
      endDateFilter
    });
    
    const matchesSearch = searchTerm === '' || 
      project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (project.description && project.description.toLowerCase().includes(searchTerm.toLowerCase()));
    
    console.log('matchesSearch:', matchesSearch);

    // Lógica do filtro de status - incluindo entregas atrasadas
    let matchesStatus = false;
    if (statusFilter === '') {
      matchesStatus = true; // Se não há filtro, incluir todos
      console.log('Sem filtro de status - incluindo todos');
    } else if (statusFilter === 'entregas_atrasadas') {
      // Filtro especial para entregas atrasadas
      const projectOverdue = !isCompletedStatus(project.status) && isOverdue(project.endDate);
      
      // Verificar se alguma etapa está atrasada
      const hasOverdueStages = project.stages && project.stages.some(stage => 
        !stage.completed && 
        !isCompletedStatus(stage.status || '') && 
        isOverdue(stage.endDate)
      );
      
      matchesStatus = projectOverdue || hasOverdueStages;
      console.log('Filtro entregas atrasadas:', { projectOverdue, hasOverdueStages, matchesStatus });
    } else {
      // Verificar se o status do projeto corresponde
      const projectMatches = project.status === statusFilter;
      
      // Verificar se alguma etapa tem o status filtrado
      const stageMatches = project.stages && project.stages.some(stage => stage.status === statusFilter);
      
      // O projeto deve aparecer se ele próprio ou alguma de suas etapas tiver o status filtrado
      matchesStatus = projectMatches || stageMatches;
      console.log('Filtro de status normal:', { statusFilter, projectStatus: project.status, projectMatches, stageMatches, matchesStatus });
    }
    
    const matchesClient = clientFilter === '' || project.clientId === clientFilter;
    const matchesService = serviceFilter === '' || project.serviceId === serviceFilter;
    const matchesConsultant = consultantFilter === '' || 
      project.mainConsultantId === consultantFilter || 
      project.supportConsultantId === consultantFilter;
    
    const matchesTags = tagFilter.length === 0 || 
      (project.tagIds && project.tagIds.some((tagId: string) => tagFilter.includes(tagId)));
    
    const matchesStartDate = startDateFilter === '' || 
      (project.startDate && project.startDate >= startDateFilter);
    
    const matchesEndDate = endDateFilter === '' || 
      (project.endDate && project.endDate <= endDateFilter);
    
    console.log('Resultados dos filtros:', {
      matchesSearch,
      matchesStatus,
      matchesClient,
      matchesService,
      matchesConsultant,
      matchesTags,
      matchesStartDate,
      matchesEndDate
    });
    
    const result = matchesSearch && matchesStatus && matchesClient && matchesService && 
           matchesConsultant && matchesTags && matchesStartDate && matchesEndDate;
    
    console.log('Projeto', project.name, 'RESULTADO FINAL:', result);
    
    return result;
  });

  console.log('=== PROJETOS FILTRADOS ===');
  console.log('Total de projetos filtrados:', filteredProjects.length);
  console.log('Projetos que passaram no filtro:', filteredProjects.map(p => p.name));

  const handleDeleteProject = async (id: string) => {
    // Find the project to check its status
    const project = (projects as Project[]).find(p => p.id === id);
    
    if (!project) {
      toast.error("Projeto não encontrado.");
      return;
    }

    // Check if project status is "cancelado"
    if (project.status !== 'cancelado') {
      toast.error("Apenas projetos com status 'cancelado' podem ser removidos. Altere o status do projeto para 'cancelado' antes de excluí-lo.");
      return;
    }

    const confirmMessage = `Tem certeza que deseja excluir o projeto "${project.name}"? Esta ação não pode ser desfeita.`;
    
    if (window.confirm(confirmMessage)) {
      try {
        await deleteProject(id);
        await refetch();
        toast.success("Projeto excluído com sucesso!");
      } catch (error: any) {
        console.error("Erro ao excluir projeto:", error);
        toast.error(error.message || "Erro ao excluir projeto.");
      }
    }
  };

  const handleEditProject = (project: any) => {
    console.log('Editando projeto:', project);
    setEditingProject(project);
    setIsDialogOpen(true);
  };

  const handleNewProject = () => {
    console.log('Criando novo projeto');
    setEditingProject(null);
    setIsDialogOpen(true);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('');
    setClientFilter('');
    setServiceFilter('');
    setTagFilter([]);
    setConsultantFilter('');
    setStartDateFilter('');
    setEndDateFilter('');
    toast.success('Filtros limpos com sucesso!');
  };

  const handleProjectSaved = async (savedProject?: Project) => {
    try {
      console.log('=== PROJETO SALVO - ATUALIZANDO LISTA ===');
      console.log('Projeto salvo:', savedProject);
      
      // Force refetch data to ensure we get the latest
      await refetch();
      
      // Close dialog and clear editing state
      setIsDialogOpen(false);
      setEditingProject(null);
      
      console.log('Lista de projetos atualizada com sucesso');
      toast.success("Projeto salvo e lista atualizada com sucesso!");
    } catch (error) {
      console.error('Erro ao atualizar lista de projetos:', error);
      toast.error('Erro ao atualizar lista de projetos');
    }
  };

  const handleDialogOpenChange = (open: boolean) => {
    console.log('Dialog open change:', open);
    setIsDialogOpen(open);
    if (!open) {
      setEditingProject(null);
    }
  };

  // Preparar opções de status dinamicamente
  const statusOptions = [
    { id: '', name: 'Todos os status' },
    { id: 'entregas_atrasadas', name: 'Entregas Atrasadas' }, // Nova opção
    ...statuses.map(status => ({
      id: status.name,
      name: status.display_name
    }))
  ];

  // Helper functions to handle SearchableSelect value changes
  const handleStatusFilterChange = (value: string | string[]) => {
    if (typeof value === 'string') {
      setStatusFilter(value);
    }
  };

  const handleClientFilterChange = (value: string | string[]) => {
    if (typeof value === 'string') {
      setClientFilter(value);
    }
  };

  const handleServiceFilterChange = (value: string | string[]) => {
    if (typeof value === 'string') {
      setServiceFilter(value);
    }
  };

  const handleConsultantFilterChange = (value: string | string[]) => {
    if (typeof value === 'string') {
      setConsultantFilter(value);
    }
  };

  const handleTagFilterChange = (value: string | string[]) => {
    if (Array.isArray(value)) {
      setTagFilter(value);
    } else if (typeof value === 'string') {
      setTagFilter([value]);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Projetos</h1>
          <p className="text-muted-foreground">Gerenciamento de projetos</p>
        </div>
        <div className="flex items-center">
          <Dialog open={isDialogOpen} onOpenChange={handleDialogOpenChange}>
            <DialogTrigger asChild>
              <Button 
                size="sm" 
                variant="outline" 
                className="ml-auto gap-1"
                onClick={handleNewProject}
              >
                <Plus className="h-4 w-4" />
                <span>Novo Projeto</span>
              </Button>
            </DialogTrigger>
            <DialogContent size="full" className="max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingProject ? 'Editar Projeto' : 'Novo Projeto'}
                </DialogTitle>
              </DialogHeader>
              <ProjectForm
                project={editingProject}
                onProjectSaved={handleProjectSaved}
                onCancel={() => setIsDialogOpen(false)}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardContent className="p-4">
          {/* Primeira linha - filtros principais */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-4">
            <Input
              placeholder="Buscar projetos..."
              value={searchTerm}
              onChange={(e) => {
                console.log('Mudando termo de busca:', e.target.value);
                setSearchTerm(e.target.value);
              }}
            />
            
            {/* Filtro de status usando dados dinâmicos */}
            <SearchableSelect
              options={statusOptions}
              value={statusFilter}
              onValueChange={handleStatusFilterChange}
              placeholder="Status"
              searchPlaceholder="Buscar status..."
            />

            <SearchableSelect
              options={[
                { id: '', name: 'Todos os clientes' },
                ...clients
              ]}
              value={clientFilter}
              onValueChange={handleClientFilterChange}
              placeholder="Cliente"
              searchPlaceholder="Buscar cliente..."
            />

            <SearchableSelect
              options={[
                { id: '', name: 'Todos os serviços' },
                ...services
              ]}
              value={serviceFilter}
              onValueChange={handleServiceFilterChange}
              placeholder="Serviço"
              searchPlaceholder="Buscar serviço..."
            />

            <SearchableSelect
              options={tags}
              value={tagFilter}
              onValueChange={handleTagFilterChange}
              placeholder="Tags"
              searchPlaceholder="Buscar tags..."
              multiple={true}
            />
          </div>

          {/* Segunda linha - filtros compactos */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
            <div className="lg:col-span-2">
              <SearchableSelect
                options={consultants}
                value={consultantFilter}
                onValueChange={handleConsultantFilterChange}
                placeholder="Consultor"
                searchPlaceholder="Buscar consultor..."
                className="w-full"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-gray-500 flex-shrink-0" />
              <Input
                type="date"
                placeholder="Data início"
                value={startDateFilter}
                onChange={(e) => setStartDateFilter(e.target.value)}
                className="text-sm"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-gray-500 flex-shrink-0" />
              <Input
                type="date"
                placeholder="Data fim"
                value={endDateFilter}
                onChange={(e) => setEndDateFilter(e.target.value)}
                className="text-sm"
              />
            </div>

            <Button variant="outline" size="sm" onClick={clearFilters} className="w-full">
              <Filter className="h-4 w-4 mr-2" />
              Limpar filtros
            </Button>
          </div>

          <div className="flex justify-between items-center mt-4">
            <div className="text-sm text-muted-foreground">
              {filteredProjects.length} projeto(s) encontrado(s)
              {statusFilter === 'entregas_atrasadas' && (
                <span className="ml-2 text-red-600 font-medium">
                  (Entregas Atrasadas)
                </span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden">
        <CardContent className="p-6 pt-6">
          {isLoading ? (
            <div className="text-center py-8">
              <p>Carregando projetos...</p>
              <p className="text-sm text-muted-foreground mt-2">Verificando conexão com o banco de dados</p>
            </div>
          ) : isError ? (
            <div className="text-center py-8 text-red-500">
              <p>Erro ao carregar projetos:</p>
              <p className="text-sm mt-2">{error?.message || 'Erro desconhecido'}</p>
              <Button 
                variant="outline" 
                onClick={() => refetch()} 
                className="mt-4"
              >
                Tentar novamente
              </Button>
            </div>
          ) : (
            <>
              <div className="mb-4 p-4 bg-gray-50 rounded">
                <h4 className="font-semibold mb-2">Status de Debug:</h4>
                <p>Total de projetos carregados: {projects?.length || 0}</p>
                <p>Total de projetos filtrados: {filteredProjects?.length || 0}</p>
                <p>Filtros ativos: {JSON.stringify({ searchTerm, statusFilter, clientFilter })}</p>
              </div>
              <ProjectsExpandedTable
                projects={filteredProjects}
                onDeleteProject={handleDeleteProject}
                onEditProject={handleEditProject}
                onRefresh={refetch}
              />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ProjectList;
