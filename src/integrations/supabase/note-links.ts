
import { supabase } from "./client";

export interface TaskInfo {
  id: string;
  title: string;
  status: 'iniciar_projeto' | 'em_producao' | 'aguardando_assinatura' | 'aguardando_aprovacao' | 'aguardando_nota_fiscal' | 'aguardando_pagamento' | 'aguardando_repasse' | 'finalizados' | 'cancelados';
}

export const fetchTasksForLinking = async (excludeTaskId: string): Promise<TaskInfo[]> => {
  try {
    const { data, error } = await supabase
      .from('notes')
      .select('id, title, status')
      .neq('id', excludeTaskId)
      .is('linked_task_id', null)
      .order('title');

    if (error) throw error;

    return data || [];
  } catch (error) {
    console.error('Error fetching tasks for linking:', error);
    return [];
  }
};

export const linkTasks = async (mainTaskId: string, dependentTaskId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('notes')
      .update({ linked_task_id: dependentTaskId })
      .eq('id', mainTaskId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error linking tasks:', error);
    return false;
  }
};

export const unlinkTask = async (taskId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('notes')
      .update({ linked_task_id: null })
      .eq('id', taskId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error unlinking task:', error);
    return false;
  }
};
