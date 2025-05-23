
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
  Eye
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ProjectForm } from './ProjectForm';
import { ProjectDetails } from './ProjectDetails';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from "@/components/ui/use-toast";
import { Json } from '@/integrations/supabase/types';

// Project type definition
export interface Project {
  id: string;
  name: string;
  description: string;
  mainConsultantId: string;
  mainConsultantName?: string;
  mainConsultantPixKey?: string;
  supportConsultantId?: string;
  supportConsultantName?: string;
  supportConsultantPixKey?: string;
  startDate: string;
  endDate: string;
  totalValue: number;
  taxPercent: number;
  thirdPartyExpenses: number;
  consultantValue: number;
  status: 'planned' | 'active' | 'completed' | 'cancelled';
  stages: Stage[];
  completedStages: number;
}

// Stage type definition for type safety
export interface Stage {
  id: string;
  name: string;
  hours: number;
  days: number;
  value: number;
  startDate: string;
  endDate: string;
  completed: boolean;
  clientApproved: boolean;
  consultantPaid: boolean;
}

export const ProjectList: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      setIsLoading(true);
      
      // Fetch projects from Supabase with properly aliased consultant references
      // Fix: Use explicit column names in foreign table references to avoid ambiguity
      const { data: projectsData, error: projectsError } = await supabase
        .from('projects')
        .select(`
          *,
          main_consultant:consultants!main_consultant_id(id, name, pix_key),
          support_consultant:consultants!support_consultant_id(id, name, pix_key)
        `);
      
      if (projectsError) throw projectsError;
      
      if (projectsData) {
        // Transform the data for frontend use
        const transformedProjects: Project[] = projectsData.map(project => {
          // Safely parse stages with proper type handling
          let stages: Stage[] = [];
          try {
            if (project.stages && Array.isArray(project.stages)) {
              stages = project.stages as unknown as Stage[];
            }
          } catch (e) {
            console.error("Error parsing stages:", e);
          }
          
          return {
            id: project.id,
            name: project.name,
            description: project.description || '',
            mainConsultantId: project.main_consultant_id,
            // Using optional chaining to safely access nested properties
            mainConsultantName: project.main_consultant?.name || 'Não especificado',
            mainConsultantPixKey: project.main_consultant?.pix_key || '',
            supportConsultantId: project.support_consultant_id || undefined,
            supportConsultantName: project.support_consultant?.name || undefined,
            supportConsultantPixKey: project.support_consultant?.pix_key || '',
            startDate: project.start_date,
            endDate: project.end_date,
            totalValue: Number(project.total_value) || 0,
            taxPercent: Number(project.tax_percent) || 0,
            thirdPartyExpenses: Number(project.third_party_expenses) || 0,
            consultantValue: Number(project.main_consultant_value) || 0,
            status: project.status as any || 'planned',
            stages: stages,
            completedStages: stages.filter(s => s.completed).length
          };
        });
        
        setProjects(transformedProjects);
      }
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

  const handleAddProject = async (project: any) => {
    if (editingProject) {
      // Update existing project in Supabase
      try {
        // Garantir que main_consultant_id está definido explicitamente
        const { error } = await supabase
          .from('projects')
          .update({
            name: project.name,
            description: project.description,
            main_consultant_id: project.mainConsultantId,
            support_consultant_id: project.supportConsultantId,
            start_date: project.startDate,
            end_date: project.endDate,
            total_value: project.totalValue,
            tax_percent: project.taxPercent,
            third_party_expenses: project.thirdPartyExpenses,
            main_consultant_value: project.consultantValue,
            status: project.status,
            stages: project.stages
          })
          .eq('id', editingProject.id);

        if (error) throw error;
        
        toast({
          title: "Sucesso",
          description: "Projeto atualizado com sucesso!"
        });
        
        setEditingProject(null);
        fetchProjects(); // Refresh projects list
      } catch (error: any) {
        console.error('Error updating project:', error);
        toast({
          variant: "destructive",
          title: "Erro",
          description: error.message || "Não foi possível atualizar o projeto."
        });
      }
    } else {
      // Add new project to Supabase
      try {
        // Garantir que main_consultant_id está definido explicitamente
        const { error } = await supabase
          .from('projects')
          .insert({
            name: project.name,
            description: project.description,
            main_consultant_id: project.mainConsultantId,  // Usar a propriedade correta
            support_consultant_id: project.supportConsultantId,
            start_date: project.startDate,
            end_date: project.endDate,
            total_value: project.totalValue,
            tax_percent: project.taxPercent,
            third_party_expenses: project.thirdPartyExpenses,
            main_consultant_value: project.consultantValue,
            status: project.status,
            stages: project.stages
          });

        if (error) {
          console.error('Error details:', error);
          throw error;
        }
        
        toast({
          title: "Sucesso",
          description: "Projeto adicionado com sucesso!"
        });
        
        fetchProjects(); // Refresh projects list
      } catch (error: any) {
        console.error('Error adding project:', error);
        toast({
          variant: "destructive",
          title: "Erro",
          description: error.message || "Não foi possível adicionar o projeto."
        });
      }
    }
    
    setShowForm(false);
  };
  
  const handleEditProject = (project: Project) => {
    setEditingProject(project);
    setShowForm(true);
  };
  
  const handleDeleteProject = async (id: string) => {
    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      setProjects(projects.filter(p => p.id !== id));
      
      toast({
        title: "Sucesso",
        description: "Projeto removido com sucesso!"
      });
    } catch (error: any) {
      console.error('Error deleting project:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: error.message || "Não foi possível remover o projeto."
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

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };
  
  const filteredProjects = projects.filter(project => 
    project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.mainConsultantName?.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold">Projetos</h1>
        <p className="text-muted-foreground">Gerenciamento de projetos e serviços</p>
      </div>
      
      {showForm ? (
        <ProjectForm 
          project={editingProject} 
          onSave={handleAddProject} 
          onCancel={() => {
            setShowForm(false);
            setEditingProject(null);
          }} 
        />
      ) : showDetails && selectedProject ? (
        <ProjectDetails 
          project={selectedProject}
          onClose={handleCloseDetails}
          onProjectUpdated={fetchProjects}
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
            <Button onClick={() => setShowForm(true)} className="w-full md:w-auto">
              <PlusCircle className="mr-2 h-4 w-4" />
              Adicionar Projeto
            </Button>
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
                    <TableHead>Consultor</TableHead>
                    <TableHead>Valor Total</TableHead>
                    <TableHead>Progresso</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        Carregando projetos...
                      </TableCell>
                    </TableRow>
                  ) : filteredProjects.length > 0 ? (
                    filteredProjects.map((project) => (
                      <TableRow key={project.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{project.name}</div>
                            <div className="text-sm text-muted-foreground">{project.description}</div>
                          </div>
                        </TableCell>
                        <TableCell>{project.mainConsultantName}</TableCell>
                        <TableCell>{formatCurrency(project.totalValue)}</TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <span className="text-sm mr-2">
                              {project.completedStages}/{project.stages?.length || 0}
                            </span>
                            <div className="bg-muted h-2 w-16 rounded-full overflow-hidden">
                              <div 
                                className="bg-blue-500 h-full rounded-full"
                                style={{ width: `${project.stages?.length ? (project.completedStages / project.stages.length) * 100 : 0}%` }}
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
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" onClick={() => handleViewProject(project)} title="Visualizar detalhes">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleEditProject(project)} title="Editar">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDeleteProject(project.id)} title="Excluir">
                            <Trash className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
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
