
-- Criar função para coletar dados consolidados de status de projeto
CREATE OR REPLACE FUNCTION public.get_project_status_change_data(p_project_id uuid, p_old_status text, p_new_status text)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
  project_data jsonb;
  client_data jsonb;
  service_data jsonb;
  main_consultant_data jsonb;
  tags_data jsonb;
  consolidated_payload jsonb;
BEGIN
  -- Buscar dados do projeto
  SELECT jsonb_build_object(
    'id', p.id,
    'project_id', p.project_id,
    'name', p.name,
    'description', p.description,
    'status', p.status,
    'start_date', p.start_date,
    'end_date', p.end_date,
    'total_value', p.total_value,
    'url', p.url,
    'created_at', p.created_at,
    'updated_at', p.updated_at
  ) INTO project_data
  FROM projects p
  WHERE p.id = p_project_id;
  
  -- Buscar dados do cliente
  SELECT jsonb_build_object(
    'id', c.id,
    'name', c.name,
    'contact_name', c.contact_name,
    'email', c.email,
    'phone', c.phone
  ) INTO client_data
  FROM clients c
  JOIN projects p ON p.client_id = c.id
  WHERE p.id = p_project_id;
  
  -- Buscar dados do serviço
  SELECT jsonb_build_object(
    'id', s.id,
    'name', s.name,
    'description', s.description,
    'total_value', s.total_value,
    'url', s.url
  ) INTO service_data
  FROM services s
  JOIN projects p ON p.service_id = s.id
  WHERE p.id = p_project_id;
  
  -- Buscar dados do consultor principal
  SELECT jsonb_build_object(
    'id', cons.id,
    'name', cons.name,
    'email', cons.email,
    'phone', cons.phone
  ) INTO main_consultant_data
  FROM consultants cons
  JOIN projects p ON p.main_consultant_id = cons.id
  WHERE p.id = p_project_id;
  
  -- Buscar tags do projeto
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', pt.id,
      'name', pt.name,
      'color', pt.color
    )
  ) INTO tags_data
  FROM project_tag_relations ptr
  JOIN project_tags pt ON ptr.tag_id = pt.id
  WHERE ptr.project_id = p_project_id;
  
  -- Montar payload consolidado para status de projeto
  consolidated_payload := jsonb_build_object(
    'event_type', 'project_status_changed',
    'timestamp', NOW(),
    'entity_type', 'project',
    'change_type', 'status_update',
    'status_change', jsonb_build_object(
      'old_status', p_old_status,
      'new_status', p_new_status,
      'changed_at', NOW()
    ),
    'project', project_data,
    'client', client_data,
    'service', service_data,
    'consultor', main_consultant_data,
    'tags', COALESCE(tags_data, '[]'::jsonb),
    'system_info', jsonb_build_object(
      'source', 'ConsultorPRO System',
      'webhook_type', 'status_change',
      'processed_at', NOW(),
      'version', 'status_change_1.0'
    )
  );
  
  RETURN consolidated_payload;
END;
$$;

-- Criar função para coletar dados consolidados de status de etapa
CREATE OR REPLACE FUNCTION public.get_stage_status_change_data(p_stage_id uuid, p_old_status text, p_new_status text)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
  stage_data jsonb;
  project_data jsonb;
  client_data jsonb;
  service_data jsonb;
  consultant_data jsonb;
  tags_data jsonb;
  consolidated_payload jsonb;
BEGIN
  -- Buscar dados da etapa
  SELECT jsonb_build_object(
    'id', ps.id,
    'name', ps.name,
    'description', ps.description,
    'status', ps.status,
    'value', ps.value,
    'valor_de_repasse', ps.valor_de_repasse,
    'start_date', ps.start_date,
    'end_date', ps.end_date,
    'created_at', ps.created_at,
    'updated_at', ps.updated_at
  ) INTO stage_data
  FROM project_stages ps
  WHERE ps.id = p_stage_id;
  
  -- Buscar dados do projeto relacionado
  SELECT jsonb_build_object(
    'id', p.id,
    'project_id', p.project_id,
    'name', p.name,
    'description', p.description,
    'status', p.status,
    'start_date', p.start_date,
    'end_date', p.end_date,
    'total_value', p.total_value,
    'url', p.url
  ) INTO project_data
  FROM projects p
  JOIN project_stages ps ON ps.project_id = p.id
  WHERE ps.id = p_stage_id;
  
  -- Buscar dados do cliente
  SELECT jsonb_build_object(
    'id', c.id,
    'name', c.name,
    'contact_name', c.contact_name,
    'email', c.email,
    'phone', c.phone
  ) INTO client_data
  FROM clients c
  JOIN projects p ON p.client_id = c.id
  JOIN project_stages ps ON ps.project_id = p.id
  WHERE ps.id = p_stage_id;
  
  -- Buscar dados do serviço
  SELECT jsonb_build_object(
    'id', s.id,
    'name', s.name,
    'description', s.description,
    'total_value', s.total_value,
    'url', s.url
  ) INTO service_data
  FROM services s
  JOIN projects p ON p.service_id = s.id
  JOIN project_stages ps ON ps.project_id = p.id
  WHERE ps.id = p_stage_id;
  
  -- Buscar dados do consultor da etapa
  SELECT jsonb_build_object(
    'id', cons.id,
    'name', cons.name,
    'email', cons.email,
    'phone', cons.phone
  ) INTO consultant_data
  FROM consultants cons
  JOIN project_stages ps ON ps.consultant_id = cons.id
  WHERE ps.id = p_stage_id;
  
  -- Buscar tags do projeto
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', pt.id,
      'name', pt.name,
      'color', pt.color
    )
  ) INTO tags_data
  FROM project_tag_relations ptr
  JOIN project_tags pt ON ptr.tag_id = pt.id
  JOIN project_stages ps ON ptr.project_id = ps.project_id
  WHERE ps.id = p_stage_id;
  
  -- Montar payload consolidado para status de etapa
  consolidated_payload := jsonb_build_object(
    'event_type', 'stage_status_changed',
    'timestamp', NOW(),
    'entity_type', 'stage',
    'change_type', 'status_update',
    'status_change', jsonb_build_object(
      'old_status', p_old_status,
      'new_status', p_new_status,
      'changed_at', NOW()
    ),
    'etapa', stage_data,
    'project', project_data,
    'client', client_data,
    'service', service_data,
    'consultor', consultant_data,
    'tags', COALESCE(tags_data, '[]'::jsonb),
    'system_info', jsonb_build_object(
      'source', 'ConsultorPRO System',
      'webhook_type', 'status_change',
      'processed_at', NOW(),
      'version', 'status_change_1.0'
    )
  );
  
  RETURN consolidated_payload;
