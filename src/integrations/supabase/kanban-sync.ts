
import { supabase } from './client';
import { updateStageStatus } from './projects';
import { Project, Stage } from '@/components/projects/types';
import { KanbanColumn } from './kanban-columns';

// Mapear status das colunas do Kanban para status das etapas
const KANBAN_TO_STAGE_STATUS_MAP: Record<string, Stage['status']> = {
  'iniciar_projeto': 'iniciar_projeto',
  'em_producao': 'em_producao',
  'aguardando_assinatura': 'aguardando_assinatura',
  'aguardando_aprovacao': 'aguardando_aprovacao',
  'aguardando_nota_fiscal': 'aguardando_nota_fiscal',
  'aguardando_pagamento': 'aguardando_pagamento',
  'aguardando_repasse': 'aguardando_repasse',
  'finalizados': 'finalizados',
  'cancelados': 'cancelados'
};

// Mapear status das etapas para colunas do Kanban
const STAGE_TO_KANBAN_STATUS_MAP: Record<Stage['status'], string> = {
  'iniciar_projeto': 'iniciar_projeto',
  'em_producao': 'em_producao',
  'aguardando_assinatura': 'aguardando_assinatura',
  'aguardando_aprovacao': 'aguardando_aprovacao',
  'aguardando_nota_fiscal': 'aguardando_nota_fiscal',
  'aguardando_pagamento': 'aguardando_pagamento',
  'aguardando_repasse': 'aguardando_repasse',
  'finalizados': 'finalizados',
  'cancelados': 'cancelados'
};

/**
 * Sincroniza o status do projeto no Kanban com as etapas
 * Quando um projeto é movido para uma coluna, marca todas as etapas anteriores como concluídas
 */
export const syncKanbanToStages = async (
  projectId: string, 
  newKanbanStatus: string, 
  kanbanColumns: KanbanColumn[]
): Promise<void> => {
  try {
    console.log('Sincronizando Kanban -> Etapas:', { projectId, newKanbanStatus });

    // Verificar se a coluna de destino é marcada como finalizada ou cancelada
    const targetColumn = kanbanColumns.find(col => col.column_id === newKanbanStatus);
    
    if (targetColumn?.is_completion_column) {
      // Verificar se todas as etapas estão concluídas antes de mover para finalizado
      const { data: stages, error: stagesError } = await supabase
        .from('project_stages')
        .select('completed')
        .eq('project_id', projectId);

      if (stagesError) throw stagesError;

      if (stages && stages.length > 0) {
        const allCompleted = stages.every(stage => stage.completed);
        if (!allCompleted && targetColumn.column_type === 'completed') {
          throw new Error('Não é possível finalizar o projeto. Todas as etapas devem estar concluídas primeiro.');
        }
      }
    }

    // Buscar as etapas do projeto
    const { data: stages, error } = await supabase
      .from('project_stages')
      .select('*')
      .eq('project_id', projectId)
      .order('stage_order');

    if (error) throw error;

    if (!stages || stages.length === 0) {
      console.log('Nenhuma etapa encontrada para o projeto');
      return;
    }

    // Encontrar o índice da coluna atual no Kanban
    const currentColumnIndex = kanbanColumns.findIndex(col => col.column_id === newKanbanStatus);
    
    if (currentColumnIndex === -1) {
      console.log('Coluna não encontrada no Kanban');
      return;
    }

    // Buscar informações do projeto para logs
    const { data: project } = await supabase
      .from('projects')
      .select('name')
      .eq('id', projectId)
      .single();

    const projectName = project?.name || 'Projeto';

    // Se a coluna é de finalização ou cancelamento, marcar todas as etapas adequadamente
    if (targetColumn?.is_completion_column) {
      const isFinalized = targetColumn.column_type === 'completed';
      const isCancelled = targetColumn.column_type === 'cancelled';
      
      for (const stage of stages) {
        const updates: Partial<Stage> = {
          completed: isFinalized,
          status: isFinalized ? 'finalizados' : (isCancelled ? 'cancelados' : stage.status) as Stage['status']
        };

        // Se está finalizando, atualizar campos relacionados
        if (isFinalized) {
          updates.manager_approved = true;
          updates.client_approved = true;
          updates.invoice_issued = true;
          updates.payment_received = true;
          updates.consultants_settled = true;
        }

        await updateStageStatus(stage.id, updates, projectName, stage.name);
        console.log(`Etapa ${stage.name} atualizada:`, updates);
      }
    } else {
      // Lógica normal para outras colunas
      for (let i = 0; i < stages.length; i++) {
        const stage = stages[i];
        const shouldBeCompleted = i <= currentColumnIndex;
        const newStageStatus = shouldBeCompleted ? 'finalizados' : stage.status;

        // Atualizar apenas se necessário
        if (stage.completed !== shouldBeCompleted || stage.status !== newStageStatus) {
          const updates: Partial<Stage> = {
            completed: shouldBeCompleted,
            status: newStageStatus as Stage['status']
          };

          // Se está marcando como concluída, atualizar campos relacionados
          if (shouldBeCompleted) {
            updates.manager_approved = true;
            updates.client_approved = true;
          }

          await updateStageStatus(stage.id, updates, projectName, stage.name);
          console.log(`Etapa ${stage.name} atualizada:`, updates);
        }
      }
    }

    // Sincronizar com a tarefa correspondente
    await syncProjectStageWithTask(projectId, projectName);

    console.log('Sincronização Kanban -> Etapas concluída');
  } catch (error) {
    console.error('Erro na sincronização Kanban -> Etapas:', error);
    throw error;
  }
};

