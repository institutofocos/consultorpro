
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useProjectActions = () => {
  const [isLoading, setIsLoading] = useState(false);

  const updateProjectStatus = async (projectId: string, newStatus: string) => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('projects')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', projectId);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating project status:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const updateStageStatus = async (stageId: string, newStatus: string) => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('project_stages')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', stageId);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating stage status:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const completeStage = async (stageId: string) => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('project_stages')
        .update({ 
          completed: true,
          completed_at: new Date().toISOString(),
          status: 'finalizados',
          updated_at: new Date().toISOString()
        })
        .eq('id', stageId);

      if (error) throw error;
    } catch (error) {
      console.error('Error completing stage:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const uncompleteStage = async (stageId: string) => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('project_stages')
        .update({ 
          completed: false,
          completed_at: null,
          status: 'em_producao',
          updated_at: new Date().toISOString()
        })
        .eq('id', stageId);

      if (error) throw error;
    } catch (error) {
      console.error('Error uncompleting stage:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    updateProjectStatus,
    updateStageStatus,
    completeStage,
    uncompleteStage,
    isLoading
  };
};
