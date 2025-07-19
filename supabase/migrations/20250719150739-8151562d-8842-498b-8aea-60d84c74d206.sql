-- Criar tabela para controlar usuários desativados
CREATE TABLE IF NOT EXISTS public.disabled_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  disabled_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  disabled_by UUID,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE public.disabled_users ENABLE ROW LEVEL SECURITY;

-- Política para permitir que usuários autenticados vejam e gerenciem usuários desativados
CREATE POLICY "Authenticated users can manage disabled users" 
ON public.disabled_users 
FOR ALL 
USING (auth.uid() IS NOT NULL) 
WITH CHECK (auth.uid() IS NOT NULL);

-- Função para verificar se um usuário está desativado
CREATE OR REPLACE FUNCTION public.is_user_disabled(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.disabled_users 
    WHERE user_id = p_user_id
  );
$$;

-- Função para desativar um usuário
CREATE OR REPLACE FUNCTION public.disable_user(p_user_id UUID, p_reason TEXT DEFAULT NULL)
RETURNS VOID
LANGUAGE PLPGSQL
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.disabled_users (user_id, disabled_by, reason)
  VALUES (p_user_id, auth.uid(), p_reason)
  ON CONFLICT (user_id) DO NOTHING;
END;
$$;

-- Função para ativar um usuário
CREATE OR REPLACE FUNCTION public.enable_user(p_user_id UUID)
RETURNS VOID
LANGUAGE PLPGSQL
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM public.disabled_users WHERE user_id = p_user_id;
END;
$$;

-- Função para excluir completamente um usuário (remove de todas as tabelas relacionadas)
CREATE OR REPLACE FUNCTION public.delete_user_completely(p_user_id UUID)
RETURNS VOID
LANGUAGE PLPGSQL
SECURITY DEFINER
AS $$
BEGIN
  -- Remover de todas as tabelas que referenciam o usuário
  DELETE FROM public.disabled_users WHERE user_id = p_user_id;
  DELETE FROM public.user_profiles WHERE user_id = p_user_id;
  DELETE FROM public.user_consultant_links WHERE user_id = p_user_id;
  DELETE FROM public.user_client_links WHERE user_id = p_user_id;
  DELETE FROM public.demand_views WHERE user_id = p_user_id;
  DELETE FROM public.profiles WHERE id = p_user_id;
  
  -- Log da exclusão
  INSERT INTO public.system_logs (log_type, category, message, details)
  VALUES (
    'info', 
    'user_deletion', 
    'Usuário excluído completamente do sistema',
    jsonb_build_object(
      'deleted_user_id', p_user_id,
      'deleted_by', auth.uid(),
      'deleted_at', NOW()
    )
  );
END;
$$;

-- Atualizar a função get_auth_users para incluir status de desativação
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
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    au.id::uuid,
    au.email::text,
    au.created_at::timestamptz,
    au.last_sign_in_at::timestamptz,
    au.email_confirmed_at::timestamptz,
    public.is_user_disabled(au.id) as disabled
  FROM auth.users au
  WHERE au.deleted_at IS NULL
  ORDER BY au.created_at DESC;
END;
$$;