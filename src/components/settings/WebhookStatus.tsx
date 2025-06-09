
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle, AlertCircle, RefreshCw, Webhook, Settings } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useWebhookProcessor } from '@/hooks/useWebhookProcessor';
import { toast } from 'sonner';

interface WebhookSystemStatus {
  consolidationEnabled: boolean;
  onlyConsolidated: boolean;
  activeWebhooks: number;
  pendingLogs: number;
  systemReady: boolean;
}

const WebhookStatus = () => {
  const [status, setStatus] = useState<WebhookSystemStatus>({
    consolidationEnabled: false,
    onlyConsolidated: false,
    activeWebhooks: 0,
    pendingLogs: 0,
    systemReady: false
  });
  const [isLoading, setIsLoading] = useState(false);
  const { processForced, checkConsolidationStatus } = useWebhookProcessor();

  const fetchStatus = async () => {
    setIsLoading(true);
    try {
      // Verificar configurações do sistema
      const { consolidationEnabled, onlyConsolidated } = await checkConsolidationStatus();
      
      // Contar webhooks ativos
      const { data: webhooks } = await supabase
        .from('webhooks')
        .select('id')
        .eq('is_active', true);
      
      // Contar logs pendentes APENAS consolidados
      const { data: logs } = await supabase
        .from('webhook_logs')
        .select('id')
        .eq('success', false)
        .eq('event_type', 'project_created_consolidated')
        .lt('attempt_count', 3);
      
      const newStatus = {
        consolidationEnabled,
        onlyConsolidated,
        activeWebhooks: webhooks?.length || 0,
        pendingLogs: logs?.length || 0,
        systemReady: consolidationEnabled && onlyConsolidated
      };
      
      setStatus(newStatus);
      
      console.log('📊 Status dos webhooks únicos atualizado:', newStatus);
    } catch (error) {
      console.error('Erro ao buscar status:', error);
      toast.error('Erro ao carregar status dos webhooks');
    } finally {
      setIsLoading(false);
    }
  };

  const processQueue = async () => {
    try {
      console.log('🚀 Processando fila de webhooks consolidados únicos');
      await processForced();
      toast.success('Fila de webhooks únicos processada');
      await fetchStatus();
    } catch (error) {
      console.error('Erro ao processar fila:', error);
      toast.error('Erro ao processar fila de webhooks');
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const getStatusBadge = () => {
    if (status.systemReady) {
      return (
        <Badge variant="default" className="bg-green-500">
          <CheckCircle className="h-3 w-3 mr-1" />
          Sistema Consolidado Único Ativo (Padrão)
        </Badge>
      );
    } else {
      return (
        <Badge variant="destructive">
          <AlertCircle className="h-3 w-3 mr-1" />
          Configuração Incompleta
        </Badge>
      );
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Webhook className="h-5 w-5" />
            <span>Status - Webhook Único Consolidado</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchStatus}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Status do Sistema:</span>
          {getStatusBadge()}
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <div className="text-xs text-muted-foreground">Consolidação Habilitada</div>
            <Badge variant={status.consolidationEnabled ? "default" : "outline"}>
              {status.consolidationEnabled ? "✅ Ativo" : "❌ Inativo"}
            </Badge>
          </div>
          <div className="space-y-1">
            <div className="text-xs text-muted-foreground">Apenas Consolidados</div>
            <Badge variant={status.onlyConsolidated ? "default" : "outline"}>
              {status.onlyConsolidated ? "✅ Ativo" : "❌ Inativo"}
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <div className="text-xs text-muted-foreground">Webhooks Ativos</div>
            <Badge variant="outline">{status.activeWebhooks}</Badge>
          </div>
          <div className="space-y-1">
            <div className="text-xs text-muted-foreground">Logs Consolidados Pendentes</div>
            <Badge variant={status.pendingLogs > 0 ? "secondary" : "outline"}>
              {status.pendingLogs}
            </Badge>
          </div>
        </div>

        {status.systemReady && (
          <div className="text-xs text-green-600 bg-green-50 p-3 rounded border border-green-200">
            <div className="font-medium mb-1">✅ Sistema Otimizado e Funcionando</div>
            <div>
              <strong>Configuração Padrão Ativa:</strong> O sistema agora está configurado por padrão para enviar APENAS UM webhook consolidado contendo todas as informações do projeto (cliente, serviço, consultor, etapas) em uma única requisição quando um novo projeto é criado.
            </div>
          </div>
        )}

        {!status.systemReady && (
          <div className="text-xs text-amber-600 bg-amber-50 p-3 rounded border border-amber-200">
            <div className="font-medium mb-1">⚠️ Atenção</div>
            <div>O sistema deve estar configurado automaticamente. Clique em "Atualizar" para verificar o status mais recente.</div>
          </div>
        )}

        {status.pendingLogs > 0 && (
          <div className="pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={processQueue}
              className="w-full"
            >
              <Webhook className="h-4 w-4 mr-2" />
              Processar Fila Consolidada ({status.pendingLogs} pendentes)
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default WebhookStatus;
