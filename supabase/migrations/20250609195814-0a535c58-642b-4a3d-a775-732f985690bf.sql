
-- Configurar sistema de webhook consolidado como padrão ativo
INSERT INTO public.system_settings (setting_key, setting_value, description)
VALUES (
  'webhook_consolidation_enabled', 
  'true', 
  'Habilita o envio de webhooks consolidados únicos como padrão'
) ON CONFLICT (setting_key) DO UPDATE SET 
  setting_value = 'true',
  updated_at = NOW();

INSERT INTO public.system_settings (setting_key, setting_value, description)
VALUES (
  'webhook_only_consolidated', 
  'true', 
  'Processar apenas webhooks consolidados únicos por padrão'
) ON CONFLICT (setting_key) DO UPDATE SET 
  setting_value = 'true',
  updated_at = NOW();

-- Garantir que apenas o trigger consolidado existe
DROP TRIGGER IF EXISTS trigger_webhooks_projects_insert ON projects;
DROP TRIGGER IF EXISTS trigger_webhooks_projects_update ON projects; 
DROP TRIGGER IF EXISTS trigger_webhooks_projects_delete ON projects;
DROP TRIGGER IF EXISTS trigger_webhooks_project_stages_insert ON project_stages;
DROP TRIGGER IF EXISTS trigger_webhooks_project_stages_update ON project_stages;
DROP TRIGGER IF EXISTS trigger_webhooks_project_stages_delete ON project_stages;
DROP TRIGGER IF EXISTS trigger_webhooks ON projects;
DROP TRIGGER IF EXISTS trigger_webhooks ON project_stages;
DROP TRIGGER IF EXISTS trigger_webhooks_insert ON projects;
DROP TRIGGER IF EXISTS trigger_webhooks_insert ON project_stages;

-- Garantir que o trigger consolidado está ativo
DROP TRIGGER IF EXISTS trigger_consolidated_project_webhook ON projects;
CREATE TRIGGER trigger_consolidated_project_webhook
  AFTER INSERT ON projects
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_consolidated_project_webhook();

-- Limpar webhooks antigos pendentes que não sejam consolidados
DELETE FROM webhook_logs 
WHERE event_type != 'project_created_consolidated' 
AND success = false
AND created_at > NOW() - INTERVAL '1 day';

-- Log de configuração
INSERT INTO public.system_logs (log_type, category, message, details)
VALUES (
  'info', 
  'webhook_default_consolidated', 
  'Sistema configurado para webhook único consolidado como padrão',
  jsonb_build_object(
    'timestamp', NOW(),
    'consolidation_enabled', true,
    'only_consolidated', true,
    'default_active', true
  )
);
