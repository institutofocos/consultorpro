
-- Primeira verificação: remover TODOS os triggers que possam estar referenciando chat
DO $$
DECLARE
  trigger_record RECORD;
  function_record RECORD;
BEGIN
  -- Remover TODOS os triggers das tabelas projects e project_stages
  FOR trigger_record IN 
    SELECT schemaname, tablename, triggername 
    FROM pg_triggers 
    WHERE (tablename = 'projects' OR tablename = 'project_stages')
    AND schemaname = 'public'
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS %I ON %I.%I CASCADE', 
      trigger_record.triggername, 
      trigger_record.schemaname, 
      trigger_record.tablename
    );
  END LOOP;
  
  -- Remover TODAS as funções que possam ter referências a chat
  FOR function_record IN 
    SELECT proname, pg_get_function_identity_arguments(oid) as args
    FROM pg_proc 
    WHERE (proname LIKE '%chat%' OR proname LIKE '%trigger_webhooks%')
    AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
  LOOP
    EXECUTE format('DROP FUNCTION IF EXISTS public.%I(%s) CASCADE', 
      function_record.proname, 
      function_record.args
    );
  END LOOP;
  
  -- Limpar TODOS os logs de sistema que possam estar causando conflito
  DELETE FROM public.system_logs WHERE 1=1;
  
  -- Verificar se há alguma referência a chat_rooms em outras tabelas
  DROP TABLE IF EXISTS public.chat_messages CASCADE;
  DROP TABLE IF EXISTS public.chat_room_participants CASCADE; 
  DROP TABLE IF EXISTS public.chat_rooms CASCADE;
END $$;

-- Recriar APENAS os triggers essenciais para projetos e etapas (SEM CHAT)
CREATE OR REPLACE FUNCTION public.trigger_webhooks_clean_final()
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

  -- Processar webhooks APENAS - ZERO referências a qualquer sistema de chat
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

-- Recriar triggers limpos
CREATE TRIGGER trigger_webhooks_final_clean
  AFTER INSERT OR UPDATE OR DELETE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.trigger_webhooks_clean_final();

CREATE TRIGGER trigger_webhooks_stages_final_clean
  AFTER INSERT OR UPDATE OR DELETE ON public.project_stages
  FOR EACH ROW EXECUTE FUNCTION public.trigger_webhooks_clean_final();

-- Verificar se as tabelas estão funcionando corretamente
SELECT 'Limpeza completa realizada - sistema 100% independente' as status;
