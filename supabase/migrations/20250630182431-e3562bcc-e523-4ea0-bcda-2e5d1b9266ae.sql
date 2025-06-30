
-- Atualizar a função get_access_profiles para incluir restrict_to_linked
CREATE OR REPLACE FUNCTION public.get_access_profiles()
RETURNS TABLE (
  id uuid,
  name text,
  description text,
  is_system_default boolean,
  is_active boolean,
  created_at timestamptz,
  updated_at timestamptz,
  permissions jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ap.id,
    ap.name::text,
    ap.description::text,
    ap.is_system_default,
    ap.is_active,
    ap.created_at,
    ap.updated_at,
    COALESCE(
      jsonb_agg(
        jsonb_build_object(
          'module_name', pmp.module_name::text,
          'can_view', pmp.can_view,
          'can_edit', pmp.can_edit,
          'can_delete', pmp.can_delete,
          'restrict_to_linked', pmp.restrict_to_linked
        )
      ) FILTER (WHERE pmp.id IS NOT NULL),
      '[]'::jsonb
    ) as permissions
  FROM public.access_profiles ap
  LEFT JOIN public.profile_module_permissions pmp ON ap.id = pmp.profile_id
  WHERE ap.is_active = true
  GROUP BY ap.id, ap.name, ap.description, ap.is_system_default, ap.is_active, ap.created_at, ap.updated_at
  ORDER BY ap.is_system_default DESC, ap.name;
END;
$$;

-- Função para sincronizar permissões do Super Admin com todos os módulos
CREATE OR REPLACE FUNCTION public.sync_super_admin_permissions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  super_admin_id uuid;
  module_record RECORD;
BEGIN
  -- Buscar o ID do perfil Super Admin
  SELECT id INTO super_admin_id 
  FROM public.access_profiles 
  WHERE name = 'Super Admin' 
  LIMIT 1;
  
  -- Se não encontrar o Super Admin, sair
  IF super_admin_id IS NULL THEN
    RETURN;
  END IF;
  
  -- Para cada módulo no enum, garantir que o Super Admin tenha permissão total
  FOR module_record IN 
    SELECT unnest(enum_range(NULL::module_type)) as module_name
  LOOP
    -- Inserir ou atualizar permissão para este módulo
    INSERT INTO public.profile_module_permissions (
      profile_id, 
      module_name, 
      can_view, 
      can_edit, 
      can_delete, 
      restrict_to_linked
    ) VALUES (
      super_admin_id,
      module_record.module_name,
      true,
      true,
      true,
      false
    )
    ON CONFLICT (profile_id, module_name) 
    DO UPDATE SET
      can_view = true,
      can_edit = true,
      can_delete = true,
      restrict_to_linked = false;
  END LOOP;
END;
$$;

-- Executar a sincronização imediatamente
SELECT public.sync_super_admin_permissions();

-- Criar trigger para executar automaticamente a sincronização quando necessário
CREATE OR REPLACE FUNCTION public.trigger_sync_super_admin()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- Executar sincronização após qualquer mudança na tabela de perfis
  PERFORM public.sync_super_admin_permissions();
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Aplicar o trigger na tabela de perfis
DROP TRIGGER IF EXISTS sync_super_admin_on_profile_change ON public.access_profiles;
CREATE TRIGGER sync_super_admin_on_profile_change
  AFTER INSERT OR UPDATE OR DELETE ON public.access_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_sync_super_admin();
