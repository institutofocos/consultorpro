
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

        // Fetch tags
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

  const { 
    data: projects = [], 
    isLoading, 
    isError, 
    refetch 
  } = useQuery({
    queryKey: ['projects'],
    queryFn: fetchProjects,
  });

  const filteredProjects = projects.filter(project => {
    const matchesSearch = searchTerm === '' || 
      project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (project.description && project.description.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === '' || project.status === statusFilter;
    const matchesClient = clientFilter === '' || project.client_id === clientFilter;
    const matchesService = serviceFilter === '' || project.service_id === serviceFilter;
    const matchesConsultant = consultantFilter === '' || 
      project.main_consultant_id === consultantFilter || 
      project.support_consultant_id === consultantFilter;
    
    const matchesTags = tagFilter.length === 0 || 
      (project.tags && project.tags.some((tag: any) => tagFilter.includes(tag.id)));
    
    const matchesStartDate = startDateFilter === '' || 
      (project.start_date && project.start_date >= startDateFilter);
    
    const matchesEndDate = endDateFilter === '' || 
      (project.end_date && project.end_date <= endDateFilter);
    
    return matchesSearch && matchesStatus && matchesClient && matchesService && 
           matchesConsultant && matchesTags && matchesStartDate && matchesEndDate;
  });

  const handleDeleteProject = async (id: string) => {
    if (window.confirm("Tem certeza que deseja excluir este projeto?")) {
      try {
        await deleteProject(id);
        await refetch();
        toast.success("Projeto excluído com sucesso!");
      } catch (error) {
        console.error("Erro ao excluir projeto:", error);
        toast.error("Erro ao excluir projeto.");
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

  const handleProjectSaved = async () => {
    try {
      await refetch();
      setIsDialogOpen(false);
      setEditingProject(null);
      toast.success("Projeto salvo com sucesso!");
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
        <h1 className="text-3xl font-bold tracking-tight">Projetos</h1>
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
                <span>Novo</span>
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            <Input
              placeholder="Buscar projetos..."
              value={searchTerm}
              onChange={(e) => {
                console.log('Mudando termo de busca:', e.target.value);
                setSearchTerm(e.target.value);
              }}
            />
            
            <SearchableSelect
              options={[
                { id: '', name: 'Todos os status' },
                { id: 'planned', name: 'Planejado' },
                { id: 'active', name: 'Ativo' },
                { id: 'completed', name: 'Concluído' },
                { id: 'cancelled', name: 'Cancelado' },
                { id: 'em_producao', name: 'Em Produção' },
                { id: 'aguardando_assinatura', name: 'Aguardando Assinatura' },
                { id: 'aguardando_aprovacao', name: 'Aguardando Aprovação' },
                { id: 'aguardando_nota_fiscal', name: 'Aguardando Nota Fiscal' },
                { id: 'aguardando_pagamento', name: 'Aguardando Pagamento' },
                { id: 'aguardando_repasse', name: 'Aguardando Repasse' },
                { id: 'concluido', name: 'Concluído' },
                { id: 'cancelado', name: 'Cancelado' }
              ]}
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
              options={consultants}
              value={consultantFilter}
              onValueChange={handleConsultantFilterChange}
              placeholder="Consultor"
              searchPlaceholder="Buscar consultor..."
            />

            <SearchableSelect
              options={tags}
              value={tagFilter}
              onValueChange={handleTagFilterChange}
              placeholder="Tags"
              searchPlaceholder="Buscar tags..."
              multiple={true}
            />

            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-gray-500" />
              <Input
                type="date"
                placeholder="Data início"
                value={startDateFilter}
                onChange={(e) => setStartDateFilter(e.target.value)}
                className="text-sm"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-gray-500" />
              <Input
                type="date"
                placeholder="Data fim"
                value={endDateFilter}
                onChange={(e) => setEndDateFilter(e.target.value)}
                className="text-sm"
              />
            </div>

            <Button variant="outline" size="sm" onClick={clearFilters}>
              <Filter className="h-4 w-4 mr-2" />
              Limpar filtros
            </Button>
          </div>

          <div className="flex justify-between items-center mt-4">
            <div className="text-sm text-muted-foreground">
              {filteredProjects.length} projeto(s) encontrado(s)
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden">
        <CardContent className="p-6 pt-6">
          {isLoading ? (
            <div className="text-center py-8">Carregando projetos...</div>
          ) : isError ? (
            <div className="text-center py-8 text-red-500">
              Erro ao carregar projetos. Por favor, tente novamente.
            </div>
          ) : (
            <ProjectsExpandedTable
              projects={filteredProjects}
              onDeleteProject={handleDeleteProject}
              onEditProject={handleEditProject}
              onRefresh={refetch}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ProjectList;
