
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

  // Calculate overdue counts using the EXACT same logic as Dashboard
  const calculateOverdueCounts = (allTasks: Task[], projectsData: any[]) => {
    console.log('=== CALCULANDO CONTADORES DE ATRASO NO REPORTS GANTT ===');
    console.log('Total de tasks recebidas:', allTasks.length);
    console.log('Total de projetos recebidos:', projectsData.length);
    console.log('Status configurados:', statuses.length);
    
    // Determinar status de conclusão usando EXATAMENTE a mesma lógica do Dashboard
    const completionStatuses = statuses
      .filter(s => s.is_completion_status)
      .map(s => s.name);
    
    // Se não há status de conclusão configurados, usar 'concluido' como fallback - IGUAL AO DASHBOARD
    const finalCompletionStatuses = completionStatuses.length > 0 
      ? completionStatuses 
      : ['concluido', 'completed', 'finalizados'];
    
    console.log('Status de conclusão finais (GANTT):', finalCompletionStatuses);
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // PROJETOS ATRASADOS - USAR EXATAMENTE A MESMA LÓGICA DO DASHBOARD
    const overdueProjectsList = projectsData.filter(project => 
      project.endDate && 
      !finalCompletionStatuses.includes(project.status) &&
      isBefore(new Date(project.endDate), today)
    );
    
    const overdueProjectsCount = overdueProjectsList.length;
    
    console.log('Projetos atrasados (usando lógica do Dashboard):', overdueProjectsCount);
    overdueProjectsList.forEach(project => {
      console.log('Projeto atrasado:', {
        name: project.name,
        endDate: project.endDate,
        status: project.status,
        isNotCompleted: !finalCompletionStatuses.includes(project.status)
      });
    });
    
    // ETAPAS ATRASADAS - USAR EXATAMENTE A MESMA LÓGICA DO DASHBOARD
    let overdueStagesCount = 0;
    
    allTasks.forEach(task => {
      const taskEndDate = new Date(task.end_date);
      taskEndDate.setHours(0, 0, 0, 0);
      
      const isNotCompleted = !finalCompletionStatuses.includes(task.status) && 
                            task.status !== 'cancelado' && 
                            task.status !== 'cancelled';
      
      const stageNotCompleted = task.completed !== undefined ? !task.completed : true;
      
      if (isBefore(taskEndDate, today) && isNotCompleted && stageNotCompleted) {
        overdueStagesCount++;
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
    
    console.log('=== RESULTADOS FINAIS REPORTS GANTT (SINCRONIZADO COM DASHBOARD) ===');
    console.log('Projetos em atraso:', overdueProjectsCount);
    console.log('Etapas em atraso:', overdueStagesCount);
    console.log('================================');
    
    return { overdueProjects: overdueProjectsCount, overdueStages: overdueStagesCount };
  };

  useEffect(() => {
    const fetchGanttData = async () => {
      try {
        setLoading(true);
        console.log('=== INICIANDO BUSCA DE DADOS GANTT (SINCRONIZADO) ===');
        
        // Fetch consultants
        const { data: consultantsData } = await supabase
          .from('consultants')
          .select('id, name')
          .order('name');
        
        if (consultantsData) {
          setConsultants(consultantsData);
          console.log('Consultores carregados:', consultantsData.length);
        }

        // Fetch projects and stages - BUSCAR DADOS COMPLETOS COMO NO DASHBOARD
        const { data: projectsData } = await supabase
          .from('projects')
          .select(`
            id,
            name,
            status,
            end_date,
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
          
          // Transformar dados dos projetos para o formato esperado pelo Dashboard
          const formattedProjectsData = projectsData.map(project => ({
            id: project.id,
            name: project.name,
            status: project.status,
            endDate: project.end_date,
            stages: project.project_stages
          }));
          
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
          
          // Calculate overdue counts using EXACTLY the same logic as Dashboard
          const { overdueProjects: overdueProjectsCount, overdueStages: overdueStagesCount } = 
            calculateOverdueCounts(allTasks, formattedProjectsData);
          
          console.log('Definindo contadores finais (SINCRONIZADO COM DASHBOARD):', {
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
    if (statuses.length >= 0) {
      console.log('Status carregados, iniciando busca de dados...');
      fetchGanttData();
    } else {
      console.log('Aguardando carregamento de status...');
    }
  }, [statuses]);

  // Debug effect to monitor state changes
  useEffect(() => {
    console.log('=== MUDANÇA DE ESTADO (SINCRONIZADO) ===');
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
