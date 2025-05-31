
import React, { useState, useEffect } from 'react';
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardContent 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { 
  AlertCircle, 
  CheckCircle2, 
  X, 
  RefreshCw, 
  TestTube, 
  Zap, 
  Database, 
  Shield, 
  Activity,
  Clock,
  History,
  AlertTriangle,
  Settings,
  Globe
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Webhook {
  id: string;
  url: string;
  events: string[];
  tables: string[];
  is_active: boolean;
  created_at: string;
}

interface WebhookConfig {
  interval_seconds: number;
  enabled: boolean;
}

interface WebhookLog {
  id: string;
  webhook_id: string;
  event_type: string;
  table_name: string;
  success: boolean;
  response_status: number | null;
  response_body: string | null;
  error_message: string | null;
  attempt_count: number;
  created_at: string;
  updated_at: string;
}

const WebhookManagement: React.FC = () => {
  const [webhookUrl, setWebhookUrl] = useState<string>('');
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [webhookLogs, setWebhookLogs] = useState<WebhookLog[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isTesting, setIsTesting] = useState<string>('');
  const [isSettingUpTriggers, setIsSettingUpTriggers] = useState<boolean>(false);
  const [urlValidation, setUrlValidation] = useState<{ isValid: boolean; message: string }>({ 
    isValid: true, 
    message: '' 
  });

  // Local webhook config state (no database persistence)
  const [webhookConfig, setWebhookConfig] = useState<WebhookConfig>({
    interval_seconds: 5,
    enabled: true
  });

  const [selectedEvents, setSelectedEvents] = useState<Record<string, boolean>>({
    INSERT: true,
    UPDATE: true,
    DELETE: true
  });

  const [selectedTables, setSelectedTables] = useState<Record<string, boolean>>({
    consultants: true,
    clients: true,
    projects: true,
    services: true,
    project_stages: true,
    financial_transactions: true,
    accounts_payable: true,
    accounts_receivable: true,
    manual_transactions: true,
    user_profiles: true,
    project_status_settings: true,
    webhooks: true,
    project_tags: true
  });

  useEffect(() => {
    fetchWebhooks();
    fetchWebhookLogs();
  }, []);

  // Real-time URL validation
  useEffect(() => {
    const validateUrl = async () => {
      if (!webhookUrl.trim()) {
        setUrlValidation({ isValid: true, message: '' });
        return;
      }

      try {
        const url = new URL(webhookUrl);
        if (!['http:', 'https:'].includes(url.protocol)) {
          setUrlValidation({ 
            isValid: false, 
            message: 'URL deve usar protocolo HTTP ou HTTPS' 
          });
          return;
        }

        setUrlValidation({ isValid: true, message: 'URL válida' });
      } catch {
        setUrlValidation({ 
          isValid: false, 
          message: 'Formato de URL inválido' 
        });
      }
    };

    const timeoutId = setTimeout(validateUrl, 500);
    return () => clearTimeout(timeoutId);
  }, [webhookUrl]);

  const callWebhookFunction = async (action: string, data: any = {}) => {
    console.log(`=== CALLING WEBHOOK FUNCTION: ${action} ===`, data);
    
    try {
      const { data: result, error } = await supabase.functions.invoke('webhooks', {
        body: { action, ...data }
      });

      if (error) {
        console.error('Webhook function error:', error);
        throw new Error(error.message || 'Webhook function failed');
      }

      if (!result || result.success === false) {
        throw new Error(result?.message || 'Webhook operation failed');
      }
      
      return result;
    } catch (error) {
      console.error('Error calling webhook function:', error);
      throw error;
    }
  };

  const fetchWebhooks = async () => {
    try {
      setIsLoading(true);
      const result = await callWebhookFunction('list');
      setWebhooks(result.webhooks || []);
    } catch (error) {
      console.error("Error loading webhooks:", error);
      toast.error("Erro ao carregar webhooks", {
        description: error instanceof Error ? error.message : "Falha ao carregar webhooks registrados",
        icon: <AlertCircle className="h-5 w-5 text-destructive" />
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchWebhookLogs = async () => {
    try {
      // Use a raw SQL query since the table might not be in the generated types yet
      const { data: logs, error } = await supabase
        .rpc('execute_sql', { 
          query: 'SELECT * FROM webhook_logs ORDER BY created_at DESC LIMIT 50' 
        });

      if (error) {
        console.error("Error loading webhook logs:", error);
        // Don't show error toast for logs as it's not critical
        return;
      }
      
      // Transform the data to match our interface
      const formattedLogs: WebhookLog[] = (logs || []).map((log: any) => ({
        id: log.id,
        webhook_id: log.webhook_id,
        event_type: log.event_type,
        table_name: log.table_name,
        success: log.success,
        response_status: log.response_status,
        response_body: log.response_body,
        error_message: log.error_message,
        attempt_count: log.attempt_count || 1,
        created_at: log.created_at,
        updated_at: log.updated_at
      }));
      
      setWebhookLogs(formattedLogs);
    } catch (error) {
      console.error("Error loading webhook logs:", error);
      // Don't show error toast for logs as it's not critical
    }
  };

  const setupDatabaseTriggers = async () => {
    try {
      setIsSettingUpTriggers(true);
      console.log('Configurando triggers automáticos avançados...');
      
      toast.info("Configurando sistema automático", {
        description: "Criando triggers para todas as tabelas do sistema"
      });
      
      const result = await callWebhookFunction('setup_triggers');
      
      if (result.success) {
        const successTriggers = result.results.filter((r: any) => r.status === 'created');
        const errorTriggers = result.results.filter((r: any) => r.status === 'error');
        
        if (successTriggers.length > 0) {
          toast.success("Sistema automático configurado!", {
            description: `${successTriggers.length} triggers criados com sucesso`,
            icon: <CheckCircle2 className="h-5 w-5 text-success" />
          });
        }
        
        if (errorTriggers.length > 0) {
          toast.error("Alguns triggers falharam", {
            description: `${errorTriggers.length} trigger(s) tiveram erro`,
            icon: <AlertCircle className="h-5 w-5 text-destructive" />
          });
        }
      }
      
    } catch (error) {
      console.error("Error setting up database triggers:", error);
      toast.error("Erro na configuração automática", {
        description: error instanceof Error ? error.message : "Falha ao configurar sistema automático",
        icon: <AlertCircle className="h-5 w-5 text-destructive" />
      });
    } finally {
      setIsSettingUpTriggers(false);
    }
  };

  const handleRegisterWebhook = async () => {
    if (!urlValidation.isValid) {
      toast.error("URL inválida", {
        description: urlValidation.message,
        icon: <AlertCircle className="h-5 w-5 text-destructive" />
      });
      return;
    }

    const events = Object.keys(selectedEvents).filter(key => selectedEvents[key]);
    const tables = Object.keys(selectedTables).filter(key => selectedTables[key]);

    if (events.length === 0) {
      toast.error("Nenhum evento selecionado", {
        description: "Por favor, selecione pelo menos um tipo de evento",
        icon: <AlertCircle className="h-5 w-5 text-destructive" />
      });
      return;
    }

    if (tables.length === 0) {
      toast.error("Nenhuma tabela selecionada", {
        description: "Por favor, selecione pelo menos uma tabela",
        icon: <AlertCircle className="h-5 w-5 text-destructive" />
      });
      return;
    }

    setIsLoading(true);

    try {
      await callWebhookFunction('register', {
        url: webhookUrl,
        events,
        tables
      });

      toast.success("Webhook registrado", {
        description: "Webhook configurado com sucesso!",
        icon: <CheckCircle2 className="h-5 w-5 text-success" />
      });

      setWebhookUrl('');
      await fetchWebhooks();
      
    } catch (error) {
      console.error("Error registering webhook:", error);
      toast.error("Falha no registro", {
        description: error instanceof Error ? error.message : "Falha ao registrar webhook",
        icon: <AlertCircle className="h-5 w-5 text-destructive" />
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteWebhook = async (webhookId: string) => {
    try {
      await callWebhookFunction('delete', { id: webhookId });
      
      toast.success("Webhook removido", {
        description: "O webhook foi removido com sucesso"
      });
      
      await fetchWebhooks();
    } catch (error) {
      console.error("Error deleting webhook:", error);
      toast.error("Falha ao excluir", {
        description: error instanceof Error ? error.message : "Falha ao excluir webhook",
        icon: <AlertCircle className="h-5 w-5 text-destructive" />
      });
    }
  };

  const testWebhook = async (url: string) => {
    try {
      setIsTesting(url);
      
      toast.info("Testando webhook", {
        description: "Enviando dados de teste..."
      });
      
      const result = await callWebhookFunction('test', { url });
      
      if (result.success) {
        toast.success("Teste bem-sucedido!", {
          description: `Webhook respondeu com status ${result.status}`,
          icon: <CheckCircle2 className="h-5 w-5 text-success" />
        });
      } else {
        toast.error("Teste falhou", {
          description: result.message || "Falha ao testar webhook",
          icon: <AlertCircle className="h-5 w-5 text-destructive" />
        });
      }
      
      await fetchWebhookLogs();
      
    } catch (error) {
      console.error("Error testing webhook:", error);
      toast.error("Teste falhou", {
        description: error instanceof Error ? error.message : "Falha ao testar webhook",
        icon: <AlertCircle className="h-5 w-5 text-destructive" />
      });
    } finally {
      setIsTesting('');
    }
  };

  const triggerTestEvents = async () => {
    try {
      setIsLoading(true);
      
      toast.info("Gerando eventos de teste", {
        description: "Criando eventos de teste para todos os webhooks ativos"
      });
      
      const result = await callWebhookFunction('trigger_test');
      
      if (result.success) {
        toast.success("Eventos de teste criados!", {
          description: result.message,
          icon: <CheckCircle2 className="h-5 w-5 text-success" />
        });
      }
      
      await fetchWebhookLogs();
      
    } catch (error) {
      console.error("Error triggering test events:", error);
      toast.error("Erro nos eventos de teste", {
        description: error instanceof Error ? error.message : "Falha ao criar eventos de teste",
        icon: <AlertCircle className="h-5 w-5 text-destructive" />
      });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleWebhookActive = async (webhookId: string, currentStatus: boolean) => {
    try {
      await callWebhookFunction('toggle_active', { 
        id: webhookId, 
        is_active: !currentStatus 
      });
      
      toast.success(`Webhook ${!currentStatus ? 'ativado' : 'desativado'}`, {
        description: `O webhook foi ${!currentStatus ? 'ativado' : 'desativado'} com sucesso`
      });
      
      await fetchWebhooks();
    } catch (error) {
      console.error("Error toggling webhook:", error);
      toast.error("Falha ao alterar status", {
        description: error instanceof Error ? error.message : "Falha ao alterar status do webhook",
        icon: <AlertCircle className="h-5 w-5 text-destructive" />
      });
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold flex items-center justify-center gap-3">
          <Zap className="h-8 w-8 text-blue-600" />
          Sistema de Webhooks
        </h1>
        <p className="text-muted-foreground text-lg">
          Configure webhooks para receber notificações automáticas de alterações no sistema em tempo real
        </p>
      </div>

      {/* Status Overview */}
      <Card className="shadow-lg border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Status do Sistema
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-white rounded-lg border">
              <div className="text-2xl font-bold text-blue-600">{webhooks.length}</div>
              <div className="text-sm text-muted-foreground">Webhooks Registrados</div>
            </div>
            <div className="text-center p-4 bg-white rounded-lg border">
              <div className="text-2xl font-bold text-green-600">
                {webhooks.filter(w => w.is_active).length}
              </div>
              <div className="text-sm text-muted-foreground">Webhooks Ativos</div>
            </div>
            <div className="text-center p-4 bg-white rounded-lg border">
              <div className="text-2xl font-bold text-orange-600">
                {webhookLogs.filter(l => l.success).length}
              </div>
              <div className="text-sm text-muted-foreground">Envios Sucessos</div>
            </div>
            <div className="text-center p-4 bg-white rounded-lg border">
              <div className="text-2xl font-bold text-red-600">
                {webhookLogs.filter(l => !l.success).length}
              </div>
              <div className="text-sm text-muted-foreground">Envios com Erro</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Configuration Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Webhook Configuration */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Configurações Gerais
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <div className="space-y-1">
                <Label>Processamento Automático</Label>
                <p className="text-sm text-muted-foreground">
                  Ativar/desativar o processamento automático de webhooks
                </p>
              </div>
              <Switch
                checked={webhookConfig.enabled}
                onCheckedChange={(enabled) => 
                  setWebhookConfig(prev => ({ ...prev, enabled }))
                }
              />
            </div>

            <div className="space-y-3">
              <Label>Intervalo de Processamento (segundos)</Label>
              <Input
                type="number"
                min="1"
                max="3600"
                value={webhookConfig.interval_seconds}
                onChange={(e) => setWebhookConfig(prev => ({
                  ...prev,
                  interval_seconds: parseInt(e.target.value) || 5
                }))}
                placeholder="5"
              />
              <p className="text-sm text-muted-foreground">
                Intervalo entre processamentos automáticos (1-3600 segundos)
              </p>
            </div>

            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-800">
                <strong>Nota:</strong> As configurações são mantidas apenas durante a sessão atual. 
                Para configurações persistentes, use as configurações do sistema de webhook.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* System Setup */}
        <Card className="shadow-lg border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Configuração Automática
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-white rounded-lg border">
              <h4 className="font-medium mb-2">Sistema de Captura Completo:</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <p>• <strong>Consultores:</strong> Todas as operações</p>
                <p>• <strong>Clientes:</strong> CRUD completo</p>
                <p>• <strong>Projetos:</strong> Inclusão, alteração, exclusão</p>
                <p>• <strong>Serviços:</strong> Gestão completa</p>
                <p>• <strong>Financeiro:</strong> Transações e contas</p>
                <p>• <strong>Usuários:</strong> Perfis e permissões</p>
                <p>• <strong>Tags:</strong> Organização e categorização</p>
                <p>• <strong>Webhooks:</strong> Sistema de notificações</p>
              </div>
            </div>
            <Button 
              onClick={setupDatabaseTriggers}
              disabled={isSettingUpTriggers}
              className="w-full bg-green-600 hover:bg-green-700"
              size="lg"
            >
              {isSettingUpTriggers ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Shield className="h-4 w-4 mr-2" />
              )}
              Configurar Triggers Automáticos
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Register New Webhook */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Registrar Novo Webhook
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <Label htmlFor="webhook-url">URL do Webhook</Label>
            <div className="relative">
              <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                id="webhook-url"
                type="url" 
                placeholder="https://seu-endpoint.com/webhook" 
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                className={`pl-10 ${
                  webhookUrl && !urlValidation.isValid 
                    ? 'border-red-300 focus:border-red-500' 
                    : webhookUrl && urlValidation.isValid 
                    ? 'border-green-300 focus:border-green-500' 
                    : ''
                }`}
              />
            </div>
            {webhookUrl && (
              <div className={`flex items-center gap-2 text-sm ${
                urlValidation.isValid ? 'text-green-600' : 'text-red-600'
              }`}>
                {urlValidation.isValid ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  <AlertTriangle className="h-4 w-4" />
                )}
                {urlValidation.message}
              </div>
            )}
          </div>
          
          <Separator />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h3 className="font-medium">Eventos a Capturar</h3>
              <div className="space-y-3">
                {Object.entries({
                  INSERT: 'Criação (INSERT)',
                  UPDATE: 'Atualização (UPDATE)',
                  DELETE: 'Exclusão (DELETE)'
                }).map(([key, label]) => (
                  <div key={key} className="flex items-center space-x-3">
                    <Checkbox 
                      id={`event-${key}`}
                      checked={selectedEvents[key]}
                      onCheckedChange={(checked) => 
                        setSelectedEvents({...selectedEvents, [key]: !!checked})
                      }
                    />
                    <label htmlFor={`event-${key}`} className="text-sm font-medium">
                      {label}
                    </label>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="space-y-3">
              <h3 className="font-medium">Entidades do Sistema</h3>
              <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto">
                {Object.entries({
                  consultants: 'Consultores',
                  clients: 'Clientes',
                  projects: 'Projetos/Demandas',
                  services: 'Serviços',
                  project_stages: 'Etapas de Projetos',
                  financial_transactions: 'Transações Financeiras',
                  accounts_payable: 'Contas a Pagar',
                  accounts_receivable: 'Contas a Receber',
                  manual_transactions: 'Transações Manuais',
                  user_profiles: 'Perfis de Usuários',
                  project_status_settings: 'Configurações de Status',
                  webhooks: 'Webhooks',
                  project_tags: 'Tags'
                }).map(([key, label]) => (
                  <div key={key} className="flex items-center space-x-3">
                    <Checkbox 
                      id={`table-${key}`}
                      checked={selectedTables[key]}
                      onCheckedChange={(checked) => 
                        setSelectedTables({...selectedTables, [key]: !!checked})
                      }
                    />
                    <label htmlFor={`table-${key}`} className="text-sm">
                      {label}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <Button 
            onClick={handleRegisterWebhook} 
            disabled={isLoading || !urlValidation.isValid || !webhookUrl}
            className="w-full"
            size="lg"
          >
            {isLoading && <RefreshCw className="mr-2 h-4 w-4 animate-spin" />}
            Registrar Webhook
          </Button>
        </CardContent>
      </Card>

      {/* Active Webhooks */}
      <Card className="shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Webhooks Registrados
          </CardTitle>
          <div className="flex gap-2">
            <Button 
              size="sm" 
              variant="outline"
              onClick={triggerTestEvents}
              disabled={isLoading}
            >
              {isLoading ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <TestTube className="h-4 w-4 mr-2" />
              )}
              Testar Sistema
            </Button>
            <Button 
              size="sm" 
              variant="outline"
              onClick={fetchWebhooks}
              disabled={isLoading}
            >
              {isLoading ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Atualizar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {webhooks.length === 0 ? (
            <div className="text-center text-muted-foreground py-12">
              <Database className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg mb-2">Nenhum webhook registrado</p>
              <p className="text-sm">Configure um webhook acima para receber notificações automáticas</p>
            </div>
          ) : (
            <div className="space-y-4">
              {webhooks.map((webhook) => (
                <div key={webhook.id} className="p-6 bg-secondary/20 rounded-lg border hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-3">
                        <p className="font-medium text-lg break-all">{webhook.url}</p>
                        <Switch
                          checked={webhook.is_active}
                          onCheckedChange={() => toggleWebhookActive(webhook.id, webhook.is_active)}
                        />
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant={webhook.is_active ? "default" : "secondary"}>
                          {webhook.is_active ? 'Ativo' : 'Inativo'}
                        </Badge>
                        <Badge variant="outline">
                          Eventos: {webhook.events.join(', ')}
                        </Badge>
                        <Badge variant="outline">
                          {webhook.tables.length} entidades
                        </Badge>
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => testWebhook(webhook.url)}
                        disabled={isTesting === webhook.url}
                      >
                        {isTesting === webhook.url ? (
                          <RefreshCw className="h-4 w-4 animate-spin" />
                        ) : (
                          <TestTube className="h-4 w-4" />
                        )}
                      </Button>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        onClick={() => handleDeleteWebhook(webhook.id)}
                      >
                        <X className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Webhook Logs */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Histórico de Envios
          </CardTitle>
        </CardHeader>
        <CardContent>
          {webhookLogs.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>Nenhum log disponível</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {webhookLogs.slice(0, 20).map((log) => (
                <div key={log.id} className="flex items-center justify-between p-3 bg-muted/30 rounded border">
                  <div className="flex items-center gap-3">
                    {log.success ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-red-600" />
                    )}
                    <div>
                      <p className="text-sm font-medium">
                        {log.event_type} em {log.table_name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(log.created_at).toLocaleString('pt-BR')}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant={log.success ? "default" : "destructive"}>
                      {log.success ? 'Sucesso' : 'Erro'}
                    </Badge>
                    {log.response_status && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Status: {log.response_status}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default WebhookManagement;
