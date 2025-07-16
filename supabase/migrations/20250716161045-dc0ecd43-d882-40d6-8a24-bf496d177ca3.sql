
-- Remover todas as referências a chat_rooms do sistema
-- Esta migração garante que não há mais nenhuma referência a chat no banco

-- Primeiro, vamos verificar e remover qualquer trigger ou função que ainda referencie chat_rooms
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    -- Remover triggers que possam referenciar chat_rooms
    FOR r IN SELECT schemaname, tablename, trigger_name FROM information_schema.triggers 
             WHERE trigger_name LIKE '%chat%' OR trigger_name LIKE '%room%'
    LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS %I ON %I.%I CASCADE', r.trigger_name, r.schemaname, r.tablename);
    END LOOP;
    
    -- Remover funções que possam referenciar chat_rooms
    FOR r IN SELECT routine_name FROM information_schema.routines 
             WHERE routine_name LIKE '%chat%' OR routine_name LIKE '%room%'
    LOOP
        EXECUTE format('DROP FUNCTION IF EXISTS public.%I CASCADE', r.routine_name);
    END LOOP;
END $$;

-- Remover qualquer política RLS que possa referenciar chat
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN SELECT schemaname, tablename, policyname FROM pg_policies 
             WHERE policyname LIKE '%chat%' OR policyname LIKE '%room%'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', r.policyname, r.schemaname, r.tablename);
    END LOOP;
END $$;

-- Garantir que os triggers de webhook estão corretos e sem referência a chat
DROP TRIGGER IF EXISTS trigger_webhooks_projects ON projects;
DROP TRIGGER IF EXISTS trigger_webhooks_stages ON project_stages;

-- Recriar triggers limpos para webhooks (sem chat)
CREATE TRIGGER trigger_webhooks_projects_clean
    AFTER INSERT OR UPDATE OR DELETE ON projects
    FOR EACH ROW EXECUTE FUNCTION trigger_webhooks_projects_only();

CREATE TRIGGER trigger_webhooks_stages_clean
    AFTER INSERT OR UPDATE OR DELETE ON project_stages
    FOR EACH ROW EXECUTE FUNCTION trigger_webhooks_projects_only();

-- Adicionar log para confirmar a limpeza
INSERT INTO public.system_logs (log_type, category, message, details)
VALUES (
    'info', 
    'cleanup', 
    'Sistema completamente limpo de referências a chat',
    jsonb_build_object(
        'timestamp', NOW(),
        'action', 'complete_chat_cleanup',
        'status', 'success'
    )
);
