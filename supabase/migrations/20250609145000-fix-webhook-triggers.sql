
-- Corrigir sistema de webhooks para garantir envio correto

-- 1. Simplificar função trigger_webhooks para ser mais confiável
CREATE OR REPLACE FUNCTION public.trigger_webhooks()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  webhook_record RECORD;
  payload jsonb;
  event_type text;
  should_process boolean := true;
  is_project_creation boolean := false;
BEGIN
  -- Log inicial para debug
  INSERT INTO public.system_logs (log_type, category, message, details)
  VALUES (
    'info', 
    'webhook_trigger', 
    'Trigger webhook executado para ' || TG_TABLE_NAME || ' operação: ' || TG_OP,
    jsonb_build_object(
      'table_name', TG_TABLE_NAME,
      'operation', TG_OP,
      'trigger_name', TG_NAME,
      'timestamp', NOW()
    )
  );

  -- Detectar se é uma criação de projeto
  IF TG_TABLE_NAME = 'projects' AND TG_OP = 'INSERT' THEN
    is_project_creation := true;
    
    -- Para criações de projeto, marcar para consolidação posterior
    INSERT INTO public.system_logs (log_type, category, message, details)
    VALUES (
      'info', 
      'project_creation_detected', 
      'Projeto criado - será consolidado: ' || NEW.name,
      jsonb_build_object(
        'project_id', NEW.id,
        'project_name', NEW.name,
        'created_at', NOW(),
        'consolidation_pending', true,
        'batch_key', 'project_creation_' || NEW.id::text
      )
    );
    
    -- Não processar webhook individual para criação de projeto
    should_process := false;
  END IF;

  -- Para etapas de projeto, verificar se é parte de uma criação de projeto recente
  IF TG_TABLE_NAME = 'project_stages' AND TG_OP = 'INSERT' THEN
    -- Verificar se há criação de projeto recente (últimos 15 segundos)
    IF EXISTS (
      SELECT 1 FROM system_logs 
      WHERE category = 'project_creation_detected' 
      AND details->>'project_id' = NEW.project_id::text
      AND created_at > (NOW() - INTERVAL '15 seconds')
    ) THEN
      -- Esta etapa faz parte de uma criação de projeto - não processar individualmente
      INSERT INTO public.system_logs (log_type, category, message, details)
      VALUES (
        'info', 
        'stage_creation_consolidated', 
        'Etapa criada como parte de projeto - será consolidada: ' || NEW.name,
        jsonb_build_object(
          'stage_id', NEW.id,
          'project_id', NEW.project_id,
          'stage_name', NEW.name,
          'part_of_project_creation', true,
          'batch_key', 'project_creation_' || NEW.project_id::text
        )
      );
      
      should_process := false;
    END IF;
  END IF;

  -- Se não deve processar, sair
  IF NOT should_process THEN
    IF TG_OP = 'DELETE' THEN
      RETURN OLD;
    ELSE
      RETURN NEW;
    END IF;
  END IF;

  -- Determinar o tipo de evento e payload baseado na operação
  IF TG_OP = 'INSERT' THEN
    event_type := 'INSERT';
    payload := to_jsonb(NEW);
    
  ELSIF TG_OP = 'UPDATE' THEN
    event_type := 'UPDATE';
    payload := jsonb_build_object(
      'old', to_jsonb(OLD),
      'new', to_jsonb(NEW)
    );
    
    -- Detectar mudanças específicas de status para projetos
    IF TG_TABLE_NAME = 'projects' THEN
      IF (to_jsonb(OLD)->>'status') IS DISTINCT FROM (to_jsonb(NEW)->>'status') THEN
        payload := payload || jsonb_build_object(
          'status_change_detected', true,
          'status_change', jsonb_build_object(
            'old_status', to_jsonb(OLD)->>'status',
            'new_status', to_jsonb(NEW)->>'status',
            'changed_at', NOW(),
            'project_id', to_jsonb(NEW)->>'id',
            'project_name', to_jsonb(NEW)->>'name'
          )
        );
      END IF;
    END IF;
    
    -- Detectar mudanças específicas de status para etapas
    IF TG_TABLE_NAME = 'project_stages' THEN
      IF (to_jsonb(OLD)->>'status') IS DISTINCT FROM (to_jsonb(NEW)->>'status') THEN
        payload := payload || jsonb_build_object(
          'stage_status_change_detected', true,
          'stage_status_change', jsonb_build_object(
            'old_status', to_jsonb(OLD)->>'status',
            'new_status', to_jsonb(NEW)->>'status',
            'changed_at', NOW(),
            'stage_id', to_jsonb(NEW)->>'id',
            'stage_name', to_jsonb(NEW)->>'name'
          )
        );
      END IF;
    END IF;
    
  ELSIF TG_OP = 'DELETE' THEN
    event_type := 'DELETE';
    payload := to_jsonb(OLD);
  END IF;

  -- Buscar todos os webhooks ativos que devem receber este evento
  FOR webhook_record IN
    SELECT * FROM public.webhooks 
    WHERE is_active = true 
    AND TG_TABLE_NAME = ANY(tables)
    AND event_type = ANY(events)
  LOOP
    
    -- Inserir na fila de webhooks para processamento
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
      'Webhook adicionado à fila de processamento: ' || TG_TABLE_NAME || ' ' || event_type,
      jsonb_build_object(
        'webhook_id', webhook_record.id,
        'webhook_url', webhook_record.url,
        'event_type', event_type,
        'table_name', TG_TABLE_NAME,
        'queued_at', NOW()
      )
    );
    
  END LOOP;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$function$;

