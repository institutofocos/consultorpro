
-- CORREÇÃO DEFINITIVA: GARANTIR APENAS UM WEBHOOK CONSOLIDADO POR PROJETO

-- Atualizar a função para criar APENAS UM webhook consolidado
CREATE OR REPLACE FUNCTION public.trigger_consolidated_project_webhook()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  consolidated_payload jsonb;
  webhook_count integer := 0;
  webhook_exists boolean := false;
BEGIN
  -- Só processar para INSERTs (criação de projeto)
  IF TG_OP != 'INSERT' THEN
    RETURN NEW;
  END IF;

  -- Verificar se o sistema está configurado para webhooks consolidados
  IF NOT EXISTS (
    SELECT 1 FROM public.system_settings 
    WHERE setting_key = 'webhook_consolidation_enabled' 
    AND setting_value = 'true'
  ) THEN
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
    INSERT INTO public.system_logs (log_type, category, message, details)
    VALUES (
      'info', 
      'webhook_consolidado_sem_destino', 
      'Nenhum webhook ativo encontrado para projeto: ' || NEW.name,
      jsonb_build_object(
        'project_id', NEW.id,
        'project_name', NEW.name
      )
    );
    RETURN NEW;
  END IF;

  -- Aguardar um momento para garantir que as etapas sejam criadas primeiro
  PERFORM pg_sleep(0.2);

  -- Gerar payload consolidado
  consolidated_payload := public.get_project_consolidated_data(NEW.id);

  -- Inserir APENAS UM webhook consolidado na fila (sem loop pelos webhooks)
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
     LIMIT 1), -- Usar apenas o primeiro webhook como referência
    'project_created_consolidated', 
    'projects_consolidated', 
    consolidated_payload, 
    false, 
    0,
    NOW(),
    NOW()
  );

  -- Log do processo
  INSERT INTO public.system_logs (log_type, category, message, details)
  VALUES (
    'success', 
    'webhook_consolidado_unico_criado', 
    'APENAS UM webhook consolidado criado para projeto: ' || NEW.name,
    jsonb_build_object(
      'project_id', NEW.id,
      'project_name', NEW.name,
      'webhooks_created', 1,
      'timestamp', NOW(),
      'solucao_definitiva', true
    )
  );

  RETURN NEW;
END;
$$;

-- Limpar qualquer webhook consolidado duplicado que possa existir
DELETE FROM webhook_logs 
WHERE event_type = 'project_created_consolidated' 
AND created_at > NOW() - INTERVAL '1 hour'
AND id NOT IN (
  SELECT DISTINCT ON (payload->>'project_id') id
  FROM webhook_logs 
  WHERE event_type = 'project_created_consolidated'
  AND created_at > NOW() - INTERVAL '1 hour'
  ORDER BY payload->>'project_id', created_at ASC
);

-- Log de confirmação
INSERT INTO public.system_logs (log_type, category, message, details)
VALUES (
  'success', 
  'webhook_consolidado_corrigido', 
  'Sistema corrigido para garantir APENAS UM webhook consolidado por projeto',
  jsonb_build_object(
    'timestamp', NOW(),
    'correcao_aplicada', true,
    'duplicatas_removidas', true,
    'sistema_definitivo', true
  )
);
