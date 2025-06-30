
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import GanttView from '../calendar/GanttView';
import { fetchProjects } from '@/integrations/supabase/projects';
import { useProjectStatuses } from '@/hooks/useProjectStatuses';
import { useUserPermissions } from '@/hooks/useUserPermissions';
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
  time_spent_minutes?: number;
  timer_status?: string;
  timer_started_at?: string;
}

interface Consultant {
  id: string;
  name: string;
}

const ReportsGantt: React.FC = () => {
  console.log('ReportsGantt component rendered - TEXTO VISUALIZAÇÃO GANTT REMOVIDO COMPLETAMENTE');
  
  const [tasks, setTasks] = useState<Task[]>([]);
  const [consultants, setConsultants] = useState<Consultant[]>([]);
  const [selectedConsultantId, setSelectedConsultantId] = useState<string>('all');
  const [overdueProjects, setOverdueProjects] = useState(0);
  const [overdueStages, setOverdueStages] = useState(0);
  const [loading, setLoading] = useState(true);

  const { statuses } = useProjectStatuses();
  const { userLinks, isLoading: permissionsLoading, isRestrictedToLinked, isSuperAdmin } = useUserPermissions();

  // Verificar se o usuário é um consultor vinculado (não super admin e tem consultant_id)
  const isConsultantUser = !isSuperAdmin && userLinks?.consultant_id;
  
  // Determinar se deve mostrar o filtro (apenas para super admins ou usuários sem restrições)
  const shouldShowFilter = isSuperAdmin || (!userLinks?.consultant_id && !isRestrictedToLinked('projects'));

  console.log('=== DEBUG PERMISSÕES ===');
  console.log('isSuperAdmin:', isSuperAdmin);
  console.log('userLinks?.consultant_id:', userLinks?.consultant_id);
  console.log('isRestrictedToLinked(projects):', isRestrictedToLinked('projects'));
  console.log('isConsultantUser:', isConsultantUser);
  console.log('shouldShowFilter:', shouldShowFilter);

  useEffect(() => {
    // Se é consultor vinculado, definir automaticamente o filtro para seu ID
    if (isConsultantUser && userLinks?.consultant_id) {
      setSelectedConsultantId(userLinks.consultant_id);
      console.log('Consultor vinculado detectado, filtro definido para:', userLinks.consultant_id);
    }
  }, [isConsultantUser, userLinks?.consultant_id]);

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

        // Buscar dados dos projetos
        console.log('Buscando projetos...');
        const projectsData = await fetchProjects();
        console.log('Projetos retornados:', projectsData?.length || 0);

        if (projectsData && statuses.length > 0) {
          const completionStatuses = statuses
            .filter(s => s.is_completion_status)
            .map(s => s.name);
          
          const finalCompletionStatuses = completionStatuses.length > 0 
            ? completionStatuses 
            : ['concluido', 'completed', 'finalizados'];
          
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          
          let overdueProjectsCount = 0;
          let overdueStagesCount = 0;
          const allTasks: Task[] = [];
          
          projectsData.forEach((project) => {
            if (project.endDate) {
              const projectEndDate = new Date(project.endDate);
              projectEndDate.setHours(0, 0, 0, 0);
              
              const isOverdue = isBefore(projectEndDate, today);
              const isNotCompleted = !finalCompletionStatuses.includes(project.status);
              
              console.log(`Projeto ${project.name}`);
              console.log(`  - Status: ${project.status}`);
              console.log(`  - Data fim: ${project.endDate} (${projectEndDate.toISOString()})`);
              console.log(`  - É antes de hoje? ${isOverdue}`);
              console.log(`  - Não está concluído? ${isNotCompleted}`);
              console.log(`  - É atrasado? ${isOverdue && isNotCompleted}`);
              
              if (isOverdue && isNotCompleted) {
                overdueProjectsCount++;
                console.log(`  *** PROJETO ATRASADO ENCONTRADO! Total atual: ${overdueProjectsCount}`);
              }
            } else {
              console.log(`Projeto sem data fim: ${project.name}`);
            }
          });
          
          console.log(`TOTAL DE PROJETOS ATRASADOS: ${overdueProjectsCount}`);
          
          projectsData.forEach((project) => {
            if (project.stages && project.stages.length > 0) {
              project.stages.forEach((stage) => {
                if (stage.endDate) {
                  const stageEndDate = new Date(stage.endDate);
                  stageEndDate.setHours(0, 0, 0, 0);
                  
                  const isStageOverdue = isBefore(stageEndDate, today);
                  const stageStatus = stage.status || 'iniciar_projeto';
                  const isStageNotCompleted = !finalCompletionStatuses.includes(stageStatus) && 
                                              stageStatus !== 'cancelado' && 
                                              stageStatus !== 'cancelled';
                  const stageNotCompleted = stage.completed !== undefined ? !stage.completed : true;
                  
                  console.log(`  Etapa ${stage.name}`);
                  console.log(`    - Status: ${stage.status || 'iniciar_projeto'}`);
                  console.log(`    - Data fim: ${stage.endDate}`);
                  console.log(`    - Completed: ${stage.completed}`);
                  
                  console.log(`    - É antes de hoje? ${isStageOverdue}`);
                  console.log(`    - Status não é conclusão? ${isStageNotCompleted}`);
                  console.log(`    - Não está marcada como completa? ${stageNotCompleted}`);
                  console.log(`    - É etapa atrasada? ${isStageOverdue && isStageNotCompleted && stageNotCompleted}`);
                  
                  if (isStageOverdue && isStageNotCompleted && stageNotCompleted) {
                    overdueStagesCount++;
                    console.log(`    *** ETAPA ATRASADA ENCONTRADA! Total atual: ${overdueStagesCount}`);
                  }
                }
                
                // Criar task com TODOS os dados de timer - safely accessing timer properties
                if (stage.startDate && stage.endDate) {
                  let consultantName = 'Não atribuído';
                  if (stage.consultantId) {
                    const consultant = consultantsData?.find(c => c.id === stage.consultantId);
                    if (consultant) {
                      consultantName = consultant.name;
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
                    completed: stage.completed,
                    // Safely access timer properties with fallback values
                    time_spent_minutes: (stage as any).time_spent_minutes || 0,
                    timer_status: (stage as any).timer_status || 'stopped',
                    timer_started_at: (stage as any).timer_started_at || undefined
                  });
                  
                  console.log('Task criada com timer data:', {
                    name: stage.name,
                    time_spent_minutes: (stage as any).time_spent_minutes,
                    timer_status: (stage as any).timer_status,
                    timer_started_at: (stage as any).timer_started_at
                  });
                }
              });
            }
          });

          console.log('=== RESULTADOS FINAIS ===');
          console.log('Total de tasks com timer data:', allTasks.length);
          
          setTasks(allTasks);
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

    if (statuses.length > 0 && !permissionsLoading) {
      fetchGanttData();
    }
  }, [statuses, permissionsLoading]);

  useEffect(() => {
    console.log('=== MUDANÇA DE ESTADO ===');
    console.log('Projetos em atraso (state):', overdueProjects);
    console.log('Etapas em atraso (state):', overdueStages);
    console.log('Loading:', loading);
    console.log('Tasks:', tasks.length);
  }, [overdueProjects, overdueStages, loading, tasks.length]);

  if (loading || permissionsLoading) {
    return (
      <Card>
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
      {/* Consultant Filter - Só mostra se não for consultor vinculado */}
      {shouldShowFilter && (
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
      )}

      {/* Gantt Chart - SEM TÍTULO EM LUGAR NENHUM */}
      <GanttView 
        tasks={tasks} 
        selectedConsultantId={selectedConsultantId}
        overdueProjects={overdueProjects}
        overdueStages={overdueStages}
        hideConsultantFilter={isConsultantUser}
      />
    </div>
  );
};

export default ReportsGantt;
