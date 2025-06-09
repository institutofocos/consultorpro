
-- Primeiro, vamos remover TODOS os triggers antigos de webhook para evitar duplicação
DROP TRIGGER IF EXISTS trigger_webhooks_projects_insert ON projects;
DROP TRIGGER IF EXISTS trigger_webhooks_projects_update ON projects; 
DROP TRIGGER IF EXISTS trigger_webhooks_projects_delete ON projects;
DROP TRIGGER IF EXISTS trigger_webhooks_project_stages_insert ON project_stages;
DROP TRIGGER IF EXISTS trigger_webhooks_project_stages_update ON project_stages;
DROP TRIGGER IF EXISTS trigger_webhooks_project_stages_delete ON project_stages;
DROP TRIGGER IF EXISTS trigger_webhooks ON projects;
DROP TRIGGER IF EXISTS trigger_webhooks ON project_stages;

-- Remover trigger genérico se existir
DROP TRIGGER IF EXISTS trigger_webhooks_insert ON projects;
DROP TRIGGER IF EXISTS trigger_webhooks_insert ON project_stages;

-- Verificar se o trigger consolidado existe e recriá-lo se necessário
DROP TRIGGER IF EXISTS trigger_consolidated_project_webhook ON projects;

-- Recriar apenas o trigger consolidado para projetos
CREATE TRIGGER trigger_consolidated_project_webhook
  AFTER INSERT ON projects
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_consolidated_project_webhook();

-- Verificar e limpar webhooks na fila que possam estar duplicados
DELETE FROM webhook_logs 
WHERE event_type = 'INSERT' 
AND table_name IN ('projects', 'project_stages')
AND success = false
AND created_at > NOW() - INTERVAL '1 hour';

-- Garantir que apenas webhooks consolidados sejam processados
INSERT INTO public.system_settings (setting_key, setting_value, description)
VALUES (
  'webhook_only_consolidated', 
  'true', 
  'Processar apenas webhooks consolidados, ignorar webhooks individuais de tabelas'
) ON CONFLICT (setting_key) DO UPDATE SET 
  setting_value = EXCLUDED.setting_value,
  updated_at = NOW();

-- Log para confirmar a configuração
INSERT INTO public.system_logs (log_type, category, message, details)
VALUES (
  'info', 
  'webhook_cleanup', 
  'Triggers antigos removidos e sistema configurado para usar apenas webhooks consolidados',
  jsonb_build_object(
    'timestamp', NOW(),
    'action', 'cleanup_and_consolidate',
    'consolidated_only', true
  )
);
