
import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Settings, Save, Zap, CheckCircle2, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface WebhookConfig {
  interval_seconds: number;
  enabled: boolean;
}

const WebhookSettings: React.FC = () => {
  const [webhookConfig, setWebhookConfig] = useState<WebhookConfig>({
    interval_seconds: 5,
    enabled: true
  });
  const [isLoading, setIsLoading] = useState(false);
  const [systemStatus, setSystemStatus] = useState<'loading' | 'active' | 'inactive'>('loading');

  useEffect(() => {
    loadWebhookSettings();
    checkSystemStatus();
  }, []);

  const loadWebhookSettings = async () => {
    try {
      setIsLoading(true);
      
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
      toast.error("Erro ao carregar configurações de webhook");
    } finally {
      setIsLoading(false);
    }
  };

  const checkSystemStatus = async () => {
    try {
      // Check if there are active webhooks
      const { data: webhooks } = await supabase
        .from('webhooks')
        .select('*')
        .eq('is_active', true);

      setSystemStatus(webhooks && webhooks.length > 0 ? 'active' : 'inactive');
    } catch (error) {
      console.error('Error checking system status:', error);
      setSystemStatus('inactive');
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

      toast.success("Configurações de webhook salvas com sucesso", {
        icon: <CheckCircle2 className="h-5 w-5 text-green-600" />
      });
    } catch (error) {
      console.error('Error saving webhook settings:', error);
      toast.error("Erro ao salvar configurações de webhook", {
        icon: <AlertCircle className="h-5 w-5 text-red-600" />
      });
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

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5" />
          Configurações de Webhook
          {systemStatus === 'active' && (
            <span className="ml-auto bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
              Sistema Ativo
            </span>
          )}
          {systemStatus === 'inactive' && (
            <span className="ml-auto bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded-full">
              Sistema Inativo
            </span>
          )}
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

          <div className="p-4 bg-muted rounded-lg">
            <h4 className="font-medium mb-2">Status Atual:</h4>
            <div className="space-y-1 text-sm">
              <p>• Processamento automático: <span className={webhookConfig.enabled ? 'text-green-600' : 'text-red-600'}>
                {webhookConfig.enabled ? 'Ativado' : 'Desativado'}
              </span></p>
              <p>• Intervalo: {webhookConfig.interval_seconds} segundos</p>
              <p>• Sistema: <span className={systemStatus === 'active' ? 'text-green-600' : 'text-orange-600'}>
                {systemStatus === 'active' ? 'Webhooks ativos configurados' : 'Nenhum webhook ativo'}
              </span></p>
              {systemStatus === 'active' && (
                <p>• Próximo processamento: ~{webhookConfig.interval_seconds}s</p>
              )}
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
  );
};

export default WebhookSettings;
