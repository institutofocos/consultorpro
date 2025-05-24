import React, { useState, useEffect } from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Search, 
  PlusCircle, 
  Edit, 
  Trash,
  Check,
  Clock,
  Eye,
  Tag,
  Filter
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import ProjectForm from './ProjectForm';
import { ProjectDetails } from './ProjectDetails';
import { useToast } from "@/components/ui/use-toast";
import { Project, Stage } from './types';
import { fetchProjects, createProject, updateProject, deleteProject } from '@/integrations/supabase/projects';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { fetchClients } from '@/integrations/supabase/clients';
import { fetchServices } from '@/integrations/supabase/services';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';

// Use export type for re-exporting types when isolatedModules is enabled
export type { Project, Stage };

export const ProjectList: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  
  // New state for filters
  const [consultantFilter, setConsultantFilter] = useState<string>("");
  const [clientFilter, setClientFilter] = useState<string>("");
  const [serviceFilter, setServiceFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [startDateFilter, setStartDateFilter] = useState<Date | undefined>(undefined);
  const [endDateFilter, setEndDateFilter] = useState<Date | undefined>(undefined);
  
  // State for filter data options
  const [consultants, setConsultants] = useState<{id: string, name: string}[]>([]);
  const [clients, setClients] = useState<{id: string, name: string}[]>([]);
  const [services, setServices] = useState<{id: string, name: string}[]>([]);
  
  useEffect(() => {
    loadProjects();
    fetchFilterData();
  }, []);

  const fetchFilterData = async () => {
    try {
      // Fetch consultants
      const { data: consultantsData, error: consultantsError } = await supabase
        .from('consultants')
        .select('id, name')
        .order('name');
      
      if (consultantsError) throw consultantsError;
      setConsultants(consultantsData || []);
      
      // Fetch clients
      const clientsData = await fetchClients();
      setClients(clientsData);
      
      // Fetch services
      const servicesData = await fetchServices();
      setServices(servicesData);
      
    } catch (error) {
      console.error('Error fetching filter data:', error);
    }
  };

  const loadProjects = async () => {
    try {
      setIsLoading(true);
      const projectsData = await fetchProjects();
      setProjects(projectsData);
    } catch (error) {
      console.error('Error fetching projects:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível carregar os projetos."
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddProject = async (project: Project) => {
    try {
      console.log('Iniciando criação/atualização do projeto:', project.name);
      
      if (editingProject) {
        // Update existing project
        console.log('Atualizando projeto existente:', editingProject.id);
        const updatedProject = await updateProject(project);
        
        // Update the project in the local state without reloading
        setProjects(prevProjects => 
          prevProjects.map(p => p.id === updatedProject.id ? updatedProject : p)
        );
        
        toast({
          title: "Sucesso",
          description: "Projeto atualizado com sucesso!"
        });
        
        setEditingProject(null);
      } else {
        // Add new project
        console.log('Criando novo projeto');
        const savedProject = await createProject(project);
        
        // Add the new project to the beginning of the list without reloading
        setProjects(prevProjects => [savedProject, ...prevProjects]);
        
        toast({
          title: "Sucesso",
          description: "Projeto criado com sucesso!"
        });
      }
      
      setShowForm(false);
      console.log('Processo de criação/atualização concluído com sucesso');
    } catch (error: any) {
      console.error('Error saving project:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: error.message || "Não foi possível salvar o projeto."
      });
    }
  };
  
  const handleEditProject = (project: Project) => {
    setEditingProject(project);
    setShowForm(true);
  };
  
  const handleDeleteProject = async (id: string, projectName?: string) => {
    const confirmMessage = projectName 
      ? `Tem certeza que deseja excluir o projeto "${projectName}"?`
      : 'Tem certeza que deseja excluir este projeto?';
      
    if (!window.confirm(confirmMessage)) return;
    
    try {
      console.log(`Tentando excluir projeto: ${projectName || id}`);
      
      await deleteProject(id);
      
      // Update local state
      setProjects(projects.filter(p => p.id !== id));
      
      toast({
        title: "Sucesso",
        description: `Projeto ${projectName ? `"${projectName}"` : ''} removido com sucesso!`
      });
    } catch (error: any) {
      console.error('Error deleting project:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: `Erro ao excluir projeto ${projectName ? `"${projectName}"` : ''}: ${error.message || "Erro desconhecido"}`
      });
    }
  };

  const handleViewProject = (project: Project) => {
    setSelectedProject(project);
    setShowDetails(true);
  };

  const handleCloseDetails = () => {
    setShowDetails(false);
    setSelectedProject(null);
  };

  // Reset all filters
  const resetFilters = () => {
    setConsultantFilter("");
    setClientFilter("");
    setServiceFilter("");
    setStatusFilter("");
    setStartDateFilter(undefined);
    setEndDateFilter(undefined);
    setSearchTerm("");
  };

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };
  
  // Calculate net value
  const calculateNetValue = (project: Project) => {
    const totalValue = project.totalValue || 0;
    const consultantValue = project.consultantValue || 0;
    const supportConsultantValue = project.supportConsultantValue || 0;
    const thirdPartyExpenses = project.thirdPartyExpenses || 0;
    return totalValue - consultantValue - supportConsultantValue - thirdPartyExpenses;
  };
  
  const filteredProjects = projects.filter(project => {
    // First filter by search term
    const matchesSearch = 
      !searchTerm || 
      project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.mainConsultantName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.serviceName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.clientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (project.tags && project.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())));
    
    // Then apply all other filters
    const matchesConsultant = !consultantFilter || 
                              project.mainConsultantId === consultantFilter || 
                              project.supportConsultantId === consultantFilter;
    
    const matchesClient = !clientFilter || project.clientId === clientFilter;
    
    const matchesService = !serviceFilter || project.serviceId === serviceFilter;
    
    const matchesStatus = !statusFilter || project.status === statusFilter;
    
    // Date range filtering
    let matchesDateRange = true;
    if (startDateFilter) {
      const projectStartDate = new Date(project.startDate);
      matchesDateRange = matchesDateRange && projectStartDate >= startDateFilter;
    }
    if (endDateFilter) {
      const projectEndDate = new Date(project.endDate);
      matchesDateRange = matchesDateRange && projectEndDate <= endDateFilter;
    }
    
    return matchesSearch && matchesConsultant && matchesClient && matchesService && matchesStatus && matchesDateRange;
  });
  
  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold">Projetos</h1>
        <p className="text-muted-foreground">Gerenciamento de projetos e serviços</p>
      </div>
      
      {showForm ? (
        <ProjectForm 
          project={editingProject} 
          onProjectSaved={handleAddProject} 
          onCancel={() => {
            setShowForm(false);
            setEditingProject(null);
          }} 
        />
      ) : showDetails && selectedProject ? (
        <ProjectDetails 
          project={selectedProject}
          onClose={handleCloseDetails}
          onProjectUpdated={loadProjects}
        />
      ) : (
        <>
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative w-full md:w-[300px]">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input 
                placeholder="Buscar projetos..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="flex items-center gap-4">
              {/* Filter Popover */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="flex items-center gap-2">
                    <Filter className="h-4 w-4" />
                    Filtrar
                    {(consultantFilter || clientFilter || serviceFilter || statusFilter || startDateFilter || endDateFilter) && (
                      <Badge className="ml-2 h-5 w-5 p-0 flex items-center justify-center">
                        {[consultantFilter, clientFilter, serviceFilter, statusFilter, startDateFilter, endDateFilter].filter(Boolean).length}
                      </Badge>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80">
                  <div className="grid gap-4">
                    <h4 className="font-medium">Filtros</h4>
                    
                    <div className="grid gap-2">
                      <label className="text-sm">Consultor</label>
                      <Select value={consultantFilter} onValueChange={setConsultantFilter}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">Todos</SelectItem>
                          {consultants.map(consultant => (
                            <SelectItem key={consultant.id} value={consultant.id}>
                              {consultant.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="grid gap-2">
                      <label className="text-sm">Cliente</label>
                      <Select value={clientFilter} onValueChange={setClientFilter}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">Todos</SelectItem>
                          {clients.map(client => (
                            <SelectItem key={client.id} value={client.id}>
                              {client.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="grid gap-2">
                      <label className="text-sm">Serviço</label>
                      <Select value={serviceFilter} onValueChange={setServiceFilter}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">Todos</SelectItem>
                          {services.map(service => (
                            <SelectItem key={service.id} value={service.id}>
                              {service.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="grid gap-2">
                      <label className="text-sm">Status</label>
                      <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">Todos</SelectItem>
                          <SelectItem value="planned">Planejado</SelectItem>
                          <SelectItem value="active">Em Andamento</SelectItem>
                          <SelectItem value="completed">Concluído</SelectItem>
                          <SelectItem value="cancelled">Cancelado</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="grid gap-2">
                      <label className="text-sm">Data de Início</label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline">
                            {startDateFilter ? format(startDateFilter, 'dd/MM/yyyy', { locale: ptBR }) : "Selecionar..."}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={startDateFilter}
                            onSelect={setStartDateFilter}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    
                    <div className="grid gap-2">
                      <label className="text-sm">Data de Término</label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline">
                            {endDateFilter ? format(endDateFilter, 'dd/MM/yyyy', { locale: ptBR }) : "Selecionar..."}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={endDateFilter}
                            onSelect={setEndDateFilter}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <Button variant="ghost" onClick={resetFilters}>Limpar Filtros</Button>
                      <Button onClick={() => document.body.click()}>Aplicar</Button>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>

              <Button onClick={() => setShowForm(true)}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Adicionar Projeto
              </Button>
            </div>
          </div>
          
          <Card className="shadow-card">
            <CardHeader className="pb-3">
              <CardTitle>Lista de Projetos</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Projeto</TableHead>
                    <TableHead>Serviço</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Consultor</TableHead>
                    <TableHead>Valor Total</TableHead>
                    <TableHead>Valor Líquido</TableHead>
                    <TableHead>Progresso</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Tags</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                        Carregando projetos...
                      </TableCell>
                    </TableRow>
                  ) : filteredProjects.length > 0 ? (
                    filteredProjects.map((project) => (
                      <TableRow key={project.id}>
                        <TableCell>
                          <div className="font-medium">{project.name}</div>
                        </TableCell>
                        <TableCell>{project.serviceName || "Não especificado"}</TableCell>
                        <TableCell>{project.clientName || "Não especificado"}</TableCell>
                        <TableCell>{project.mainConsultantName}</TableCell>
                        <TableCell>{formatCurrency(project.totalValue)}</TableCell>
                        <TableCell>{formatCurrency(calculateNetValue(project))}</TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <span className="text-sm mr-2">
                              {project.completedStages}/{project.stages?.length || 0}
                            </span>
                            <div className="bg-muted h-2 w-16 rounded-full overflow-hidden">
                              <div 
                                className="bg-blue-500 h-full rounded-full"
                                style={{ width: `${project.stages?.length ? (project.completedStages || 0 / project.stages.length) * 100 : 0}%` }}
                              ></div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {project.status === 'active' && (
                            <Badge className="bg-green-500">
                              <Clock className="mr-1 h-3 w-3" />
                              Em Andamento
                            </Badge>
                          )}
                          {project.status === 'completed' && (
                            <Badge className="bg-blue-500">
                              <Check className="mr-1 h-3 w-3" />
                              Concluído
                            </Badge>
                          )}
                          {project.status === 'planned' && (
                            <Badge variant="outline">
                              Planejado
                            </Badge>
                          )}
                          {project.status === 'cancelled' && (
                            <Badge variant="destructive">
                              Cancelado
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {project.tags && project.tags.length > 0 ? (
                              project.tags.map((tag, idx) => (
                                <Badge key={idx} variant="secondary" className="mr-1">
                                  <Tag className="h-3 w-3 mr-1" />
                                  {tag}
                                </Badge>
                              ))
                            ) : (
                              <span className="text-xs text-muted-foreground">Sem tags</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" onClick={() => handleViewProject(project)} title="Visualizar detalhes">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleEditProject(project)} title="Editar">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDeleteProject(project.id, project.name)} title="Excluir">
                            <Trash className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                        Nenhum projeto encontrado
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default ProjectList;
