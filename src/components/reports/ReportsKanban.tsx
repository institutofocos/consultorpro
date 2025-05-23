
import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Users, Filter } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';

export default function ReportsKanban() {
  const [projects, setProjects] = useState<any[]>([]);
  const [consultants, setConsultants] = useState<any[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [projectsByStatus, setProjectsByStatus] = useState<Record<string, any[]>>({
    planned: [],
    in_progress: [],
    completed: [],
    cancelled: [],
  });

  // Filter states
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedConsultant, setSelectedConsultant] = useState<string | null>(null);
  const [timePeriod, setTimePeriod] = useState<string>("all");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: projectsData, error: projectsError } = await supabase
          .from('projects')
          .select(`
            id, name, description, status, start_date, end_date,
            main_consultant_id, support_consultant_id, stages,
            clients:client_id (id, name),
            main_consultant:main_consultant_id (id, name),
            support_consultant:support_consultant_id (id, name)
          `);
        
        if (projectsError) throw projectsError;
        
        // Process projects to determine real status based on stages completion
        const processedProjects = projectsData?.map(project => {
          let computedStatus = project.status;
          
          // If project has stages, compute status based on stage completion
          if (project.stages && Array.isArray(project.stages)) {
            const completedStages = project.stages.filter((stage: any) => stage.completed).length;
            const totalStages = project.stages.length;
            
            if (totalStages > 0) {
              if (completedStages === 0) {
                computedStatus = 'planned';
              } else if (completedStages < totalStages) {
                computedStatus = 'in_progress';
              } else if (completedStages === totalStages) {
                computedStatus = 'completed';
              }
            }
          }
          
          return {
            ...project,
            computedStatus
          };
        }) || [];
        
        const { data: consultantsData, error: consultantsError } = await supabase
          .from('consultants')
          .select('id, name');
        
        if (consultantsError) throw consultantsError;
        
        setProjects(processedProjects);
        setFilteredProjects(processedProjects);
        setConsultants(consultantsData || []);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  useEffect(() => {
    if (filteredProjects.length > 0) {
      const grouped = {
        planned: filteredProjects.filter(p => p.computedStatus === 'planned'),
        in_progress: filteredProjects.filter(p => p.computedStatus === 'in_progress'),
        completed: filteredProjects.filter(p => p.computedStatus === 'completed'),
        cancelled: filteredProjects.filter(p => p.computedStatus === 'cancelled' || p.status === 'cancelled'),
      };
      setProjectsByStatus(grouped);
    }
  }, [filteredProjects]);

  useEffect(() => {
    applyFilters();
  }, [selectedDate, selectedConsultant, timePeriod, projects]);

  const applyFilters = () => {
    let filtered = [...projects];
    
    // Filter by consultant
    if (selectedConsultant) {
      filtered = filtered.filter(project =>
        project.main_consultant_id === selectedConsultant ||
        project.support_consultant_id === selectedConsultant
      );
    }
    
    // Apply date filters
    if (timePeriod !== 'all') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (timePeriod === 'today') {
        filtered = filtered.filter(project => {
          const startDate = new Date(project.start_date);
          const endDate = new Date(project.end_date);
          return (startDate <= today && today <= endDate);
        });
      } else if (timePeriod === 'week') {
        // Get start and end of current week (Sunday to Saturday)
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay());
        const weekEnd = new Date(today);
        weekEnd.setDate(weekStart.getDate() + 6);
        
        filtered = filtered.filter(project => {
          const startDate = new Date(project.start_date);
          const endDate = new Date(project.end_date);
          return (startDate <= weekEnd && endDate >= weekStart);
        });
      } else if (timePeriod === 'month') {
        // Get start and end of current month
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        
        filtered = filtered.filter(project => {
          const startDate = new Date(project.start_date);
          const endDate = new Date(project.end_date);
          return (startDate <= monthEnd && endDate >= monthStart);
        });
      }
    }
    
    setFilteredProjects(filtered);
  };
  
  const resetFilters = () => {
    setSelectedDate(new Date());
    setSelectedConsultant(null);
    setTimePeriod("all");
  };
  
  const getStatusText = (status: string) => {
    const statusMap: Record<string, string> = {
      planned: 'Planejado',
      in_progress: 'Em Progresso',
      completed: 'Concluído',
      cancelled: 'Cancelado'
    };
    return statusMap[status] || status;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'planned': return 'bg-blue-100 border-blue-300';
      case 'in_progress': return 'bg-yellow-100 border-yellow-300';
      case 'completed': return 'bg-green-100 border-green-300';
      case 'cancelled': return 'bg-red-100 border-red-300';
      default: return 'bg-gray-100 border-gray-300';
    }
  };

  const getStageCompletionText = (project: any) => {
    if (!project.stages || !Array.isArray(project.stages)) {
      return 'Sem etapas';
    }
    
    const completedStages = project.stages.filter((stage: any) => stage.completed).length;
    const totalStages = project.stages.length;
    
    return `${completedStages}/${totalStages} etapas`;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Relatórios - Kanban</h1>
          <p className="text-muted-foreground">Visualize os projetos em formato de kanban</p>
        </div>
        
        <div className="flex flex-wrap gap-2 items-center">
          {/* Date selection */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                <CalendarIcon className="h-4 w-4" />
                {selectedDate ? format(selectedDate, 'dd/MM/yyyy', { locale: pt }) : 'Selecionar data'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <div className="p-2">
                {/* Add date picker ui here */}
              </div>
            </PopoverContent>
          </Popover>
          
          {/* Time period filter */}
          <Select value={timePeriod} onValueChange={setTimePeriod}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="today">Hoje</SelectItem>
              <SelectItem value="week">Esta Semana</SelectItem>
              <SelectItem value="month">Este Mês</SelectItem>
            </SelectContent>
          </Select>
          
          {/* Consultant filter */}
          <Select value={selectedConsultant || ''} onValueChange={setSelectedConsultant}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Consultor" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todos os Consultores</SelectItem>
              {consultants.map(consultant => (
                <SelectItem key={consultant.id} value={consultant.id}>
                  {consultant.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {/* Reset filters */}
          <Button variant="ghost" onClick={resetFilters}>
            Limpar Filtros
          </Button>
        </div>
      </div>

      {loading ? (
        <Card className="shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center justify-center h-40">
              <p>Carregando projetos...</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Object.entries(projectsByStatus).map(([status, statusProjects]) => (
            <div key={status} className="flex flex-col h-full">
              <div className={`p-4 rounded-t-lg ${getStatusColor(status)} border-b`}>
                <h3 className="font-medium">{getStatusText(status)}</h3>
                <div className="text-xs text-muted-foreground">{statusProjects.length} projetos</div>
              </div>
              <div className="bg-muted/30 rounded-b-lg flex-1 p-2 min-h-[400px] overflow-auto">
                {statusProjects.length === 0 ? (
                  <div className="flex items-center justify-center h-20 text-sm text-muted-foreground">
                    Nenhum projeto
                  </div>
                ) : (
                  <div className="space-y-2">
                    {statusProjects.map((project) => (
                      <Card key={project.id} className="shadow-sm overflow-hidden">
                        <CardContent className="p-3">
                          <div className="font-medium mb-2">{project.name}</div>
                          <div className="text-xs text-muted-foreground mb-2">
                            {project.clients?.name}
                          </div>
                          <div className="flex flex-col gap-1">
                            <div className="text-xs flex justify-between">
                              <span>Data:</span>
                              <span>
                                {format(new Date(project.start_date), 'dd/MM', { locale: pt })} - {format(new Date(project.end_date), 'dd/MM', { locale: pt })}
                              </span>
                            </div>
                            <div className="text-xs flex justify-between">
                              <span>Consultor:</span>
                              <span>{project.main_consultant?.name}</span>
                            </div>
                            {project.support_consultant && (
                              <div className="text-xs flex justify-between">
                                <span>Apoio:</span>
                                <span>{project.support_consultant?.name}</span>
                              </div>
                            )}
                            <div className="text-xs flex justify-between">
                              <span>Progresso:</span>
                              <span>{getStageCompletionText(project)}</span>
                            </div>
                            <div className="mt-2">
                              <div className="text-xs font-medium mb-1">Etapas:</div>
                              <div className="space-y-1">
                                {project.stages && Array.isArray(project.stages) ? (
                                  project.stages.map((stage: any, idx: number) => (
                                    <div 
                                      key={idx} 
                                      className={`text-xs p-1 rounded flex justify-between ${
                                        stage.completed ? 'bg-green-50 text-green-700' : 'bg-gray-50'
                                      }`}
                                    >
                                      <span>{stage.name}</span>
                                      <span>{stage.completed ? 'Concluída' : 'Pendente'}</span>
                                    </div>
                                  ))
                                ) : (
                                  <div className="text-xs text-muted-foreground">Sem etapas</div>
                                )}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
