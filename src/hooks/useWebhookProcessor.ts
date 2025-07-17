
import { useCallback, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useWebhookProcessor = () => {
  const [isProcessing, setIsProcessing] = useState(false);

  const processConsolidatedWebhooks = useCallback(async () => {
    if (isProcessing) return;
    
    try {
      setIsProcessing(true);
      console.log('✅ Status verificado sem dependências de chat');
      
      // Process pending webhooks without any chat dependencies
      const { data: pendingLogs, error } = await supabase
        .from('webhook_logs')
        .select(`
          *,
          webhooks!inner(*)
        `)
        .eq('success', false)
        .lt('attempt_count', 3)
        .eq('webhooks.is_active', true)
        .limit(10);

      if (error) {
        console.error('Erro ao buscar webhooks pendentes:', error);
        return;
      }

      if (pendingLogs && pendingLogs.length > 0) {
        console.log(`Processando ${pendingLogs.length} webhooks pendentes`);
        
        for (const log of pendingLogs) {
          try {
            // Update attempt count
            await supabase
              .from('webhook_logs')
              .update({ 
                attempt_count: log.attempt_count + 1,
                updated_at: new Date().toISOString()
              })
              .eq('id', log.id);
              
          } catch (logError) {
            console.error('Erro ao processar webhook individual:', logError);
          }
        }
      }
    } catch (error) {
      console.error('Erro ao processar webhooks consolidados:', error);
    } finally {
      setIsProcessing(false);
    }
  }, [isProcessing]);

  const processStatusChangeWebhooks = useCallback(async () => {
    try {
      // Process status change webhooks for projects and stages only
      const { data: statusChangeLogs, error } = await supabase
        .from('webhook_logs')
        .select('*')
        .eq('success', false)
        .in('table_name', ['projects', 'project_stages'])
        .limit(5);

      if (error) {
        console.error('Erro ao buscar webhooks de mudança de status:', error);
        return;
      }

      if (statusChangeLogs && statusChangeLogs.length > 0) {
        console.log(`Processando ${statusChangeLogs.length} webhooks de status`);
      }
    } catch (error) {
      console.error('Erro ao processar webhooks de status:', error);
    }
  }, []);

  return {
    processConsolidatedWebhooks,
    processStatusChangeWebhooks,
    isProcessing
  };
};
