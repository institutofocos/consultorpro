
-- ===== LIMPEZA DEFINITIVA E CONFIGURAÇÃO ÚNICA DE WEBHOOK CONSOLIDADO =====

-- 1. REMOVER TODOS OS TRIGGERS DE WEBHOOK EXISTENTES (usando information_schema)
DO $$
DECLARE
    r RECORD;
BEGIN
    -- Remover todos os triggers que contenham 'webhook' no nome
    FOR r IN (
        SELECT trigger_schema, event_object_table, trigger_name 
        FROM information_schema.triggers 
        WHERE trigger_name ILIKE '%webhook%'
        AND trigger_schema = 'public'
    ) LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS %I ON %I.%I CASCADE', 
                      r.trigger_name, r.trigger_schema, r.event_object_table);
        RAISE NOTICE 'Removido trigger: % da tabela %', r.trigger_name, r.event_object_table;
    END LOOP;
END $$;

-- 2. REMOVER TRIGGERS ESPECÍFICOS CONHECIDOS (caso ainda existam)
DROP TRIGGER IF EXISTS trigger_webhooks_projects_insert ON projects CASCADE;
DROP TRIGGER IF EXISTS trigger_webhooks_projects_update ON projects CASCADE; 
DROP TRIGGER IF EXISTS trigger_webhooks_projects_delete ON projects CASCADE;
DROP TRIGGER IF EXISTS trigger_webhooks_project_stages_insert ON project_stages CASCADE;
DROP TRIGGER IF EXISTS trigger_webhooks_project_stages_update ON project_stages CASCADE;
DROP TRIGGER IF EXISTS trigger_webhooks_project_stages_delete ON project_stages CASCADE;
DROP TRIGGER IF EXISTS trigger_webhooks ON projects CASCADE;
DROP TRIGGER IF EXISTS trigger_webhooks ON project_stages CASCADE;
DROP TRIGGER IF EXISTS trigger_webhooks_insert ON projects CASCADE;
DROP TRIGGER IF EXISTS trigger_webhooks_insert ON project_stages CASCADE;

-- 3. GARANTIR QUE A FUNÇÃO CONSOLIDADA EXISTE E ESTÁ CORRETA
CREATE OR REPLACE FUNCTION public.trigger_consolidated_project_webhook()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  webhook_record RECORD;
  consolidated_payload jsonb;
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
    RETURN NEW;
  END IF;

  -- Aguardar um momento para garantir que as etapas sejam criadas primeiro
  PERFORM pg_sleep(0.2);

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
    
  END LOOP;

  -- Log do processo
  INSERT INTO public.system_logs (log_type, category, message, details)
  VALUES (
    'info', 
    'webhook_consolidado_unico_definitivo', 
    'Webhook consolidado único criado para projeto: ' || NEW.name || ' (Total: ' || webhook_count || ')',
    jsonb_build_object(
      'project_id', NEW.id,
      'project_name', NEW.name,
      'webhooks_created', webhook_count,
      'timestamp', NOW(),
      'definitivo', true
    )
  );

  RETURN NEW;
END;
$$;

-- 4. CRIAR APENAS O TRIGGER CONSOLIDADO
CREATE TRIGGER trigger_consolidated_project_webhook
  AFTER INSERT ON projects
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_consolidated_project_webhook();

-- 5. CONFIGURAR O SISTEMA DEFINITIVAMENTE PARA WEBHOOKS CONSOLIDADOS ÚNICOS
INSERT INTO public.system_settings (setting_key, setting_value, description)
VALUES (
  'webhook_consolidation_enabled', 
  'true', 
  'Sistema configurado DEFINITIVAMENTE para webhooks consolidados únicos'
) ON CONFLICT (setting_key) DO UPDATE SET 
  setting_value = 'true',
  updated_at = NOW(),
  description = 'Sistema configurado DEFINITIVAMENTE para webhooks consolidados únicos';

INSERT INTO public.system_settings (setting_key, setting_value, description)
VALUES (
  'webhook_only_consolidated', 
  'true', 
  'Processar EXCLUSIVAMENTE webhooks consolidados - NUNCA individuais'
) ON CONFLICT (setting_key) DO UPDATE SET 
  setting_value = 'true',
  updated_at = NOW(),
  description = 'Processar EXCLUSIVAMENTE webhooks consolidados - NUNCA individuais';

-- 6. LIMPAR WEBHOOKS ANTIGOS NA FILA QUE NÃO SEJAM CONSOLIDADOS
DELETE FROM webhook_logs 
WHERE event_type != 'project_created_consolidated' 
AND table_name != 'projects_consolidated'
AND success = false;

-- 7. LOG DEFINITIVO
INSERT INTO public.system_logs (log_type, category, message, details)
VALUES (
  'success', 
  'webhook_sistema_definitivo', 
  'Sistema configurado DEFINITIVAMENTE para enviar APENAS webhooks consolidados únicos',
  jsonb_build_object(
    'timestamp', NOW(),
    'consolidation_enabled', true,
    'only_consolidated', true,
    'individual_webhooks_removed', true,
    'triggers_cleaned', true,
    'definitivo', true,
    'configuracao_final', 'Apenas webhooks consolidados serão enviados'
  )
);

-- 8. VERIFICAR CONFIGURAÇÃO FINAL
DO $$
DECLARE
    consolidation_enabled boolean;
    only_consolidated boolean;
    trigger_exists boolean;
    triggers_count integer;
BEGIN
    -- Verificar configurações
    SELECT setting_value = 'true' INTO consolidation_enabled
    FROM system_settings WHERE setting_key = 'webhook_consolidation_enabled';
    
    SELECT setting_value = 'true' INTO only_consolidated
    FROM system_settings WHERE setting_key = 'webhook_only_consolidated';
    
    -- Verificar se o trigger consolidado existe
    SELECT EXISTS(
        SELECT 1 FROM information_schema.triggers 
        WHERE trigger_name = 'trigger_consolidated_project_webhook' 
        AND trigger_schema = 'public'
    ) INTO trigger_exists;
    
    -- Contar triggers restantes com 'webhook' no nome
    SELECT COUNT(*) INTO triggers_count
    FROM information_schema.triggers 
    WHERE trigger_name ILIKE '%webhook%' 
    AND trigger_schema = 'public';
    
    -- Log final de verificação
    INSERT INTO public.system_logs (log_type, category, message, details)
    VALUES (
      'info', 
      'webhook_verificacao_final', 
      'Verificação final do sistema de webhooks consolidados',
      jsonb_build_object(
        'consolidation_enabled', consolidation_enabled,
        'only_consolidated', only_consolidated,
        'trigger_consolidado_exists', trigger_exists,
        'total_webhook_triggers', triggers_count,
        'sistema_pronto', (consolidation_enabled AND only_consolidated AND trigger_exists AND triggers_count = 1)
      )
    );
END $$;
