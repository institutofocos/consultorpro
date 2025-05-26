
import { useState } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

export const useProjectActions = () => {
  const [isLoading, setIsLoading] = useState(false);

  const updateProjectStatus = async (projectId: string, status: string) => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('projects')
        .update({ status })
        .eq('id', projectId);

      if (error) throw error;
      toast.success('Status do projeto atualizado com sucesso!');
    } catch (error) {
      console.error('Erro ao atualizar status do projeto:', error);
      toast.error('Erro ao atualizar status do projeto.');
    } finally {
      setIsLoading(false);
    }
  };

  const updateStageStatus = async (stageId: string, status: string) => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('project_stages')
        .update({ status })
        .eq('id', stageId);

      if (error) throw error;
      toast.success('Status da etapa atualizado com sucesso!');
    } catch (error) {
      console.error('Erro ao atualizar status da etapa:', error);
      toast.error('Erro ao atualizar status da etapa.');
    } finally {
      setIsLoading(false);
    }
  };

  const completeProject = async (projectId: string) => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('projects')
        .update({ status: 'concluido' })
        .eq('id', projectId);

      if (error) throw error;
      toast.success('Projeto concluído com sucesso!');
    } catch (error) {
      console.error('Erro ao concluir projeto:', error);
      toast.error('Erro ao concluir projeto.');
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
          status: 'concluido',
          completed_at: new Date().toISOString()
        })
        .eq('id', stageId);

      if (error) throw error;
      toast.success('Etapa concluída com sucesso!');
    } catch (error) {
      console.error('Erro ao concluir etapa:', error);
      toast.error('Erro ao concluir etapa.');
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
          status: 'em_producao',
          completed_at: null
        })
        .eq('id', stageId);

      if (error) throw error;
      toast.success('Conclusão da etapa desfeita com sucesso!');
    } catch (error) {
      console.error('Erro ao desfazer conclusão da etapa:', error);
      toast.error('Erro ao desfazer conclusão da etapa.');
    } finally {
      setIsLoading(false);
    }
  };

  const cancelProject = async (projectId: string) => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('projects')
        .update({ status: 'cancelado' })
        .eq('id', projectId);

      if (error) throw error;
      toast.success('Projeto cancelado com sucesso!');
    } catch (error) {
      console.error('Erro ao cancelar projeto:', error);
      toast.error('Erro ao cancelar projeto.');
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    updateProjectStatus,
    updateStageStatus,
    completeProject,
    completeStage,
    uncompleteStage,
    cancelProject,
  };
};