/**
 * Sincroniza uma etapa marcada como concluída com o Kanban
 * Move o projeto para a próxima coluna correspondente
 */
export const syncStageToKanban = async (
  projectId: string,
  completedStageId: string,
  kanbanColumns: KanbanColumn[]
): Promise<string | null> => {
  try {
    console.log('Sincronizando Etapa -> Kanban:', { projectId, completedStageId });

    // Buscar todas as etapas do projeto
    const { data: stages, error } = await supabase
      .from('project_stages')
      .select('*')
      .eq('project_id', projectId)
      .order('stage_order');

    if (error) throw error;

    if (!stages || stages.length === 0) return null;

    // Encontrar a etapa que foi concluída
    const completedStageIndex = stages.findIndex(stage => stage.id === completedStageId);
    
    if (completedStageIndex === -1) return null;

    // Contar quantas etapas estão concluídas
    const completedStagesCount = stages.filter(stage => stage.completed).length;
    
    // Determinar a coluna do Kanban baseada no número de etapas concluídas
    let targetColumnIndex = Math.min(completedStagesCount - 1, kanbanColumns.length - 1);
    
    // Se todas as etapas estão concluídas, mover para a última coluna (geralmente "Finalizados")
    if (completedStagesCount === stages.length) {
      // Procurar por uma coluna marcada como de conclusão (finalizados)
      const completionColumn = kanbanColumns.find(col => 
        col.is_completion_column && col.column_type === 'completed'
      );
      
      if (completionColumn) {
        targetColumnIndex = kanbanColumns.findIndex(col => col.id === completionColumn.id);
      } else {
        targetColumnIndex = kanbanColumns.length - 1;
      }
    }

    const targetColumn = kanbanColumns[targetColumnIndex];
    
    if (!targetColumn) return null;

    // Atualizar a tarefa correspondente no sistema de notas
    await updateProjectTaskStatus(projectId, targetColumn.column_id);

    // Buscar o nome do projeto para sincronização
    const { data: project } = await supabase
      .from('projects')
      .select('name')
      .eq('id', projectId)
      .single();

    if (project) {
      await syncProjectStageWithTask(projectId, project.name);
    }

    console.log(`Projeto movido para coluna: ${targetColumn.title}`);
    return targetColumn.column_id;
  } catch (error) {
    console.error('Erro na sincronização Etapa -> Kanban:', error);
    return null;
  }
};

/**
 * Sincroniza quando uma etapa é atualizada em "Atualizar Status da Etapa"
 * Esta função é chamada quando o usuário marca uma etapa como finalizada/cancelada
 */