END;
$$;

-- Criar trigger para mudanças de status em projetos
CREATE OR REPLACE FUNCTION public.trigger_project_status_webhook()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  consolidated_payload jsonb;
  webhook_exists boolean := false;
BEGIN
  -- Só processar para UPDATEs onde o status mudou
  IF TG_OP != 'UPDATE' OR OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;

  -- Verificar se existe pelo menos um webhook ativo
  SELECT EXISTS(
    SELECT 1 FROM public.webhooks 
    WHERE is_active = true
  ) INTO webhook_exists;

  -- Se não há webhooks ativos, não processar
  IF NOT webhook_exists THEN
    RETURN NEW;
  END IF;

  -- Gerar payload consolidado para mudança de status do projeto
  consolidated_payload := public.get_project_status_change_data(NEW.id, OLD.status, NEW.status);

  -- Inserir APENAS UM webhook de status na fila
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
     LIMIT 1),
    'project_status_changed', 
    'projects_status_change', 
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
    'webhook_status_change_project', 
    'Webhook de mudança de status criado para projeto: ' || NEW.name,
    jsonb_build_object(
      'project_id', NEW.id,
      'project_name', NEW.name,
      'old_status', OLD.status,
      'new_status', NEW.status,
      'timestamp', NOW()
    )
  );

  RETURN NEW;
END;
$$;

-- Criar trigger para mudanças de status em etapas
CREATE OR REPLACE FUNCTION public.trigger_stage_status_webhook()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  consolidated_payload jsonb;
  webhook_exists boolean := false;
BEGIN
  -- Só processar para UPDATEs onde o status mudou
  IF TG_OP != 'UPDATE' OR COALESCE(OLD.status, '') = COALESCE(NEW.status, '') THEN
    RETURN NEW;
  END IF;

  -- Verificar se existe pelo menos um webhook ativo
  SELECT EXISTS(
    SELECT 1 FROM public.webhooks 
    WHERE is_active = true
  ) INTO webhook_exists;

  -- Se não há webhooks ativos, não processar
  IF NOT webhook_exists THEN
    RETURN NEW;
  END IF;

  -- Gerar payload consolidado para mudança de status da etapa
  consolidated_payload := public.get_stage_status_change_data(NEW.id, COALESCE(OLD.status, ''), COALESCE(NEW.status, ''));

  -- Inserir APENAS UM webhook de status na fila
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
     LIMIT 1),
    'stage_status_changed', 
    'project_stages_status_change', 
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
    'webhook_status_change_stage', 
    'Webhook de mudança de status criado para etapa: ' || NEW.name,
    jsonb_build_object(
      'stage_id', NEW.id,
      'stage_name', NEW.name,
      'project_id', NEW.project_id,
      'old_status', COALESCE(OLD.status, ''),
      'new_status', COALESCE(NEW.status, ''),
      'timestamp', NOW()
    )
  );

  RETURN NEW;
END;
$$;

-- Criar os triggers para capturar mudanças de status
CREATE TRIGGER project_status_change_webhook_trigger
  AFTER UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_project_status_webhook();

CREATE TRIGGER stage_status_change_webhook_trigger
  AFTER UPDATE ON project_stages
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_stage_status_webhook();

-- Configuração para identificar webhooks de status
INSERT INTO public.system_settings (setting_key, setting_value, description)
VALUES (
  'webhook_status_change_enabled', 
  'true', 
  'Habilita o envio de webhooks para mudanças de status em projetos e etapas'
) ON CONFLICT (setting_key) DO UPDATE SET 
  setting_value = EXCLUDED.setting_value,
  updated_at = NOW();

-- Log de configuração
INSERT INTO public.system_logs (log_type, category, message, details)
VALUES (
  'success', 
  'webhook_status_system_configured', 
  'Sistema de webhooks para mudanças de status configurado com sucesso',
  jsonb_build_object(
    'timestamp', NOW(),
    'triggers_created', ARRAY['project_status_change_webhook_trigger', 'stage_status_change_webhook_trigger'],
    'functions_created', ARRAY['get_project_status_change_data', 'get_stage_status_change_data', 'trigger_project_status_webhook', 'trigger_stage_status_webhook']
  )
);
