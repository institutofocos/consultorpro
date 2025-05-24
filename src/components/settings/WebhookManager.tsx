
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
import { toast } from "sonner";
import { AlertCircle, CheckCircle2, X, RefreshCw, TestTube, Settings } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Webhook {
  id: string;
  url: string;
  events: string[];
  tables: string[];
  is_active: boolean;
  created_at: string;
}

const WebhookManager: React.FC = () => {
  const [webhookUrl, setWebhookUrl] = useState<string>('');
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isTesting, setIsTesting] = useState<string>('');
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
    financial_transactions: true
  });

  // Load existing webhooks on component mount
  useEffect(() => {
    fetchWebhooks();
    
    // Set up automatic webhook processing every 10 seconds for real-time processing
    const interval = setInterval(() => {
      processWebhookQueueSilently();
    }, 10000);

    return () => clearInterval(interval);
  }, []);

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

      console.log('Webhook function result:', result);
      
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
    }
  };

  const verifyTriggers = async () => {
    try {
      setIsLoading(true);
      console.log('Verificando triggers de webhook...');
      
      toast.info("Verificando triggers", {
        description: "Verificando se todos os triggers de webhook estão ativos"
      });
      
      const result = await callWebhookFunction('verify_triggers');
      
      if (result.success) {
        console.log('Trigger verification results:', result.results);
        
        const createdTriggers = result.results.filter(r => r.status === 'created');
        const errorTriggers = result.results.filter(r => r.status === 'error');
        
        if (createdTriggers.length > 0) {
          toast.success("Triggers criados", {
            description: `${createdTriggers.length} trigger(s) foram criados com sucesso`,
            icon: <CheckCircle2 className="h-5 w-5 text-success" />
          });
        } else if (errorTriggers.length > 0) {
          toast.error("Erro em alguns triggers", {
            description: `${errorTriggers.length} trigger(s) tiveram erro`,
            icon: <AlertCircle className="h-5 w-5 text-destructive" />
          });
        } else {
          toast.success("Triggers verificados", {
            description: "Todos os triggers estão funcionando corretamente",
            icon: <CheckCircle2 className="h-5 w-5 text-success" />
          });
        }
      } else {
        toast.error("Falha na verificação", {
          description: result.message || "Erro ao verificar triggers",
          icon: <AlertCircle className="h-5 w-5 text-destructive" />
        });
      }
      
    } catch (error) {
      console.error("Error verifying triggers:", error);
      toast.error("Erro na verificação", {
        description: error instanceof Error ? error.message : "Falha ao verificar triggers",
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

    // Validate URL format
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
        description: "Seu webhook foi registrado com sucesso e será disparado automaticamente",
        icon: <CheckCircle2 className="h-5 w-5 text-success" />
      });

      // Clear form and reload webhooks
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
        description: "Enviando payload de teste para " + url
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
      console.log('Triggering test events for projects and stages');
      
      toast.info("Criando eventos de teste", {
        description: "Gerando eventos de teste para projetos e etapas"
      });
      
      const result = await callWebhookFunction('trigger_test');
      
      if (result.success) {
        toast.success("Eventos de teste criados", {
          description: result.message + " - Serão processados automaticamente",
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
        <h1 className="text-3xl font-bold">Webhooks</h1>
        <p className="text-muted-foreground">Configure webhooks para receber notificações automáticas quando os dados mudarem</p>
      </div>

      {/* Verificação de Sistema */}
      <Card className="shadow-card border-amber-200 bg-amber-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Verificação do Sistema
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Certifique-se de que todos os triggers de webhook estejam funcionando corretamente no banco de dados.
            Os webhooks são disparados automaticamente a cada 10 segundos.
          </p>
          <Button 
            onClick={verifyTriggers}
            disabled={isLoading}
            variant="outline"
            className="w-full"
          >
            {isLoading ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Settings className="h-4 w-4 mr-2" />
            )}
            Verificar e Corrigir Triggers
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
            <h3 className="text-sm font-medium">Eventos</h3>
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
                  Insert
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
                  Update
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
                  Delete
                </label>
              </div>
            </div>
          </div>
          
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Tabelas</h3>
            <div className="flex flex-wrap gap-4">
              {Object.entries({
                consultants: 'Consultores',
                projects: 'Projetos', 
                services: 'Serviços',
                clients: 'Clientes',
                notes: 'Notas',
                project_stages: 'Etapas do Projeto',
                financial_transactions: 'Transações Financeiras'
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
          >
            {isLoading && <RefreshCw className="mr-2 h-4 w-4 animate-spin" />}
            Registrar Webhook
          </Button>
        </CardFooter>
      </Card>

      <Card className="shadow-card">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle>Webhooks Registrados</CardTitle>
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
              Gerar Teste
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
            <p className="text-center text-muted-foreground py-8">Nenhum webhook registrado ainda</p>
          ) : (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                <p className="text-sm text-green-800">
                  ✅ Processamento automático ativo - Os webhooks são disparados automaticamente a cada 10 segundos
                </p>
              </div>
              {webhooks.map((webhook) => (
                <div key={webhook.id} className="flex items-center justify-between p-4 bg-secondary/20 rounded-lg">
                  <div className="space-y-1">
                    <p className="font-medium break-all">{webhook.url}</p>
                    <div className="flex flex-wrap gap-2">
                      <p className="text-xs text-muted-foreground">
                        Eventos: {webhook.events.join(', ')}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Tabelas: {webhook.tables.join(', ')}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Status: {webhook.is_active ? 'Ativo (Auto)' : 'Inativo'}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
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
