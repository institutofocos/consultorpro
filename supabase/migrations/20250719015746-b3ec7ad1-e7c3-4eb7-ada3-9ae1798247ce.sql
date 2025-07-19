-- Primeiro remover a função conflitante
DROP FUNCTION IF EXISTS public.user_can_access_module(text, text);

-- Criar função user_is_restricted_to_linked que está sendo referenciada
CREATE OR REPLACE FUNCTION public.user_is_restricted_to_linked(module_name text)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
AS $function$
BEGIN
  -- Verificar se o usuário tem restrição aos dados vinculados para este módulo
  RETURN EXISTS (
    SELECT 1 
    FROM public.user_profiles up
    JOIN public.access_profiles ap ON up.profile_id = ap.id
    JOIN public.profile_module_permissions pmp ON ap.id = pmp.profile_id
    WHERE up.user_id = auth.uid()
    AND pmp.module_name::text = module_name
    AND pmp.restrict_to_linked = true
    AND ap.is_active = true
  );
EXCEPTION
  WHEN OTHERS THEN
    -- Em caso de erro, assumir não restrito para não bloquear o sistema
    RETURN false;
END;
$function$;

-- Criar função user_can_access_module que está sendo referenciada
CREATE OR REPLACE FUNCTION public.user_can_access_module(module_name text, access_type text)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
AS $function$
BEGIN
  -- Se é Super Admin, tem acesso total
  IF public.user_is_super_admin() THEN
    RETURN true;
  END IF;
  
  -- Verificar se o usuário tem a permissão específica para este módulo
  RETURN EXISTS (
    SELECT 1 
    FROM public.user_profiles up
    JOIN public.access_profiles ap ON up.profile_id = ap.id
    JOIN public.profile_module_permissions pmp ON ap.id = pmp.profile_id
    WHERE up.user_id = auth.uid()
    AND pmp.module_name::text = module_name
    AND ap.is_active = true
    AND (
      (access_type = 'view' AND pmp.can_view = true) OR
      (access_type = 'edit' AND pmp.can_edit = true) OR
      (access_type = 'delete' AND pmp.can_delete = true)
    )
  );
EXCEPTION
  WHEN OTHERS THEN
    -- Em caso de erro, retornar false para manter segurança
    RETURN false;
END;
$function$;