
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

    // Atualizar etapas baseado na posição da coluna
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
          updates.managerApproved = true;
          updates.clientApproved = true;
        }

        await updateStageStatus(stage.id, updates, projectName, stage.name);
        console.log(`Etapa ${stage.name} atualizada:`, updates);
      }
    }

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
      targetColumnIndex = kanbanColumns.length - 1;
    }

    const targetColumn = kanbanColumns[targetColumnIndex];
    
    if (!targetColumn) return null;

    // Atualizar a tarefa correspondente no sistema de notas
    await updateProjectTaskStatus(projectId, targetColumn.column_id);

    console.log(`Projeto movido para coluna: ${targetColumn.title}`);
    return targetColumn.column_id;
  } catch (error) {
    console.error('Erro na sincronização Etapa -> Kanban:', error);
    return null;
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
      'finalizados': 'finalizado',
      'cancelados': 'cancelado'
    };

    const taskStatus = taskStatusMap[newStatus] || 'a_fazer';

    // Atualizar o status da tarefa
    const { error } = await supabase
      .from('notes')
      .update({ status: taskStatus })
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
