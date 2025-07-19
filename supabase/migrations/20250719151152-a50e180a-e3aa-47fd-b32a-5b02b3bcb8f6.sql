-- Criar tabela para rastrear usuários excluídos (não podemos deletar do auth.users diretamente)
CREATE TABLE IF NOT EXISTS public.deleted_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  user_email TEXT NOT NULL,
  deleted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  deleted_by UUID,
  reason TEXT DEFAULT 'Excluído via interface administrativa',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE public.deleted_users ENABLE ROW LEVEL SECURITY;

-- Política para permitir que usuários autenticados vejam e gerenciem usuários excluídos
CREATE POLICY "Authenticated users can manage deleted users" 
ON public.deleted_users 
FOR ALL 
USING (auth.uid() IS NOT NULL) 
WITH CHECK (auth.uid() IS NOT NULL);

-- Atualizar função para excluir completamente um usuário
CREATE OR REPLACE FUNCTION public.delete_user_completely(p_user_id UUID)
RETURNS VOID
LANGUAGE PLPGSQL
SECURITY DEFINER
AS $$
DECLARE
  user_email_var TEXT;
BEGIN
  -- Buscar email do usuário antes da exclusão
  SELECT email INTO user_email_var 
  FROM auth.users 
  WHERE id = p_user_id;
  
  -- Registrar a exclusão antes de remover os dados
  INSERT INTO public.deleted_users (user_id, user_email, deleted_by)
  VALUES (p_user_id, COALESCE(user_email_var, 'Email não encontrado'), auth.uid())
  ON CONFLICT (user_id) DO NOTHING;
  
  -- Remover de todas as tabelas que referenciam o usuário
  DELETE FROM public.disabled_users WHERE user_id = p_user_id;
  DELETE FROM public.user_profiles WHERE user_id = p_user_id;
  DELETE FROM public.user_consultant_links WHERE user_id = p_user_id;
  DELETE FROM public.user_client_links WHERE user_id = p_user_id;
  DELETE FROM public.demand_views WHERE user_id = p_user_id;
  DELETE FROM public.profiles WHERE id = p_user_id;
  
  -- Remover de tabelas de projeto se houver referências
  UPDATE public.projects SET main_consultant_id = NULL WHERE main_consultant_id = p_user_id;
  UPDATE public.projects SET support_consultant_id = NULL WHERE support_consultant_id = p_user_id;
  UPDATE public.project_stages SET consultant_id = NULL WHERE consultant_id = p_user_id;
  
  -- Remover de demands
  DELETE FROM public.demands WHERE created_by = p_user_id;
  UPDATE public.demands SET consultant_id = NULL WHERE consultant_id = p_user_id;
  
  -- Log da exclusão
  INSERT INTO public.system_logs (log_type, category, message, details)
  VALUES (
    'info', 
    'user_deletion', 
    'Usuário excluído completamente do sistema',
    jsonb_build_object(
      'deleted_user_id', p_user_id,
      'deleted_user_email', user_email_var,
      'deleted_by', auth.uid(),
      'deleted_at', NOW()
    )
  );
END;
$$;

-- Atualizar a função get_auth_users para excluir usuários marcados como deletados
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
    AND NOT EXISTS (
      SELECT 1 FROM public.deleted_users du 
      WHERE du.user_id = au.id
    )
  ORDER BY au.created_at DESC;
END;
$$;

-- Função para restaurar um usuário excluído (se necessário)
CREATE OR REPLACE FUNCTION public.restore_deleted_user(p_user_id UUID)
RETURNS VOID
LANGUAGE PLPGSQL
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM public.deleted_users WHERE user_id = p_user_id;
  
  INSERT INTO public.system_logs (log_type, category, message, details)
  VALUES (
    'info', 
    'user_restoration', 
    'Usuário restaurado no sistema',
    jsonb_build_object(
      'restored_user_id', p_user_id,
      'restored_by', auth.uid(),
      'restored_at', NOW()
    )
  );
END;
$$;