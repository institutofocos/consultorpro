-- Corrigir função get_auth_users removendo referência a user_metadata
DROP FUNCTION IF EXISTS public.get_auth_users();

CREATE OR REPLACE FUNCTION public.get_auth_users()
RETURNS TABLE(
  id uuid, 
  email text, 
  created_at timestamp with time zone, 
  last_sign_in_at timestamp with time zone, 
  email_confirmed_at timestamp with time zone,
  disabled boolean
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    au.id::uuid,
    au.email::text,
    au.created_at::timestamptz,
    au.last_sign_in_at::timestamptz,
    au.email_confirmed_at::timestamptz,
    false as disabled  -- Retorna sempre false por enquanto, já que não podemos acessar user_metadata
  FROM auth.users au
  WHERE au.deleted_at IS NULL
  ORDER BY au.created_at DESC;
END;
$function$;