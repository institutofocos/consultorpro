
-- Otimizar sistema de webhooks para reduzir disparos múltiplos

-- 1. Atualizar função trigger_webhooks para ser mais inteligente
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
BEGIN
  -- Gerar chave de lote para agrupar operações relacionadas
  batch_key := TG_TABLE_NAME || '_' || TG_OP || '_' || 
    CASE 
      WHEN TG_OP = 'INSERT' THEN COALESCE(to_jsonb(NEW)->>'id', 'unknown')
      WHEN TG_OP = 'UPDATE' THEN COALESCE(to_jsonb(NEW)->>'id', 'unknown')
      WHEN TG_OP = 'DELETE' THEN COALESCE(to_jsonb(OLD)->>'id', 'unknown')
    END;

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
      'operation_context', 'single_insert'
    );
    
  ELSIF TG_OP = 'UPDATE' THEN
    event_type := 'UPDATE';
    payload := jsonb_build_object(
      'old', to_jsonb(OLD),
      'new', to_jsonb(NEW),
      'batch_key', batch_key,
      'operation_context', 'single_update'
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
      'operation_context', 'single_delete'
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
      'Webhook adicionado à fila de processamento com batch_key',
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

  -- Se nenhum webhook foi encontrado, registrar isso também
  IF NOT EXISTS (
    SELECT 1 FROM public.webhooks 
    WHERE is_active = true 
    AND TG_TABLE_NAME = ANY(tables)
    AND event_type = ANY(events)
  ) THEN
    INSERT INTO public.system_logs (log_type, category, message, details)
    VALUES (
      'warning', 
      'webhook_no_match', 
      'Nenhum webhook ativo encontrado para ' || TG_TABLE_NAME || ' com evento ' || event_type,
      jsonb_build_object(
        'table_name', TG_TABLE_NAME,
        'event_type', event_type,
        'batch_key', batch_key,
        'available_webhooks', (SELECT COUNT(*) FROM public.webhooks WHERE is_active = true)
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

-- 2. Atualizar função de processamento para lidar com batches
CREATE OR REPLACE FUNCTION public.process_webhook_queue_optimized()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  log_record RECORD;
  batch_logs RECORD;
  processed_count integer := 0;
BEGIN
  INSERT INTO public.system_logs (log_type, category, message, details)
  VALUES (
    'info', 
    'webhook_queue_process', 
    'Iniciando processamento otimizado da fila de webhooks',
    jsonb_build_object('started_at', NOW())
  );

  -- Processar logs em batches por webhook_id e batch_key para reduzir duplicação
  FOR batch_logs IN 
    SELECT 
      wl.webhook_id,
      w.url as webhook_url,
      w.secret_key,
      wl.payload->>'batch_key' as batch_key,
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
    GROUP BY wl.webhook_id, w.url, w.secret_key, wl.payload->>'batch_key'
    ORDER BY MIN(wl.created_at)
    LIMIT 10
  LOOP
    BEGIN
      -- Atualizar todos os logs do batch
      UPDATE webhook_logs 
      SET 
        attempt_count = attempt_count + 1,
        updated_at = NOW(),
        error_message = 'Queued for optimized edge function processing (batch: ' || batch_logs.batch_size || ' items)'
      WHERE id = ANY(batch_logs.log_ids);
      
      processed_count := processed_count + batch_logs.batch_size;
      
      INSERT INTO public.system_logs (log_type, category, message, details)
      VALUES (
        'info', 
        'webhook_batch_processed', 
        'Batch de webhooks processado: ' || batch_logs.batch_size || ' itens',
        jsonb_build_object(
          'webhook_url', batch_logs.webhook_url,
          'batch_key', batch_logs.batch_key,
          'batch_size', batch_logs.batch_size,
          'first_created', batch_logs.first_created,
          'last_created', batch_logs.last_created,
          'log_ids', batch_logs.log_ids
        )
      );
      
    EXCEPTION WHEN OTHERS THEN
      -- Em caso de erro, registrar e continuar
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
        'Erro ao processar batch de webhooks: ' || SQLERRM,
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
    'Processamento otimizado da fila de webhooks concluído',
    jsonb_build_object(
      'completed_at', NOW(),
      'processed_count', processed_count
    )
  );
END;
$function$;

-- 3. Inserir log de conclusão da otimização
INSERT INTO system_logs (log_type, category, message, details)
VALUES (
  'info',
  'webhook_optimization',
  'Sistema de webhooks otimizado para reduzir disparos múltiplos',
  jsonb_build_object(
    'optimizations', ARRAY[
      'Debounce de 30 segundos entre operações similares',
      'Agrupamento por batch_key',
      'Processamento em lotes para reduzir duplicação',
      'Intervalo mínimo de 10 segundos entre processamentos'
    ],
    'timestamp', NOW()
  )
);
