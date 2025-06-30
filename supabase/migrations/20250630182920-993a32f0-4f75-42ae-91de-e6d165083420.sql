
-- Criar tabela para vínculos de usuários com perfis de acesso
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  profile_id UUID NOT NULL REFERENCES public.access_profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Habilitar RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para user_profiles
CREATE POLICY "Usuários autenticados podem visualizar vínculos de perfis"
  ON public.user_profiles
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Usuários autenticados podem criar vínculos de perfis"
  ON public.user_profiles
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Usuários autenticados podem atualizar vínculos de perfis"
  ON public.user_profiles
  FOR UPDATE
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Usuários autenticados podem deletar vínculos de perfis"
  ON public.user_profiles
  FOR DELETE
  USING (auth.uid() IS NOT NULL);

-- Função para buscar perfil do usuário
CREATE OR REPLACE FUNCTION public.get_user_profile(p_user_id UUID)
RETURNS TABLE (
  user_id uuid,
  profile_id uuid,
  profile_name text,
  profile_description text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    up.user_id,
    up.profile_id,
    ap.name::text as profile_name,
    ap.description::text as profile_description
  FROM public.user_profiles up
  JOIN public.access_profiles ap ON up.profile_id = ap.id
  WHERE up.user_id = p_user_id;
END;
$$;

-- Função para atribuir perfil ao usuário
CREATE OR REPLACE FUNCTION public.assign_user_profile(p_user_id UUID, p_profile_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.user_profiles (user_id, profile_id)
  VALUES (p_user_id, p_profile_id)
  ON CONFLICT (user_id) 
  DO UPDATE SET 
    profile_id = p_profile_id,
    updated_at = now();
END;
$$;

-- Garantir que o Super Admin seja atribuído ao email específico
DO $$
DECLARE
  super_admin_profile_id UUID;
  target_user_id UUID;
BEGIN
  -- Buscar o ID do perfil Super Admin
  SELECT id INTO super_admin_profile_id 
  FROM public.access_profiles 
  WHERE name = 'Super Admin' 
  LIMIT 1;
  
  -- Buscar o ID do usuário pelo email
  SELECT id INTO target_user_id
  FROM auth.users
  WHERE email = 'pedroaugusto.andrademelo@gmail.com'
  LIMIT 1;
  
  -- Se ambos existirem, criar o vínculo
  IF super_admin_profile_id IS NOT NULL AND target_user_id IS NOT NULL THEN
    INSERT INTO public.user_profiles (user_id, profile_id)
    VALUES (target_user_id, super_admin_profile_id)
    ON CONFLICT (user_id) 
    DO UPDATE SET 
      profile_id = super_admin_profile_id,
      updated_at = now();
  END IF;
END;
$$;

-- Conceder permissões para as funções
GRANT EXECUTE ON FUNCTION public.get_user_profile(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.assign_user_profile(UUID, UUID) TO authenticated;
