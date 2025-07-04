
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

  // Função principal para processar a fila de webhooks (incluindo status changes)
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
    console.log('=== PROCESSANDO FILA DE WEBHOOKS (INCLUINDO STATUS CHANGES) ===');
    
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
            message: 'Erro no processamento de webhooks (incluindo status changes): ' + error.message,
            details: {
              error: error.message,
              timestamp: new Date().toISOString(),
              includes_status_changes: true
            }
          });
        return;
      }

      if (data?.success) {
        console.log('✅ Fila de webhooks processada com sucesso:', data.message);
        
        if (data.processed_count && data.processed_count > 0) {
          console.log(`📊 Webhooks processados: ${data.processed_count} (incluindo status changes)`);
          
          await supabase
            .from('system_logs')
            .insert({
              log_type: 'success',
              category: 'webhook_processor_success',
              message: `${data.processed_count} webhooks processados com sucesso (incluindo mudanças de status)`,
              details: {
                processed_count: data.processed_count,
                success_count: data.success_count || 0,
                timestamp: new Date().toISOString(),
                includes_status_changes: true
              }
            });
        } else {
          console.log('📭 Nenhum webhook pendente para processar');
        }
      }
    } catch (error) {
      console.error('💥 Erro crítico no processamento de webhooks:', error);
      
      await supabase
        .from('system_logs')
        .insert({
          log_type: 'error',
          category: 'webhook_processor_critical',
          message: 'Erro crítico no processamento de webhooks: ' + (error instanceof Error ? error.message : 'Erro desconhecido'),
          details: {
            error: error instanceof Error ? error.message : 'Erro desconhecido',
            timestamp: new Date().toISOString(),
            includes_status_changes: true
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

    console.log(`🔄 Processamento automático de webhooks iniciado (${config.interval_seconds}s) - Incluindo Status Changes`);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      console.log('⏹️ Processamento automático de webhooks parado');
    };
  }, [config.interval_seconds, config.enabled, processWebhookQueue]);

  // Processar imediatamente (respeitando debounce)
  const processImmediately = useCallback(async () => {
    console.log('🚀 Processamento imediato de webhooks solicitado (incluindo status changes)');
    await processWebhookQueue();
  }, [processWebhookQueue]);

  // Processar forçado (ignora debounce)
  const processForced = useCallback(async () => {
    console.log('⚡ Processamento forçado de webhooks solicitado (incluindo status changes)');
    await processWebhookQueue(true);
  }, [processWebhookQueue]);

  // Função específica para criação de projetos
  const processForProjectCreation = useCallback(async () => {
    console.log('🎯 Processamento específico para criação de projeto');
    await processWebhookQueue(true);
  }, [processWebhookQueue]);

  // Verificar status dos webhooks
  const checkWebhookStatus = useCallback(async () => {
    try {
      const { data: settings } = await supabase
        .from('system_settings')
        .select('*')
        .in('setting_key', ['webhook_consolidation_enabled', 'webhook_status_change_enabled'])
        .limit(10);
      
      const consolidationEnabled = settings?.find(s => s.setting_key === 'webhook_consolidation_enabled')?.setting_value === 'true';
      const statusChangeEnabled = settings?.find(s => s.setting_key === 'webhook_status_change_enabled')?.setting_value === 'true';
      
      console.log('📊 Status dos webhooks:', {
        consolidationEnabled,
        statusChangeEnabled,
        systemReady: consolidationEnabled && statusChangeEnabled
      });
      
      return { consolidationEnabled, statusChangeEnabled };
    } catch (error) {
      console.error('Erro ao verificar status dos webhooks:', error);
      return { consolidationEnabled: false, statusChangeEnabled: false };
    }
  }, []);

  return {
    config,
    setConfig,
    isProcessing,
    processImmediately,
    processForced,
    processWebhookQueue,
    processForProjectCreation,
    checkConsolidationStatus: checkWebhookStatus
  };
};
