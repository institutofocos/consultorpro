
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Webhook, Plus, Trash2, TestTube, Eye, EyeOff } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import WebhookStatus from './WebhookStatus';

interface WebhookRecord {
  id: string;
  url: string;
  events: string[];
  tables: string[];
  is_active: boolean;
  secret_key?: string;
  created_at: string;
}

const WebhookManagement = () => {
  const [webhooks, setWebhooks] = useState<WebhookRecord[]>([]);
  const [newWebhook, setNewWebhook] = useState({
    url: '',
    secretKey: ''
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchWebhooks();
  }, []);

  const fetchWebhooks = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('webhooks', {
        body: { action: 'list' }
      });

      if (error) {
        console.error('Erro ao buscar webhooks:', error);
        toast.error('Erro ao carregar webhooks');
        return;
      }

      if (data?.success && data?.webhooks) {
        setWebhooks(data.webhooks);
        console.log('📋 Webhooks carregados:', data.webhooks.length);
      }
    } catch (error) {
      console.error('Erro ao buscar webhooks:', error);
      toast.error('Erro ao carregar webhooks');
    }
  };

  const handleAddWebhook = async () => {
    if (!newWebhook.url) {
      toast.error('URL do webhook é obrigatória');
      return;
    }

    setIsLoading(true);
    try {
      console.log('➕ Adicionando webhook consolidado:', newWebhook.url);
      
      const { data, error } = await supabase.functions.invoke('webhooks', {
        body: {
          action: 'register',
          url: newWebhook.url,
          events: ['INSERT'], // Apenas INSERT para webhooks consolidados
          tables: ['projects'], // Apenas projetos para webhooks consolidados
          secret_key: newWebhook.secretKey || undefined
        }
      });

      if (error) {
        console.error('Erro ao registrar webhook:', error);
        toast.error('Erro ao registrar webhook: ' + error.message);
        return;
      }

      if (data?.success) {
        toast.success('Webhook consolidado registrado com sucesso!');
        setNewWebhook({ url: '', secretKey: '' });
        await fetchWebhooks();
      } else {
        toast.error(data?.message || 'Erro ao registrar webhook');
      }
    } catch (error) {
      console.error('Erro ao registrar webhook:', error);
      toast.error('Erro ao registrar webhook');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestWebhook = async (webhook: WebhookRecord) => {
    setIsLoading(true);
    try {
      console.log('🧪 Testando webhook consolidado:', webhook.url);
      
      const { data, error } = await supabase.functions.invoke('webhooks', {
        body: {
          action: 'test',
          url: webhook.url
        }
      });

      if (error) {
        console.error('Erro ao testar webhook:', error);
        toast.error('Erro ao testar webhook: ' + error.message);
        return;
      }

      if (data?.success) {
        toast.success('Teste consolidado enviado com sucesso! Verifique o destino.');
      } else {
        toast.error(data?.message || 'Teste consolidado falhou');
      }
    } catch (error) {
      console.error('Erro ao testar webhook:', error);
      toast.error('Erro ao testar webhook');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleActive = async (webhookId: string, isActive: boolean) => {
    try {
      console.log(`🔄 ${isActive ? 'Ativando' : 'Desativando'} webhook:`, webhookId);
      
      const { data, error } = await supabase.functions.invoke('webhooks', {
        body: {
          action: 'toggle_active',
          id: webhookId,
          is_active: isActive
        }
      });

      if (error) {
        console.error('Erro ao alterar status:', error);
        toast.error('Erro ao alterar status do webhook');
        return;
      }

      if (data?.success) {
        toast.success(data.message);
        await fetchWebhooks();
      }
    } catch (error) {
      console.error('Erro ao alterar status:', error);
      toast.error('Erro ao alterar status do webhook');
    }
  };

  const handleDeleteWebhook = async (webhookId: string) => {
    if (!confirm('Tem certeza que deseja excluir este webhook?')) {
      return;
    }

    try {
      console.log('🗑️ Excluindo webhook:', webhookId);
      
      const { data, error } = await supabase.functions.invoke('webhooks', {
        body: {
          action: 'delete',
          id: webhookId
        }
      });

      if (error) {
        console.error('Erro ao excluir webhook:', error);
        toast.error('Erro ao excluir webhook');
        return;
      }

      if (data?.success) {
        toast.success('Webhook excluído com sucesso');
        await fetchWebhooks();
      }
    } catch (error) {
      console.error('Erro ao excluir webhook:', error);
      toast.error('Erro ao excluir webhook');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Gerenciamento de Webhooks</h2>
        <p className="text-muted-foreground">
          Configure webhooks consolidados para receber notificações quando projetos forem criados
        </p>
      </div>

      <WebhookStatus />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Plus className="h-5 w-5" />
            <span>Adicionar Webhook Consolidado</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-blue-600 bg-blue-50 p-3 rounded border border-blue-200">
            <div className="font-medium mb-1">ℹ️ Webhooks Consolidados</div>
            <div>Os webhooks consolidados enviam todos os dados do projeto (cliente, serviço, consultor, etapas) em uma única requisição quando um projeto é criado.</div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <div>
              <Label htmlFor="webhook-url">URL do Webhook *</Label>
              <Input
                id="webhook-url"
                placeholder="https://seu-site.com/webhook"
                value={newWebhook.url}
                onChange={(e) => setNewWebhook({ ...newWebhook, url: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="secret-key">Chave Secreta (Opcional)</Label>
              <Input
                id="secret-key"
                type="password"
                placeholder="Chave para autenticação"
                value={newWebhook.secretKey}
                onChange={(e) => setNewWebhook({ ...newWebhook, secretKey: e.target.value })}
              />
            </div>
          </div>

          <Button 
            onClick={handleAddWebhook} 
            disabled={isLoading || !newWebhook.url}
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Webhook Consolidado
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Webhook className="h-5 w-5" />
            <span>Webhooks Registrados ({webhooks.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {webhooks.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Webhook className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum webhook registrado</p>
            </div>
          ) : (
            <div className="space-y-4">
              {webhooks.map((webhook) => (
                <div key={webhook.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="font-medium text-sm break-all">
                        {webhook.url}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Criado em: {new Date(webhook.created_at).toLocaleString('pt-BR')}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={webhook.is_active}
                        onCheckedChange={(checked) => handleToggleActive(webhook.id, checked)}
                      />
                      <Badge variant={webhook.is_active ? "default" : "secondary"}>
                        {webhook.is_active ? "Ativo" : "Inativo"}
                      </Badge>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline" className="text-xs">
                      📡 Eventos: {webhook.events.join(', ')}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      📋 Tabelas: {webhook.tables.join(', ')}
                    </Badge>
                    {webhook.secret_key && (
                      <Badge variant="outline" className="text-xs">
                        🔐 Com autenticação
                      </Badge>
                    )}
                  </div>

                  <Separator />

                  <div className="flex justify-between">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleTestWebhook(webhook)}
                      disabled={isLoading}
                    >
                      <TestTube className="h-4 w-4 mr-2" />
                      Testar Consolidado
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteWebhook(webhook.id)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Excluir
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

export default WebhookManagement;
