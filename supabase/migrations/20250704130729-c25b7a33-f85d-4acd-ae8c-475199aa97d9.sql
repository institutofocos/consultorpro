
-- Verificar e remover qualquer referência incorreta à coluna project_id na tabela chat_rooms
-- e garantir que não há triggers problemáticos

-- Primeiro, vamos verificar se há algum trigger problemático nas tabelas relacionadas
-- Remover triggers que possam estar causando o problema

DROP TRIGGER IF EXISTS trigger_webhooks ON public.chat_rooms;
DROP TRIGGER IF EXISTS trigger_consolidated_project_webhook ON public.projects;

-- Recriar apenas o trigger essencial para projetos (sem interferência com chat)
CREATE OR REPLACE FUNCTION public.trigger_consolidated_project_webhook()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  consolidated_payload jsonb;
  webhook_exists boolean := false;
BEGIN
  -- Só processar para INSERTs (criação de projeto)
  IF TG_OP != 'INSERT' THEN
    RETURN NEW;
  END IF;

  -- Verificar se existe pelo menos um webhook ativo para projetos
  SELECT EXISTS(
    SELECT 1 FROM public.webhooks 
    WHERE is_active = true 
    AND 'projects' = ANY(tables)
    AND 'INSERT' = ANY(events)
  ) INTO webhook_exists;

  -- Se não há webhooks ativos, não processar
  IF NOT webhook_exists THEN
    RETURN NEW;
  END IF;

  -- Aguardar um momento para garantir que as etapas sejam criadas primeiro
  PERFORM pg_sleep(0.1);

  -- Gerar payload consolidado SEM referência a chat_rooms
  consolidated_payload := jsonb_build_object(
    'event_type', 'project_created_consolidated',
    'timestamp', NOW(),
    'project_id', NEW.id,
    'project_name', NEW.name,
    'system_info', jsonb_build_object(
      'source', 'ConsultorPRO System',
      'consolidation_type', 'project_creation_simple',
      'processed_at', NOW()
    )
  );

  -- Inserir webhook consolidado na fila
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
    (SELECT id FROM public.webhooks 
     WHERE is_active = true 
     AND 'projects' = ANY(tables)
     AND 'INSERT' = ANY(events)
     LIMIT 1),
    'project_created_consolidated', 
    'projects_consolidated', 
    consolidated_payload, 
    false, 
    0,
    NOW(),
    NOW()
  );

  RETURN NEW;
END;
$$;

-- Recriar o trigger apenas para projects
CREATE TRIGGER trigger_consolidated_project_webhook
  AFTER INSERT ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_consolidated_project_webhook();

-- Garantir que não há conflitos nas políticas RLS
-- Verificar se existem políticas RLS problemáticas que referenciam colunas inexistentes

-- Log de correção
INSERT INTO public.system_logs (log_type, category, message, details)
VALUES (
  'info', 
  'chat_project_fix_final', 
  'Removidos triggers problemáticos e corrigidas referências incorretas',
  jsonb_build_object(
    'timestamp', NOW(),
    'action', 'remove_problematic_triggers',
    'description', 'Triggers recriados sem referências a project_id em chat_rooms'
  )
);
