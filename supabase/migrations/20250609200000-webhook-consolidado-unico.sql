
-- LIMPEZA COMPLETA DOS TRIGGERS ANTIGOS
-- Remover TODOS os triggers de webhook que possam existir
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

-- Remover qualquer trigger genérico que possa ter sido criado
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT tgname FROM pg_trigger WHERE tgname LIKE '%webhook%' AND tgrelid IN (
        SELECT oid FROM pg_class WHERE relname IN ('projects', 'project_stages')
    )) LOOP
        EXECUTE 'DROP TRIGGER IF EXISTS ' || r.tgname || ' ON projects';
        EXECUTE 'DROP TRIGGER IF EXISTS ' || r.tgname || ' ON project_stages';
    END LOOP;
END $$;

-- Verificar se o trigger consolidado existe
DROP TRIGGER IF EXISTS trigger_consolidated_project_webhook ON projects;

-- Recriar APENAS o trigger consolidado para projetos
CREATE TRIGGER trigger_consolidated_project_webhook
  AFTER INSERT ON projects
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_consolidated_project_webhook();

-- Configurações do sistema para webhooks consolidados
INSERT INTO public.system_settings (setting_key, setting_value, description)
VALUES (
  'webhook_consolidation_enabled', 
  'true', 
  'Habilita o envio de webhooks consolidados para criação de projetos'
) ON CONFLICT (setting_key) DO UPDATE SET 
  setting_value = 'true',
  updated_at = NOW();

INSERT INTO public.system_settings (setting_key, setting_value, description)
VALUES (
  'webhook_only_consolidated', 
  'true', 
  'Processar apenas webhooks consolidados, ignorar webhooks individuais de tabelas'
) ON CONFLICT (setting_key) DO UPDATE SET 
  setting_value = 'true',
  updated_at = NOW();

-- Remover webhooks individuais duplicados da fila
DELETE FROM webhook_logs 
WHERE event_type = 'INSERT' 
AND table_name IN ('projects', 'project_stages')
AND event_type != 'project_created_consolidated'
AND success = false;

-- Log para confirmar a configuração
INSERT INTO public.system_logs (log_type, category, message, details)
VALUES (
  'info', 
  'webhook_consolidado_unico', 
  'Sistema configurado para enviar APENAS webhooks consolidados',
  jsonb_build_object(
    'timestamp', NOW(),
    'action', 'webhook_consolidado_unico',
    'consolidated_only', true,
    'individual_webhooks_disabled', true
  )
);
