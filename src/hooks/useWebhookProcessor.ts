
import { supabase } from '@/integrations/supabase/client';

export const useWebhookProcessor = () => {
  const processWebhookQueue = async () => {
    console.log('=== PROCESSANDO FILA DE WEBHOOKS (INCLUINDO STATUS CHANGES) ===');
    
    try {
      const { data, error } = await supabase.functions.invoke('webhooks', {
        body: {
          action: 'process_queue',
          include_status_changes: true
        }
      });

      if (error) {
        throw error;
      }

      console.log('✅ Webhooks processados com sucesso:', data);
      return data;
    } catch (error) {
      console.error('Erro ao processar fila de webhooks:', error);
      throw error;
    }
  };

  const processForProjectCreation = async () => {
    console.log('🔄 Processamento consolidado de webhook para criação de projeto');
    
    try {
      // Aguardar um momento para garantir que todas as operações relacionadas ao projeto estejam concluídas
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const { data, error } = await supabase.functions.invoke('webhooks', {
        body: {
          action: 'process_project_creation',
          consolidate: true
        }
      });

      if (error) {
        console.error('Erro no processamento de webhook de criação:', error);
        return;
      }

      console.log('✅ Webhook de criação de projeto processado:', data);
      return data;
    } catch (error) {
      console.error('Erro ao processar webhook de criação:', error);
    }
  };

  const processForStatusChange = async (entityType: 'project' | 'stage', entityId: string, oldStatus?: string, newStatus?: string) => {
    console.log(`🔄 Processamento de webhook para mudança de status ${entityType}:`, {
      entityId,
      oldStatus,
      newStatus
    });
    
    try {
      const { data, error } = await supabase.functions.invoke('webhooks', {
        body: {
          action: 'process_status_change',
          entity_type: entityType,
          entity_id: entityId,
          old_status: oldStatus,
          new_status: newStatus
        }
      });

      if (error) {
        console.error('Erro no processamento de webhook de status:', error);
        return;
      }

      console.log('✅ Webhook de mudança de status processado:', data);
      return data;
    } catch (error) {
      console.error('Erro ao processar webhook de status:', error);
    }
  };

  // Novo método processForced - alias para processWebhookQueue
  const processForced = async () => {
    console.log('🚀 Processamento forçado de webhooks iniciado');
    return await processWebhookQueue();
  };

  // Novo método checkConsolidationStatus
  const checkConsolidationStatus = async () => {
    console.log('📊 Verificando status de consolidação de webhooks');
    
    try {
      // Verificar se há webhooks ativos
      const { data: webhooks, error: webhookError } = await supabase
        .from('webhooks')
        .select('id, is_active, tables, events')
        .eq('is_active', true);

      if (webhookError) {
        console.error('Erro ao verificar webhooks:', webhookError);
        return {
          consolidationEnabled: false,
          statusChangeEnabled: false
        };
      }

      // Verificar se há webhooks para criação de projetos
      const consolidationEnabled = webhooks?.some(w => 
        w.tables?.includes('projects') && w.events?.includes('INSERT')
      ) || false;

      // Verificar se há webhooks para mudanças de status
      const statusChangeEnabled = webhooks?.some(w => 
        (w.tables?.includes('projects') || w.tables?.includes('project_stages')) && 
        w.events?.includes('UPDATE')
      ) || false;

      console.log('Status de consolidação:', {
        consolidationEnabled,
        statusChangeEnabled
      });

      return {
        consolidationEnabled,
        statusChangeEnabled
      };
    } catch (error) {
      console.error('Erro ao verificar status de consolidação:', error);
      return {
        consolidationEnabled: false,
        statusChangeEnabled: false
      };
    }
  };

  // Auto-processamento a cada 5 segundos
  const startAutoProcessing = () => {
    console.log('🔄 Processamento automático de webhooks iniciado (5s) - Incluindo Status Changes');
    
    const interval = setInterval(async () => {
      try {
        await processWebhookQueue();
      } catch (error) {
        console.error('Erro no processamento automático:', error);
      }
    }, 5000);

    return () => {
      console.log('⏹️ Processamento automático de webhooks parado');
      clearInterval(interval);
    };
  };

  // Configuração do sistema
  const config = {
    autoProcessingEnabled: true,
    processingInterval: 5000,
    maxRetries: 3,
    consolidationEnabled: true,
    statusChangeEnabled: true
  };

  return {
    processWebhookQueue,
    processForProjectCreation,
    processForStatusChange,
    processForced,
    checkConsolidationStatus,
    startAutoProcessing,
    config
  };
};
