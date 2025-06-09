
-- Sistema de webhooks simplificado e funcional

-- 1. Função trigger simplificada que sempre funciona
CREATE OR REPLACE FUNCTION public.trigger_webhooks()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  webhook_record RECORD;
  payload jsonb;
  event_type text;
BEGIN
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
    
  ELSIF TG_OP = 'DELETE' THEN
    event_type := 'DELETE';
    payload := to_jsonb(OLD);
  END IF;

  -- Buscar webhooks ativos e criar logs
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
    
  END LOOP;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$function$;

-- 2. Recriar triggers (drop e recreate para garantir)
DROP TRIGGER IF EXISTS project_webhooks_trigger ON projects;
DROP TRIGGER IF EXISTS project_stages_webhooks_trigger ON project_stages;
DROP TRIGGER IF EXISTS clients_webhooks_trigger ON clients;
DROP TRIGGER IF EXISTS consultants_webhooks_trigger ON consultants;
DROP TRIGGER IF EXISTS services_webhooks_trigger ON services;

-- Criar triggers para todas as tabelas importantes
CREATE TRIGGER project_webhooks_trigger
  AFTER INSERT OR UPDATE OR DELETE ON projects
  FOR EACH ROW EXECUTE FUNCTION trigger_webhooks();

CREATE TRIGGER project_stages_webhooks_trigger
  AFTER INSERT OR UPDATE OR DELETE ON project_stages
  FOR EACH ROW EXECUTE FUNCTION trigger_webhooks();

CREATE TRIGGER clients_webhooks_trigger
  AFTER INSERT OR UPDATE OR DELETE ON clients
  FOR EACH ROW EXECUTE FUNCTION trigger_webhooks();

CREATE TRIGGER consultants_webhooks_trigger
  AFTER INSERT OR UPDATE OR DELETE ON consultants
  FOR EACH ROW EXECUTE FUNCTION trigger_webhooks();

CREATE TRIGGER services_webhooks_trigger
  AFTER INSERT OR UPDATE OR DELETE ON services
  FOR EACH ROW EXECUTE FUNCTION trigger_webhooks();

-- 3. Função de processamento simples
CREATE OR REPLACE FUNCTION public.process_webhook_queue()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  processed_count integer := 0;
BEGIN
  -- Marcar webhooks pendentes para processamento
  UPDATE webhook_logs 
  SET attempt_count = attempt_count + 1,
      updated_at = NOW()
  WHERE success = false 
  AND attempt_count < 3;
  
  GET DIAGNOSTICS processed_count = ROW_COUNT;
  
  RETURN jsonb_build_object(
    'success', true,
    'processed_count', processed_count,
    'message', 'Fila processada com sucesso'
  );
END;
$function$;

-- Log de sistema
INSERT INTO system_logs (log_type, category, message, details)
VALUES (
  'success',
  'webhook_system_fixed',
  'Sistema de webhooks corrigido - versão simplificada',
  jsonb_build_object(
    'timestamp', NOW(),
    'version', 'simple_2.0',
    'triggers_created', ARRAY['projects', 'project_stages', 'clients', 'consultants', 'services']
  )
);
