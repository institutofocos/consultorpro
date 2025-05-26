import { supabase } from './client';
import { Project, Stage } from '@/components/projects/types';
import { syncStageStatusToKanban } from './kanban-sync';
import { fetchKanbanColumns } from './kanban-columns';

export const fetchProjects = async (): Promise<Project[]> => {
  try {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching projects:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching projects:', error);
    return [];
  }
};

export const fetchProjectById = async (id: string): Promise<Project | null> => {
  try {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching project by ID:', error);
      return null;
    }

    return data || null;
  } catch (error) {
    console.error('Error fetching project by ID:', error);
    return null;
  }
};

export const createProject = async (project: Omit<Project, 'id' | 'created_at' | 'updated_at'>): Promise<Project | null> => {
  try {
    const { data, error } = await supabase
      .from('projects')
      .insert([project])
      .select()
      .single();

    if (error) {
      console.error('Error creating project:', error);
      return null;
    }

    return data as Project;
  } catch (error) {
    console.error('Error creating project:', error);
    return null;
  }
};

export const updateProject = async (id: string, updates: Partial<Project>): Promise<void> => {
  try {
    const { error } = await supabase
      .from('projects')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (error) {
      console.error('Error updating project:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error updating project:', error);
    throw error;
  }
};

export const deleteProject = async (id: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting project:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error deleting project:', error);
    throw error;
  }
};

export const fetchStagesByProjectId = async (projectId: string): Promise<Stage[]> => {
  try {
    const { data, error } = await supabase
      .from('project_stages')
      .select('*')
      .eq('project_id', projectId)
      .order('stage_order');

    if (error) {
      console.error('Error fetching stages:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching stages:', error);
    return [];
  }
};

export const createStage = async (stage: Omit<Stage, 'id' | 'created_at' | 'updated_at'>): Promise<Stage | null> => {
  try {
    const { data, error } = await supabase
      .from('project_stages')
      .insert([stage])
      .select()
      .single();

    if (error) {
      console.error('Error creating stage:', error);
      return null;
    }

    return data as Stage;
  } catch (error) {
    console.error('Error creating stage:', error);
    return null;
  }
};

export const updateStage = async (id: string, updates: Partial<Stage>): Promise<void> => {
  try {
    const { error } = await supabase
      .from('project_stages')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (error) {
      console.error('Error updating stage:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error updating stage:', error);
    throw error;
  }
};

export const deleteStage = async (id: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('project_stages')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting stage:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error deleting stage:', error);
    throw error;
  }
};

export const updateStageStatus = async (
  stageId: string, 
  updates: Partial<Stage>,
  projectName?: string,
  stageName?: string
): Promise<void> => {
  try {
    console.log('Atualizando status da etapa:', { stageId, updates });

    // Atualizar a etapa no banco
    const { error } = await supabase
      .from('project_stages')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', stageId);

    if (error) throw error;

    // Se o status foi atualizado para finalizados ou cancelados, sincronizar com Kanban
    if (updates.status && (updates.status === 'finalizados' || updates.status === 'cancelados')) {
      try {
        const kanbanColumns = await fetchKanbanColumns();
        await syncStageStatusToKanban(stageId, updates.status, kanbanColumns);
      } catch (syncError) {
        console.error('Erro na sincronização com Kanban:', syncError);
        // Não falhar a operação principal por causa do erro de sincronização
      }
    }

    console.log(`Status da etapa atualizado com sucesso`);
    
    if (projectName && stageName) {
      console.log(`Etapa "${stageName}" do projeto "${projectName}" atualizada`);
    }
  } catch (error) {
    console.error('Erro ao atualizar status da etapa:', error);
    throw error;
  }
};

export const updateStageOrder = async (stageId: string, newOrder: number): Promise<void> => {
  try {
    const { error } = await supabase
      .from('project_stages')
      .update({ stage_order: newOrder })
      .eq('id', stageId);

    if (error) {
      console.error('Error updating stage order:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error updating stage order:', error);
    throw error;
  }
};
