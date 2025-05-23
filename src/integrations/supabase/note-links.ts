
import { supabase } from './client';

// Simple type definition to avoid circular references
type TaskInfo = {
  id: string;
  title: string;
  status: 'a_fazer' | 'em_producao' | 'finalizado' | 'cancelado';
};

/**
 * Links two tasks together, making the dependent task require completion of the parent task
 * @param dependentTaskId The task that depends on another task
 * @param parentTaskId The task that must be completed first
 */
export const linkTasks = async (dependentTaskId: string, parentTaskId: string): Promise<boolean> => {
  try {
    // Make sure the tasks exist and are not the same
    if (dependentTaskId === parentTaskId) {
      throw new Error('Uma tarefa não pode depender de si mesma');
    }

    const { error } = await supabase
      .from('notes')
      .update({
        linked_task_id: parentTaskId
      })
      .eq('id', dependentTaskId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error linking tasks:', error);
    return false;
  }
};

/**
 * Removes the link between tasks
 * @param taskId The task to unlink from its parent
 */
export const unlinkTask = async (taskId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('notes')
      .update({
        linked_task_id: null
      })
      .eq('id', taskId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error unlinking task:', error);
    return false;
  }
};

/**
 * Fetches all available tasks to link with
 * @param excludeTaskId The task to exclude from results (typically the current task)
 */
export const fetchTasksForLinking = async (excludeTaskId: string): Promise<TaskInfo[]> => {
  try {
    const { data, error } = await supabase
      .from('notes')
      .select('id, title, status')
      .neq('id', excludeTaskId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data?.map(item => ({
      id: item.id,
      title: item.title,
      status: item.status as 'a_fazer' | 'em_producao' | 'finalizado' | 'cancelado'
    })) || [];
  } catch (error) {
    console.error('Error fetching tasks for linking:', error);
    return [];
  }
};

/**
 * Gets all tasks that depend on the specified task
 * @param taskId The parent task ID
 */
export const getDependentTasks = async (taskId: string): Promise<TaskInfo[]> => {
  try {
    const { data, error } = await supabase
      .from('notes')
      .select('id, title, status')
      .eq('linked_task_id', taskId);

    if (error) throw error;
    return data?.map(item => ({
      id: item.id,
      title: item.title,
      status: item.status as 'a_fazer' | 'em_producao' | 'finalizado' | 'cancelado'
    })) || [];
  } catch (error) {
    console.error('Error fetching dependent tasks:', error);
    return [];
  }
};
