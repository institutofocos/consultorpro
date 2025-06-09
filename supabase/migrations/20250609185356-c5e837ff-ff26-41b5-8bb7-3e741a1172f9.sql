
-- Criar uma função para coletar dados consolidados do projeto
CREATE OR REPLACE FUNCTION public.get_project_consolidated_data(p_project_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
  project_data jsonb;
  client_data jsonb;
  service_data jsonb;
  main_consultant_data jsonb;
  support_consultant_data jsonb;
  stages_data jsonb;
  consolidated_payload jsonb;
BEGIN
  -- Buscar dados do projeto
  SELECT to_jsonb(p.*) INTO project_data
  FROM projects p
  WHERE p.id = p_project_id;
  
  -- Buscar dados do cliente
  SELECT to_jsonb(c.*) INTO client_data
  FROM clients c
  JOIN projects p ON p.client_id = c.id
  WHERE p.id = p_project_id;
  
  -- Buscar dados do serviço
  SELECT to_jsonb(s.*) INTO service_data
  FROM services s
  JOIN projects p ON p.service_id = s.id
  WHERE p.id = p_project_id;
  
  -- Buscar dados do consultor principal
  SELECT to_jsonb(cons.*) INTO main_consultant_data
  FROM consultants cons
  JOIN projects p ON p.main_consultant_id = cons.id
  WHERE p.id = p_project_id;
  
  -- Buscar dados do consultor de apoio
  SELECT to_jsonb(cons.*) INTO support_consultant_data
  FROM consultants cons
  JOIN projects p ON p.support_consultant_id = cons.id
  WHERE p.id = p_project_id;
  
  -- Buscar etapas do projeto
  SELECT jsonb_agg(to_jsonb(ps.*)) INTO stages_data
  FROM project_stages ps
  WHERE ps.project_id = p_project_id
  ORDER BY ps.stage_order;
  
  -- Montar payload consolidado
  consolidated_payload := jsonb_build_object(
    'event_type', 'project_created_consolidated',
    'timestamp', NOW(),
    'project_id', p_project_id,
    'project', project_data,
    'client', client_data,
    'service', service_data,
    'main_consultant', main_consultant_data,
    'support_consultant', support_consultant_data,
    'stages', COALESCE(stages_data, '[]'::jsonb),
    'system_info', jsonb_build_object(
      'source', 'ConsultorPRO System',
      'consolidation_type', 'project_creation',
      'processed_at', NOW()
    )
  );
  
  RETURN consolidated_payload;
END;
$$;

-- Criar uma função para processar webhooks consolidados de projeto
CREATE OR REPLACE FUNCTION public.trigger_consolidated_project_webhook()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  webhook_record RECORD;
  consolidated_payload jsonb;
  log_id uuid;
BEGIN
  -- Só processar para INSERTs (criação de projeto)
  IF TG_OP != 'INSERT' THEN
    RETURN NEW;
  END IF;

  -- Log inicial
  INSERT INTO public.system_logs (log_type, category, message, details)
  VALUES (
    'info', 
    'consolidated_webhook_trigger', 
    'Trigger consolidado executado para criação de projeto: ' || NEW.name,
    jsonb_build_object(
      'project_id', NEW.id,
      'project_name', NEW.name,
      'timestamp', NOW()
    )
  ) RETURNING id INTO log_id;

  -- Gerar payload consolidado
  consolidated_payload := public.get_project_consolidated_data(NEW.id);

  -- Buscar webhooks ativos que devem receber eventos de projetos
  FOR webhook_record IN
    SELECT * FROM public.webhooks 
    WHERE is_active = true 
    AND 'projects' = ANY(tables)
    AND 'INSERT' = ANY(events)
  LOOP
    
    INSERT INTO public.system_logs (log_type, category, message, details)
    VALUES (
      'info', 
      'consolidated_webhook_match', 
      'Webhook consolidado encontrado para projeto: ' || NEW.name,
      jsonb_build_object(
        'webhook_id', webhook_record.id,
        'webhook_url', webhook_record.url,
        'project_id', NEW.id
      )
    );
    
    -- Inserir na fila de webhooks consolidados
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
    
    INSERT INTO public.system_logs (log_type, category, message, details)
    VALUES (
      'success', 
      'consolidated_webhook_queued', 
      'Webhook consolidado adicionado à fila: ' || NEW.name,
      jsonb_build_object(
        'webhook_id', webhook_record.id,
        'project_id', NEW.id,
        'queued_at', NOW()
      )
    );
    
  END LOOP;

  RETURN NEW;
END;
$$;

-- Remover triggers antigos de webhook para projetos (se existirem)
DROP TRIGGER IF EXISTS trigger_webhooks_projects_insert ON projects;
DROP TRIGGER IF EXISTS trigger_webhooks_projects_update ON projects;
DROP TRIGGER IF EXISTS trigger_webhooks_projects_delete ON projects;

-- Criar novo trigger consolidado apenas para criação de projetos
CREATE TRIGGER trigger_consolidated_project_webhook
  AFTER INSERT ON projects
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_consolidated_project_webhook();

-- Adicionar configuração para identificar webhooks consolidados
INSERT INTO public.system_settings (setting_key, setting_value, description)
VALUES (
  'webhook_consolidation_enabled', 
  'true', 
  'Habilita o envio de webhooks consolidados para criação de projetos'
) ON CONFLICT (setting_key) DO UPDATE SET 
  setting_value = EXCLUDED.setting_value,
  updated_at = NOW();
