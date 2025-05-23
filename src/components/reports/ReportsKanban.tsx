
import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { KanbanSquare, User, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from "@/integrations/supabase/client";

// Componentes de exemplo para o Kanban
const KanbanColumn = ({ title, children, color, count }: { title: string, children: React.ReactNode, color: string, count: number }) => (
  <div className="flex flex-col h-full min-w-[250px] bg-muted/20 rounded-lg p-2">
    <div className="flex items-center mb-2 px-2 py-1">
      <div className={`w-3 h-3 rounded-full mr-2 ${color}`} />
      <h3 className="font-medium">{title}</h3>
      <span className="ml-auto bg-muted px-2 py-0.5 rounded text-xs">{count}</span>
    </div>
    <div className="space-y-2 flex-grow overflow-auto">
      {children}
    </div>
  </div>
);

const KanbanCard = ({ 
  title, 
  description, 
  tags,
  dueDate,
  consultant
}: { 
  title: string, 
  description?: string, 
  tags?: string[],
  dueDate?: Date,
  consultant?: string
}) => (
  <Card className="bg-card border shadow-sm">
    <CardContent className="p-3">
      <h4 className="font-medium mb-1">{title}</h4>
      {description && <p className="text-sm text-muted-foreground mb-2">{description}</p>}
      
      {(consultant || dueDate) && (
        <div className="flex flex-col space-y-1 mb-2">
          {consultant && (
            <div className="flex items-center text-xs text-muted-foreground">
              <User className="h-3 w-3 mr-1" />
              <span>{consultant}</span>
            </div>
          )}
          {dueDate && (
            <div className="flex items-center text-xs text-muted-foreground">
              <Calendar className="h-3 w-3 mr-1" />
              <span>{format(dueDate, 'P', { locale: ptBR })}</span>
            </div>
          )}
        </div>
      )}
      
      {tags && tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {tags.map((tag, i) => (
            <span key={i} className="bg-primary/10 text-primary text-xs px-2 py-0.5 rounded-full">
              {tag}
            </span>
          ))}
        </div>
      )}
    </CardContent>
  </Card>
);

interface KanbanProject {
  id: string;
  name: string;
  description?: string;
  status: 'planned' | 'active' | 'completed' | 'cancelled';
  endDate: Date;
  consultant?: string;
  tags?: string[];
}

export default function ReportsKanban() {
  const [projects, setProjects] = useState<KanbanProject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    fetchProjects();
  }, []);
  
  const fetchProjects = async () => {
    setIsLoading(true);
    try {
      // Buscar projetos com consultores
      const { data: projectsData, error } = await supabase
        .from('projects')
        .select(`
          id, name, description, status, end_date,
          main_consultant:consultants!main_consultant_id(name)
        `);
        
      if (error) throw error;
      
      // Buscar tags de serviços associados aos projetos
      const { data: serviceTags } = await supabase
        .from('service_tags')
        .select(`
          tag_id,
          tags(name),
          service_id
        `);
      
      // Transformar os dados para o formato do Kanban
      const formattedProjects: KanbanProject[] = (projectsData || []).map(project => {
        return {
          id: project.id,
          name: project.name,
          description: project.description,
          status: project.status as 'planned' | 'active' | 'completed' | 'cancelled',
          endDate: new Date(project.end_date),
          consultant: project.main_consultant?.name,
          tags: [] // Será preenchido se implementarmos a integração completa com tags
        };
      });
      
      setProjects(formattedProjects);
    } catch (error) {
      console.error("Error fetching projects for Kanban:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Separar projetos por status para as colunas
  const plannedProjects = projects.filter(p => p.status === 'planned');
  const activeProjects = projects.filter(p => p.status === 'active');
  const completedProjects = projects.filter(p => p.status === 'completed');
  const cancelledProjects = projects.filter(p => p.status === 'cancelled');

  const columns = [
    { title: "Planejados", projects: plannedProjects, color: "bg-amber-500" },
    { title: "Em Andamento", projects: activeProjects, color: "bg-green-500" },
    { title: "Concluídos", projects: completedProjects, color: "bg-blue-500" },
    { title: "Cancelados", projects: cancelledProjects, color: "bg-red-500" }
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold">Relatórios - Kanban</h1>
        <p className="text-muted-foreground">Visualize os projetos em formato de kanban</p>
      </div>
      
      <Card className="shadow-card">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xl">
            <div className="flex items-center">
              <KanbanSquare className="h-5 w-5 mr-2" />
              <span>Kanban de Projetos</span>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 overflow-hidden">
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <p>Carregando projetos...</p>
            </div>
          ) : projects.length === 0 ? (
            <div className="flex justify-center items-center h-64">
              <p className="text-muted-foreground">Nenhum projeto encontrado</p>
            </div>
          ) : (
            <div className="flex gap-4 overflow-x-auto pb-4 h-[calc(100vh-300px)]">
              {columns.map((column, index) => (
                <KanbanColumn 
                  key={index} 
                  title={column.title} 
                  color={column.color}
                  count={column.projects.length}
                >
                  {column.projects.map((project) => (
                    <KanbanCard 
                      key={project.id} 
                      title={project.name} 
                      description={project.description?.substring(0, 100) + (project.description && project.description.length > 100 ? '...' : '')} 
                      dueDate={project.endDate}
                      consultant={project.consultant}
                      tags={project.tags}
                    />
                  ))}
                  
                  {column.projects.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                      Nenhum projeto nesta categoria
                    </div>
                  )}
                </KanbanColumn>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
