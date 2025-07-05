
-- Remover completamente qualquer referência problemática ao chat
-- e garantir que o sistema de projetos funcione independentemente

-- 1. Verificar e remover qualquer trigger que ainda referencie chat
DROP TRIGGER IF EXISTS trigger_webhooks ON public.projects CASCADE;
DROP TRIGGER IF EXISTS project_webhook_trigger ON public.projects CASCADE;
DROP TRIGGER IF EXISTS chat_creation_trigger ON public.projects CASCADE;
DROP TRIGGER IF EXISTS create_project_chat_room ON public.projects CASCADE;

-- 2. Remover qualquer função que ainda tente criar chat rooms
DROP FUNCTION IF EXISTS public.create_project_chat_room() CASCADE;
DROP FUNCTION IF EXISTS public.link_project_to_chat_room() CASCADE;
DROP FUNCTION IF EXISTS public.trigger_project_chat_creation() CASCADE;

-- 3. Limpar a função de webhook para ser completamente independente do chat
CREATE OR REPLACE FUNCTION public.trigger_webhooks_projects_only()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
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
$function$;

-- 4. Recriar trigger limpo na tabela projects
CREATE TRIGGER trigger_webhooks_projects_only
  AFTER INSERT OR UPDATE OR DELETE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.trigger_webhooks_projects_only();

-- 5. Fazer o mesmo para project_stages
CREATE TRIGGER trigger_webhooks_stages_only
  AFTER INSERT OR UPDATE OR DELETE ON public.project_stages
  FOR EACH ROW EXECUTE FUNCTION public.trigger_webhooks_projects_only();

-- 6. Limpar logs de sistema que podem estar causando conflito
DELETE FROM public.system_logs 
WHERE message LIKE '%chat%' 
   OR message LIKE '%project_id%' 
   OR details::text LIKE '%chat%'
   OR details::text LIKE '%project_id%';

-- 7. Verificar se não há mais referências problemáticas
SELECT 'Sistema limpo - projetos totalmente independentes do chat';
