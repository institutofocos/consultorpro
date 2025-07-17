
-- Remover COMPLETAMENTE todas as tabelas, funções, triggers e políticas relacionadas ao chat

-- 1. Remover todas as políticas RLS relacionadas ao chat
DROP POLICY IF EXISTS "Users can view chat rooms based on participation" ON public.chat_rooms;
DROP POLICY IF EXISTS "Users can manage room participants" ON public.chat_room_participants;
DROP POLICY IF EXISTS "Authenticated users can view messages in active rooms" ON public.chat_messages;
DROP POLICY IF EXISTS "Authenticated users can send messages to active rooms" ON public.chat_messages;
DROP POLICY IF EXISTS "Users can edit their own messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Allow authenticated users to view all chat rooms" ON public.chat_rooms;
DROP POLICY IF EXISTS "Allow authenticated users to create chat rooms" ON public.chat_rooms;
DROP POLICY IF EXISTS "Allow room creators to update their rooms" ON public.chat_rooms;
DROP POLICY IF EXISTS "Allow room creators to delete their rooms" ON public.chat_rooms;
DROP POLICY IF EXISTS "Allow authenticated users to view all participants" ON public.chat_room_participants;
DROP POLICY IF EXISTS "Allow authenticated users to manage participants" ON public.chat_room_participants;

-- 2. Remover TODOS os triggers relacionados ao chat
DROP TRIGGER IF EXISTS chat_messages_updated_at ON public.chat_messages;
DROP TRIGGER IF EXISTS chat_rooms_updated_at ON public.chat_rooms;
DROP TRIGGER IF EXISTS chat_room_participants_updated_at ON public.chat_room_participants;

-- 3. Remover TODAS as funções relacionadas ao chat
DROP FUNCTION IF EXISTS public.user_can_view_chat_room(uuid, uuid) CASCADE;
DROP FUNCTION IF EXISTS public.get_available_chat_users() CASCADE;
DROP FUNCTION IF EXISTS public.get_room_participants(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.update_room_participants(uuid, jsonb) CASCADE;
DROP FUNCTION IF EXISTS public.add_user_to_room_and_subrooms(uuid, uuid, uuid, boolean, boolean) CASCADE;
DROP FUNCTION IF EXISTS public.remove_user_from_specific_room(uuid, uuid) CASCADE;
DROP FUNCTION IF EXISTS public.get_all_chat_rooms_debug() CASCADE;
DROP FUNCTION IF EXISTS public.get_user_chat_participations(uuid) CASCADE;

-- 4. Remover TODAS as tabelas de chat na ordem correta (devido às foreign keys)
DROP TABLE IF EXISTS public.chat_messages CASCADE;
DROP TABLE IF EXISTS public.chat_room_participants CASCADE;
DROP TABLE IF EXISTS public.chat_rooms CASCADE;
DROP TABLE IF EXISTS public.demand_chat_messages CASCADE;

-- 5. Limpar TODOS os logs do sistema relacionados ao chat
DELETE FROM public.system_logs 
WHERE category LIKE '%chat%' 
   OR message LIKE '%chat%' 
   OR details::text LIKE '%chat%'
   OR details::text LIKE '%chat_room%'
   OR message LIKE '%project_id%';

-- 6. Remover configurações do sistema relacionadas ao chat
DELETE FROM public.system_settings 
WHERE setting_key LIKE '%chat%';

-- 7. Garantir que as funções de webhook estejam limpas e funcionando apenas para projetos
CREATE OR REPLACE FUNCTION public.trigger_webhooks_final()
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

  -- Processar webhooks APENAS para projetos e etapas - SEM chat
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

-- 8. Remover TODOS os triggers antigos e recriar apenas os necessários
DROP TRIGGER IF EXISTS trigger_webhooks_projects_only ON public.projects;
DROP TRIGGER IF EXISTS trigger_webhooks_stages_only ON public.project_stages;
DROP TRIGGER IF EXISTS trigger_webhooks_projects_clean ON public.projects;
DROP TRIGGER IF EXISTS trigger_webhooks_stages_clean ON public.project_stages;
DROP TRIGGER IF EXISTS trigger_webhooks_final_clean ON public.projects;
DROP TRIGGER IF EXISTS trigger_webhooks_stages_final_clean ON public.project_stages;

-- Criar triggers limpos apenas para projetos e etapas
CREATE TRIGGER trigger_webhooks_projects_final
  AFTER INSERT OR UPDATE OR DELETE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.trigger_webhooks_final();

CREATE TRIGGER trigger_webhooks_stages_final
  AFTER INSERT OR UPDATE OR DELETE ON public.project_stages
  FOR EACH ROW EXECUTE FUNCTION public.trigger_webhooks_final();

-- 9. Verificar se não há mais referências a chat em outras tabelas
-- Remover qualquer coluna que faça referência a chat_rooms se existir
DO $$
BEGIN
    -- Verificar se existe alguma coluna relacionada a chat em projects
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'projects' 
               AND column_name LIKE '%chat%') THEN
        ALTER TABLE projects DROP COLUMN IF EXISTS chat_room_id;
        ALTER TABLE projects DROP COLUMN IF EXISTS chat_id;
    END IF;
    
    -- Verificar se existe alguma coluna relacionada a chat em project_stages
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'project_stages' 
               AND column_name LIKE '%chat%') THEN
        ALTER TABLE project_stages DROP COLUMN IF EXISTS chat_room_id;
        ALTER TABLE project_stages DROP COLUMN IF EXISTS chat_id;
    END IF;
END $$;

-- 10. Log de confirmação
INSERT INTO public.system_logs (log_type, category, message, details)
VALUES (
  'success', 
  'chat_removal_complete', 
  'Sistema de chat COMPLETAMENTE removido - projetos e etapas funcionam independentemente',
  jsonb_build_object(
    'timestamp', NOW(),
    'action', 'complete_chat_removal',
    'tables_removed', '["chat_rooms", "chat_room_participants", "chat_messages"]',
    'functions_removed', 'all_chat_functions',
    'triggers_cleaned', true,
    'webhooks_cleaned', true
  )
);
