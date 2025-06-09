
-- Atualizar a função para criar webhook consolidado
CREATE OR REPLACE FUNCTION public.trigger_consolidated_project_webhook()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  webhook_record RECORD;
  consolidated_payload jsonb;
  log_id uuid;
  webhook_count integer := 0;
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
    INSERT INTO public.system_logs (log_type, category, message, details)
    VALUES (
      'warning', 
      'webhook_consolidado_disabled', 
      'Sistema de webhook consolidado está desabilitado',
      jsonb_build_object('project_id', NEW.id, 'project_name', NEW.name)
    );
    RETURN NEW;
  END IF;

  -- Log inicial
  INSERT INTO public.system_logs (log_type, category, message, details)
  VALUES (
    'info', 
    'webhook_consolidado_iniciado', 
    'Iniciando criação de webhook consolidado para projeto: ' || NEW.name,
    jsonb_build_object(
      'project_id', NEW.id,
      'project_name', NEW.name,
      'timestamp', NOW()
    )
  ) RETURNING id INTO log_id;

  -- Aguardar um momento para garantir que as etapas sejam criadas primeiro
  PERFORM pg_sleep(0.1);

  -- Gerar payload consolidado
  consolidated_payload := public.get_project_consolidated_data(NEW.id);

  -- Buscar webhooks ativos que devem receber eventos de projetos
  FOR webhook_record IN
    SELECT * FROM public.webhooks 
    WHERE is_active = true 
    AND 'projects' = ANY(tables)
    AND 'INSERT' = ANY(events)
  LOOP
    
    -- Inserir APENAS UM webhook consolidado na fila
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
      'project_created_consolidated', 
      'projects_consolidated', 
      consolidated_payload, 
      false, 
      0,
      NOW(),
      NOW()
    );
    
    webhook_count := webhook_count + 1;
    
    INSERT INTO public.system_logs (log_type, category, message, details)
    VALUES (
      'success', 
      'webhook_consolidado_criado', 
      'Webhook consolidado único criado para projeto: ' || NEW.name,
      jsonb_build_object(
        'webhook_id', webhook_record.id,
        'project_id', NEW.id,
        'webhook_count', webhook_count,
        'payload_size', pg_column_size(consolidated_payload)
      )
    );
    
  END LOOP;

  -- Log final
  INSERT INTO public.system_logs (log_type, category, message, details)
  VALUES (
    'info', 
    'webhook_consolidado_concluido', 
    'Processo de webhook consolidado concluído. Total de webhooks criados: ' || webhook_count,
    jsonb_build_object(
      'project_id', NEW.id,
      'total_webhooks_created', webhook_count,
      'consolidated_only', true
    )
  );

  RETURN NEW;
END;
$$;
