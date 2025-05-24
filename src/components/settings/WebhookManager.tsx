
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
import { AlertCircle, CheckCircle2, X, RefreshCw, Play, Loader2 } from "lucide-react";
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
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
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
    
    // Set up automatic webhook processing every 30 seconds
    const interval = setInterval(() => {
      processWebhookQueue();
    }, 30000);

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

  const processWebhookQueue = async () => {
    if (isProcessing) return;
    
    try {
      setIsProcessing(true);
      console.log('Processing webhook queue...');
      const result = await callWebhookFunction('process');
      console.log('Queue processing result:', result.message);
    } catch (error) {
      console.error('Error processing webhook queue:', error);
    } finally {
      setIsProcessing(false);
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
        description: "Seu webhook foi registrado com sucesso",
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
      console.log('Testing webhook:', url);
      
      toast.info("Testando webhook", {
        description: "Enviando payload de teste para " + url
      });
      
      const result = await callWebhookFunction('test', { url });
      
      if (result.success) {
        toast.success("Teste bem-sucedido", {
          description: "Teste do webhook concluído com sucesso",
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
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold">Webhooks</h1>
        <p className="text-muted-foreground">Configure webhooks para receber notificações quando os dados mudarem</p>
      </div>

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
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
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
              onClick={processWebhookQueue}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Play className="h-4 w-4 mr-2" />
              )}
              Processar Fila
            </Button>
            <Button 
              size="sm" 
              variant="outline"
              onClick={fetchWebhooks}
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
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
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Carregando webhooks...
            </div>
          ) : webhooks.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Nenhum webhook registrado ainda</p>
          ) : (
            <div className="space-y-4">
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
                        Status: {webhook.is_active ? 'Ativo' : 'Inativo'}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => testWebhook(webhook.url)}
                    >
                      Testar
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
