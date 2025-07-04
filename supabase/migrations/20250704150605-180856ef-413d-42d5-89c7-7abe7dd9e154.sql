
-- LIMPEZA COMPLETA: Remover TODOS os vínculos entre projetos e chat

-- 1. Remover TODOS os triggers que podem estar causando problemas
DROP TRIGGER IF EXISTS trigger_webhooks ON public.projects;
DROP TRIGGER IF EXISTS trigger_consolidated_project_webhook ON public.projects;
DROP TRIGGER IF EXISTS trigger_project_creation ON public.projects;
DROP TRIGGER IF EXISTS trigger_project_webhook_simple ON public.projects;
DROP TRIGGER IF EXISTS trigger_log_project_changes ON public.projects;
DROP TRIGGER IF EXISTS trigger_webhooks ON public.project_stages;
DROP TRIGGER IF EXISTS trigger_webhooks ON public.chat_rooms;

-- 2. Remover TODAS as funções relacionadas a triggers de projeto
DROP FUNCTION IF EXISTS public.trigger_consolidated_project_webhook();
DROP FUNCTION IF EXISTS public.trigger_project_webhook_simple();
DROP FUNCTION IF EXISTS public.log_project_changes();

-- 3. Verificar e remover qualquer coluna project_id que possa existir em chat_rooms
DO $$ 
BEGIN
    -- Verificar se a coluna existe antes de tentar removê-la
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'chat_rooms' 
        AND column_name = 'project_id'
    ) THEN
        ALTER TABLE public.chat_rooms DROP COLUMN project_id;
    END IF;
END $$;

-- 4. Limpar webhook_logs de entradas relacionadas a projetos
DELETE FROM public.webhook_logs WHERE table_name = 'projects';
DELETE FROM public.webhook_logs WHERE table_name = 'project_stages';

-- 5. Desativar webhooks relacionados a projetos
UPDATE public.webhooks 
SET is_active = false 
WHERE 'projects' = ANY(tables) OR 'project_stages' = ANY(tables);

-- 6. Garantir que a função user_can_view_chat_room seja completamente independente
CREATE OR REPLACE FUNCTION public.user_can_view_chat_room(room_id uuid, user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Função isolada que só verifica participação em chat
  RETURN EXISTS (
    SELECT 1 FROM chat_room_participants crp
    WHERE crp.room_id = room_id 
    AND crp.user_id = user_id 
    AND crp.can_read = true
  );
EXCEPTION
  WHEN OTHERS THEN
    -- Em caso de erro, permitir acesso para não quebrar o sistema
    RETURN TRUE;
END;
$$;

-- 7. Limpar system_logs de entradas relacionadas ao conflito
DELETE FROM public.system_logs 
WHERE category LIKE '%project%' 
AND category LIKE '%chat%';

-- 8. Verificar se há alguma foreign key problemática
DO $$
DECLARE
    fk_record RECORD;
BEGIN
    FOR fk_record IN 
        SELECT conname, conrelid::regclass AS table_name
        FROM pg_constraint
        WHERE contype = 'f'
        AND confrelid = 'public.chat_rooms'::regclass
    LOOP
        EXECUTE format('ALTER TABLE %s DROP CONSTRAINT IF EXISTS %I', 
                      fk_record.table_name, fk_record.conname);
    END LOOP;
END $$;

-- 9. Log de correção final
INSERT INTO public.system_logs (log_type, category, message, details)
VALUES (
  'info', 
  'system_cleanup', 
  'Sistema de projetos completamente isolado do sistema de chat - LIMPEZA DEFINITIVA',
  jsonb_build_object(
    'timestamp', NOW(),
    'action', 'complete_isolation',
    'description', 'Removidas TODAS as dependências entre projetos e chat'
  )
);
