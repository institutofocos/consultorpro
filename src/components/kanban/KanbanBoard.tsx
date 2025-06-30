
import React, { useState, useEffect } from "react";
import { DragDropContext, Droppable, Draggable, DropResult } from "react-beautiful-dnd";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, Search, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useProjectStatuses } from "@/hooks/useProjectStatuses";
import { useUserPermissions } from "@/hooks/useUserPermissions";
import KanbanCard from "./KanbanCard";
import ProjectDetailsModal from "./ProjectDetailsModal";
import { Project } from "@/components/projects/types";

// Define the Supabase response type to match actual response structure
interface SupabaseProject {
  id: string;
  name: string;
  description?: string;
  client?: { name: string }[];
  service?: { name: string }[];
  main_consultant?: { name: string }[];
  support_consultant?: { name: string }[];
  status: string;
  start_date: string;
  end_date: string;
  total_value: number;
  main_consultant_id?: string;
  support_consultant_id?: string;
  client_id?: string;
  service_id?: string;
  main_consultant_commission?: number;
  support_consultant_commission?: number;
  hourly_rate?: number;
  total_hours?: number;
  tax_percent?: number;
  third_party_expenses?: number;
  main_consultant_value?: number;
  support_consultant_value?: number;
  manager_name?: string;
  manager_email?: string;
  manager_phone?: string;
  url?: string;
  project_id?: string;
  created_at?: string;
  updated_at?: string;
}

interface Consultant {
  id: string;
  name: string;
}