export const syncStageStatusToKanban = async (
  stageId: string,
  newStatus: Stage['status'],
  kanbanColumns: KanbanColumn[]
): Promise<void> => {
  try {
    console.log('Sincronizando status da etapa para Kanban:', { stageId, newStatus });

    // Buscar a etapa e o projeto
    const { data: stage, error: stageError } = await supabase
      .from('project_stages')
      .select('*, project_id')
      .eq('id', stageId)
      .single();

    if (stageError || !stage) {
      console.error('Erro ao buscar etapa:', stageError);
      return;
    }

    // Buscar o nome do projeto
    const { data: project } = await supabase
      .from('projects')
      .select('name')
      .eq('id', stage.project_id)
      .single();

    const projectName = project?.name || 'Projeto';

    // Se o status é "finalizados" ou "cancelados", procurar coluna correspondente
    if (newStatus === 'finalizados' || newStatus === 'cancelados') {
      const targetColumnType = newStatus === 'finalizados' ? 'completed' : 'cancelled';
      const targetColumn = kanbanColumns.find(col => 
        col.is_completion_column && col.column_type === targetColumnType
      );

      if (targetColumn) {
        // Verificar se todas as etapas do projeto estão finalizadas
        const { data: allStages } = await supabase
          .from('project_stages')
          .select('completed, status')
          .eq('project_id', stage.project_id)
          .order('stage_order');

        if (allStages) {
          // Contar etapas concluídas (incluindo a atual que está sendo atualizada)
          const completedCount = allStages.filter(s => 
            s.id === stageId ? (newStatus === 'finalizados') : s.completed
          ).length;

          // Se todas as etapas estão concluídas ou se está cancelando
          if (completedCount === allStages.length || newStatus === 'cancelados') {
            await updateProjectTaskStatus(stage.project_id, targetColumn.column_id);
            console.log(`Projeto movido para coluna ${targetColumn.title} devido ao status da etapa`);
          }
        }
      }
    }

    // Sincronizar progresso geral
    await syncProjectStageWithTask(stage.project_id, projectName);

  } catch (error) {
    console.error('Erro na sincronização status da etapa -> Kanban:', error);
  }
};

/**
 * Sincroniza o progresso das etapas do projeto com a tarefa correspondente
 */
