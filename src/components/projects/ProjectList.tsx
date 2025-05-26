
import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { fetchProjects, deleteProject } from '@/integrations/supabase/projects';
import ProjectsExpandedTable from './ProjectsExpandedTable';
import ProjectForm from './ProjectForm';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

const ProjectList: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [clientFilter, setClientFilter] = useState<string>('');
  const [clients, setClients] = useState<Array<{id: string, name: string}>>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<any>(null);

  useEffect(() => {
    const fetchClients = async () => {
      try {
        const { data, error } = await supabase
          .from('clients')
          .select('id, name')
          .order('name');
        
        if (error) {
          console.error('Erro ao buscar clientes:', error);
          toast.error('Erro ao carregar clientes');
          return;
        }
        
        if (data) {
          setClients(data);
        }
      } catch (error) {
        console.error('Erro ao buscar clientes:', error);
        toast.error('Erro ao carregar clientes');
      }
    };
    
    fetchClients();
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
    
    return matchesSearch && matchesStatus && matchesClient;
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

  const handleDialogClose = () => {
    console.log('Fechando dialog');
    setIsDialogOpen(false);
    setEditingProject(null);
  };

  const handleStatusFilterChange = (value: string) => {
    console.log('Mudando filtro de status para:', value);
    setStatusFilter(value);
  };

  const handleClientFilterChange = (value: string) => {
    console.log('Mudando filtro de cliente para:', value);
    setClientFilter(value);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Projetos</h1>
        <div className="flex items-center">
          <Dialog open={isDialogOpen} onOpenChange={handleDialogClose}>
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
                onCancel={handleDialogClose}
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
            
            <Select value={statusFilter} onValueChange={handleStatusFilterChange}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos os status</SelectItem>
                <SelectItem value="em_producao">Em Produção</SelectItem>
                <SelectItem value="aguardando_assinatura">Aguardando Assinatura</SelectItem>
                <SelectItem value="aguardando_aprovacao">Aguardando Aprovação</SelectItem>
                <SelectItem value="aguardando_nota_fiscal">Aguardando Nota Fiscal</SelectItem>
                <SelectItem value="aguardando_pagamento">Aguardando Pagamento</SelectItem>
                <SelectItem value="aguardando_repasse">Aguardando Repasse</SelectItem>
                <SelectItem value="concluido">Concluído</SelectItem>
                <SelectItem value="cancelado">Cancelado</SelectItem>
              </SelectContent>
            </Select>

            <Select value={clientFilter} onValueChange={handleClientFilterChange}>
              <SelectTrigger>
                <SelectValue placeholder="Cliente" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos os clientes</SelectItem>
                {clients.map((client) => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

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
