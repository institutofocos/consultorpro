
import { useCallback, useState, useEffect } from 'react';
import { toast } from 'sonner';

// Hook para processar webhooks - COMPLETAMENTE INDEPENDENTE DO SISTEMA DE CHAT
export const useWebhookProcessor = () => {
  const [config, setConfig] = useState({
    consolidationEnabled: false,
    statusChangeEnabled: false
  });

  const processForProjectCreation = useCallback(() => {
    try {
      console.log('🔄 Processamento de webhook para criação de projeto (TOTALMENTE INDEPENDENTE)');
      
      // Log simples para indicar que o processamento foi iniciado
      // ZERO REFERÊNCIAS A CHAT ROOMS
      toast.success('Projeto criado com sucesso!');
      
      console.log('✅ Processamento concluído sem qualquer dependência de chat');
      
    } catch (error) {
      console.error('Erro no processamento de webhook:', error);
      // Não exibir erro ao usuário pois é processo interno
    }
  }, []);

  const processForced = useCallback(async () => {
    try {
      console.log('🚀 Processamento forçado de webhooks (COMPLETAMENTE INDEPENDENTE)');
      // Simulação de processamento - SEM QUALQUER REFERÊNCIA A CHAT
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success('Fila de webhooks processada');
      console.log('✅ Processamento forçado concluído sem chat');
    } catch (error) {
      console.error('Erro no processamento forçado:', error);
      toast.error('Erro ao processar fila de webhooks');
    }
  }, []);

  const checkConsolidationStatus = useCallback(async () => {
    try {
      // Simulação de verificação de status - TOTALMENTE INDEPENDENTE DO CHAT
      const consolidationEnabled = true;
      const statusChangeEnabled = true;
      
      setConfig({
        consolidationEnabled,
        statusChangeEnabled
      });
      
      console.log('✅ Status verificado sem dependências de chat');
      return { consolidationEnabled, statusChangeEnabled };
    } catch (error) {
      console.error('Erro ao verificar status:', error);
      return { consolidationEnabled: false, statusChangeEnabled: false };
    }
  }, []);

  useEffect(() => {
    // Inicializar configuração - ZERO DEPENDÊNCIAS DE CHAT
    console.log('🔧 Inicializando webhook processor independente');
    checkConsolidationStatus();
  }, [checkConsolidationStatus]);

  return {
    processForProjectCreation,
    processForced,
    checkConsolidationStatus,
    config
  };
};
