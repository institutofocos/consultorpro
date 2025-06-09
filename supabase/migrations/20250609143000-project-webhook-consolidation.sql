
-- Função para desabilitar triggers de projeto temporariamente
CREATE OR REPLACE FUNCTION disable_project_triggers()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Desabilitar trigger para projects
  ALTER TABLE projects DISABLE TRIGGER project_webhooks_trigger;
  
  -- Desabilitar trigger para project_stages  
  ALTER TABLE project_stages DISABLE TRIGGER project_stages_webhooks_trigger;
  
  -- Log da operação
  INSERT INTO system_logs (log_type, category, message, details)
  VALUES (
    'info',
    'webhook_consolidation',
    'Triggers de projeto desabilitados temporariamente',
    jsonb_build_object(
      'operation', 'disable_triggers',
      'timestamp', NOW()
    )
  );
END;
$$;

-- Função para reabilitar triggers de projeto
CREATE OR REPLACE FUNCTION enable_project_triggers()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Reabilitar trigger para projects
  ALTER TABLE projects ENABLE TRIGGER project_webhooks_trigger;
  
  -- Reabilitar trigger para project_stages
  ALTER TABLE project_stages ENABLE TRIGGER project_stages_webhooks_trigger;
  
  -- Log da operação
  INSERT INTO system_logs (log_type, category, message, details)
  VALUES (
    'info',
    'webhook_consolidation',
    'Triggers de projeto reabilitados',
    jsonb_build_object(
      'operation', 'enable_triggers',
      'timestamp', NOW()
    )
  );
END;
$$;

-- Função para buscar dados completos do projeto para webhook consolidado
CREATE OR REPLACE FUNCTION get_project_webhook_data(project_uuid uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  project_data jsonb;
  stages_data jsonb;
  client_data jsonb;
  service_data jsonb;
  main_consultant_data jsonb;
  support_consultant_data jsonb;
  result jsonb;
BEGIN
  -- Buscar dados do projeto
  SELECT to_jsonb(p.*) INTO project_data
  FROM projects p
  WHERE p.id = project_uuid;
  
  IF project_data IS NULL THEN
    RAISE EXCEPTION 'Projeto não encontrado: %', project_uuid;
  END IF;
  
  -- Buscar etapas do projeto
  SELECT COALESCE(jsonb_agg(to_jsonb(ps.*) ORDER BY ps.stage_order), '[]'::jsonb) INTO stages_data
  FROM project_stages ps
  WHERE ps.project_id = project_uuid;
  
  -- Buscar dados do cliente se existir
  SELECT to_jsonb(c.*) INTO client_data
  FROM clients c
  WHERE c.id = (project_data->>'client_id')::uuid;
  
  -- Buscar dados do serviço se existir
  SELECT to_jsonb(s.*) INTO service_data
  FROM services s
  WHERE s.id = (project_data->>'service_id')::uuid;
  
  -- Buscar dados do consultor principal se existir
  SELECT to_jsonb(co.*) INTO main_consultant_data
  FROM consultants co
  WHERE co.id = (project_data->>'main_consultant_id')::uuid;
  
  -- Buscar dados do consultor de apoio se existir
  SELECT to_jsonb(co.*) INTO support_consultant_data
  FROM consultants co
  WHERE co.id = (project_data->>'support_consultant_id')::uuid;
  
  -- Montar resultado consolidado
  result := jsonb_build_object(
    'event_type', 'PROJECT_CREATED',
    'table_name', 'projects',
    'timestamp', NOW(),
    'project', project_data,
    'stages', stages_data,
    'client', client_data,
    'service', service_data,
    'main_consultant', main_consultant_data,
    'support_consultant', support_consultant_data
  );
  
  RETURN result;
END;
$$;

-- Log de criação das funções
INSERT INTO system_logs (log_type, category, message, details)
VALUES (
  'info',
  'webhook_consolidation',
  'Funções de consolidação de webhook criadas',
  jsonb_build_object(
    'functions', ARRAY['disable_project_triggers', 'enable_project_triggers', 'get_project_webhook_data'],
    'timestamp', NOW()
  )
);
