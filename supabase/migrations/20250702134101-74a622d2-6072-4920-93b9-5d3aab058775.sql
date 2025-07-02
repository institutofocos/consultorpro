
-- Adicionar 'chat' ao enum module_type se ainda não existir
DO $$
BEGIN
    -- Verificar se o valor 'chat' já existe no enum
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'chat' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'module_type')
    ) THEN
        ALTER TYPE public.module_type ADD VALUE 'chat';
    END IF;
END $$;

-- Sincronizar permissões do Super Admin para incluir o novo módulo chat
SELECT public.sync_super_admin_permissions();

-- Adicionar permissões de chat para os perfis existentes baseado no tipo de perfil
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
        END IF;
    END LOOP;
END $$;
