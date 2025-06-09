
import { useState } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

export const useProjectActions = () => {
  const [isLoading, setIsLoading] = useState(false);

  // Função para processar webhooks imediatamente após uma ação
  const processWebhooksImmediately = async () => {
    try {
      console.log('Processando webhooks imediatamente após ação...');
      const { data, error } = await supabase.functions.invoke('webhooks', {
        body: { action: 'process' }
      });

      if (error) {
        console.error('Erro ao processar webhooks:', error);
        return;
      }

      if (data?.success) {
        console.log('Webhooks processados imediatamente:', data.message);
      }
    } catch (error) {
      console.error('Erro no processamento imediato de webhooks:', error);
    }
  };

  const updateProjectStatus = async (projectId: string, status: string) => {
    setIsLoading(true);
    console.log('Atualizando status do projeto:', projectId, 'para:', status);
    
    try {
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
        throw error;
      }
      
      console.log('Status do projeto atualizado com sucesso - webhook disparado automaticamente via trigger');
      toast.success('Status do projeto atualizado com sucesso');
      
      // Processar webhooks imediatamente
      setTimeout(() => {
        processWebhooksImmediately();
      }, 500);
      
      // Log para confirmar que a atualização foi feita
      await supabase
        .from('system_logs')
        .insert({
          log_type: 'info',
          category: 'project_action',
          message: `Status do projeto atualizado via useProjectActions para: ${status}`,
          details: {
            project_id: projectId,
            new_status: status,
            timestamp: new Date().toISOString(),
            webhook_triggered_by: 'database_trigger',
            auto_processed: true
          }
        });
        
    } catch (error) {
      console.error('Erro na atualização do status do projeto:', error);
      toast.error('Erro ao atualizar status do projeto');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const updateStageStatus = async (stageId: string, status: string) => {
    setIsLoading(true);
    console.log('Atualizando status da etapa:', stageId, 'para:', status);
    
    try {
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
        throw error;
      }
      
      console.log('Status da etapa atualizado com sucesso - webhook disparado automaticamente via trigger');
      toast.success('Status da etapa atualizado com sucesso');
      
      // Processar webhooks imediatamente
      setTimeout(() => {
        processWebhooksImmediately();
      }, 500);
      
      // Log simplificado
      await supabase
        .from('system_logs')
        .insert({
          log_type: 'info',
          category: 'stage_action',
          message: `Status da etapa atualizado via useProjectActions para: ${status}`,
          details: {
            stage_id: stageId,
            new_status: status,
            timestamp: new Date().toISOString(),
            webhook_triggered_by: 'database_trigger',
            auto_processed: true
          }
        });
        
    } catch (error) {
      console.error('Erro na atualização do status da etapa:', error);
      toast.error('Erro ao atualizar status da etapa');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const completeProject = async (projectId: string) => {
    setIsLoading(true);
    console.log('Concluindo projeto:', projectId);
    
    try {
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
        throw error;
      }
      
      console.log('Projeto concluído com sucesso - webhook disparado automaticamente via trigger');
      toast.success('Projeto concluído com sucesso');
      
      // Processar webhooks imediatamente
      setTimeout(() => {
        processWebhooksImmediately();
      }, 500);
      
      // Log simplificado
      await supabase
        .from('system_logs')
        .insert({
          log_type: 'info',
          category: 'project_action',
          message: 'Projeto concluído via useProjectActions',
          details: {
            project_id: projectId,
            action: 'complete',
            timestamp: new Date().toISOString(),
            webhook_triggered_by: 'database_trigger',
            auto_processed: true
          }
        });
        
    } catch (error) {
      console.error('Erro na conclusão do projeto:', error);
      toast.error('Erro ao concluir projeto');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const completeStage = async (stageId: string) => {
    setIsLoading(true);
    console.log('Concluindo etapa:', stageId);
    
    try {
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
        throw error;
      }
      
      console.log('Etapa concluída com sucesso - webhook disparado automaticamente via trigger');
      toast.success('Etapa concluída com sucesso');
      
      // Processar webhooks imediatamente
      setTimeout(() => {
        processWebhooksImmediately();
      }, 500);
      
      // Log simplificado
      await supabase
        .from('system_logs')
        .insert({
          log_type: 'info',
          category: 'stage_action',
          message: 'Etapa concluída via useProjectActions',
          details: {
            stage_id: stageId,
            action: 'complete',
            timestamp: new Date().toISOString(),
            webhook_triggered_by: 'database_trigger',
            auto_processed: true
          }
        });
        
    } catch (error) {
      console.error('Erro na conclusão da etapa:', error);
      toast.error('Erro ao concluir etapa');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const uncompleteStage = async (stageId: string) => {
    setIsLoading(true);
    console.log('Desfazendo conclusão da etapa:', stageId);
    
    try {
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
        throw error;
      }
      
      console.log('Conclusão da etapa desfeita com sucesso - webhook disparado automaticamente via trigger');
      toast.success('Conclusão da etapa desfeita com sucesso');
      
      // Processar webhooks imediatamente
      setTimeout(() => {
        processWebhooksImmediately();
      }, 500);
      
      // Log simplificado
      await supabase
        .from('system_logs')
        .insert({
          log_type: 'info',
          category: 'stage_action',
          message: 'Conclusão da etapa desfeita via useProjectActions',
          details: {
            stage_id: stageId,
            action: 'uncomplete',
            timestamp: new Date().toISOString(),
            webhook_triggered_by: 'database_trigger',
            auto_processed: true
          }
        });
        
    } catch (error) {
      console.error('Erro ao desfazer conclusão da etapa:', error);
      toast.error('Erro ao desfazer conclusão da etapa');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const cancelProject = async (projectId: string) => {
    setIsLoading(true);
    console.log('Cancelando projeto:', projectId);
    
    try {
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
        throw error;
      }
      
      console.log('Projeto cancelado com sucesso - webhook disparado automaticamente via trigger');
      toast.success('Projeto cancelado com sucesso');
      
      // Processar webhooks imediatamente
      setTimeout(() => {
        processWebhooksImmediately();
      }, 500);
      
      // Log simplificado
      await supabase
        .from('system_logs')
        .insert({
          log_type: 'info',
          category: 'project_action',
          message: 'Projeto cancelado via useProjectActions',
          details: {
            project_id: projectId,
            action: 'cancel',
            timestamp: new Date().toISOString(),
            webhook_triggered_by: 'database_trigger',
            auto_processed: true
          }
        });
        
    } catch (error) {
      console.error('Erro no cancelamento do projeto:', error);
      toast.error('Erro ao cancelar projeto');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteStage = async (stageId: string) => {
    setIsLoading(true);
    console.log('Deletando etapa:', stageId);
    
    try {
      const { data, error } = await supabase
        .rpc('delete_project_stage', { stage_id: stageId });

      if (error) {
        console.error('Erro ao excluir etapa:', error);
        toast.error('Erro ao excluir etapa');
        throw error;
      }
      
      console.log('Etapa excluída com sucesso - webhook disparado automaticamente via trigger');
      toast.success('Etapa excluída com sucesso');
      
      // Processar webhooks imediatamente
      setTimeout(() => {
        processWebhooksImmediately();
      }, 500);
      
      // Log simplificado
      await supabase
        .from('system_logs')
        .insert({
          log_type: 'info',
          category: 'stage_action',
          message: 'Etapa excluída via useProjectActions',
          details: {
            stage_id: stageId,
            action: 'delete',
            timestamp: new Date().toISOString(),
            webhook_triggered_by: 'database_trigger',
            auto_processed: true
          }
        });
        
      return true;
    } catch (error) {
      console.error('Erro na exclusão da etapa:', error);
      toast.error('Erro ao excluir etapa');
      throw error;
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
    deleteStage,
    processWebhooksImmediately,
  };
};
