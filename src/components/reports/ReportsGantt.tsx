
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarDays, User, Clock, Plus, RefreshCw } from 'lucide-react';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format, differenceInDays, parseISO, startOfWeek, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface GanttTask {
  id: string;
  project_id: string;
  task_name: string;
  task_description?: string;
  start_date: string;
  end_date: string;
  duration_days: number;
  progress_percentage: number;
  status: 'not_started' | 'in_progress' | 'completed' | 'on_hold';
  priority: 'low' | 'medium' | 'high';
  assigned_consultant_id?: string;
  assigned_consultant?: {
    name: string;
  };
  project?: {
    name: string;
    client?: {
      name: string;
    };
  };
}

interface Project {
  id: string;
  name: string;
  client?: {
    name: string;
  };
}

const statusConfig = {
  not_started: { label: 'Não Iniciado', color: 'bg-gray-400', textColor: 'text-gray-100' },
  in_progress: { label: 'Em Progresso', color: 'bg-blue-500', textColor: 'text-white' },
  completed: { label: 'Concluído', color: 'bg-green-500', textColor: 'text-white' },
  on_hold: { label: 'Em Espera', color: 'bg-yellow-500', textColor: 'text-white' }
};

const priorityConfig = {
  low: { label: 'Baixa', color: 'bg-green-100 text-green-800' },
  medium: { label: 'Média', color: 'bg-yellow-100 text-yellow-800' },
  high: { label: 'Alta', color: 'bg-red-100 text-red-800' }
};

