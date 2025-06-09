
-- Corrigir sistema de webhooks definitivamente

-- 1. Recriar função trigger_webhooks mais simples e confiável
CREATE OR REPLACE FUNCTION public.trigger_webhooks()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  webhook_record RECORD;
  payload jsonb;
  event_type text;
  should_queue boolean := true;
BEGIN
  -- Log de debug
  INSERT INTO public.system_logs (log_type, category, message, details)
  VALUES (
    'info', 
    'webhook_trigger_debug', 
    'Trigger executado: ' || TG_TABLE_NAME || ' - ' || TG_OP,
    jsonb_build_object(
      'table_name', TG_TABLE_NAME,
      'operation', TG_OP,
      'timestamp', NOW()
    )
  );

  -- Determinar tipo de evento e payload
  IF TG_OP = 'INSERT' THEN
    event_type := 'INSERT';
    payload := to_jsonb(NEW);
    
  ELSIF TG_OP = 'UPDATE' THEN
    event_type := 'UPDATE';
    payload := jsonb_build_object(
      'old', to_jsonb(OLD),
      'new', to_jsonb(NEW)
    );
    
    -- Detectar mudanças de status
    IF TG_TABLE_NAME IN ('projects', 'project_stages') THEN
      IF (to_jsonb(OLD)->>'status') IS DISTINCT FROM (to_jsonb(NEW)->>'status') THEN
        payload := payload || jsonb_build_object(
          'status_change_detected', true,
          'status_change', jsonb_build_object(
            'old_status', to_jsonb(OLD)->>'status',
            'new_status', to_jsonb(NEW)->>'status',
            'changed_at', NOW(),
            'record_id', to_jsonb(NEW)->>'id',
            'record_name', COALESCE(to_jsonb(NEW)->>'name', 'Unnamed')
          )
        );
        
        INSERT INTO public.system_logs (log_type, category, message, details)
        VALUES (
          'info', 
          'status_change_detected', 
          'Mudança de status: ' || COALESCE(to_jsonb(NEW)->>'name', 'Unnamed'),
          jsonb_build_object(
            'table_name', TG_TABLE_NAME,
            'record_id', to_jsonb(NEW)->>'id',
            'old_status', to_jsonb(OLD)->>'status',
            'new_status', to_jsonb(NEW)->>'status'
          )
        );
      END IF;
    END IF;
    
  ELSIF TG_OP = 'DELETE' THEN
    event_type := 'DELETE';
    payload := to_jsonb(OLD);
  END IF;

  -- Buscar webhooks ativos para esta tabela e evento
  FOR webhook_record IN
    SELECT * FROM public.webhooks 
    WHERE is_active = true 
    AND TG_TABLE_NAME = ANY(tables)
    AND event_type = ANY(events)
  LOOP
    
    -- Inserir na fila de webhooks
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
    
    INSERT INTO public.system_logs (log_type, category, message, details)
    VALUES (
      'success', 
      'webhook_queued', 
      'Webhook enfileirado: ' || TG_TABLE_NAME || ' ' || event_type,
      jsonb_build_object(
        'webhook_id', webhook_record.id,
        'webhook_url', webhook_record.url,
        'event_type', event_type,
        'table_name', TG_TABLE_NAME
      )
    );
    
  END LOOP;

  -- Se nenhum webhook foi encontrado, registrar
  IF NOT EXISTS (
    SELECT 1 FROM public.webhooks 
    WHERE is_active = true 
    AND TG_TABLE_NAME = ANY(tables)
    AND event_type = ANY(events)
  ) THEN
    INSERT INTO public.system_logs (log_type, category, message, details)
    VALUES (
      'warning', 
      'no_webhook_match', 
      'Nenhum webhook encontrado para: ' || TG_TABLE_NAME || ' ' || event_type,
      jsonb_build_object(
        'table_name', TG_TABLE_NAME,
        'event_type', event_type,
        'active_webhooks', (SELECT COUNT(*) FROM public.webhooks WHERE is_active = true)
      )
    );
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$function$;

-- 2. Recriar triggers principais (drop e recreate para garantir)
DROP TRIGGER IF EXISTS project_webhooks_trigger ON projects;
DROP TRIGGER IF EXISTS project_stages_webhooks_trigger ON project_stages;

-- Recriar triggers
CREATE TRIGGER project_webhooks_trigger
  AFTER INSERT OR UPDATE OR DELETE ON projects
  FOR EACH ROW EXECUTE FUNCTION trigger_webhooks();

CREATE TRIGGER project_stages_webhooks_trigger
  AFTER INSERT OR UPDATE OR DELETE ON project_stages
  FOR EACH ROW EXECUTE FUNCTION trigger_webhooks();

-- 3. Função para consolidar criação de projetos
CREATE OR REPLACE FUNCTION public.consolidate_project_creation_webhooks()
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  project_record RECORD;
  stages_data jsonb[];
  consolidated_payload jsonb;
  webhook_record RECORD;
  consolidation_count integer := 0;