export const syncProjectStageWithTask = async (projectId: string, projectName: string): Promise<void> => {
  try {
    console.log('Sincronizando progresso do projeto com tarefa:', { projectId, projectName });

    // Buscar todas as etapas do projeto
    const { data: stages, error: stagesError } = await supabase
      .from('project_stages')
      .select('*')
      .eq('project_id', projectId)
      .order('stage_order');

    if (stagesError || !stages) {
      console.error('Erro ao buscar etapas:', stagesError);
      return;
    }

    // Buscar a tarefa principal do projeto
    const { data: mainTask, error: taskError } = await supabase
      .from('notes')
      .select('id, title')
      .ilike('title', `Projeto: ${projectName}%`)
      .single();

    if (taskError || !mainTask) {
      console.log('Tarefa principal não encontrada para o projeto');
      return;
    }

    // Contar etapas concluídas
    const completedStagesCount = stages.filter(stage => stage.completed).length;
    const totalStages = stages.length;
    
    // Determinar status da tarefa baseado no progresso
    let taskStatus = 'a_fazer';
    if (completedStagesCount === 0) {
      taskStatus = 'a_fazer';
    } else if (completedStagesCount === totalStages) {
      taskStatus = 'finalizados';
    } else {
      taskStatus = 'em_producao';
    }

    // Atualizar status da tarefa principal
    const { error: taskUpdateError } = await supabase
      .from('notes')
      .update({ 
        status: taskStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', mainTask.id);

    if (taskUpdateError) {
      console.error('Erro ao atualizar status da tarefa:', taskUpdateError);
    } else {
      console.log(`Status da tarefa atualizado para: ${taskStatus}`);
    }

    // Atualizar checklists da tarefa para refletir o status das etapas
    for (const stage of stages) {
      const { error: checklistError } = await supabase
        .from('note_checklists')
        .update({
          completed: stage.completed,
          completed_at: stage.completed ? new Date().toISOString() : null
        })
        .eq('note_id', mainTask.id)
        .eq('title', stage.name);

      if (checklistError) {
        console.error(`Erro ao atualizar checklist para etapa ${stage.name}:`, checklistError);
      }
    }

    console.log('Sincronização projeto-tarefa concluída');
  } catch (error) {
    console.error('Erro na sincronização projeto-tarefa:', error);
  }
};

/**
 * Sincroniza quando uma etapa é marcada como concluída em tarefas
 */
export const syncTaskStageToProject = async (taskId: string, stageTitle: string, completed: boolean): Promise<void> => {
  try {
    console.log('Sincronizando etapa da tarefa com projeto:', { taskId, stageTitle, completed });

    // Buscar a tarefa para obter o nome do projeto
    const { data: task, error: taskError } = await supabase
      .from('notes')
      .select('title')
      .eq('id', taskId)
      .single();

    if (taskError || !task) {
      console.error('Erro ao buscar tarefa:', taskError);
      return;
    }

    // Extrair nome do projeto do título da tarefa
    const projectNameMatch = task.title.match(/^Projeto: (.+)$/);
    if (!projectNameMatch) {
      console.log('Não é uma tarefa de projeto');
      return;
    }

    const projectName = projectNameMatch[1];

    // Buscar o projeto pelo nome
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id')
      .eq('name', projectName)
      .single();

    if (projectError || !project) {
      console.error('Projeto não encontrado:', projectError);
      return;
    }

    // Buscar a etapa correspondente no projeto
    const { data: projectStage, error: stageError } = await supabase
      .from('project_stages')
      .select('id, completed')
      .eq('project_id', project.id)
      .eq('name', stageTitle)
      .single();

    if (stageError || !projectStage) {
      console.error('Etapa do projeto não encontrada:', stageError);
      return;
    }

    // Atualizar apenas se o status for diferente
    if (projectStage.completed !== completed) {
      const updates: Partial<Stage> = {
        completed: completed,
        status: completed ? 'finalizados' : 'em_producao'
      };

      // Se está marcando como concluída, atualizar campos relacionados
      if (completed) {
        updates.manager_approved = true;
        updates.client_approved = true;
      }

      await updateStageStatus(projectStage.id, updates, projectName, stageTitle);
      console.log(`Etapa do projeto ${stageTitle} atualizada para completed: ${completed}`);
    }

  } catch (error) {
    console.error('Erro na sincronização tarefa-projeto:', error);
  }
};

/**
 * Atualiza o status da tarefa do projeto no sistema de notas
 */
const updateProjectTaskStatus = async (projectId: string, newStatus: string): Promise<void> => {
  try {
    // Buscar o nome do projeto
    const { data: project } = await supabase
      .from('projects')
      .select('name')
      .eq('id', projectId)
      .single();

    if (!project) return;

    // Buscar a tarefa correspondente ao projeto
    const { data: task } = await supabase
      .from('notes')
      .select('id')
      .ilike('title', `Projeto: ${project.name}%`)
      .single();

    if (!task) return;

    // Mapear status do Kanban para status da tarefa
    const taskStatusMap: Record<string, string> = {
      'iniciar_projeto': 'a_fazer',
      'em_producao': 'em_producao',
      'aguardando_assinatura': 'em_producao',
      'aguardando_aprovacao': 'em_producao',
      'aguardando_nota_fiscal': 'em_producao',
      'aguardando_pagamento': 'em_producao',
      'aguardando_repasse': 'em_producao',
      'finalizados': 'finalizados',
      'cancelados': 'cancelados'
    };

    const taskStatus = taskStatusMap[newStatus] || 'a_fazer';

    // Atualizar o status da tarefa
    const { error } = await supabase
      .from('notes')
      .update({ 
        status: taskStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', task.id);

    if (error) {
      console.error('Erro ao atualizar status da tarefa:', error);
    } else {
      console.log(`Status da tarefa atualizado para: ${taskStatus}`);
    }
  } catch (error) {
    console.error('Erro ao atualizar tarefa do projeto:', error);
  }
};
