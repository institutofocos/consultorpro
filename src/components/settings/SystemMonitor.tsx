
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, AlertCircle, CheckCircle, Info, AlertTriangle, Webhook } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface SystemLog {
  id: string;
  log_type: string;
  category: string;
  message: string;
  details: any;
  created_at: string;
}

interface ConsolidationStatus {
  webhookConsolidationEnabled: boolean;
  onlyConsolidated: boolean;
  systemReady: boolean;
}

const SystemMonitor = () => {
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [consolidationStatus, setConsolidationStatus] = useState<ConsolidationStatus>({
    webhookConsolidationEnabled: false,
    onlyConsolidated: false,
    systemReady: false
  });
  const [isLoading, setIsLoading] = useState(false);

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('system_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Erro ao buscar logs:', error);
        toast.error('Erro ao carregar logs do sistema');
        return;
      }

      setLogs(data || []);
    } catch (error) {
      console.error('Erro ao buscar logs:', error);
      toast.error('Erro ao carregar logs do sistema');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchConsolidationStatus = async () => {
    try {
      const { data: settings } = await supabase
        .from('system_settings')
        .select('*')
        .in('setting_key', ['webhook_consolidation_enabled', 'webhook_only_consolidated']);

      const webhookConsolidationEnabled = settings?.find(s => s.setting_key === 'webhook_consolidation_enabled')?.setting_value === 'true';
      const onlyConsolidated = settings?.find(s => s.setting_key === 'webhook_only_consolidated')?.setting_value === 'true';

      setConsolidationStatus({
        webhookConsolidationEnabled,
        onlyConsolidated,
        systemReady: webhookConsolidationEnabled && onlyConsolidated
      });
    } catch (error) {
      console.error('Erro ao buscar status da consolidação:', error);
    }
  };

  useEffect(() => {
    fetchLogs();
    fetchConsolidationStatus();
  }, []);

  const getLogIcon = (logType: string) => {
    switch (logType) {
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      default:
        return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  const getLogBadgeColor = (logType: string) => {
    switch (logType) {
      case 'error':
        return 'destructive';
      case 'warning':
        return 'secondary';
      case 'success':
        return 'default';
      default:
        return 'outline';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR');
  };

  const getConsolidationStatusBadge = () => {
    if (consolidationStatus.systemReady) {
      return <Badge variant="default" className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" />Sistema Consolidado Ativo</Badge>;
    } else if (consolidationStatus.webhookConsolidationEnabled) {
      return <Badge variant="secondary"><AlertTriangle className="h-3 w-3 mr-1" />Parcialmente Configurado</Badge>;
    } else {
      return <Badge variant="destructive"><AlertCircle className="h-3 w-3 mr-1" />Sistema Padrão</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center space-x-2">
            <Webhook className="h-5 w-5" />
            <span>Status dos Webhooks Consolidados</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Status do Sistema:</span>
              {getConsolidationStatusBadge()}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <div className="text-xs text-muted-foreground">Consolidação Habilitada</div>
                <Badge variant={consolidationStatus.webhookConsolidationEnabled ? "default" : "outline"}>
                  {consolidationStatus.webhookConsolidationEnabled ? "Sim" : "Não"}
                </Badge>
              </div>
              <div className="space-y-1">
                <div className="text-xs text-muted-foreground">Apenas Consolidados</div>
                <Badge variant={consolidationStatus.onlyConsolidated ? "default" : "outline"}>
                  {consolidationStatus.onlyConsolidated ? "Sim" : "Não"}
                </Badge>
              </div>
            </div>
            {consolidationStatus.systemReady && (
              <div className="text-xs text-green-600 bg-green-50 p-2 rounded">
                ✅ Sistema configurado para enviar webhooks consolidados contendo todos os dados do projeto em uma única requisição.
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle>Monitor do Sistema</CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              fetchLogs();
              fetchConsolidationStatus();
            }}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </CardHeader>
        <CardContent>
          {logs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum log encontrado
            </div>
          ) : (
            <div className="space-y-3">
              {logs.map((log) => (
                <div key={log.id} className="border rounded-lg p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {getLogIcon(log.log_type)}
                      <Badge variant={getLogBadgeColor(log.log_type) as any}>
                        {log.log_type}
                      </Badge>
                      <Badge variant="outline">
                        {log.category}
                      </Badge>
                      {log.category.includes('consolidated') && (
                        <Badge variant="default" className="bg-blue-500">
                          <Webhook className="h-3 w-3 mr-1" />
                          Consolidado
                        </Badge>
                      )}
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {formatDate(log.created_at)}
                    </span>
                  </div>
                  <p className="text-sm">{log.message}</p>
                  {log.details && (
                    <details className="text-xs text-muted-foreground">
                      <summary className="cursor-pointer">Detalhes</summary>
                      <pre className="mt-2 whitespace-pre-wrap">
                        {JSON.stringify(log.details, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SystemMonitor;
