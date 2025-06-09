
-- Consolidar webhooks de criação de projeto para enviar todos os dados em uma única requisição

-- 1. Atualizar função trigger_webhooks para consolidar operações de projeto
CREATE OR REPLACE FUNCTION public.trigger_webhooks()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  webhook_record RECORD;
  payload jsonb;
  event_type text;
  log_id uuid;
  batch_key text;
  recent_similar_count integer;
  is_project_creation boolean := false;
  project_data jsonb;
BEGIN
  -- Detectar se é uma criação de projeto
  IF TG_TABLE_NAME = 'projects' AND TG_OP = 'INSERT' THEN
    is_project_creation := true;
  END IF;

  -- Para criações de projeto, marcar para consolidação posterior
  IF is_project_creation THEN
    -- Criar entrada especial para consolidação de projeto
    INSERT INTO public.system_logs (log_type, category, message, details)
    VALUES (
      'info', 
      'project_creation_detected', 
      'Projeto criado - aguardando consolidação: ' || NEW.name,
      jsonb_build_object(
        'project_id', NEW.id,
        'project_name', NEW.name,
        'created_at', NOW(),
        'consolidation_pending', true,
        'batch_key', 'project_creation_' || NEW.id::text
      )
    );
    
    -- Não processar webhook imediatamente para projetos
    -- Deixar para consolidação posterior
    IF TG_OP = 'DELETE' THEN
      RETURN OLD;
    ELSE
      RETURN NEW;
    END IF;
  END IF;

  -- Gerar chave de lote para agrupar operações relacionadas
  batch_key := TG_TABLE_NAME || '_' || TG_OP || '_' || 
    CASE 
      WHEN TG_OP = 'INSERT' THEN COALESCE(to_jsonb(NEW)->>'id', 'unknown')
      WHEN TG_OP = 'UPDATE' THEN COALESCE(to_jsonb(NEW)->>'id', 'unknown')
      WHEN TG_OP = 'DELETE' THEN COALESCE(to_jsonb(OLD)->>'id', 'unknown')
    END;

  -- Para etapas de projeto, verificar se é parte de uma criação de projeto
  IF TG_TABLE_NAME = 'project_stages' AND TG_OP = 'INSERT' THEN
    -- Verificar se há criação de projeto recente (últimos 30 segundos)
    IF EXISTS (
      SELECT 1 FROM system_logs 
      WHERE category = 'project_creation_detected' 
      AND details->>'project_id' = NEW.project_id::text
      AND created_at > (NOW() - INTERVAL '30 seconds')
    ) THEN
      -- Esta etapa faz parte de uma criação de projeto - não processar individualmente
      INSERT INTO public.system_logs (log_type, category, message, details)
      VALUES (
        'info', 
        'stage_creation_consolidated', 
        'Etapa criada como parte de projeto - consolidando: ' || NEW.name,
        jsonb_build_object(
          'stage_id', NEW.id,
          'project_id', NEW.project_id,
          'stage_name', NEW.name,
          'part_of_project_creation', true,
          'batch_key', 'project_creation_' || NEW.project_id::text
        )
      );
      
      RETURN NEW;
    END IF;
  END IF;

  -- Verificar se há operações similares recentes (últimos 30 segundos)
  SELECT COUNT(*)
  INTO recent_similar_count
  FROM webhook_logs wl
  WHERE wl.table_name = TG_TABLE_NAME
    AND wl.event_type = TG_OP
    AND wl.created_at > (NOW() - INTERVAL '30 seconds')
    AND wl.payload->>'batch_key' = batch_key;

  -- Se há muitas operações similares recentes, pular este trigger
  IF recent_similar_count > 2 THEN
    INSERT INTO public.system_logs (log_type, category, message, details)
    VALUES (
      'info', 
      'webhook_skip', 
      'Webhook skipped due to recent similar operations: ' || TG_TABLE_NAME || ' ' || TG_OP,
      jsonb_build_object(
        'table_name', TG_TABLE_NAME,
        'operation', TG_OP,
        'batch_key', batch_key,
        'recent_count', recent_similar_count,
        'timestamp', NOW()
      )
    );
    
    IF TG_OP = 'DELETE' THEN
      RETURN OLD;
    ELSE
      RETURN NEW;
    END IF;
  END IF;

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
      'batch_key', batch_key,
      'recent_similar_count', recent_similar_count,
      'timestamp', NOW()
    )
  ) RETURNING id INTO log_id;

  -- Determinar o tipo de evento e payload baseado na operação
  IF TG_OP = 'INSERT' THEN
    event_type := 'INSERT';
    payload := to_jsonb(NEW) || jsonb_build_object(
      'batch_key', batch_key,
      'operation_context', 'individual_insert'
    );
    
  ELSIF TG_OP = 'UPDATE' THEN
    event_type := 'UPDATE';
    payload := jsonb_build_object(
      'old', to_jsonb(OLD),
      'new', to_jsonb(NEW),
      'batch_key', batch_key,
      'operation_context', 'individual_update'
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
    payload := to_jsonb(OLD) || jsonb_build_object(
      'batch_key', batch_key,
      'operation_context', 'individual_delete'
    );
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
      'Webhook adicionado à fila de processamento individual',
      jsonb_build_object(
        'webhook_id', webhook_record.id,
        'webhook_url', webhook_record.url,
        'event_type', event_type,
        'table_name', TG_TABLE_NAME,
        'batch_key', batch_key,
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

-- 2. Criar função para consolidar webhooks de criação de projeto
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
  -- Buscar criações de projeto pendentes de consolidação (mais de 10 segundos)
  FOR project_creation_log IN 
    SELECT 
      details->>'project_id' as project_id,
      details->>'project_name' as project_name,
      details->>'batch_key' as batch_key,
      created_at
    FROM system_logs 
    WHERE category = 'project_creation_detected'
    AND created_at < (NOW() - INTERVAL '10 seconds')
    AND NOT EXISTS (
      SELECT 1 FROM system_logs sl2 
      WHERE sl2.category = 'project_consolidated' 
      AND sl2.details->>'project_id' = system_logs.details->>'project_id'
    )
    ORDER BY created_at
    LIMIT 5
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

-- 3. Atualizar função de processamento para incluir consolidação
CREATE OR REPLACE FUNCTION public.process_webhook_queue_with_consolidation()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  log_record RECORD;
  batch_logs RECORD;
  processed_count integer := 0;
  consolidated_count integer := 0;
BEGIN
  INSERT INTO public.system_logs (log_type, category, message, details)
  VALUES (
    'info', 
    'webhook_queue_process', 
    'Iniciando processamento com consolidação da fila de webhooks',
    jsonb_build_object('started_at', NOW())
  );

  -- Primeiro, consolidar criações de projeto pendentes
  PERFORM public.consolidate_project_creation_webhooks();
  
  -- Processar logs em batches por webhook_id e batch_key
  FOR batch_logs IN 
    SELECT 
      wl.webhook_id,
      w.url as webhook_url,
      w.secret_key,
      wl.payload->>'batch_key' as batch_key,
      wl.event_type,
      COUNT(*) as batch_size,
      MIN(wl.created_at) as first_created,
      MAX(wl.created_at) as last_created,
      array_agg(wl.id ORDER BY wl.created_at) as log_ids,
      array_agg(wl.payload ORDER BY wl.created_at) as payloads
    FROM webhook_logs wl
    JOIN webhooks w ON wl.webhook_id = w.id
    WHERE wl.success = false 
    AND wl.attempt_count < 3
    AND w.is_active = true
    GROUP BY wl.webhook_id, w.url, w.secret_key, wl.payload->>'batch_key', wl.event_type
    ORDER BY MIN(wl.created_at)
    LIMIT 15
  LOOP
    BEGIN
      -- Priorizar webhooks consolidados de projeto
      IF batch_logs.event_type = 'PROJECT_CREATED' THEN
        consolidated_count := consolidated_count + 1;
      END IF;
      
      -- Atualizar todos os logs do batch
      UPDATE webhook_logs 
      SET 
        attempt_count = attempt_count + 1,
        updated_at = NOW(),
        error_message = 'Queued for consolidated edge function processing (batch: ' || batch_logs.batch_size || ' items)'
      WHERE id = ANY(batch_logs.log_ids);
      
      processed_count := processed_count + batch_logs.batch_size;
      
      INSERT INTO public.system_logs (log_type, category, message, details)
      VALUES (
        'info', 
        'webhook_batch_processed', 
        'Batch de webhooks processado com consolidação: ' || batch_logs.batch_size || ' itens',
        jsonb_build_object(
          'webhook_url', batch_logs.webhook_url,
          'batch_key', batch_logs.batch_key,
          'event_type', batch_logs.event_type,
          'batch_size', batch_logs.batch_size,
          'is_consolidated', batch_logs.event_type = 'PROJECT_CREATED',
          'first_created', batch_logs.first_created,
          'last_created', batch_logs.last_created,
          'log_ids', batch_logs.log_ids
        )
      );
      
    EXCEPTION WHEN OTHERS THEN
      UPDATE webhook_logs 
      SET 
        attempt_count = attempt_count + 1,
        error_message = SQLERRM,
        updated_at = NOW()
      WHERE id = ANY(batch_logs.log_ids);
      
      INSERT INTO public.system_logs (log_type, category, message, details)
      VALUES (
        'error', 
        'webhook_batch_error', 
        'Erro ao processar batch consolidado: ' || SQLERRM,
        jsonb_build_object(
          'batch_key', batch_logs.batch_key,
          'batch_size', batch_logs.batch_size,
          'error', SQLERRM
        )
      );
    END;
  END LOOP;
  
  INSERT INTO public.system_logs (log_type, category, message, details)
  VALUES (
    'info', 
    'webhook_queue_process', 
    'Processamento consolidado concluído',
    jsonb_build_object(
      'completed_at', NOW(),
      'processed_count', processed_count,
      'consolidated_count', consolidated_count
    )
  );
END;
$function$;

-- Inserir log de conclusão da consolidação
INSERT INTO system_logs (log_type, category, message, details)
VALUES (
  'info',
  'webhook_consolidation',
  'Sistema de webhooks consolidado para criação de projetos',
  jsonb_build_object(
    'features', ARRAY[
      'Consolidação de criação de projeto em webhook único',
      'Agrupamento de projeto + etapas em uma requisição',
      'Processamento inteligente com 10 segundos de espera',
      'Payload completo com todos os dados do projeto'
    ],
    'timestamp', NOW()
  )
);
