-- Remover completamente os triggers e funções relacionados ao chat que ainda estão ativos

-- 1. Remover triggers de chat nas tabelas de projeto e etapas
DROP TRIGGER IF EXISTS trigger_create_stage_chat_room ON project_stages;

-- 2. Remover a função que tenta criar salas de chat para etapas
DROP FUNCTION IF EXISTS public.create_stage_chat_room() CASCADE;

-- 3. Verificar e remover qualquer função que ainda referencie chat_rooms
DROP FUNCTION IF EXISTS public.create_project_chat_room() CASCADE;
DROP FUNCTION IF EXISTS public.add_user_to_project_chat() CASCADE;
DROP FUNCTION IF EXISTS public.create_chat_room_for_project() CASCADE;
DROP FUNCTION IF EXISTS public.setup_project_chat_room() CASCADE;

-- 4. Remover qualquer trigger relacionado a webhooks de chat (se existir)
DROP TRIGGER IF EXISTS chat_webhook_trigger ON projects;
DROP TRIGGER IF EXISTS chat_room_webhook_trigger ON project_stages;

-- 5. Limpar logs do sistema relacionados a chat
DELETE FROM system_logs WHERE message LIKE '%chat%' OR message LIKE '%Chat%' OR category LIKE '%chat%';

-- 6. Verificar e remover configurações de sistema relacionadas a chat
DELETE FROM system_settings WHERE setting_key LIKE '%chat%' OR setting_key LIKE '%Chat%';

-- 7. Log de confirmação
INSERT INTO public.system_logs (log_type, category, message, details)
VALUES (
  'success', 
  'system_cleanup', 
  'Triggers e funções de chat removidos completamente do sistema de projetos',
  jsonb_build_object(
    'removed_triggers', ARRAY['trigger_create_stage_chat_room'],
    'removed_functions', ARRAY['create_stage_chat_room', 'create_project_chat_room', 'add_user_to_project_chat', 'create_chat_room_for_project', 'setup_project_chat_room'],
    'cleanup_completed_at', NOW(),
    'system_now_chat_independent', true
  )
);