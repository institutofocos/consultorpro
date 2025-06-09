
import { useState } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

export const useProjectActions = () => {
  const [isLoading, setIsLoading] = useState(false);

  const updateProjectStatus = async (projectId: string, status: string) => {
    setIsLoading(true);
    console.log('Atualizando status do projeto:', projectId, 'para:', status);
    
    const { error } = await supabase
      .from('projects')
      .update({ 
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', projectId);

    if (error) {
      console.error('Erro ao atualizar status do projeto:', error);
      toast.error('Erro ao atualizar status do projeto');
      setIsLoading(false);
      throw error;
    }
    
    console.log('Status do projeto atualizado com sucesso');
    toast.success('Status do projeto atualizado com sucesso');
    setIsLoading(false);
  };

  const updateStageStatus = async (stageId: string, status: string) => {
    setIsLoading(true);
    console.log('Atualizando status da etapa:', stageId, 'para:', status);
    
    const { error } = await supabase
      .from('project_stages')
      .update({ 
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', stageId);

    if (error) {
      console.error('Erro ao atualizar status da etapa:', error);
      toast.error('Erro ao atualizar status da etapa');
      setIsLoading(false);
      throw error;
    }
    
    console.log('Status da etapa atualizado com sucesso');
    toast.success('Status da etapa atualizado com sucesso');
    setIsLoading(false);
  };

  const completeProject = async (projectId: string) => {
    setIsLoading(true);
    console.log('Concluindo projeto:', projectId);
    
    const { error } = await supabase
      .from('projects')
      .update({ 
        status: 'concluido',
        updated_at: new Date().toISOString()
      })
      .eq('id', projectId);

    if (error) {
      console.error('Erro ao concluir projeto:', error);
      toast.error('Erro ao concluir projeto');
      setIsLoading(false);
      throw error;
    }
    
    console.log('Projeto concluído com sucesso');
    toast.success('Projeto concluído com sucesso');
    setIsLoading(false);
  };

  const completeStage = async (stageId: string) => {
    setIsLoading(true);
    console.log('Concluindo etapa:', stageId);
    
    const { error } = await supabase
      .from('project_stages')
      .update({ 
        completed: true, 
        status: 'concluido',
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', stageId);

    if (error) {
      console.error('Erro ao concluir etapa:', error);
      toast.error('Erro ao concluir etapa');
      setIsLoading(false);
      throw error;
    }
    
    console.log('Etapa concluída com sucesso');
    toast.success('Etapa concluída com sucesso');
    setIsLoading(false);
  };

  const uncompleteStage = async (stageId: string) => {
    setIsLoading(true);
    console.log('Desfazendo conclusão da etapa:', stageId);
    
    const { error } = await supabase
      .from('project_stages')
      .update({ 
        completed: false, 
        status: 'em_producao',
        completed_at: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', stageId);

    if (error) {
      console.error('Erro ao desfazer conclusão da etapa:', error);
      toast.error('Erro ao desfazer conclusão da etapa');
      setIsLoading(false);
      throw error;
    }
    
    console.log('Conclusão da etapa desfeita com sucesso');
    toast.success('Conclusão da etapa desfeita com sucesso');
    setIsLoading(false);
  };

  const cancelProject = async (projectId: string) => {
    setIsLoading(true);
    console.log('Cancelando projeto:', projectId);
    
    const { error } = await supabase
      .from('projects')
      .update({ 
        status: 'cancelado',
        updated_at: new Date().toISOString()
      })
      .eq('id', projectId);

    if (error) {
      console.error('Erro ao cancelar projeto:', error);
      toast.error('Erro ao cancelar projeto');
      setIsLoading(false);
      throw error;
    }
    
    console.log('Projeto cancelado com sucesso');
    toast.success('Projeto cancelado com sucesso');
    setIsLoading(false);
  };

  const deleteStage = async (stageId: string) => {
    setIsLoading(true);
    console.log('Deletando etapa:', stageId);
    
    const { data, error } = await supabase
      .rpc('delete_project_stage', { stage_id: stageId });

    if (error) {
      console.error('Erro ao excluir etapa:', error);
      toast.error('Erro ao excluir etapa');
      setIsLoading(false);
      throw error;
    }
    
    console.log('Etapa excluída com sucesso');
    toast.success('Etapa excluída com sucesso');
    setIsLoading(false);
    return true;
  };

  return {
    isLoading,
    updateProjectStatus,
    updateStageStatus,
    completeProject,
    completeStage,
    uncompleteStage,
    cancelProject,
    deleteStage,
  };
};
