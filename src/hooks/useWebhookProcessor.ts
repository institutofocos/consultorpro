
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface WebhookConfig {
  interval_seconds: number;
  enabled: boolean;
}

export const useWebhookProcessor = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [config, setConfig] = useState<WebhookConfig>({
    interval_seconds: 30, // Aumentei o intervalo para reduzir spam de logs
    enabled: true
  });

  // Função para processar a fila de webhooks
  const processWebhookQueue = useCallback(async () => {
    if (!config.enabled || isProcessing) return;
    
    setIsProcessing(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('webhooks', {
        body: { action: 'process' }
      });

      if (error) {
        // Log silencioso para evitar spam no console
        console.debug('Webhook processing skipped:', error.message);
        return;
      }

      if (data?.success && data.processed_count && data.processed_count > 0) {
        console.log('Webhooks processados:', data.processed_count);
        await supabase
          .from('system_logs')
          .insert({
            log_type: 'success',
            category: 'webhook_processor',
            message: `${data.processed_count} webhooks processados com sucesso`,
            details: {
              processed_count: data.processed_count,
              timestamp: new Date().toISOString(),
              auto_processed: true
            }
          });
      }
    } catch (error) {
      // Log silencioso para reduzir ruído
      console.debug('Erro no processamento de webhooks:', error);
    } finally {
      setIsProcessing(false);
    }
  }, [config.enabled, isProcessing]);

  // Função para enviar webhook consolidado de projeto
  const sendProjectWebhook = useCallback(async (projectId: string) => {
    try {
      console.log('Enviando webhook consolidado para projeto:', projectId);
      
      const { data, error } = await supabase.functions.invoke('webhooks', {
        body: { 
          action: 'send_project_webhook',
          project_id: projectId
        }
      });

      if (error) {
        console.debug('Erro ao enviar webhook de projeto:', error);
        return false;
      }

      if (data?.success) {
        console.log('Webhook de projeto enviado com sucesso');
        return true;
      }
      
      return false;
    } catch (error) {
      console.debug('Erro no envio de webhook de projeto:', error);
      return false;
    }
  }, []);

  // Configurar intervalo automático de processamento (com intervalo maior)
  useEffect(() => {
    if (!config.enabled) return;

    const interval = setInterval(() => {
      processWebhookQueue();
    }, config.interval_seconds * 1000);

    return () => {
      clearInterval(interval);
    };
  }, [config.interval_seconds, config.enabled, processWebhookQueue]);

  // Processar imediatamente quando há mudanças críticas
  const processImmediately = useCallback(async () => {
    await processWebhookQueue();
  }, [processWebhookQueue]);

  return {
    config,
    setConfig,
    isProcessing,
    processImmediately,
    processWebhookQueue,
    sendProjectWebhook
  };
};