const ReportsGantt: React.FC = () => {
  const [tasks, setTasks] = useState<GanttTask[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [viewStartDate, setViewStartDate] = useState<Date>(() => startOfWeek(new Date()));
  const { toast } = useToast();

  // Generate timeline weeks (4 weeks)
  const timelineWeeks = Array.from({ length: 4 }, (_, i) => addDays(viewStartDate, i * 7));

  useEffect(() => {
    fetchData();
  }, [selectedProject]);

  const fetchData = async () => {
    try {
      setIsLoading(true);

      // Fetch projects
      const { data: projectsData } = await supabase
        .from('projects')
        .select(`
          id,
          name,
          clients (name)
        `)
        .order('name');

      setProjects(projectsData || []);

      // Fetch tasks with filters
      let query = supabase
        .from('gantt_tasks')
        .select(`
          *,
          consultants (name),
          projects (
            name,
            clients (name)
          )
        `)
        .order('start_date');

      if (selectedProject !== 'all') {
        query = query.eq('project_id', selectedProject);
      }

      const { data: tasksData, error } = await query;

      if (error) throw error;

      setTasks(tasksData || []);
    } catch (error) {
      console.error('Error fetching Gantt data:', error);
      toast({
        variant: "destructive",
        title: "Erro ao carregar dados",
        description: "Não foi possível carregar os dados do Gantt."
      });
    } finally {
      setIsLoading(false);
    }
  };

  const generateTasksFromProjects = async () => {
    try {
      setIsLoading(true);

      // Get projects that don't have Gantt tasks yet
      const { data: projectsWithoutTasks } = await supabase
        .from('projects')
        .select(`
          id,
          name,
          start_date,
          end_date,
          main_consultant_id,
          status,
          project_stages (*)
        `)
        .not('id', 'in', `(${tasks.map(t => `'${t.project_id}'`).join(',')})`);

      if (!projectsWithoutTasks || projectsWithoutTasks.length === 0) {
        toast({
          title: "Nenhum projeto novo",
          description: "Todos os projetos já possuem tarefas no Gantt."
        });
        return;
      }

      // Use the Supabase function to populate Gantt tasks
      for (const project of projectsWithoutTasks) {
        const { error } = await supabase.rpc('populate_gantt_from_project', {
          p_project_id: project.id
        });

        if (error) {
          console.error(`Error generating tasks for project ${project.name}:`, error);
        }
      }

      toast({
        title: "Tarefas geradas",
        description: `Tarefas do Gantt foram geradas para ${projectsWithoutTasks.length} projeto(s).`
      });

      await fetchData();
    } catch (error) {
      console.error('Error generating tasks:', error);
      toast({
        variant: "destructive",
        title: "Erro ao gerar tarefas",
        description: "Não foi possível gerar as tarefas automaticamente."
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getTaskPosition = (startDate: string, endDate: string) => {
    const start = parseISO(startDate);
    const end = parseISO(endDate);
    const viewEnd = addDays(viewStartDate, 28); // 4 weeks

    // Calculate position within the 4-week view
    const totalViewDays = 28;
    const daysSinceViewStart = differenceInDays(start, viewStartDate);
    const taskDuration = differenceInDays(end, start) + 1;

    // Calculate percentages for positioning
    const leftPercent = Math.max(0, (daysSinceViewStart / totalViewDays) * 100);
    const widthPercent = Math.min(100 - leftPercent, (taskDuration / totalViewDays) * 100);

    return {
      left: `${leftPercent}%`,
      width: `${Math.max(2, widthPercent)}%`, // Minimum 2% width for visibility
      visible: daysSinceViewStart < totalViewDays && daysSinceViewStart + taskDuration > 0
    };
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-8 w-8 animate-spin" />
        <span className="ml-2">Carregando dados do Gantt...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <Select value={selectedProject} onValueChange={setSelectedProject}>
            <SelectTrigger className="w-[300px]">
              <SelectValue placeholder="Selecione um projeto" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Projetos</SelectItem>
              {projects.map((project) => (
                <SelectItem key={project.id} value={project.id}>
                  {project.name} {project.client && `- ${project.client.name}`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setViewStartDate(addDays(viewStartDate, -7))}
            >
              ← Semana Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setViewStartDate(addDays(viewStartDate, 7))}
            >
              Próxima Semana →
            </Button>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchData}
            disabled={isLoading}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={generateTasksFromProjects}
            disabled={isLoading}
          >
            <Plus className="h-4 w-4 mr-2" />
            Gerar do Projeto
          </Button>
        </div>
      </div>

      {/* Gantt Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Gráfico de Gantt - {format(viewStartDate, 'dd/MM/yyyy', { locale: ptBR })} a {format(addDays(viewStartDate, 27), 'dd/MM/yyyy', { locale: ptBR })}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {tasks.length === 0 ? (
            <div className="text-center py-12">
              <CalendarDays className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium">Nenhuma tarefa encontrada</h3>
              <p className="text-muted-foreground mb-4">
                Gere tarefas automaticamente a partir dos projetos existentes.
              </p>
              <Button onClick={generateTasksFromProjects} disabled={isLoading}>
                <Plus className="h-4 w-4 mr-2" />
                Gerar Tarefas dos Projetos
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Timeline Header */}
              <div className="flex">
                <div className="w-80 flex-shrink-0"></div>
                <div className="flex-1 grid grid-cols-4 gap-1 text-sm font-medium text-muted-foreground">
                  {timelineWeeks.map((week, index) => (
                    <div key={index} className="text-center py-2 border-r border-muted">
                      Semana {format(week, 'dd/MM', { locale: ptBR })}
                    </div>
                  ))}
                </div>
              </div>

              {/* Task Rows */}
              <div className="space-y-2">
                {tasks.map((task) => {
                  const position = getTaskPosition(task.start_date, task.end_date);
                  
                  if (!position.visible) return null;

                  return (
                    <div key={task.id} className="flex items-center">
                      {/* Task Info */}
                      <div className="w-80 flex-shrink-0 pr-4">
                        <div className="space-y-1">
                          <div className="font-medium text-sm">{task.task_name}</div>
                          <div className="text-xs text-muted-foreground">
                            {task.project?.name}
                            {task.project?.client && ` - ${task.project.client.name}`}
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className={statusConfig[task.status].color}>
                              {statusConfig[task.status].label}
                            </Badge>
                            <Badge variant="outline" className={priorityConfig[task.priority].color}>
                              {priorityConfig[task.priority].label}
                            </Badge>
                            {task.assigned_consultant && (
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <User className="h-3 w-3" />
                                {task.assigned_consultant.name}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Timeline */}
                      <div className="flex-1 relative h-8 bg-muted/20 rounded">
                        <div
                          className={`absolute top-1 bottom-1 rounded ${statusConfig[task.status].color} ${statusConfig[task.status].textColor} flex items-center justify-center text-xs font-medium`}
                          style={{
                            left: position.left,
                            width: position.width
                          }}
                        >
                          <div className="flex items-center gap-1 px-2">
                            <Clock className="h-3 w-3" />
                            {task.duration_days}d
                            {task.progress_percentage > 0 && (
                              <span>({task.progress_percentage}%)</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Timeline Grid */}
              <div className="relative">
                <div className="flex">
                  <div className="w-80 flex-shrink-0"></div>
                  <div className="flex-1 grid grid-cols-4 gap-1">
                    {timelineWeeks.map((_, index) => (
                      <div key={index} className="h-4 border-r border-muted/50"></div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary Stats */}
      {tasks.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{tasks.length}</div>
              <div className="text-xs text-muted-foreground">Total de Tarefas</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-green-600">
                {tasks.filter(t => t.status === 'completed').length}
              </div>
              <div className="text-xs text-muted-foreground">Concluídas</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-blue-600">
                {tasks.filter(t => t.status === 'in_progress').length}
              </div>
              <div className="text-xs text-muted-foreground">Em Progresso</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-gray-600">
                {tasks.filter(t => t.status === 'not_started').length}
              </div>
              <div className="text-xs text-muted-foreground">Não Iniciadas</div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default ReportsGantt;
