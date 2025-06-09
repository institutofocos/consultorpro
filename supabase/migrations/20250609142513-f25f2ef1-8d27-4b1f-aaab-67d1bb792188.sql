
-- Verificar se existe trigger para INSERT na tabela projects
DROP TRIGGER IF EXISTS project_webhooks_trigger ON projects;

-- Recriar o trigger para capturar todas as operações (INSERT, UPDATE, DELETE)
CREATE TRIGGER project_webhooks_trigger
  AFTER INSERT OR UPDATE OR DELETE ON projects
  FOR EACH ROW EXECUTE FUNCTION trigger_webhooks();

-- Verificar se existe trigger para INSERT na tabela project_stages  
DROP TRIGGER IF EXISTS project_stages_webhooks_trigger ON project_stages;

-- Recriar o trigger para project_stages também
CREATE TRIGGER project_stages_webhooks_trigger
  AFTER INSERT OR UPDATE OR DELETE ON project_stages
  FOR EACH ROW EXECUTE FUNCTION trigger_webhooks();

-- Inserir log para confirmar que os triggers foram criados
INSERT INTO system_logs (log_type, category, message, details)
VALUES (
  'info',
  'webhook_setup',
  'Triggers de webhook recriados para INSERT, UPDATE e DELETE',
  jsonb_build_object(
    'tables', ARRAY['projects', 'project_stages'],
    'operations', ARRAY['INSERT', 'UPDATE', 'DELETE'],
    'timestamp', NOW()
  )
);
