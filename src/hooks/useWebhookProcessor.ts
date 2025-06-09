
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
      }
    } catch (error) {
      console.error('Erro no processamento automático de webhooks:', error);
    } finally {
      setIsProcessing(false);
    }
  }, [config.enabled, isProcessing]);

  // Configurar intervalo automático de processamento
  useEffect(() => {
    if (!config.enabled) return;

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
    processWebhookQueue
  };
};
