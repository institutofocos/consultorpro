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

  // Função principal para processar a fila de webhooks consolidados únicos
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
    console.log('=== PROCESSANDO FILA DE WEBHOOKS CONSOLIDADOS ÚNICOS (PADRÃO) ===');
    
    try {
      const { data, error } = await supabase.functions.invoke('webhooks', {
        body: { action: 'process' }
      });

      if (error) {
        console.error('Erro ao processar fila de webhooks consolidados:', error);
        
        await supabase
          .from('system_logs')
          .insert({
            log_type: 'error',
            category: 'webhook_processor_consolidated_error',
            message: 'Erro no processamento consolidado único padrão: ' + error.message,
            details: {
              error: error.message,
              timestamp: new Date().toISOString(),
              consolidation_enabled: true,
              webhook_unico_padrao: true
            }
          });
        return;
      }

      if (data?.success) {
        console.log('✅ Fila consolidada única padrão processada com sucesso:', data.message);
        
        if (data.processed_count && data.processed_count > 0) {
          console.log(`📊 Webhooks consolidados únicos processados: ${data.processed_count}`);
          
          await supabase
            .from('system_logs')
            .insert({
              log_type: 'success',
              category: 'webhook_consolidado_unico_padrao_success',
              message: `${data.processed_count} webhooks consolidados únicos processados com sucesso (configuração padrão)`,
              details: {
                processed_count: data.processed_count,
                consolidated_count: data.consolidated_count || 0,
                timestamp: new Date().toISOString(),
                consolidation_enabled: true,
                webhook_unico_padrao: true
              }
            });
        } else {
          console.log('📭 Nenhum webhook consolidado único pendente para processar');
        }
      }
    } catch (error) {
      console.error('💥 Erro crítico no processamento consolidado único padrão:', error);
      
      await supabase
        .from('system_logs')
        .insert({
          log_type: 'error',
          category: 'webhook_consolidado_unico_padrao_critical',
          message: 'Erro crítico no processamento consolidado único padrão: ' + (error instanceof Error ? error.message : 'Erro desconhecido'),
          details: {
            error: error instanceof Error ? error.message : 'Erro desconhecido',
            timestamp: new Date().toISOString(),
            consolidation_enabled: true,
            webhook_unico_padrao: true
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

    console.log(`🔄 Processamento automático de webhooks consolidados únicos iniciado (${config.interval_seconds}s) - Configuração Padrão`);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      console.log('⏹️ Processamento automático de webhooks consolidados únicos parado');
    };
  }, [config.interval_seconds, config.enabled, processWebhookQueue]);

  // Processar imediatamente (respeitando debounce)
  const processImmediately = useCallback(async () => {
    console.log('🚀 Processamento imediato de webhooks consolidados únicos solicitado (configuração padrão)');
    await processWebhookQueue();
  }, [processWebhookQueue]);

  // Processar forçado (ignora debounce)
  const processForced = useCallback(async () => {
    console.log('⚡ Processamento forçado de webhooks consolidados únicos solicitado (configuração padrão)');
    await processWebhookQueue(true);
  }, [processWebhookQueue]);

  // Função específica para criação de projetos consolidados únicos
  const processForProjectCreation = useCallback(async () => {
    console.log('🎯 Processamento consolidado único específico para criação de projeto (configuração padrão)');
    await processWebhookQueue(true);
  }, [processWebhookQueue]);

  // Verificar status dos webhooks consolidados únicos padrão
  const checkConsolidationStatus = useCallback(async () => {
    try {
      const { data: settings } = await supabase
        .from('system_settings')
        .select('*')
        .in('setting_key', ['webhook_consolidation_enabled', 'webhook_only_consolidated'])
        .limit(10);
      
      const consolidationEnabled = settings?.find(s => s.setting_key === 'webhook_consolidation_enabled')?.setting_value === 'true';
      const onlyConsolidated = settings?.find(s => s.setting_key === 'webhook_only_consolidated')?.setting_value === 'true';
      
      console.log('📊 Status dos webhooks consolidados únicos padrão:', {
        consolidationEnabled,
        onlyConsolidated,
        systemReady: consolidationEnabled && onlyConsolidated,
        webhookUnicoPadrao: true
      });
      
      return { consolidationEnabled, onlyConsolidated };
    } catch (error) {
      console.error('Erro ao verificar status da consolidação única padrão:', error);
      return { consolidationEnabled: false, onlyConsolidated: false };
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
    checkConsolidationStatus
  };
};
