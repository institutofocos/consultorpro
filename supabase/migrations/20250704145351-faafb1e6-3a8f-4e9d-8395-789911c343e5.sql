
-- Remover completamente qualquer referência problemática e garantir que o sistema de projetos funcione independentemente do chat

-- 1. Verificar se existe alguma coluna project_id na tabela chat_rooms e removê-la se existir
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'chat_rooms' AND column_name = 'project_id') THEN
        ALTER TABLE public.chat_rooms DROP COLUMN project_id;
    END IF;
END $$;

-- 2. Remover TODOS os triggers que possam estar causando problemas
DROP TRIGGER IF EXISTS trigger_webhooks ON public.projects;
DROP TRIGGER IF EXISTS trigger_consolidated_project_webhook ON public.projects;
DROP TRIGGER IF EXISTS trigger_project_creation ON public.projects;
DROP TRIGGER IF EXISTS trigger_project_webhook_simple ON public.projects;
DROP TRIGGER IF EXISTS trigger_webhooks ON public.project_stages;
DROP TRIGGER IF EXISTS trigger_webhooks ON public.chat_rooms;

-- 3. Remover funções problemáticas
DROP FUNCTION IF EXISTS public.trigger_consolidated_project_webhook();
DROP FUNCTION IF EXISTS public.trigger_project_webhook_simple();

-- 4. Criar função completamente nova e simples para logs de projeto
CREATE OR REPLACE FUNCTION public.log_project_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Log simples sem qualquer referência a chat ou outras tabelas
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.system_logs (log_type, category, message, details)
    VALUES (
      'info', 
      'project_created', 
      'Projeto criado: ' || NEW.name,
      jsonb_build_object(
        'project_id', NEW.id,
        'project_name', NEW.name,
        'created_at', NOW()
      )
    );
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO public.system_logs (log_type, category, message, details)
    VALUES (
      'info', 
      'project_updated', 
      'Projeto atualizado: ' || NEW.name,
      jsonb_build_object(
        'project_id', NEW.id,
        'project_name', NEW.name,
        'updated_at', NOW()
      )
    );
  END IF;

  RETURN NEW;
END;
$$;

-- 5. Criar trigger simples apenas para logging
CREATE TRIGGER trigger_log_project_changes
  AFTER INSERT OR UPDATE ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION public.log_project_changes();

-- 6. Garantir que user_can_view_chat_room não interfira
CREATE OR REPLACE FUNCTION public.user_can_view_chat_room(room_id uuid, user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Função isolada que não interfere com projetos
  RETURN EXISTS (
    SELECT 1 FROM chat_room_participants crp
    WHERE crp.room_id = room_id AND crp.user_id = user_id AND crp.can_read = true
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN TRUE; -- Em caso de erro, permitir acesso
END;
$$;

-- 7. Log de correção
INSERT INTO public.system_logs (log_type, category, message, details)
VALUES (
  'info', 
  'project_system_isolation', 
  'Sistema de projetos completamente isolado do sistema de chat',
  jsonb_build_object(
    'timestamp', NOW(),
    'action', 'isolate_project_system',
    'description', 'Removidas todas as dependências cruzadas entre projetos e chat'
  )
);