-- 2. Atualizar função de consolidação para ser mais eficiente
CREATE OR REPLACE FUNCTION public.consolidate_project_creation_webhooks()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  project_creation_log RECORD;
  project_data jsonb;
  stages_data jsonb[];
  consolidated_payload jsonb;
  webhook_record RECORD;
BEGIN
  -- Buscar criações de projeto pendentes de consolidação (mais de 8 segundos)
  FOR project_creation_log IN 
    SELECT 
      details->>'project_id' as project_id,
      details->>'project_name' as project_name,
      details->>'batch_key' as batch_key,
      created_at
    FROM system_logs 
    WHERE category = 'project_creation_detected'
    AND created_at < (NOW() - INTERVAL '8 seconds')
    AND NOT EXISTS (
      SELECT 1 FROM system_logs sl2 
      WHERE sl2.category = 'project_consolidated' 
      AND sl2.details->>'project_id' = system_logs.details->>'project_id'
    )
    ORDER BY created_at
    LIMIT 3
  LOOP
    BEGIN
      -- Buscar dados completos do projeto
      SELECT to_jsonb(p.*) INTO project_data
      FROM projects p 
      WHERE p.id = project_creation_log.project_id::uuid;
      
      -- Buscar todas as etapas do projeto
      SELECT array_agg(to_jsonb(ps.*) ORDER BY ps.stage_order)
      INTO stages_data
      FROM project_stages ps 
      WHERE ps.project_id = project_creation_log.project_id::uuid;
      
      -- Criar payload consolidado
      consolidated_payload := jsonb_build_object(
        'event_type', 'PROJECT_CREATED',
        'project', project_data,
        'stages', COALESCE(stages_data, ARRAY[]::jsonb[]),
        'created_at', project_creation_log.created_at,
        'consolidated_at', NOW(),
        'batch_key', project_creation_log.batch_key,
        'operation_context', 'consolidated_project_creation',
        'total_stages', array_length(stages_data, 1)
      );
      
      -- Buscar webhooks ativos para projetos
      FOR webhook_record IN
        SELECT * FROM public.webhooks 
        WHERE is_active = true 
        AND 'projects' = ANY(tables)
        AND 'INSERT' = ANY(events)
      LOOP
        
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
        'Projeto consolidado com sucesso: ' || project_creation_log.project_name,
        jsonb_build_object(
          'project_id', project_creation_log.project_id,
          'project_name', project_creation_log.project_name,
          'total_stages', array_length(stages_data, 1),
          'consolidation_completed_at', NOW(),
          'original_creation', project_creation_log.created_at
        )
      );
      
    EXCEPTION WHEN OTHERS THEN
      INSERT INTO public.system_logs (log_type, category, message, details)
      VALUES (
        'error', 
        'project_consolidation_error', 
        'Erro ao consolidar projeto: ' || SQLERRM,
        jsonb_build_object(
          'project_id', project_creation_log.project_id,
          'error', SQLERRM
        )
      );
    END;
  END LOOP;
