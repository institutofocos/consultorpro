
import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ChartGantt } from 'lucide-react';
import { addDays, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from "@/integrations/supabase/client";

export default function ReportsGantt() {
  const [projects, setProjects] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    fetchProjects();
  }, []);
  
  const fetchProjects = async () => {
    setIsLoading(true);
    try {
      // Buscar projetos
      const { data: projectsData, error: projectsError } = await supabase
        .from('projects')
        .select(`
          id, name, description, start_date, end_date, status,
          main_consultant:main_consultant_id(name)
        `);
      
      if (projectsError) throw projectsError;

      // Buscar etapas para calcular progresso
      const { data: stagesData, error: stagesError } = await supabase
        .from('project_stages')
        .select('project_id, completed');

      if (stagesError) throw stagesError;
      
      const formattedProjects = projectsData?.map(project => {
        // Count completed stages
        const projectStages = stagesData?.filter(stage => stage.project_id === project.id) || [];
        const totalStages = projectStages.length;
        const completedStages = projectStages.filter(stage => stage.completed).length;
        
        // Determine color based on status
        let color = 'bg-slate-500'; // Default
        if (project.status === 'active') color = 'bg-green-500';
        if (project.status === 'completed') color = 'bg-blue-500';
        if (project.status === 'cancelled') color = 'bg-red-500';
        if (project.status === 'planned') color = 'bg-amber-500';
        
        return {
          id: project.id,
          name: project.name,
          start: new Date(project.start_date),
          end: new Date(project.end_date),
          consultant: project.main_consultant?.name || 'N/A',
          progress: totalStages > 0 ? Math.round((completedStages / totalStages) * 100) : 0,
          color
        };
      }) || [];
      
      setProjects(formattedProjects);
    } catch (error) {
      console.error("Error fetching projects for Gantt chart:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Calcula total de dias no intervalo para visualização do Gantt
  const minDate = projects.length > 0 
    ? new Date(Math.min(...projects.map(p => p.start.getTime()))) 
    : new Date();
  const maxDate = projects.length > 0
    ? new Date(Math.max(...projects.map(p => p.end.getTime())))
    : addDays(new Date(), 30);
  const totalDays = Math.ceil((maxDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24));

  // Função para calcular a posição e tamanho das barras
  const calculateBarStyle = (project: typeof projects[0]) => {
    const startOffset = Math.ceil((project.start.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24));
    const duration = Math.ceil((project.end.getTime() - project.start.getTime()) / (1000 * 60 * 60 * 24));
    
    return {
      left: `${(startOffset / totalDays) * 100}%`,
      width: `${(duration / totalDays) * 100}%`,
    };
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold">Relatórios - Gantt</h1>
        <p className="text-muted-foreground">Visualize os projetos em formato de diagrama de Gantt</p>
      </div>
      
      <Card className="shadow-card">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xl">
            <div className="flex items-center">
              <ChartGantt className="h-5 w-5 mr-2" />
              <span>Diagrama de Gantt</span>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <p>Carregando projetos...</p>
            </div>
          ) : projects.length === 0 ? (
            <div className="flex justify-center items-center h-64">
              <p className="text-muted-foreground">Nenhum projeto encontrado</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <div className="min-w-[700px]">
                <div className="grid grid-cols-[200px_1fr] mb-2">
                  <div className="font-medium">Projeto</div>
                  <div className="font-medium pl-2">Cronograma</div>
                </div>
                
                {projects.map(project => (
                  <div key={project.id} className="grid grid-cols-[200px_1fr] py-3 border-t">
                    <div>
                      <p className="font-medium">{project.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(project.start, 'P', {locale: ptBR})} - {format(project.end, 'P', {locale: ptBR})}
                      </p>
                      <p className="text-xs text-muted-foreground">Consultor: {project.consultant || 'N/A'}</p>
                    </div>
                    
                    <div className="relative h-8">
                      {/* Barra de fundo */}
                      <div className="absolute inset-y-0 bg-muted rounded-full" style={calculateBarStyle(project)}></div>
                      
                      {/* Barra de progresso */}
                      <div 
                        className={`absolute inset-y-0 ${project.color} rounded-full`} 
                        style={{
                          ...calculateBarStyle(project),
                          width: `calc(${calculateBarStyle(project).width} * ${project.progress / 100})`
                        }}
                      ></div>
                      
                      {/* Porcentagem de conclusão */}
                      <div 
                        className="absolute inset-y-0 flex items-center justify-center text-xs font-medium text-white"
                        style={calculateBarStyle(project)}
                      >
                        {project.progress}%
                      </div>
                    </div>
                  </div>
                ))}
                
                {/* Linha do tempo atual */}
                <div 
                  className="absolute top-0 bottom-0 w-px bg-red-500 z-10" 
                  style={{
                    left: `calc(${(Math.ceil((new Date().getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24)) / totalDays) * 100}% + 200px)`
                  }}
                ></div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
