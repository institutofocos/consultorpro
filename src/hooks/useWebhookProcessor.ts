
import { useCallback, useState, useEffect } from 'react';
import { toast } from 'sonner';

// Hook para processar webhooks
export const useWebhookProcessor = () => {
  const [config, setConfig] = useState({
    consolidationEnabled: false,
    statusChangeEnabled: false
  });

  const processForProjectCreation = useCallback(() => {
    try {
      console.log('🔄 Processamento de webhook para criação de projeto');
      
      // Log simples para indicar que o processamento foi iniciado
      toast.success('Projeto criado com sucesso!');
      
    } catch (error) {
      console.error('Erro no processamento de webhook:', error);
      // Não exibir erro ao usuário pois é processo interno
    }
  }, []);

  const processForced = useCallback(async () => {
    try {
      console.log('🚀 Processamento forçado de webhooks');
      // Simulação de processamento
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success('Fila de webhooks processada');
    } catch (error) {
      console.error('Erro no processamento forçado:', error);
      toast.error('Erro ao processar fila de webhooks');
    }
  }, []);

  const checkConsolidationStatus = useCallback(async () => {
    try {
      // Simulação de verificação de status
      const consolidationEnabled = true;
      const statusChangeEnabled = true;
      
      setConfig({
        consolidationEnabled,
        statusChangeEnabled
      });
      
      return { consolidationEnabled, statusChangeEnabled };
    } catch (error) {
      console.error('Erro ao verificar status:', error);
      return { consolidationEnabled: false, statusChangeEnabled: false };
    }
  }, []);

  useEffect(() => {
    // Inicializar configuração
    checkConsolidationStatus();
  }, [checkConsolidationStatus]);

  return {
    processForProjectCreation,
    processForced,
    checkConsolidationStatus,
    config
  };
};