END;
$function$;

-- 3. Atualizar função de processamento para ser mais robusta
CREATE OR REPLACE FUNCTION public.process_webhook_queue_with_consolidation()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  log_record RECORD;
  processed_count integer := 0;
  consolidated_count integer := 0;
BEGIN
  INSERT INTO public.system_logs (log_type, category, message, details)
  VALUES (
    'info', 
    'webhook_queue_process', 
    'Iniciando processamento da fila de webhooks',
    jsonb_build_object('started_at', NOW())
  );

  -- Primeiro, consolidar criações de projeto pendentes
  PERFORM public.consolidate_project_creation_webhooks();
  
  -- Processar logs pendentes individualmente
  FOR log_record IN 
    SELECT wl.*, w.url as webhook_url, w.secret_key
    FROM webhook_logs wl
    JOIN webhooks w ON wl.webhook_id = w.id
    WHERE wl.success = false 
    AND wl.attempt_count < 3
    AND w.is_active = true
    ORDER BY wl.created_at
    LIMIT 20
  LOOP
    BEGIN
      -- Priorizar webhooks consolidados de projeto
      IF log_record.event_type = 'PROJECT_CREATED' THEN
        consolidated_count := consolidated_count + 1;
      END IF;
      
      -- Atualizar log para processamento
      UPDATE webhook_logs 
      SET 
        attempt_count = attempt_count + 1,
        updated_at = NOW(),
        error_message = 'Queued for edge function processing'
      WHERE id = log_record.id;
      
      processed_count := processed_count + 1;
      
      INSERT INTO public.system_logs (log_type, category, message, details)
      VALUES (
        'info', 
        'webhook_processed', 
        'Webhook processado: ' || log_record.event_type || ' para ' || log_record.table_name,
        jsonb_build_object(
          'webhook_url', log_record.webhook_url,
          'event_type', log_record.event_type,
          'table_name', log_record.table_name,
          'is_consolidated', log_record.event_type = 'PROJECT_CREATED',
          'attempt', log_record.attempt_count + 1
        )
      );
      
    EXCEPTION WHEN OTHERS THEN
      UPDATE webhook_logs 
      SET 
        attempt_count = attempt_count + 1,
        error_message = SQLERRM,
        updated_at = NOW()
      WHERE id = log_record.id;
      
      INSERT INTO public.system_logs (log_type, category, message, details)
      VALUES (
        'error', 
        'webhook_process_error', 
        'Erro ao processar webhook: ' || SQLERRM,
        jsonb_build_object(
          'webhook_log_id', log_record.id,
          'error', SQLERRM
        )
      );
    END;
  END LOOP;
  
  INSERT INTO public.system_logs (log_type, category, message, details)
  VALUES (
    'info', 
    'webhook_queue_process', 
    'Processamento concluído',
    jsonb_build_object(
      'completed_at', NOW(),
      'processed_count', processed_count,
      'consolidated_count', consolidated_count
    )
  );
END;
$function$;

-- Inserir log de correção
INSERT INTO system_logs (log_type, category, message, details)
VALUES (
  'info',
  'webhook_fix',
  'Sistema de webhooks corrigido para garantir envio correto',
  jsonb_build_object(
    'features', ARRAY[
      'Webhooks de status funcionando normalmente',
      'Criação de projeto consolidada em webhook único',
      'Processamento mais confiável',
      'Logs detalhados para debug'
    ],
    'timestamp', NOW()
  )
);
