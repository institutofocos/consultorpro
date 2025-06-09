
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
    interval_seconds: 5,
    enabled: true
  });

  // Função para processar a fila de webhooks
  const processWebhookQueue = useCallback(async () => {
    if (!config.enabled || isProcessing) return;
    
    setIsProcessing(true);
    console.log('Processando fila de webhooks automaticamente...');
    
    try {
      const { data, error } = await supabase.functions.invoke('webhooks', {
        body: { action: 'process' }
      });

      if (error) {
        console.error('Erro ao processar fila de webhooks:', error);
        return;
      }

      if (data?.success) {
        console.log('Fila de webhooks processada:', data.message);
        // Log de sucesso apenas se houver webhooks processados
        if (data.processed_count && data.processed_count > 0) {
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
      }
    } catch (error) {
      console.error('Erro no processamento automático de webhooks:', error);
      await supabase
        .from('system_logs')
        .insert({
          log_type: 'error',
          category: 'webhook_processor',
          message: 'Erro no processamento automático de webhooks: ' + (error instanceof Error ? error.message : 'Erro desconhecido'),
          details: {
            error: error instanceof Error ? error.message : 'Erro desconhecido',
            timestamp: new Date().toISOString()
          }
        });
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
        console.error('Erro ao enviar webhook de projeto:', error);
        return false;
      }

      if (data?.success) {
        console.log('Webhook de projeto enviado com sucesso:', data.message);
        await supabase
          .from('system_logs')
          .insert({
            log_type: 'success',
            category: 'project_webhook',
            message: `Webhook consolidado enviado para projeto ${projectId}`,
            details: {
              project_id: projectId,
              timestamp: new Date().toISOString()
            }
          });
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Erro no envio de webhook de projeto:', error);
      await supabase
        .from('system_logs')
        .insert({
          log_type: 'error',
          category: 'project_webhook',
          message: 'Erro no envio de webhook de projeto: ' + (error instanceof Error ? error.message : 'Erro desconhecido'),
          details: {
            project_id: projectId,
            error: error instanceof Error ? error.message : 'Erro desconhecido',
            timestamp: new Date().toISOString()
          }
        });
      return false;
    }
  }, []);

  // Configurar intervalo automático de processamento
  useEffect(() => {
    if (!config.enabled) return;

    // Processar imediatamente na inicialização
    processWebhookQueue();

    const interval = setInterval(() => {
      processWebhookQueue();
    }, config.interval_seconds * 1000);

    console.log(`Processamento automático de webhooks iniciado a cada ${config.interval_seconds} segundos`);

    return () => {
      clearInterval(interval);
      console.log('Processamento automático de webhooks parado');
    };
  }, [config.interval_seconds, config.enabled, processWebhookQueue]);

  // Processar imediatamente quando há mudanças críticas
  const processImmediately = useCallback(async () => {
    console.log('Processamento imediato de webhooks solicitado');
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