const KanbanBoard: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [consultants, setConsultants] = useState<Consultant[]>([]);
  const [selectedConsultant, setSelectedConsultant] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const { statuses, getStatusDisplay } = useProjectStatuses();
  const { 
    isRestrictedConsultant, 
    getLinkedConsultantId, 
    isSuperAdmin,
    isLoading: permissionsLoading 
  } = useUserPermissions();

  // Configurar filtro automático baseado no perfil do usuário
  useEffect(() => {
    if (!permissionsLoading) {
      if (isRestrictedConsultant) {
        const linkedConsultantId = getLinkedConsultantId();
        if (linkedConsultantId) {
          setSelectedConsultant(linkedConsultantId);
        }
      }
    }
  }, [isRestrictedConsultant, getLinkedConsultantId, permissionsLoading]);

  useEffect(() => {
    fetchProjects();
    fetchConsultants();
  }, []);

  // Transform Supabase data to Project format
  const transformProject = (supabaseProject: SupabaseProject): Project => {
    return {
      ...supabaseProject,
      // Map required camelCase properties
      mainConsultantCommission: supabaseProject.main_consultant_commission || 0,
      supportConsultantCommission: supabaseProject.support_consultant_commission || 0,
      startDate: supabaseProject.start_date,
      endDate: supabaseProject.end_date,
      totalValue: supabaseProject.total_value,
      taxPercent: supabaseProject.tax_percent || 16,
      // Handle consultant data (arrays from joins) - map to the Project interface format
      clients: supabaseProject.client?.[0],
      services: supabaseProject.service?.[0],
      main_consultant: supabaseProject.main_consultant?.[0] ? {
        id: supabaseProject.main_consultant_id || '',
        name: supabaseProject.main_consultant[0].name,
        email: ''
      } : undefined,
      support_consultant: supabaseProject.support_consultant?.[0] ? {
        id: supabaseProject.support_consultant_id || '',
        name: supabaseProject.support_consultant[0].name,
        email: ''
      } : undefined,
      // Map IDs to camelCase
      clientId: supabaseProject.client_id,
      serviceId: supabaseProject.service_id,
      mainConsultantId: supabaseProject.main_consultant_id,
      supportConsultantId: supabaseProject.support_consultant_id,
      // Add required fields for Project interface
      clientName: supabaseProject.client?.[0]?.name,
      serviceName: supabaseProject.service?.[0]?.name,
      mainConsultantName: supabaseProject.main_consultant?.[0]?.name,
      supportConsultantName: supabaseProject.support_consultant?.[0]?.name,
    };
  };

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('projects')
        .select(`
          *,
          client:clients(name),
          service:services(name),
          main_consultant:consultants!projects_main_consultant_id_fkey(name),
          support_consultant:consultants!projects_support_consultant_id_fkey(name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Transform the data to match our Project interface
      const transformedProjects = (data || []).map(transformProject);
      setProjects(transformedProjects);
    } catch (error) {
      console.error('Error fetching projects:', error);
      toast.error('Erro ao carregar projetos');
    } finally {
      setLoading(false);
    }
  };

  const fetchConsultants = async () => {
    try {
      const { data, error } = await supabase
        .from('consultants')
        .select('id, name')
        .order('name');

      if (error) throw error;
      setConsultants(data || []);
    } catch (error) {
      console.error('Error fetching consultants:', error);
    }
  };

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination) return;

    const projectId = result.draggableId;
    const newStatus = result.destination.droppableId;

    try {
      const { error } = await supabase
        .from('projects')
        .update({ status: newStatus })
        .eq('id', projectId);

      if (error) throw error;

      setProjects(prev => 
        prev.map(project => 
          project.id === projectId 
            ? { ...project, status: newStatus }
            : project
        )
      );

      toast.success('Status do projeto atualizado com sucesso');
    } catch (error) {
      console.error('Error updating project status:', error);
      toast.error('Erro ao atualizar status do projeto');
    }
  };

  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.clientName?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesConsultant = selectedConsultant === "all" || 
                             project.mainConsultantId === selectedConsultant ||
                             project.supportConsultantId === selectedConsultant;

    return matchesSearch && matchesConsultant;
  });

  const projectsByStatus = statuses.reduce((acc, status) => {
    acc[status.name] = filteredProjects.filter(project => project.status === status.name);
    return acc;
  }, {} as Record<string, Project[]>);

  if (loading || permissionsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p>Carregando projetos...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-center">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Buscar projetos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            {/* Só mostra o filtro de consultor se não for consultor restrito */}
            {!isRestrictedConsultant && (
              <div className="w-64">
                <Select value={selectedConsultant} onValueChange={setSelectedConsultant}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filtrar por consultor" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os consultores</SelectItem>
                    {consultants.map(consultant => (
                      <SelectItem key={consultant.id} value={consultant.id}>
                        {consultant.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Kanban Board */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {statuses.map((status) => (
            <div key={status.name} className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge 
                    style={{ backgroundColor: status.color, color: '#ffffff' }}
                    className="text-white"
                  >
                    {status.display_name}
                  </Badge>
                  <span className="text-sm text-gray-500">
                    ({projectsByStatus[status.name]?.length || 0})
                  </span>
                </div>
              </div>
              
              <Droppable droppableId={status.name}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`min-h-[200px] p-2 rounded-lg border-2 border-dashed transition-colors ${
                      snapshot.isDraggingOver 
                        ? 'border-blue-400 bg-blue-50' 
                        : 'border-gray-200'
                    }`}
                  >
                    {projectsByStatus[status.name]?.map((project, index) => (
                      <Draggable 
                        key={project.id} 
                        draggableId={project.id} 
                        index={index}
                      >
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={`mb-3 ${snapshot.isDragging ? 'opacity-50' : ''}`}
                          >
                            <KanbanCard 
                              project={project}
                              type="project"
                              onClick={() => {
                                setSelectedProject(project);
                                setIsDetailsOpen(true);
                              }}
                            />
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          ))}
        </div>
      </DragDropContext>

      {/* Modal de Detalhes */}
      <ProjectDetailsModal
        project={selectedProject}
        open={isDetailsOpen}
        onOpenChange={(open) => {
          setIsDetailsOpen(open);
          if (!open) {
            setSelectedProject(null);
          }
        }}
      />
    </div>
  );
};

export default KanbanBoard;
