
import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface WebhookConfig {
  interval_seconds: number;
  enabled: boolean;
}

export const useWebhookProcessor = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [config, setConfig] = useState<WebhookConfig>({
    interval_seconds: 45, // Aumentado para permitir agrupamento completo
    enabled: true
  });

  // Refs para controle de debounce e agrupamento
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastProcessTimeRef = useRef<number>(0);
  const projectCreationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Função para processar a fila de webhooks com agrupamento inteligente
  const processWebhookQueue = useCallback(async (force = false) => {
    if (!config.enabled || (isProcessing && !force)) return;
    
    // Implementar debounce mais longo para agrupamento
    const now = Date.now();
    const timeSinceLastProcess = now - lastProcessTimeRef.current;
    const minInterval = 15000; // Mínimo de 15 segundos entre processamentos
    
    if (!force && timeSinceLastProcess < minInterval) {
      console.log(`Processamento em debounce - aguardando ${minInterval - timeSinceLastProcess}ms`);
      return;
    }
    
    setIsProcessing(true);
    lastProcessTimeRef.current = now;
    console.log('Processando fila de webhooks com agrupamento inteligente...');
    
    try {
      const { data, error } = await supabase.functions.invoke('webhooks', {
        body: { 
          action: 'process_grouped',
          consolidate_project_operations: true 
        }
      });

      if (error) {
        console.error('Erro ao processar fila de webhooks:', error);
        return;
      }

      if (data?.success) {
        console.log('Fila de webhooks processada com agrupamento:', data.message);
        // Log de sucesso apenas se houver webhooks processados
        if (data.processed_count && data.processed_count > 0) {
          await supabase
            .from('system_logs')
            .insert({
              log_type: 'success',
              category: 'webhook_processor',
              message: `${data.processed_count} webhooks processados com agrupamento`,
              details: {
                processed_count: data.processed_count,
                consolidated_operations: data.consolidated_operations || 0,
                timestamp: new Date().toISOString(),
                auto_processed: true,
                grouped: !force
              }
            });
        }
      }
    } catch (error) {
      console.error('Erro no processamento agrupado de webhooks:', error);
      await supabase
        .from('system_logs')
        .insert({
          log_type: 'error',
          category: 'webhook_processor',
          message: 'Erro no processamento agrupado de webhooks: ' + (error instanceof Error ? error.message : 'Erro desconhecido'),
          details: {
            error: error instanceof Error ? error.message : 'Erro desconhecido',
            timestamp: new Date().toISOString()
          }
        });
    } finally {
      setIsProcessing(false);
    }
  }, [config.enabled, isProcessing]);

  // Função de processamento com debounce inteligente para criação de projetos
  const debouncedProcessForProjectCreation = useCallback(() => {
    if (projectCreationTimeoutRef.current) {
      clearTimeout(projectCreationTimeoutRef.current);
    }

    // Aguardar 10 segundos para permitir que todas as etapas sejam criadas
    projectCreationTimeoutRef.current = setTimeout(() => {
      console.log('Processando webhooks após criação completa de projeto');
      processWebhookQueue();
    }, 10000);
  }, [processWebhookQueue]);

  // Função de processamento normal com debounce
  const debouncedProcess = useCallback(() => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    // Aguardar 8 segundos antes de processar para agrupar operações relacionadas
    debounceTimeoutRef.current = setTimeout(() => {
      processWebhookQueue();
    }, 8000);
  }, [processWebhookQueue]);

  // Configurar intervalo automático de processamento
  useEffect(() => {
    if (!config.enabled) return;

    // Processar imediatamente na inicialização (mas com debounce)
    debouncedProcess();

    const interval = setInterval(() => {
      processWebhookQueue();
    }, config.interval_seconds * 1000);

    console.log(`Processamento automático de webhooks iniciado a cada ${config.interval_seconds} segundos com agrupamento`);

    return () => {
      clearInterval(interval);
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
      if (projectCreationTimeoutRef.current) {
        clearTimeout(projectCreationTimeoutRef.current);
      }
      console.log('Processamento automático de webhooks parado');
    };
  }, [config.interval_seconds, config.enabled, debouncedProcess, processWebhookQueue]);

  // Processar imediatamente para criação de projeto (com agrupamento)
  const processForProjectCreation = useCallback(async () => {
    console.log('Processamento específico para criação de projeto solicitado');
    debouncedProcessForProjectCreation();
  }, [debouncedProcessForProjectCreation]);

  // Processar imediatamente quando há mudanças críticas (com debounce)
  const processImmediately = useCallback(async () => {
    console.log('Processamento imediato de webhooks solicitado com debounce');
    debouncedProcess();
  }, [debouncedProcess]);

  // Processar forçado (sem debounce) para casos urgentes
  const processForced = useCallback(async () => {
    console.log('Processamento forçado de webhooks solicitado');
    await processWebhookQueue(true);
  }, [processWebhookQueue]);

  return {
    config,
    setConfig,
    isProcessing,
    processImmediately,
    processForced,
    processForProjectCreation,
    processWebhookQueue: debouncedProcess
  };
};
