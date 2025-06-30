
-- Remover tabelas relacionadas ao gerenciamento de usuários (se existirem)
DROP TABLE IF EXISTS public.module_permissions CASCADE;
DROP TABLE IF EXISTS public.user_profiles CASCADE;

-- Remover funções relacionadas ao controle de usuários (se existirem)
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.create_consultant_user() CASCADE;
DROP FUNCTION IF EXISTS public.is_admin() CASCADE;
DROP FUNCTION IF EXISTS public.get_current_user_role() CASCADE;
DROP FUNCTION IF EXISTS public.update_module_permissions_updated_at() CASCADE;

-- Remover triggers relacionados (se existirem)  
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS create_user_for_consultant ON public.consultants;

-- Remover configurações do sistema relacionadas a usuários
DELETE FROM public.system_settings 
WHERE setting_key IN (
    'system_modules', 
    'default_user_role', 
    'require_email_verification',
    'webhook_consolidation_enabled'
);

-- Verificar se há outras configurações relacionadas a usuários que devem ser removidas
DELETE FROM public.system_settings 
WHERE setting_key LIKE '%user%' 
   OR setting_key LIKE '%auth%' 
   OR setting_key LIKE '%permission%'
   OR setting_key LIKE '%role%';
