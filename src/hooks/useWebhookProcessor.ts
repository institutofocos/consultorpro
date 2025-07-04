
import { useCallback } from 'react';
import { toast } from 'sonner';

// Hook simplificado para processar webhooks consolidados
export const useWebhookProcessor = () => {
  const processForProjectCreation = useCallback(() => {
    try {
      console.log('🔄 Processamento de webhook consolidado para criação de projeto');
      
      // Log simples para indicar que o processamento foi iniciado
      // O processamento real dos webhooks acontece no backend
      toast.success('Projeto criado com sucesso!');
      
    } catch (error) {
      console.error('Erro no processamento de webhook:', error);
      // Não exibir erro ao usuário pois é processo interno
    }
  }, []);

  return {
    processForProjectCreation
  };
};
