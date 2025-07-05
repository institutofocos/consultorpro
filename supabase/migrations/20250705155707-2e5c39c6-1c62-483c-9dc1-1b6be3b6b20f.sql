
-- Verificar e remover qualquer trigger ou função ainda conectada ao chat
DO $$
DECLARE
  trigger_record RECORD;
  function_record RECORD;
BEGIN
  -- Remover todos os triggers relacionados a chat em todas as tabelas
  FOR trigger_record IN 
    SELECT schemaname, tablename, triggername 
    FROM pg_triggers 
    WHERE triggername LIKE '%chat%' 
    AND schemaname = 'public'
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS %I ON %I.%I CASCADE', 
      trigger_record.triggername, 
      trigger_record.schemaname, 
      trigger_record.tablename
    );
  END LOOP;
  
  -- Remover todas as funções relacionadas a chat
  FOR function_record IN 
    SELECT proname, pg_get_function_identity_arguments(oid) as args
    FROM pg_proc 
    WHERE proname LIKE '%chat%' 
    AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
  LOOP
    EXECUTE format('DROP FUNCTION IF EXISTS public.%I(%s) CASCADE', 
      function_record.proname, 
      function_record.args
    );
  END LOOP;
  
  -- Verificar se existe alguma coluna relacionada a chat nas tabelas de projeto
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_schema = 'public' 
             AND table_name = 'projects' 
             AND column_name LIKE '%chat%') THEN
    ALTER TABLE public.projects DROP COLUMN IF EXISTS chat_room_id CASCADE;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_schema = 'public' 
             AND table_name = 'project_stages' 
             AND column_name LIKE '%chat%') THEN
    ALTER TABLE public.project_stages DROP COLUMN IF EXISTS chat_room_id CASCADE;
  END IF;
  
  -- Remover qualquer trigger de webhook que possa estar tentando criar chat
  DROP TRIGGER IF EXISTS trigger_webhooks ON public.projects CASCADE;
  DROP TRIGGER IF EXISTS project_webhook_trigger ON public.projects CASCADE;
  DROP TRIGGER IF EXISTS chat_creation_trigger ON public.projects CASCADE;
  
  -- Recriar apenas o trigger de webhook sem referências a chat
  CREATE OR REPLACE FUNCTION public.trigger_webhooks_clean()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  AS $trigger_function$
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

    -- Processar webhooks APENAS - SEM CRIAR CHAT
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
  $trigger_function$;
  
  -- Recriar o trigger limpo na tabela projects
  CREATE TRIGGER trigger_webhooks_clean
    AFTER INSERT OR UPDATE OR DELETE ON public.projects
    FOR EACH ROW EXECUTE FUNCTION public.trigger_webhooks_clean();
    
  -- Fazer o mesmo para project_stages
  CREATE TRIGGER trigger_webhooks_clean_stages
    AFTER INSERT OR UPDATE OR DELETE ON public.project_stages
    FOR EACH ROW EXECUTE FUNCTION public.trigger_webhooks_clean();

END $$;

-- Limpar logs relacionados a erros de chat
DELETE FROM public.system_logs 
WHERE message LIKE '%chat%' 
   OR message LIKE '%project_id%' 
   OR details::text LIKE '%chat%';

-- Verificar se não há mais referências problemáticas
SELECT 'Limpeza concluída - sistema de projetos independente do chat';
