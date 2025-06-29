
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import GanttView from '../calendar/GanttView';
import { useProjectStatuses } from '@/hooks/useProjectStatuses';
import { isAfter, isBefore } from 'date-fns';

interface Task {
  id: string;
  name: string;
  description: string;
  start_date: string;
  end_date: string;
  status: string;
  value: number;
  valor_de_repasse: number;
  hours: number;
  days: number;
  project_id: string;
  consultant_id: string;
  consultant_name: string;
  project_name: string;
  service_name: string;
  completed?: boolean;
}

interface Consultant {
  id: string;
  name: string;
}

const ReportsGantt: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [consultants, setConsultants] = useState<Consultant[]>([]);
  const [selectedConsultantId, setSelectedConsultantId] = useState<string>('all');
  const [overdueProjects, setOverdueProjects] = useState(0);
  const [overdueStages, setOverdueStages] = useState(0);
  const [loading, setLoading] = useState(true);

  const { statuses } = useProjectStatuses();

  // Calculate overdue counts using the same logic as Dashboard
  const calculateOverdueCounts = (allTasks: Task[]) => {
    console.log('=== CALCULANDO CONTADORES DE ATRASO NO REPORTS GANTT ===');
    console.log('Total de tasks recebidas:', allTasks.length);
    console.log('Status configurados:', statuses.length);
    
    // Get projects data for overdue project calculation
    const projectsMap = new Map();
    const overdueProjectIds = new Set<string>();
    let overdueStagesCount = 0;
    
    // Determine completion statuses from configured statuses
    const completionStatuses = statuses
      .filter(s => s.is_completion_status)
      .map(s => s.name);
    
    // If no completion statuses configured, use fallback
    const finalCompletionStatuses = completionStatuses.length > 0 
      ? completionStatuses 
      : ['concluido', 'completed', 'finalizados'];
    
    console.log('Status de conclusão finais:', finalCompletionStatuses);
    
    // Group tasks by project
    allTasks.forEach(task => {
      if (!projectsMap.has(task.project_id)) {
        projectsMap.set(task.project_id, {
          id: task.project_id,
          name: task.project_name,
          tasks: []
        });
      }
      projectsMap.get(task.project_id).tasks.push(task);
    });
    
    console.log('Projetos agrupados:', projectsMap.size);
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Check each project and its stages
    projectsMap.forEach((project) => {
      let projectHasOverdueStages = false;
      
      project.tasks.forEach((task: Task) => {
        // Check if this stage/task is overdue
        const taskEndDate = new Date(task.end_date);
        taskEndDate.setHours(0, 0, 0, 0);
        
        const isNotCompleted = !finalCompletionStatuses.includes(task.status) && 
                              task.status !== 'cancelado' && 
                              task.status !== 'cancelled';
        
        const stageNotCompleted = task.completed !== undefined ? !task.completed : true;
        
        if (isBefore(taskEndDate, today) && isNotCompleted && stageNotCompleted) {
          overdueStagesCount++;
          projectHasOverdueStages = true;
          console.log('Etapa em atraso encontrada:', {
            taskName: task.name,
            endDate: task.end_date,
            status: task.status,
            completed: task.completed,
            projectName: task.project_name,
            isNotCompleted,
            stageNotCompleted,
            taskEndDate: taskEndDate.toISOString(),
            today: today.toISOString()
          });
        }
      });
      
      // If project has overdue stages, add it to overdue projects
      if (projectHasOverdueStages) {
        overdueProjectIds.add(project.id);
        console.log('Projeto em atraso:', project.name);
      }
    });
    
    const overdueProjectsCount = overdueProjectIds.size;
    
    console.log('=== RESULTADOS FINAIS REPORTS GANTT ===');
    console.log('Projetos em atraso:', overdueProjectsCount);
    console.log('Etapas em atraso:', overdueStagesCount);
    console.log('================================');
    
    return { overdueProjects: overdueProjectsCount, overdueStages: overdueStagesCount };
  };

  useEffect(() => {
    const fetchGanttData = async () => {
      try {
        setLoading(true);
        console.log('=== INICIANDO BUSCA DE DADOS GANTT ===');
        
        // Fetch consultants
        const { data: consultantsData } = await supabase
          .from('consultants')
          .select('id, name')
          .order('name');
        
        if (consultantsData) {
          setConsultants(consultantsData);
          console.log('Consultores carregados:', consultantsData.length);
        }

        // Fetch projects and stages
        const { data: projectsData } = await supabase
          .from('projects')
          .select(`
            id,
            name,
            service_id,
            services(name),
            project_stages(
              id,
              name,
              description,
              start_date,
              end_date,
              status,
              value,
              valor_de_repasse,
              hours,
              days,
              consultant_id,
              completed,
              consultants(name)
            )
          `)
          .order('name');

        console.log('Projetos carregados:', projectsData?.length || 0);

        if (projectsData) {
          const allTasks: Task[] = [];
          
          projectsData.forEach(project => {
            if (project.project_stages && project.project_stages.length > 0) {
              project.project_stages.forEach(stage => {
                if (stage.start_date && stage.end_date) {
                  allTasks.push({
                    id: stage.id,
                    name: stage.name,
                    description: stage.description || '',
                    start_date: stage.start_date,
                    end_date: stage.end_date,
                    status: stage.status || 'iniciar_projeto',
                    value: Number(stage.value) || 0,
                    valor_de_repasse: Number(stage.valor_de_repasse) || 0,
                    hours: stage.hours || 0,
                    days: stage.days || 0,
                    project_id: project.id,
                    consultant_id: stage.consultant_id || '',
                    consultant_name: stage.consultants?.name || 'Não atribuído',
                    project_name: project.name,
                    service_name: project.services?.name || 'Sem serviço',
                    completed: stage.completed
                  });
                }
              });
            }
          });

          console.log('Total de tasks criadas:', allTasks.length);
          setTasks(allTasks);
          
          // Calculate overdue counts
          const { overdueProjects: overdueProjectsCount, overdueStages: overdueStagesCount } = calculateOverdueCounts(allTasks);
          
          console.log('Definindo contadores finais:', {
            overdueProjects: overdueProjectsCount,
            overdueStages: overdueStagesCount
          });
          
          setOverdueProjects(overdueProjectsCount);
          setOverdueStages(overdueStagesCount);
        }

      } catch (error) {
        console.error('Error fetching Gantt data:', error);
        toast.error('Erro ao carregar dados do Gantt');
      } finally {
        setLoading(false);
      }
    };

    // Only fetch data when statuses are loaded
    if (statuses.length >= 0) { // Changed from > 0 to >= 0 to handle empty status arrays
      console.log('Status carregados, iniciando busca de dados...');
      fetchGanttData();
    } else {
      console.log('Aguardando carregamento de status...');
    }
  }, [statuses]);

  // Debug effect to monitor state changes
  useEffect(() => {
    console.log('=== MUDANÇA DE ESTADO ===');
    console.log('Projetos em atraso (state):', overdueProjects);
    console.log('Etapas em atraso (state):', overdueStages);
    console.log('Loading:', loading);
    console.log('Tasks:', tasks.length);
  }, [overdueProjects, overdueStages, loading, tasks.length]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Gráfico de Gantt
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p>Carregando dados...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Consultant Filter */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium">Filtrar por consultor:</label>
            <Select value={selectedConsultantId} onValueChange={setSelectedConsultantId}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Selecione um consultor" />
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
        </CardContent>
      </Card>

      {/* Debug Info - TEMPORÁRIO */}
      <Card className="border-yellow-200 bg-yellow-50">
        <CardContent className="p-4">
          <div className="text-sm text-yellow-800">
            <p><strong>Debug Info:</strong></p>
            <p>Projetos em atraso: {overdueProjects}</p>
            <p>Etapas em atraso: {overdueStages}</p>
            <p>Total de tasks: {tasks.length}</p>
            <p>Status configurados: {statuses.length}</p>
          </div>
        </CardContent>
      </Card>

      {/* Gantt Chart */}
      <GanttView 
        tasks={tasks} 
        selectedConsultantId={selectedConsultantId}
        overdueProjects={overdueProjects}
        overdueStages={overdueStages}
      />
    </div>
  );
};

export default ReportsGantt;