BEGIN
  -- Buscar projetos criados nos últimos 10 segundos que ainda não foram consolidados
  FOR project_record IN 
    SELECT p.*, 
           c.name as client_name, 
           s.name as service_name, 
           cons.name as consultant_name
    FROM projects p
    LEFT JOIN clients c ON p.client_id = c.id
    LEFT JOIN services s ON p.service_id = s.id
    LEFT JOIN consultants cons ON p.main_consultant_id = cons.id
    WHERE p.created_at > (NOW() - INTERVAL '10 seconds')
    AND NOT EXISTS (
      SELECT 1 FROM system_logs sl 
      WHERE sl.category = 'project_consolidated' 
      AND sl.details->>'project_id' = p.id::text
    )
    ORDER BY p.created_at
    LIMIT 5
  LOOP
    BEGIN
      -- Buscar todas as etapas do projeto
      SELECT array_agg(
        jsonb_build_object(
          'id', ps.id,
          'name', ps.name,
          'description', ps.description,
          'value', ps.value,
          'days', ps.days,
          'start_date', ps.start_date,
          'end_date', ps.end_date,
          'status', ps.status,
          'stage_order', ps.stage_order,
          'consultant_id', ps.consultant_id,
          'valor_de_repasse', ps.valor_de_repasse
        ) ORDER BY ps.stage_order
      )
      INTO stages_data
      FROM project_stages ps 
      WHERE ps.project_id = project_record.id;
      
      -- Criar payload consolidado completo
      consolidated_payload := jsonb_build_object(
        'event_type', 'PROJECT_CREATED',
        'consolidation_type', 'project_with_stages',
        'project', jsonb_build_object(
          'id', project_record.id,
          'name', project_record.name,
          'description', project_record.description,
          'status', project_record.status,
          'start_date', project_record.start_date,
          'end_date', project_record.end_date,
          'total_value', project_record.total_value,
          'client_id', project_record.client_id,
          'client_name', project_record.client_name,
          'service_id', project_record.service_id,
          'service_name', project_record.service_name,
          'main_consultant_id', project_record.main_consultant_id,
          'consultant_name', project_record.consultant_name,
          'created_at', project_record.created_at
        ),
        'stages', COALESCE(stages_data, ARRAY[]::jsonb[]),
        'metadata', jsonb_build_object(
          'total_stages', array_length(stages_data, 1),
          'total_project_value', project_record.total_value,
          'consolidated_at', NOW(),
          'consolidation_version', '2.0'
        )
      );
      
      -- Inserir webhook consolidado para todos os webhooks ativos de projetos
      FOR webhook_record IN
        SELECT * FROM public.webhooks 
        WHERE is_active = true 
        AND 'projects' = ANY(tables)
        AND 'INSERT' = ANY(events)
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
          'PROJECT_CREATED', 
          'projects', 
          consolidated_payload, 
          false, 
          0,
          NOW(),
          NOW()
        );
        
      END LOOP;
      
      -- Marcar como consolidado
      INSERT INTO public.system_logs (log_type, category, message, details)
      VALUES (
        'success', 
        'project_consolidated', 
        'Projeto consolidado: ' || project_record.name,
        jsonb_build_object(
          'project_id', project_record.id,
          'project_name', project_record.name,
          'total_stages', array_length(stages_data, 1),
          'consolidated_at', NOW()
        )
      );
      
      consolidation_count := consolidation_count + 1;
      
    EXCEPTION WHEN OTHERS THEN
      INSERT INTO public.system_logs (log_type, category, message, details)
      VALUES (
        'error', 
        'consolidation_error', 
        'Erro ao consolidar projeto: ' || SQLERRM,
        jsonb_build_object(
          'project_id', project_record.id,
          'error', SQLERRM
        )
      );
    END;
  END LOOP;
  
  RETURN consolidation_count;
END;
$function$;

-- 4. Função principal de processamento
CREATE OR REPLACE FUNCTION public.process_webhook_queue_with_consolidation()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  log_record RECORD;
  processed_count integer := 0;
  consolidated_count integer := 0;
  error_count integer := 0;
BEGIN
  INSERT INTO public.system_logs (log_type, category, message, details)
  VALUES (
    'info', 
    'queue_processing_start', 
    'Iniciando processamento da fila',
    jsonb_build_object('started_at', NOW())
  );

  -- Primeiro consolidar projetos recentes
  SELECT public.consolidate_project_creation_webhooks() INTO consolidated_count;
  
  -- Processar fila individual (máximo 30 por vez)
  FOR log_record IN 
    SELECT wl.*, w.url as webhook_url, w.secret_key
    FROM webhook_logs wl
    JOIN webhooks w ON wl.webhook_id = w.id
    WHERE wl.success = false 
    AND wl.attempt_count < 3
    AND w.is_active = true
    ORDER BY wl.created_at
    LIMIT 30
  LOOP
    BEGIN
      -- Marcar para processamento pela edge function
      UPDATE webhook_logs 
      SET 
        attempt_count = attempt_count + 1,
        updated_at = NOW()
      WHERE id = log_record.id;
      
      processed_count := processed_count + 1;
      
    EXCEPTION WHEN OTHERS THEN
      UPDATE webhook_logs 
      SET 
        attempt_count = attempt_count + 1,
        error_message = SQLERRM,
        updated_at = NOW()
      WHERE id = log_record.id;
      
      error_count := error_count + 1;
    END;
  END LOOP;
  
  INSERT INTO public.system_logs (log_type, category, message, details)
  VALUES (
    'info', 
    'queue_processing_complete', 
    'Processamento concluído',
    jsonb_build_object(
      'processed_count', processed_count,
      'consolidated_count', consolidated_count,
      'error_count', error_count,
      'completed_at', NOW()
    )
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'processed_count', processed_count,
    'consolidated_count', consolidated_count,
    'error_count', error_count
  );
END;
$function$;

-- Inserir log de correção final
INSERT INTO system_logs (log_type, category, message, details)
VALUES (
  'success',
  'webhook_system_fixed',
  'Sistema de webhooks corrigido e simplificado',
  jsonb_build_object(
    'timestamp', NOW(),
    'version', '2.0',
    'features', ARRAY[
      'Triggers simplificados e confiáveis',
      'Consolidação de projetos funcionando',
      'Status updates funcionando',
      'Processamento mais robusto'
    ]
  )
);
