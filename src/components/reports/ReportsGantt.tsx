
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import GanttView from '../calendar/GanttView';
import { fetchProjects } from '@/integrations/supabase/projects';
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

// Função para calcular valores usando EXATAMENTE a mesma lógica do Dashboard
const calculateDashboardMetrics = (projectsData: any[], statuses: any[]) => {
  console.log('=== CALCULANDO MÉTRICAS COMO NO DASHBOARD ===');
  
  // Determinar status de conclusão usando EXATAMENTE a mesma lógica do Dashboard
  const completionStatuses = statuses
    .filter(s => s.is_completion_status)
    .map(s => s.name);
  
  // Se não há status de conclusão configurados, usar 'concluido' como fallback - IGUAL AO DASHBOARD
  const finalCompletionStatuses = completionStatuses.length > 0 
    ? completionStatuses 
    : ['concluido', 'completed', 'finalizados'];
  
  console.log('Status de conclusão finais (IGUAL DASHBOARD):', finalCompletionStatuses);
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // PROJETOS ATRASADOS - USAR EXATAMENTE A MESMA LÓGICA DO DASHBOARD
  const overdueProjectsList = projectsData.filter(project => 
    project.endDate && 
    !finalCompletionStatuses.includes(project.status) &&
    isBefore(new Date(project.endDate), today)
  );
  
  const overdueProjectsCount = overdueProjectsList.length;
  
  // ETAPAS ATRASADAS - PROCESSAR TODAS AS ETAPAS DE TODOS OS PROJETOS
  let overdueStagesCount = 0;
  
  projectsData.forEach(project => {
    if (project.stages) {
      project.stages.forEach(stage => {
        const stageEndDate = new Date(stage.endDate);
        stageEndDate.setHours(0, 0, 0, 0);
        
        const isNotCompleted = !finalCompletionStatuses.includes(stage.status) && 
                              stage.status !== 'cancelado' && 
                              stage.status !== 'cancelled';
        
        const stageNotCompleted = stage.completed !== undefined ? !stage.completed : true;
        
        if (isBefore(stageEndDate, today) && isNotCompleted && stageNotCompleted) {
          overdueStagesCount++;
          console.log('Etapa em atraso (DASHBOARD LOGIC):', {
            stageName: stage.name,
            endDate: stage.endDate,
            status: stage.status,
            completed: stage.completed,
            projectName: project.name
          });
        }
      });
    }
  });
  
  console.log('=== RESULTADOS DASHBOARD LOGIC ===');
  console.log('Projetos em atraso:', overdueProjectsCount);
  console.log('Etapas em atraso:', overdueStagesCount);
  
  return { 
    overdueProjects: overdueProjectsCount, 
    overdueStages: overdueStagesCount 
  };
};

const ReportsGantt: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [consultants, setConsultants] = useState<Consultant[]>([]);
  const [selectedConsultantId, setSelectedConsultantId] = useState<string>('all');
  const [overdueProjects, setOverdueProjects] = useState(0);
  const [overdueStages, setOverdueStages] = useState(0);
  const [loading, setLoading] = useState(true);

  const { statuses } = useProjectStatuses();

  useEffect(() => {
    const fetchGanttData = async () => {
      try {
        setLoading(true);
        console.log('=== INICIANDO BUSCA DE DADOS GANTT (USANDO DASHBOARD LOGIC) ===');
        
        // Fetch consultants
        const { data: consultantsData } = await supabase
          .from('consultants')
          .select('id, name')
          .order('name');
        
        if (consultantsData) {
          setConsultants(consultantsData);
          console.log('Consultores carregados:', consultantsData.length);
        }

        // Buscar dados dos projetos usando a MESMA função do Dashboard
        const projectsData = await fetchProjects();
        console.log('Projetos carregados (DASHBOARD DATA):', projectsData?.length || 0);

        if (projectsData) {
          const allTasks: Task[] = [];
          
          // Processar projetos para criar tasks do Gantt
          projectsData.forEach(project => {
            if (project.stages && project.stages.length > 0) {
              project.stages.forEach(stage => {
                if (stage.startDate && stage.endDate) {
                  // Get consultant name - fix the property access
                  let consultantName = 'Não atribuído';
                  if (stage.consultantId) {
                    // Try to find consultant in the consultants list
                    const consultant = consultantsData?.find(c => c.id === stage.consultantId);
                    if (consultant) {
                      consultantName = consultant.name;
                    } else if (stage.consultant?.name) {
                      // Fallback to consultant data from stage if available
                      consultantName = stage.consultant.name;
                    }
                  }
                  
                  allTasks.push({
                    id: stage.id,
                    name: stage.name,
                    description: stage.description || '',
                    start_date: stage.startDate,
                    end_date: stage.endDate,
                    status: stage.status || 'iniciar_projeto',
                    value: Number(stage.value) || 0,
                    valor_de_repasse: Number(stage.valorDeRepasse) || 0,
                    hours: stage.hours || 0,
                    days: stage.days || 0,
                    project_id: project.id,
                    consultant_id: stage.consultantId || '',
                    consultant_name: consultantName,
                    project_name: project.name,
                    service_name: project.serviceName || 'Sem serviço',
                    completed: stage.completed
                  });
                }
              });
            }
          });

          console.log('Total de tasks criadas:', allTasks.length);
          setTasks(allTasks);
          
          // CALCULAR VALORES USANDO A MESMA LÓGICA DO DASHBOARD
          const { overdueProjects: overdueProjectsCount, overdueStages: overdueStagesCount } = 
            calculateDashboardMetrics(projectsData, statuses);
          
          console.log('Definindo contadores (DASHBOARD LOGIC):', {
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
    console.log('=== MUDANÇA DE ESTADO (DASHBOARD LOGIC) ===');
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
