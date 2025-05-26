import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { KanbanSquare, User, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from "@/integrations/supabase/client";
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { fetchKanbanColumns, KanbanColumn } from '@/integrations/supabase/kanban-columns';
import { syncKanbanToStages } from '@/integrations/supabase/kanban-sync';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

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
  status: string;
  endDate: Date;
  consultant?: string;
  tags?: string[];
}

export default function ReportsKanban() {
  const [projects, setProjects] = useState<KanbanProject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const queryClient = useQueryClient();
  
  // Buscar colunas do Kanban
  const { data: kanbanColumns = [] } = useQuery({
    queryKey: ['kanban-columns'],
    queryFn: fetchKanbanColumns,
  });
  
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
          id, name, description, end_date,
          main_consultant:consultants!main_consultant_id(name),
          project_stages!inner(status)
        `);
        
      if (error) throw error;
      
      // Transformar os dados para o formato do Kanban
      const formattedProjects: KanbanProject[] = (projectsData || []).map(project => {
        // Determinar o status baseado nas etapas
        const stages = project.project_stages || [];
        const completedStages = stages.filter((stage: any) => stage.completed);
        
        // Se não há etapas, usar o primeiro status
        let projectStatus = 'iniciar_projeto';
        
        if (stages.length > 0) {
          const completedCount = completedStages.length;
          const totalStages = stages.length;
          
          if (completedCount === totalStages) {
            projectStatus = 'finalizados';
          } else if (completedCount === 0) {
            projectStatus = 'iniciar_projeto';
          } else {
            // Projeto em andamento - usar uma lógica para determinar a coluna
            const progressPercentage = (completedCount / totalStages) * 100;
            
            if (progressPercentage <= 25) {
              projectStatus = 'em_producao';
            } else if (progressPercentage <= 50) {
              projectStatus = 'aguardando_assinatura';
            } else if (progressPercentage <= 75) {
              projectStatus = 'aguardando_aprovacao';
            } else {
              projectStatus = 'aguardando_pagamento';
            }
          }
        }
        
        return {
          id: project.id,
          name: project.name,
          description: project.description,
          status: projectStatus,
          endDate: new Date(project.end_date),
          consultant: project.main_consultant?.name,
          tags: []
        };
      });
      
      setProjects(formattedProjects);
    } catch (error) {
      console.error("Error fetching projects for Kanban:", error);
      toast.error("Erro ao carregar projetos");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDragEnd = async (result: any) => {
    const { destination, source, draggableId } = result;

    // Se não há destino ou o item foi solto no mesmo lugar
    if (!destination || 
        (destination.droppableId === source.droppableId && 
         destination.index === source.index)) {
      return;
    }

    const projectId = draggableId;
    const newStatus = destination.droppableId;

    try {
      // Atualizar estado local imediatamente para feedback visual
      setProjects(prevProjects => 
        prevProjects.map(project => 
          project.id === projectId 
            ? { ...project, status: newStatus }
            : project
        )
      );

      // Sincronizar com as etapas do projeto
      await syncKanbanToStages(projectId, newStatus, kanbanColumns);
      
      // Invalidar queries relacionadas para atualizar outros componentes
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      
      toast.success("Projeto movido e etapas atualizadas com sucesso!");
    } catch (error) {
      console.error("Erro ao mover projeto:", error);
      toast.error("Erro ao mover projeto");
      
      // Reverter estado local em caso de erro
      fetchProjects();
    }
  };

  // Organizar projetos por status das colunas do Kanban
  const organizeProjectsByColumns = () => {
    const columnProjects: Record<string, KanbanProject[]> = {};
    
    kanbanColumns.forEach(column => {
      columnProjects[column.column_id] = projects.filter(p => p.status === column.column_id);
    });
    
    return columnProjects;
  };

  const projectsByColumn = organizeProjectsByColumns();

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
            <DragDropContext onDragEnd={handleDragEnd}>
              <div className="flex gap-4 overflow-x-auto pb-4 h-[calc(100vh-300px)]">
                {kanbanColumns.map((column) => (
                  <KanbanColumn 
                    key={column.column_id}
                    title={column.title} 
                    color={column.bg_color}
                    count={projectsByColumn[column.column_id]?.length || 0}
                  >
                    <Droppable droppableId={column.column_id}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                          className={`min-h-[200px] transition-colors ${
                            snapshot.isDraggingOver ? 'bg-blue-50' : ''
                          }`}
                        >
                          {(projectsByColumn[column.column_id] || []).map((project, index) => (
                            <Draggable key={project.id} draggableId={project.id} index={index}>
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  className={`mb-2 ${
                                    snapshot.isDragging ? 'rotate-2 scale-105' : ''
                                  }`}
                                >
                                  <KanbanCard 
                                    title={project.name} 
                                    description={project.description?.substring(0, 100) + (project.description && project.description.length > 100 ? '...' : '')} 
                                    dueDate={project.endDate}
                                    consultant={project.consultant}
                                    tags={project.tags}
                                  />
                                </div>
                              )}
                            </Draggable>
                          ))}
                          {provided.placeholder}
                          
                          {(projectsByColumn[column.column_id]?.length || 0) === 0 && (
                            <div className="text-center py-8 text-muted-foreground text-sm">
                              Nenhum projeto nesta categoria
                            </div>
                          )}
                        </div>
                      )}
                    </Droppable>
                  </KanbanColumn>
                ))}
              </div>
            </DragDropContext>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
