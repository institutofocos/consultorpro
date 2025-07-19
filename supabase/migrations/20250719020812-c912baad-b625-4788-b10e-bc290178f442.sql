-- Apenas criar a função que está faltando
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