
-- Remover todas as referências remanescentes a chat_rooms
-- Desabilitar triggers temporariamente para evitar erros
SET session_replication_role = replica;

-- Remover triggers que possam referenciar chat_rooms
DROP TRIGGER IF EXISTS on_project_created ON projects;
DROP TRIGGER IF EXISTS on_project_updated ON projects;
DROP TRIGGER IF EXISTS on_stage_created ON project_stages;
DROP TRIGGER IF EXISTS on_stage_updated ON project_stages;

-- Remover funções que possam referenciar chat_rooms
DROP FUNCTION IF EXISTS create_project_chat_room CASCADE;
DROP FUNCTION IF EXISTS handle_project_chat_creation CASCADE;
DROP FUNCTION IF EXISTS setup_project_chat CASCADE;
DROP FUNCTION IF EXISTS create_chat_room_for_project CASCADE;

-- Recriar trigger de webhook apenas para projetos (sem chat)
CREATE OR REPLACE FUNCTION public.trigger_webhooks_projects_only()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  webhook_record RECORD;
  payload jsonb;
  event_type text;
BEGIN
  -- Determinar o tipo de evento
  IF TG_OP = 'INSERT' THEN
    event_type := 'INSERT';
    payload := to_jsonb(NEW);
  ELSIF TG_OP = 'UPDATE' THEN
    event_type := 'UPDATE';
    payload := jsonb_build_object('old', to_jsonb(OLD), 'new', to_jsonb(NEW));
  ELSIF TG_OP = 'DELETE' THEN
    event_type := 'DELETE';
    payload := to_jsonb(OLD);
  END IF;

  -- Processar webhooks APENAS - ZERO REFERÊNCIAS A CHAT
  FOR webhook_record IN
    SELECT * FROM public.webhooks 
    WHERE is_active = true 
    AND TG_TABLE_NAME = ANY(tables)
    AND event_type = ANY(events)
  LOOP
    INSERT INTO public.webhook_logs (
      webhook_id, 
      event_type, 
      table_name, 
      payload, 
      success, 
      attempt_count,
      created_at,
      updated_at
    ) VALUES (
      webhook_record.id, 
      event_type, 
      TG_TABLE_NAME, 
      payload, 
      false, 
      0,
      NOW(),
      NOW()
    );
  END LOOP;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$;

-- Recriar triggers para projetos e etapas (sem chat)
CREATE TRIGGER trigger_webhooks_projects_only
    AFTER INSERT OR UPDATE OR DELETE ON projects
    FOR EACH ROW EXECUTE FUNCTION trigger_webhooks_projects_only();

CREATE TRIGGER trigger_webhooks_stages_only
    AFTER INSERT OR UPDATE OR DELETE ON project_stages
    FOR EACH ROW EXECUTE FUNCTION trigger_webhooks_projects_only();

-- Habilitar triggers novamente
SET session_replication_role = DEFAULT;

-- Log para confirmação
INSERT INTO public.system_logs (log_type, category, message, details)
VALUES (
  'info', 
  'migration', 
  'Todas as referências a chat foram removidas com sucesso',
  jsonb_build_object(
    'migration', '20250716120000-remove-all-chat-references',
    'timestamp', NOW(),
    'status', 'completed'
  )
);
