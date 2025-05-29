
import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, User, BarChart3, Plus, RefreshCw } from 'lucide-react';
import { format, differenceInDays, startOfWeek, endOfWeek, eachDayOfInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface GanttTask {
  id: string;
  project_id: string;
  task_name: string;
  task_description: string | null;
  start_date: string;
  end_date: string;
  duration_days: number;
  progress_percentage: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'not_started' | 'in_progress' | 'completed' | 'on_hold' | 'cancelled';
  assigned_consultant_id: string | null;
  depends_on_task_id: string | null;
  created_at: string;
  updated_at: string;
  projects?: {
    name: string;
    status: string;
  };
  consultants?: {
    name: string;
  };
}

interface Project {
  id: string;
  name: string;
  status: string;
  start_date: string;
  end_date: string;
  description: string;
  main_consultant_id: string;
}

const statusColors = {
  not_started: 'bg-gray-200 text-gray-800',
  in_progress: 'bg-blue-200 text-blue-800',
  completed: 'bg-green-200 text-green-800',
  on_hold: 'bg-yellow-200 text-yellow-800',
  cancelled: 'bg-red-200 text-red-800'
};

const priorityColors = {
  low: 'bg-blue-100 text-blue-800',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-orange-100 text-orange-800',
  critical: 'bg-red-100 text-red-800'
};

const statusLabels = {
  not_started: 'Não iniciado',
  in_progress: 'Em andamento',
  completed: 'Concluído',
  on_hold: 'Em espera',
  cancelled: 'Cancelado'
};

const priorityLabels = {
  low: 'Baixa',
  medium: 'Média',
  high: 'Alta',
  critical: 'Crítica'
};

export default function ReportsGantt() {
  const [selectedProject, setSelectedProject] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'week' | 'month'>('month');
  const { toast } = useToast();

  // Fetch projects
  const { data: projects = [] } = useQuery({
    queryKey: ['projects-gantt'],
    queryFn: async () => {
      console.log('🔍 Buscando projetos para o Gantt...');
      const { data, error } = await supabase
        .from('projects')
        .select(`
          id, 
          name, 
          status, 
          start_date, 
          end_date, 
          description, 
          main_consultant_id,
          consultants:main_consultant_id(name)
        `)
        .order('name');
      
      if (error) {
        console.error('❌ Erro ao buscar projetos:', error);
        throw error;
      }
      
      console.log('✅ Projetos encontrados:', data?.length || 0);
      console.log('📋 Dados dos projetos:', data);
      return data as Project[];
    }
  });

  // Fetch gantt tasks
  const { data: ganttTasks = [], isLoading, refetch } = useQuery({
    queryKey: ['gantt-tasks', selectedProject],
    queryFn: async () => {
      console.log('🔍 Buscando tarefas do Gantt para projeto:', selectedProject);
      let query = supabase
        .from('gantt_tasks')
        .select(`
          *,
          projects:project_id (name, status),
          consultants:assigned_consultant_id (name)
        `)
        .order('start_date');

      if (selectedProject !== 'all') {
        query = query.eq('project_id', selectedProject);
      }

      const { data, error } = await query;
      
      if (error) {
        console.error('❌ Erro ao buscar tarefas do Gantt:', error);
        throw error;
      }
      
      console.log('✅ Tarefas do Gantt encontradas:', data?.length || 0);
      console.log('📋 Dados das tarefas:', data);
      return data as GanttTask[];
    }
  });

  // Auto-populate gantt when component mounts and there are projects but no tasks
  useEffect(() => {
    if (projects.length > 0 && ganttTasks.length === 0) {
      console.log('🔄 Auto-populando Gantt com todos os projetos...');
      populateAllProjects();
    }
  }, [projects, ganttTasks]);

  const populateAllProjects = async () => {
    try {
      console.log('🚀 Iniciando população completa do Gantt...');
      
      // Clear existing tasks first
      console.log('🗑️ Limpando tarefas existentes...');
      const { error: deleteError } = await supabase
        .from('gantt_tasks')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');

      if (deleteError) {
        console.error('❌ Erro ao limpar tarefas existentes:', deleteError);
        throw deleteError;
      }

      console.log('✅ Tarefas existentes removidas');

      // Populate with all projects
      let successCount = 0;
      for (const project of projects) {
        try {
          console.log(`📂 Processando projeto: ${project.name} (${project.id})`);
          await populateGanttFromProject(project.id, false);
          successCount++;
          console.log(`✅ Projeto ${project.name} processado com sucesso`);
        } catch (error) {
          console.error(`❌ Erro ao processar projeto ${project.name}:`, error);
        }
      }

      console.log(`🎉 População concluída: ${successCount} de ${projects.length} projetos`);

      toast({
        title: "Sucesso",
        description: `Gantt populado com ${successCount} projetos`
      });
      
      refetch();
    } catch (error) {
      console.error('❌ Erro na população completa:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao popular dados do Gantt"
      });
    }
  };

  const populateGanttFromProject = async (projectId: string, showToast = true) => {
    try {
      console.log(`🔄 Populando Gantt para projeto: ${projectId}`);
      
      // Fetch project data with main consultant
      const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .select(`
          *,
          main_consultant:consultants!main_consultant_id(id, name),
          support_consultant:consultants!support_consultant_id(id, name)
        `)
        .eq('id', projectId)
        .single();

      if (projectError) {
        console.error('❌ Erro ao buscar dados do projeto:', projectError);
        throw projectError;
      }

      if (!projectData) {
        console.log('⚠️ Projeto não encontrado');
        if (showToast) {
          toast({
            variant: "destructive",
            title: "Erro",
            description: "Projeto não encontrado"
          });
        }
        return;
      }

      console.log('📊 Dados do projeto:', projectData);

      // Mapear status do projeto para status do Gantt
      const mapProjectStatus = (status: string) => {
        const statusMap: Record<string, 'not_started' | 'in_progress' | 'completed' | 'on_hold' | 'cancelled'> = {
          'em_planejamento': 'not_started',
          'planned': 'not_started',
          'em_producao': 'in_progress',
          'active': 'in_progress',
          'concluido': 'completed',
          'completed': 'completed',
          'cancelado': 'cancelled',
          'cancelled': 'cancelled',
          'pausado': 'on_hold'
        };
        return statusMap[status] || 'not_started';
      };

      // Insert main project task
      const mainTaskData = {
        project_id: projectId,
        task_name: `📋 ${projectData.name}`,
        task_description: projectData.description || 'Projeto principal',
        start_date: projectData.start_date,
        end_date: projectData.end_date,
        duration_days: differenceInDays(new Date(projectData.end_date), new Date(projectData.start_date)) + 1,
        assigned_consultant_id: projectData.main_consultant_id,
        status: mapProjectStatus(projectData.status),
        priority: 'high' as const,
        progress_percentage: projectData.status === 'concluido' || projectData.status === 'completed' ? 100 : 0
      };

      console.log('📝 Inserindo tarefa principal:', mainTaskData);

      const { error: insertError } = await supabase
        .from('gantt_tasks')
        .insert(mainTaskData);

      if (insertError) {
        console.error('❌ Erro ao inserir tarefa principal:', insertError);
        throw insertError;
      }

      console.log('✅ Tarefa principal inserida com sucesso');

      // Fetch and insert project stages
      const { data: stages, error: stagesError } = await supabase
        .from('project_stages')
        .select(`
          *,
          consultant:consultants!consultant_id(id, name)
        `)
        .eq('project_id', projectId)
        .order('stage_order');

      if (stagesError) {
        console.error('❌ Erro ao buscar etapas:', stagesError);
      } else if (stages && stages.length > 0) {
        console.log(`📋 Encontradas ${stages.length} etapas para o projeto`);
        
        for (const stage of stages) {
          console.log(`📌 Processando etapa: ${stage.name}`);
          
          // Mapear status da etapa para status do Gantt
          const mapStageStatus = (stageStatus: string, completed: boolean) => {
            if (completed) return 'completed';
            
            const statusMap: Record<string, 'not_started' | 'in_progress' | 'completed' | 'on_hold' | 'cancelled'> = {
              'iniciar_projeto': 'not_started',
              'em_producao': 'in_progress',
              'aguardando_aprovacao': 'on_hold',
              'aguardando_assinatura': 'on_hold',
              'concluido': 'completed',
              'cancelado': 'cancelled'
            };
            return statusMap[stageStatus] || 'not_started';
          };

          const stageTaskData = {
            project_id: projectId,
            task_name: `📝 ${stage.name}`,
            task_description: stage.description || '',
            start_date: stage.start_date || projectData.start_date,
            end_date: stage.end_date || projectData.end_date,
            duration_days: stage.days || 1,
            progress_percentage: stage.completed ? 100 : 0,
            assigned_consultant_id: stage.consultant_id || projectData.main_consultant_id,
            status: mapStageStatus(stage.status, stage.completed),
            priority: 'medium' as const
          };

          console.log('📝 Inserindo etapa:', stageTaskData);

          const { error: stageInsertError } = await supabase
            .from('gantt_tasks')
            .insert(stageTaskData);

          if (stageInsertError) {
            console.error(`❌ Erro ao inserir etapa ${stage.name}:`, stageInsertError);
          } else {
            console.log(`✅ Etapa ${stage.name} inserida com sucesso`);
          }
        }
      } else {
        console.log('⚠️ Nenhuma etapa encontrada para este projeto');
      }

      if (showToast) {
        toast({
          title: "Sucesso",
          description: `Projeto "${projectData.name}" adicionado ao Gantt`
        });
        refetch();
      }
    } catch (error) {
      console.error('❌ Erro na função populateGanttFromProject:', error);
      if (showToast) {
        toast({
          variant: "destructive",
          title: "Erro",
          description: "Erro ao popular dados do Gantt"
        });
      }
    }
  };

  const getTimelineData = () => {
    if (ganttTasks.length === 0) return { days: [], startDate: new Date(), endDate: new Date() };

    const startDate = new Date(Math.min(...ganttTasks.map(task => new Date(task.start_date).getTime())));
    const endDate = new Date(Math.max(...ganttTasks.map(task => new Date(task.end_date).getTime())));

    const timelineStart = viewMode === 'week' ? startOfWeek(startDate) : startDate;
    const timelineEnd = viewMode === 'week' ? endOfWeek(endDate) : endDate;

    const days = eachDayOfInterval({ start: timelineStart, end: timelineEnd });

    return { days, startDate: timelineStart, endDate: timelineEnd };
  };

  const { days, startDate: timelineStart, endDate: timelineEnd } = getTimelineData();

  const getTaskPosition = (task: GanttTask) => {
    const taskStart = new Date(task.start_date);
    const taskEnd = new Date(task.end_date);
    
    const totalDays = differenceInDays(timelineEnd, timelineStart) + 1;
    const startOffset = differenceInDays(taskStart, timelineStart);
    const duration = differenceInDays(taskEnd, taskStart) + 1;
    
    const left = Math.max(0, (startOffset / totalDays) * 100);
    const width = Math.min(100 - left, (duration / totalDays) * 100);
    
    return { left: `${left}%`, width: `${width}%` };
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <BarChart3 className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <p className="text-gray-500">Carregando dados do Gantt...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Gráfico de Gantt</h2>
          <p className="text-muted-foreground">
            Visualização cronológica dos projetos e suas tarefas
          </p>
        </div>
        
        <div className="flex gap-2 flex-wrap">
          <Select value={selectedProject} onValueChange={setSelectedProject}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Selecionar projeto" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os projetos</SelectItem>
              {projects.map((project) => (
                <SelectItem key={project.id} value={project.id}>
                  {project.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={viewMode} onValueChange={(value: 'week' | 'month') => setViewMode(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Semana</SelectItem>
              <SelectItem value="month">Mês</SelectItem>
            </SelectContent>
          </Select>

          <Button
            onClick={populateAllProjects}
            variant="outline"
            size="sm"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Atualizar Gantt
          </Button>

          {selectedProject !== 'all' && (
            <Button
              onClick={() => populateGanttFromProject(selectedProject)}
              variant="outline"
              size="sm"
            >
              <Plus className="w-4 h-4 mr-2" />
              Popular Projeto
            </Button>
          )}
        </div>
      </div>

      {ganttTasks.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-64">
            <BarChart3 className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Nenhuma tarefa encontrada
            </h3>
            <p className="text-gray-500 text-center mb-4">
              {projects.length === 0 
                ? 'Nenhum projeto cadastrado. Crie alguns projetos primeiro.'
                : 'Clique em "Atualizar Gantt" para popular com todos os projetos ou selecione um projeto específico.'}
            </p>
            {projects.length > 0 && (
              <Button onClick={populateAllProjects}>
                <Plus className="w-4 h-4 mr-2" />
                Popular Gantt com Todos os Projetos
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Cronograma de Tarefas
            </CardTitle>
            <CardDescription>
              {ganttTasks.length} tarefa(s) encontrada(s)
              {selectedProject !== 'all' && projects.find(p => p.id === selectedProject) && 
                ` para o projeto "${projects.find(p => p.id === selectedProject)?.name}"`
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              {/* Timeline Header */}
              <div className="min-w-[800px]">
                <div className="flex border-b">
                  <div className="w-80 p-3 border-r bg-gray-50 font-medium">
                    Tarefa
                  </div>
                  <div className="flex-1 relative">
                    <div className="flex">
                      {days.map((day, index) => (
                        <div 
                          key={index}
                          className="flex-1 p-2 text-xs text-center border-r border-gray-200 bg-gray-50"
                          style={{ minWidth: '40px' }}
                        >
                          {format(day, viewMode === 'week' ? 'dd/MM' : 'dd', { locale: ptBR })}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Tasks */}
                {ganttTasks.map((task) => {
                  const position = getTaskPosition(task);
                  
                  return (
                    <div key={task.id} className="flex border-b hover:bg-gray-50">
                      <div className="w-80 p-3 border-r">
                        <div className="space-y-2">
                          <div className="font-medium text-sm truncate" title={task.task_name}>
                            {task.task_name}
                          </div>
                          
                          <div className="flex flex-wrap gap-1">
                            <Badge 
                              variant="secondary" 
                              className={cn("text-xs", statusColors[task.status])}
                            >
                              {statusLabels[task.status]}
                            </Badge>
                            <Badge 
                              variant="outline" 
                              className={cn("text-xs", priorityColors[task.priority])}
                            >
                              {priorityLabels[task.priority]}
                            </Badge>
                          </div>

                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <Calendar className="w-3 h-3" />
                            {format(new Date(task.start_date), 'dd/MM', { locale: ptBR })} - 
                            {format(new Date(task.end_date), 'dd/MM', { locale: ptBR })}
                          </div>

                          {task.consultants && (
                            <div className="flex items-center gap-1 text-xs text-gray-500">
                              <User className="w-3 h-3" />
                              <span className="truncate">{task.consultants.name}</span>
                            </div>
                          )}

                          {task.progress_percentage > 0 && (
                            <div className="flex items-center gap-1 text-xs text-gray-500">
                              <div className="w-12 h-1 bg-gray-200 rounded">
                                <div 
                                  className="h-1 bg-blue-500 rounded"
                                  style={{ width: `${task.progress_percentage}%` }}
                                />
                              </div>
                              <span>{task.progress_percentage}%</span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex-1 relative p-2" style={{ minHeight: '80px' }}>
                        <div 
                          className={cn(
                            "absolute top-1/2 transform -translate-y-1/2 h-6 rounded",
                            "flex items-center justify-center text-xs font-medium",
                            task.status === 'completed' ? 'bg-green-500 text-white' :
                            task.status === 'in_progress' ? 'bg-blue-500 text-white' :
                            task.status === 'on_hold' ? 'bg-yellow-500 text-white' :
                            task.status === 'cancelled' ? 'bg-red-500 text-white' :
                            'bg-gray-400 text-white'
                          )}
                          style={{
                            left: position.left,
                            width: position.width,
                            minWidth: '60px'
                          }}
                          title={`${task.task_name} (${task.duration_days} dias)`}
                        >
                          <Clock className="w-3 h-3 mr-1" />
                          {task.duration_days}d
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
