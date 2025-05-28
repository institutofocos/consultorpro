import React, { useState, useEffect } from 'react';
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardContent,
  CardFooter 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { AlertCircle, CheckCircle2, X, RefreshCw, TestTube, Settings, Zap, Database, Save } from "lucide-react";
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

const WebhookManager: React.FC = () => {
  const [webhookUrl, setWebhookUrl] = useState<string>('');
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isTesting, setIsTesting] = useState<string>('');
  const [webhookConfig, setWebhookConfig] = useState<WebhookConfig>({ interval_seconds: 5, enabled: true });
  const [selectedEvents, setSelectedEvents] = useState<Record<string, boolean>>({
    INSERT: true,
    UPDATE: true,
    DELETE: true
  });
  const [selectedTables, setSelectedTables] = useState<Record<string, boolean>>({
    consultants: true,
    projects: true,
    services: true,
    clients: true,
    notes: true,
    project_stages: true,
    financial_transactions: true,
    chat_messages: true,
    chat_rooms: true
  });

  // Load existing webhooks and settings on component mount
  useEffect(() => {
    fetchWebhooks();
    loadWebhookSettings();
    
    // Set up automatic webhook processing with dynamic interval
    const setupInterval = () => {
      return setInterval(() => {
        if (webhookConfig.enabled) {
          processWebhookQueueSilently();
        }
      }, webhookConfig.interval_seconds * 1000);
    };

    const interval = setupInterval();

    return () => clearInterval(interval);
  }, [webhookConfig]);

  const loadWebhookSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('system_settings')
        .select('setting_value')
        .eq('setting_key', 'webhook_interval')
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setWebhookConfig(data.setting_value as unknown as WebhookConfig);
      }
    } catch (error) {
      console.error('Error loading webhook settings:', error);
    }
  };

  const saveWebhookSettings = async () => {
    try {
      setIsLoading(true);

      const { error } = await supabase
        .from('system_settings')
        .upsert({
          setting_key: 'webhook_interval',
          setting_value: webhookConfig as any
        });

      if (error) throw error;

      // Log da alteração
      await supabase.rpc('insert_system_log', {
        p_log_type: 'info',
        p_category: 'webhook',
        p_message: `Configurações de webhook atualizadas: intervalo ${webhookConfig.interval_seconds}s, ${webhookConfig.enabled ? 'ativado' : 'desativado'}`,
        p_details: webhookConfig as any
      });

      toast.success("Configurações de webhook salvas com sucesso");
    } catch (error) {
      console.error('Error saving webhook settings:', error);
      toast.error("Erro ao salvar configurações de webhook");
    } finally {
      setIsLoading(false);
    }
  };

  const handleIntervalChange = (value: string) => {
    const numValue = parseInt(value);
    if (numValue >= 1 && numValue <= 3600) {
      setWebhookConfig(prev => ({
        ...prev,
        interval_seconds: numValue
      }));
    }
  };

  const handleEnabledChange = (enabled: boolean) => {
    setWebhookConfig(prev => ({
      ...prev,
      enabled
    }));
  };

  const callWebhookFunction = async (action: string, data: any = {}) => {
    console.log(`=== CALLING WEBHOOK FUNCTION: ${action} ===`, data);
    
    try {
      const { data: result, error } = await supabase.functions.invoke('webhooks', {
        body: { action, ...data }
      });

      if (error) {
        console.error('Webhook function error:', error);
        
        // Log error to system logs
        await supabase.rpc('insert_system_log', {
          p_log_type: 'error',
          p_category: 'webhook',
          p_message: `Erro na função webhook: ${action}`,
          p_details: { error: error.message, action, data } as any
        });
        
        throw new Error(error.message || 'Webhook function failed');
      }

      console.log('Webhook function result:', result);
      
      if (!result || result.success === false) {
        // Log warning to system logs
        await supabase.rpc('insert_system_log', {
          p_log_type: 'warning',
          p_category: 'webhook',
          p_message: `Webhook operation failed: ${action}`,
          p_details: { result, action, data } as any
        });
        
        throw new Error(result?.message || 'Webhook operation failed');
      }

      // Log success to system logs
      await supabase.rpc('insert_system_log', {
        p_log_type: 'success',
        p_category: 'webhook',
        p_message: `Webhook operation successful: ${action}`,
        p_details: { result, action } as any
      });
      
      return result;
    } catch (error) {
      console.error('Error calling webhook function:', error);
      throw error;
    }
  };

  const fetchWebhooks = async () => {
    try {
      setIsLoading(true);
      console.log('Fetching webhooks from database...');
      
      const result = await callWebhookFunction('list');
      
      setWebhooks(result.webhooks || []);
      console.log('Webhooks loaded:', result.webhooks?.length || 0);
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

  const processWebhookQueueSilently = async () => {
    try {
      console.log('Auto-processing webhook queue...');
      const result = await callWebhookFunction('process');
      console.log('Auto queue processing result:', result.message);
    } catch (error) {
      console.error('Error in auto webhook queue processing:', error);
      
      // Log error silently
      await supabase.rpc('insert_system_log', {
        p_log_type: 'error',
        p_category: 'webhook',
        p_message: 'Erro no processamento automático de webhooks',
        p_details: { error: error instanceof Error ? error.message : 'Unknown error' } as any
      });
    }
  };

  const verifyTriggers = async () => {
    try {
      setIsLoading(true);
      console.log('Verificando e configurando triggers de webhook...');
      
      toast.info("Configurando sistema", {
        description: "Criando triggers para capturar todas as interações do sistema"
      });
      
      const result = await callWebhookFunction('verify_triggers');
      
      if (result.success) {
        console.log('Trigger verification results:', result.results);
        
        const createdTriggers = result.results.filter(r => r.status === 'created');
        const errorTriggers = result.results.filter(r => r.status === 'error');
        
        if (createdTriggers.length > 0) {
          toast.success("Sistema configurado", {
            description: `${createdTriggers.length} trigger(s) criados. Webhooks irão capturar todas as interações!`,
            icon: <CheckCircle2 className="h-5 w-5 text-success" />
          });
        } else if (errorTriggers.length > 0) {
          toast.error("Erro em alguns triggers", {
            description: `${errorTriggers.length} trigger(s) tiveram erro`,
            icon: <AlertCircle className="h-5 w-5 text-destructive" />
          });
        } else {
          toast.success("Sistema já configurado", {
            description: "Todos os triggers estão ativos e capturando interações",
            icon: <CheckCircle2 className="h-5 w-5 text-success" />
          });
        }
      } else {
        toast.error("Falha na configuração", {
          description: result.message || "Erro ao configurar triggers",
          icon: <AlertCircle className="h-5 w-5 text-destructive" />
        });
      }
      
    } catch (error) {
      console.error("Error verifying triggers:", error);
      toast.error("Erro na configuração", {
        description: error instanceof Error ? error.message : "Falha ao configurar sistema",
        icon: <AlertCircle className="h-5 w-5 text-destructive" />
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterWebhook = async () => {
    if (!webhookUrl.trim()) {
      toast.error("URL inválida", {
        description: "Por favor, insira uma URL válida para o webhook",
        icon: <AlertCircle className="h-5 w-5 text-destructive" />
      });
      return;
    }

    try {
      new URL(webhookUrl);
    } catch (e) {
      toast.error("URL inválida", {
        description: "Por favor, insira uma URL válida incluindo http:// ou https://",
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
      console.log('Registering webhook:', { url: webhookUrl, events, tables });
      
      const result = await callWebhookFunction('register', {
        url: webhookUrl,
        events,
        tables
      });

      toast.success("Webhook registrado", {
        description: "Webhook configurado! Irá receber todas as interações automaticamente",
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
      console.log('Deleting webhook:', webhookId);
      
      const result = await callWebhookFunction('delete', { id: webhookId });
      
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
      console.log('Testing webhook:', url);
      
      toast.info("Testando webhook", {
        description: "Enviando dados completos de teste..."
      });
      
      const result = await callWebhookFunction('test', { url });
      
      if (result.success) {
        toast.success("Teste bem-sucedido", {
          description: `Webhook respondeu com status ${result.status}`,
          icon: <CheckCircle2 className="h-5 w-5 text-success" />
        });
      } else {
        toast.error("Teste falhou", {
          description: result.message || "Falha ao testar webhook",
          icon: <AlertCircle className="h-5 w-5 text-destructive" />
        });
      }
      
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
      console.log('Triggering comprehensive test events');
      
      toast.info("Gerando eventos de teste", {
        description: "Criando eventos completos para clientes, consultores, projetos e etapas"
      });
      
      const result = await callWebhookFunction('trigger_test');
      
      if (result.success) {
        toast.success("Eventos de teste criados", {
          description: result.message + " - Processamento automático em andamento",
          icon: <CheckCircle2 className="h-5 w-5 text-success" />
        });
      } else {
        toast.error("Falha ao criar eventos de teste", {
          description: result.message || "Erro ao gerar eventos de teste",
          icon: <AlertCircle className="h-5 w-5 text-destructive" />
        });
      }
      
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

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold">Sistema de Webhooks</h1>
        <p className="text-muted-foreground">Configure webhooks para receber notificações de todas as interações do sistema</p>
      </div>

      {/* Webhook Configuration Settings */}
      <Card className="shadow-card border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Configurações de Webhook
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="webhook-enabled">Processamento Automático</Label>
                <p className="text-sm text-muted-foreground">
                  Ativar/desativar o processamento automático de webhooks
                </p>
              </div>
              <Switch
                id="webhook-enabled"
                checked={webhookConfig.enabled}
                onCheckedChange={handleEnabledChange}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="webhook-interval">Intervalo de Processamento (segundos)</Label>
              <Input
                id="webhook-interval"
                type="number"
                min="1"
                max="3600"
                value={webhookConfig.interval_seconds}
                onChange={(e) => handleIntervalChange(e.target.value)}
                placeholder="5"
              />
              <p className="text-sm text-muted-foreground">
                Intervalo em segundos entre cada processamento automático (1-3600 segundos)
              </p>
            </div>

            <div className="p-4 bg-white rounded-lg border">
              <h4 className="font-medium mb-2">Status Atual:</h4>
              <div className="space-y-1 text-sm">
                <p>• Processamento automático: <span className={webhookConfig.enabled ? 'text-green-600' : 'text-red-600'}>
                  {webhookConfig.enabled ? 'Ativado' : 'Desativado'}
                </span></p>
                <p>• Intervalo: {webhookConfig.interval_seconds} segundos</p>
                <p>• Próximo processamento: ~{webhookConfig.interval_seconds}s</p>
              </div>
            </div>

            <Button onClick={saveWebhookSettings} disabled={isLoading} className="w-full">
              {isLoading ? (
                <Settings className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Salvar Configurações
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* System Configuration */}
      <Card className="shadow-card border-green-200 bg-green-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Configuração do Sistema
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Configure o sistema para capturar TODAS as interações: novos clientes, consultores, projetos, demandas, etapas e muito mais.
            O processamento automático acontece a cada {webhookConfig.interval_seconds} segundos.
          </p>
          <Button 
            onClick={verifyTriggers}
            disabled={isLoading}
            variant="default"
            className="w-full bg-green-600 hover:bg-green-700"
          >
            {isLoading ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Zap className="h-4 w-4 mr-2" />
            )}
            Configurar Sistema Completo
          </Button>
        </CardContent>
      </Card>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Registrar Novo Webhook</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="webhook-url">URL do Webhook</Label>
            <Input 
              id="webhook-url"
              type="url" 
              placeholder="https://seu-endpoint.com/webhook" 
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              className="w-full"
            />
          </div>
          
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Eventos a Capturar</h3>
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="event-insert" 
                  checked={selectedEvents.INSERT}
                  onCheckedChange={(checked) => 
                    setSelectedEvents({...selectedEvents, INSERT: !!checked})
                  }
                />
                <label 
                  htmlFor="event-insert" 
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Criação (INSERT)
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="event-update" 
                  checked={selectedEvents.UPDATE}
                  onCheckedChange={(checked) => 
                    setSelectedEvents({...selectedEvents, UPDATE: !!checked})
                  }
                />
                <label 
                  htmlFor="event-update" 
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Atualização (UPDATE)
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="event-delete" 
                  checked={selectedEvents.DELETE}
                  onCheckedChange={(checked) => 
                    setSelectedEvents({...selectedEvents, DELETE: !!checked})
                  }
                />
                <label 
                  htmlFor="event-delete" 
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Exclusão (DELETE)
                </label>
              </div>
            </div>
          </div>
          
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Entidades do Sistema</h3>
            <div className="grid grid-cols-2 gap-4">
              {Object.entries({
                consultants: 'Consultores',
                clients: 'Clientes',
                projects: 'Projetos/Demandas', 
                project_stages: 'Etapas de Projetos',
                services: 'Serviços',
                notes: 'Notas e Tarefas',
                financial_transactions: 'Transações Financeiras',
                chat_messages: 'Mensagens do Chat',
                chat_rooms: 'Salas de Chat'
              }).map(([key, label]) => (
                <div key={key} className="flex items-center space-x-2">
                  <Checkbox 
                    id={`table-${key}`}
                    checked={selectedTables[key]}
                    onCheckedChange={(checked) => 
                      setSelectedTables({...selectedTables, [key]: !!checked})
                    }
                  />
                  <label 
                    htmlFor={`table-${key}`}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {label}
                  </label>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button 
            onClick={handleRegisterWebhook} 
            disabled={isLoading}
            className="w-full"
          >
            {isLoading && <RefreshCw className="mr-2 h-4 w-4 animate-spin" />}
            Registrar Webhook Completo
          </Button>
        </CardFooter>
      </Card>

      <Card className="shadow-card">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle>Webhooks Ativos</CardTitle>
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
          {isLoading ? (
            <div className="text-center text-muted-foreground py-8 flex items-center justify-center">
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Carregando webhooks...
            </div>
          ) : webhooks.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <p className="text-lg mb-2">Nenhum webhook registrado</p>
              <p className="text-sm">Configure um webhook acima para receber todas as interações do sistema</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                <p className="text-sm text-blue-800 flex items-center gap-2">
                  <Zap className="h-4 w-4" />
                  Sistema ativo - Capturando todas as interações a cada {webhookConfig.interval_seconds} segundos
                </p>
              </div>
              {webhooks.map((webhook) => (
                <div key={webhook.id} className="flex items-center justify-between p-4 bg-secondary/20 rounded-lg border">
                  <div className="space-y-1 flex-1">
                    <p className="font-medium break-all">{webhook.url}</p>
                    <div className="flex flex-wrap gap-2 text-xs">
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                        Eventos: {webhook.events.join(', ')}
                      </span>
                      <span className="bg-green-100 text-green-800 px-2 py-1 rounded">
                        Entidades: {webhook.tables.length}
                      </span>
                      <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded">
                        {webhook.is_active ? `Ativo (${webhookConfig.interval_seconds}s)` : 'Inativo'}
                      </span>
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
                        'Testar'
                      )}
                    </Button>
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      onClick={() => handleDeleteWebhook(webhook.id)}
                    >
                      <X className="h-4 w-4 text-muted-foreground" />
                    </Button>
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

export default WebhookManager;
