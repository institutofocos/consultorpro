
import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

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

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastProcessTimeRef = useRef<number>(0);

  // Função principal para processar a fila de webhooks incluindo consolidados
  const processWebhookQueue = useCallback(async (force = false) => {
    if (!config.enabled || (isProcessing && !force)) return;
    
    // Controle de frequência mínima (5 segundos)
    const now = Date.now();
    const timeSinceLastProcess = now - lastProcessTimeRef.current;
    const minInterval = 5000;
    
    if (!force && timeSinceLastProcess < minInterval) {
      console.log(`Aguardando ${minInterval - timeSinceLastProcess}ms antes do próximo processamento`);
      return;
    }
    
    setIsProcessing(true);
    lastProcessTimeRef.current = now;
    console.log('=== PROCESSANDO FILA DE WEBHOOKS CONSOLIDADOS ===');
    
    try {
      const { data, error } = await supabase.functions.invoke('webhooks', {
        body: { action: 'process' }
      });

      if (error) {
        console.error('Erro ao processar fila de webhooks:', error);
        
        await supabase
          .from('system_logs')
          .insert({
            log_type: 'error',
            category: 'webhook_processor_error',
            message: 'Erro no processamento: ' + error.message,
            details: {
              error: error.message,
              timestamp: new Date().toISOString()
            }
          });
        return;
      }

      if (data?.success) {
        console.log('✅ Fila processada com sucesso:', data.message);
        
        if (data.processed_count && data.processed_count > 0) {
          console.log(`📊 Processados: ${data.processed_count} webhooks`);
          
          await supabase
            .from('system_logs')
            .insert({
              log_type: 'success',
              category: 'webhook_processor_success',
              message: `${data.processed_count} webhooks processados com sucesso (incluindo consolidados)`,
              details: {
                processed_count: data.processed_count,
                consolidated_count: data.consolidated_count || 0,
                timestamp: new Date().toISOString()
              }
            });
        }
      }
    } catch (error) {
      console.error('💥 Erro crítico no processamento:', error);
      
      await supabase
        .from('system_logs')
        .insert({
          log_type: 'error',
          category: 'webhook_processor_critical',
          message: 'Erro crítico: ' + (error instanceof Error ? error.message : 'Erro desconhecido'),
          details: {
            error: error instanceof Error ? error.message : 'Erro desconhecido',
            timestamp: new Date().toISOString()
          }
        });
    } finally {
      setIsProcessing(false);
    }
  }, [config.enabled, isProcessing]);

  // Configurar intervalo automático
  useEffect(() => {
    if (!config.enabled) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Processar imediatamente na inicialização
    processWebhookQueue();

    // Configurar intervalo
    intervalRef.current = setInterval(() => {
      processWebhookQueue();
    }, config.interval_seconds * 1000);

    console.log(`🔄 Processamento automático iniciado (${config.interval_seconds}s) - Webhooks consolidados habilitados`);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      console.log('⏹️ Processamento automático parado');
    };
  }, [config.interval_seconds, config.enabled, processWebhookQueue]);

  // Processar imediatamente
  const processImmediately = useCallback(async () => {
    console.log('🚀 Processamento imediato solicitado (consolidados inclusos)');
    await processWebhookQueue();
  }, [processWebhookQueue]);

  // Processar forçado (ignora debounce)
  const processForced = useCallback(async () => {
    console.log('⚡ Processamento forçado solicitado (consolidados inclusos)');
    await processWebhookQueue(true);
  }, [processWebhookQueue]);

  // Função específica para criação de projetos consolidados
  const processForProjectCreation = useCallback(async () => {
    console.log('🎯 Processamento consolidado para criação de projeto solicitado');
    await processWebhookQueue(true);
  }, [processWebhookQueue]);

  return {
    config,
    setConfig,
    isProcessing,
    processImmediately,
    processForced,
    processWebhookQueue,
    processForProjectCreation
  };
};
