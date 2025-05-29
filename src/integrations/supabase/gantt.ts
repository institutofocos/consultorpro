
import { supabase } from './client';

export interface GanttTask {
  id: string;
  project_id: string;
  task_name: string;
  task_description: string | null;
  start_date: string;
  end_date: string;
  duration_days: number;
  progress_percentage: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'not_started' | 'in_progress' | 'completed' | 'on_hold' | 'cancelled';
  assigned_consultant_id: string | null;
  depends_on_task_id: string | null;
  created_at: string;
  updated_at: string;
}

export const ganttOperations = {
  // Buscar todas as tarefas do Gantt
  async getGanttTasks(projectId?: string) {
    let query = supabase
      .from('gantt_tasks')
      .select(`
        *,
        projects:project_id (name, status),
        consultants:assigned_consultant_id (name)
      `)
      .order('start_date');

    if (projectId) {
      query = query.eq('project_id', projectId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  // Criar nova tarefa no Gantt
  async createGanttTask(task: Omit<GanttTask, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('gantt_tasks')
      .insert(task)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Atualizar tarefa do Gantt
  async updateGanttTask(id: string, updates: Partial<GanttTask>) {
    const { data, error } = await supabase
      .from('gantt_tasks')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Deletar tarefa do Gantt
  async deleteGanttTask(id: string) {
    const { error } = await supabase
      .from('gantt_tasks')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  // Popular tarefas do Gantt a partir de um projeto
  async populateGanttFromProject(projectId: string) {
    const { data, error } = await supabase.rpc('populate_gantt_from_project', {
      p_project_id: projectId
    });
    
    if (error) throw error;
    return data;
  }
};
