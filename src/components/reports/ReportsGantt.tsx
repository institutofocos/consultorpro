
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
        console.log('=== INICIANDO BUSCA DE DADOS GANTT (DEBUG DETALHADO) ===');
        
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
        console.log('Projetos retornados pela fetchProjects:', projectsData?.length || 0);
        
        if (projectsData) {
          console.log('Primeiros 3 projetos para debug:', projectsData.slice(0, 3).map(p => ({
            id: p.id,
            name: p.name,
            status: p.status,
            endDate: p.endDate,
            stages: p.stages?.length || 0
          })));
        }

        if (projectsData && statuses.length > 0) {
          console.log('Status configurados:', statuses.map(s => ({ name: s.name, is_completion: s.is_completion_status })));
          
          // Determinar status de conclusão
          const completionStatuses = statuses
            .filter(s => s.is_completion_status)
            .map(s => s.name);
          
          const finalCompletionStatuses = completionStatuses.length > 0 
            ? completionStatuses 
            : ['concluido', 'completed', 'finalizados'];
          
          console.log('Status de conclusão finais:', finalCompletionStatuses);
          
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          console.log('Data de hoje (zerada):', today.toISOString());
          
          // PROJETOS ATRASADOS - DEBUG DETALHADO
          console.log('=== CALCULANDO PROJETOS ATRASADOS ===');
          let overdueProjectsCount = 0;
          
          projectsData.forEach((project, index) => {
            if (project.endDate) {
              const projectEndDate = new Date(project.endDate);
              projectEndDate.setHours(0, 0, 0, 0);
              
              const isOverdue = isBefore(projectEndDate, today);
              const isNotCompleted = !finalCompletionStatuses.includes(project.status);
              
              console.log(`Projeto ${index + 1}: ${project.name}`);
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
          
          // ETAPAS ATRASADAS - DEBUG DETALHADO
          console.log('=== CALCULANDO ETAPAS ATRASADAS ===');
          let overdueStagesCount = 0;
          const allTasks: Task[] = [];
          
          projectsData.forEach((project, projectIndex) => {
            console.log(`Processando etapas do projeto ${projectIndex + 1}: ${project.name}`);
            console.log(`  - Número de etapas: ${project.stages?.length || 0}`);
            
            if (project.stages && project.stages.length > 0) {
              project.stages.forEach((stage, stageIndex) => {
                console.log(`  Etapa ${stageIndex + 1}: ${stage.name}`);
                console.log(`    - Status: ${stage.status || 'iniciar_projeto'}`);
                console.log(`    - Data fim: ${stage.endDate}`);
                console.log(`    - Completed: ${stage.completed}`);
                
                if (stage.endDate) {
                  const stageEndDate = new Date(stage.endDate);
                  stageEndDate.setHours(0, 0, 0, 0);
                  
                  const isStageOverdue = isBefore(stageEndDate, today);
                  const stageStatus = stage.status || 'iniciar_projeto';
                  const isStageNotCompleted = !finalCompletionStatuses.includes(stageStatus) && 
                                              stageStatus !== 'cancelado' && 
                                              stageStatus !== 'cancelled';
                  const stageNotCompleted = stage.completed !== undefined ? !stage.completed : true;
                  
                  console.log(`    - É antes de hoje? ${isStageOverdue}`);
                  console.log(`    - Status não é conclusão? ${isStageNotCompleted}`);
                  console.log(`    - Não está marcada como completa? ${stageNotCompleted}`);
                  console.log(`    - É etapa atrasada? ${isStageOverdue && isStageNotCompleted && stageNotCompleted}`);
                  
                  if (isStageOverdue && isStageNotCompleted && stageNotCompleted) {
                    overdueStagesCount++;
                    console.log(`    *** ETAPA ATRASADA ENCONTRADA! Total atual: ${overdueStagesCount}`);
                  }
                }
                
                // Criar task para o Gantt se tem datas
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
                    completed: stage.completed
                  });
                }
              });
            }
          });

          console.log('=== RESULTADOS FINAIS ===');
          console.log('Projetos em atraso:', overdueProjectsCount);
          console.log('Etapas em atraso:', overdueStagesCount);
          console.log('Total de tasks criadas:', allTasks.length);
          
          // Force update states
          console.log('Atualizando estados...');
          setTasks(allTasks);
          setOverdueProjects(overdueProjectsCount);
          setOverdueStages(overdueStagesCount);
          console.log('Estados atualizados!');
        } else {
          console.log('Dados não disponíveis:', { projectsData: !!projectsData, statusesLength: statuses.length });
        }

      } catch (error) {
        console.error('Error fetching Gantt data:', error);
        toast.error('Erro ao carregar dados do Gantt');
      } finally {
        setLoading(false);
      }
    };

    // Only fetch data when statuses are loaded
    if (statuses.length > 0) {
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
