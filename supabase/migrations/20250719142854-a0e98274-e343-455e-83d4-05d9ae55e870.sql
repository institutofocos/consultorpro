-- Atualizar função get_auth_users para incluir status disabled
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
    COALESCE((au.user_metadata->>'disabled')::boolean, false) as disabled
  FROM auth.users au
  WHERE au.deleted_at IS NULL
  ORDER BY au.created_at DESC;
END;
$function$