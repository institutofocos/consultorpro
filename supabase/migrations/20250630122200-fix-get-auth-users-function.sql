
-- Corrigir a função get_auth_users para retornar os tipos corretos
DROP FUNCTION IF EXISTS public.get_auth_users();

CREATE OR REPLACE FUNCTION public.get_auth_users()
RETURNS TABLE (
  id uuid,
  email text,
  created_at timestamptz,
  last_sign_in_at timestamptz,
  email_confirmed_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    au.id::uuid,
    au.email::text,
    au.created_at::timestamptz,
    au.last_sign_in_at::timestamptz,
    au.email_confirmed_at::timestamptz
  FROM auth.users au
  WHERE au.deleted_at IS NULL
  ORDER BY au.created_at DESC;
END;
$$;

-- Garantir que a função tenha as permissões corretas
GRANT EXECUTE ON FUNCTION public.get_auth_users() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_auth_users() TO anon;

-- Testar a função
DO $$
BEGIN
  -- Verificar se a função funciona
  PERFORM * FROM public.get_auth_users() LIMIT 1;
  RAISE NOTICE 'Função get_auth_users() testada com sucesso';
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Erro ao testar função: %', SQLERRM;
END $$;
