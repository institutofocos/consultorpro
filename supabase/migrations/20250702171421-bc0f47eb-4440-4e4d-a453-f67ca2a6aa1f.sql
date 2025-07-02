
-- Verificar se o valor 'chat' já existe no enum module_type
DO $$
BEGIN
    -- Tentar adicionar 'chat' ao enum se não existir
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'chat' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'module_type')
    ) THEN
        -- Adicionar o valor 'chat' ao enum
        ALTER TYPE public.module_type ADD VALUE 'chat';
        
        -- Log da operação
        INSERT INTO public.system_logs (log_type, category, message, details)
        VALUES (
            'info', 
            'enum_update', 
            'Valor chat adicionado ao enum module_type com sucesso',
            jsonb_build_object('enum_name', 'module_type', 'new_value', 'chat')
        );
    ELSE
        -- Log indicando que já existe
        INSERT INTO public.system_logs (log_type, category, message, details)
        VALUES (
            'info', 
            'enum_check', 
            'Valor chat já existe no enum module_type',
            jsonb_build_object('enum_name', 'module_type', 'existing_value', 'chat')
        );
    END IF;
END $$;

-- Garantir que as permissões do Super Admin incluam o novo módulo chat
SELECT public.sync_super_admin_permissions();

-- Verificar se as permissões de chat já existem para os perfis, se não, criar
DO $$
DECLARE
    profile_record RECORD;
BEGIN
    -- Para cada perfil ativo, verificar se tem permissão de chat
    FOR profile_record IN 
        SELECT id, name FROM public.access_profiles WHERE is_active = true
    LOOP
        -- Verificar se já existe permissão de chat para este perfil
        IF NOT EXISTS (
            SELECT 1 FROM public.profile_module_permissions 
            WHERE profile_id = profile_record.id AND module_name = 'chat'
        ) THEN
            -- Adicionar permissões baseadas no tipo de perfil
            CASE profile_record.name
                WHEN 'Super Admin' THEN
                    INSERT INTO public.profile_module_permissions (profile_id, module_name, can_view, can_edit, can_delete, restrict_to_linked)
                    VALUES (profile_record.id, 'chat', true, true, true, false);
                
                WHEN 'Admin' THEN
                    INSERT INTO public.profile_module_permissions (profile_id, module_name, can_view, can_edit, can_delete, restrict_to_linked)
                    VALUES (profile_record.id, 'chat', true, true, true, false);
                
                WHEN 'Gestor' THEN
                    INSERT INTO public.profile_module_permissions (profile_id, module_name, can_view, can_edit, can_delete, restrict_to_linked)
                    VALUES (profile_record.id, 'chat', true, true, true, false);
                
                WHEN 'Consultor' THEN
                    INSERT INTO public.profile_module_permissions (profile_id, module_name, can_view, can_edit, can_delete, restrict_to_linked)
                    VALUES (profile_record.id, 'chat', true, false, false, true);
                
                ELSE
                    -- Para perfis customizados, adicionar sem permissões por padrão
                    INSERT INTO public.profile_module_permissions (profile_id, module_name, can_view, can_edit, can_delete, restrict_to_linked)
                    VALUES (profile_record.id, 'chat', false, false, false, false);
            END CASE;
            
            -- Log da criação da permissão
            INSERT INTO public.system_logs (log_type, category, message, details)
            VALUES (
                'info', 
                'permission_created', 
                'Permissões de chat criadas para perfil: ' || profile_record.name,
                jsonb_build_object('profile_id', profile_record.id, 'profile_name', profile_record.name)
            );
        END IF;
    END LOOP;
END $$;

-- Verificar se tudo foi criado corretamente
SELECT 
    'Enum values' as check_type,
    string_agg(enumlabel, ', ') as values
FROM pg_enum 
WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'module_type')
UNION ALL
SELECT 
    'Chat permissions count' as check_type,
    COUNT(*)::text as values
FROM public.profile_module_permissions 
WHERE module_name = 'chat';
