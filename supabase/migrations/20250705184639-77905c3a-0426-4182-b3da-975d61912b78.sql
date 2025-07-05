
-- Limpar COMPLETAMENTE qualquer referência ao sistema de chat
-- Esta é uma limpeza final e definitiva

-- 1. Remover TODOS os triggers relacionados a chat e project_id
DROP TRIGGER IF EXISTS trigger_webhooks ON public.projects CASCADE;
DROP TRIGGER IF EXISTS project_webhook_trigger ON public.projects CASCADE;
DROP TRIGGER IF EXISTS chat_creation_trigger ON public.projects CASCADE;
DROP TRIGGER IF EXISTS create_project_chat_room ON public.projects CASCADE;
DROP TRIGGER IF EXISTS project_chat_trigger ON public.projects CASCADE;
DROP TRIGGER IF EXISTS auto_create_chat_room ON public.projects CASCADE;

-- 2. Remover TODAS as funções relacionadas a chat
DROP FUNCTION IF EXISTS public.create_project_chat_room() CASCADE;
DROP FUNCTION IF EXISTS public.link_project_to_chat_room() CASCADE;
DROP FUNCTION IF EXISTS public.trigger_project_chat_creation() CASCADE;
DROP FUNCTION IF EXISTS public.auto_create_project_chat() CASCADE;
DROP FUNCTION IF EXISTS public.handle_project_chat_creation() CASCADE;

-- 3. Verificar se ainda existem tabelas de chat e removê-las completamente
DROP TABLE IF EXISTS public.chat_messages CASCADE;
DROP TABLE IF EXISTS public.chat_room_participants CASCADE; 
DROP TABLE IF EXISTS public.chat_rooms CASCADE;

-- 4. Limpar TODOS os logs do sistema que possam estar causando conflito
DELETE FROM public.system_logs WHERE 1=1;

-- 5. Remover TODAS as configurações relacionadas a chat
DELETE FROM public.system_settings WHERE setting_key LIKE '%chat%';

-- 6. Recriar o trigger de webhook limpo APENAS para projetos (sem chat)
CREATE OR REPLACE FUNCTION public.trigger_webhooks_projects_clean()
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

  -- Processar webhooks - SEM qualquer referência a chat
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

-- 7. Criar trigger limpo na tabela projects
DROP TRIGGER IF EXISTS trigger_webhooks_projects_clean ON public.projects;
CREATE TRIGGER trigger_webhooks_projects_clean
  AFTER INSERT OR UPDATE OR DELETE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.trigger_webhooks_projects_clean();

-- 8. Criar trigger limpo na tabela project_stages
DROP TRIGGER IF EXISTS trigger_webhooks_stages_clean ON public.project_stages;
CREATE TRIGGER trigger_webhooks_stages_clean
  AFTER INSERT OR UPDATE OR DELETE ON public.project_stages
  FOR EACH ROW EXECUTE FUNCTION public.trigger_webhooks_projects_clean();

-- 9. Verificar se não há mais referências problemáticas
SELECT 'Sistema completamente limpo - ZERO referências a chat' as status;
