
-- Criar tabela para vincular usuários a consultores
CREATE TABLE public.user_consultant_links (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  consultant_id UUID NOT NULL REFERENCES public.consultants(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id), -- Um usuário só pode ter um consultor vinculado
  UNIQUE(consultant_id) -- Um consultor só pode estar vinculado a um usuário
);

-- Criar tabela para vincular usuários a clientes
CREATE TABLE public.user_client_links (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id), -- Um usuário só pode ter um cliente vinculado
  UNIQUE(client_id) -- Um cliente só pode estar vinculado a um usuário
);

-- Habilitar RLS nas tabelas
ALTER TABLE public.user_consultant_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_client_links ENABLE ROW LEVEL SECURITY;

-- Políticas para user_consultant_links
CREATE POLICY "Usuários autenticados podem visualizar vínculos de consultores" 
  ON public.user_consultant_links 
  FOR SELECT 
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Usuários autenticados podem criar vínculos de consultores" 
  ON public.user_consultant_links 
  FOR INSERT 
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Usuários autenticados podem atualizar vínculos de consultores" 
  ON public.user_consultant_links 
  FOR UPDATE 
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Usuários autenticados podem deletar vínculos de consultores" 
  ON public.user_consultant_links 
  FOR DELETE 
  USING (auth.uid() IS NOT NULL);

-- Políticas para user_client_links
CREATE POLICY "Usuários autenticados podem visualizar vínculos de clientes" 
  ON public.user_client_links 
  FOR SELECT 
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Usuários autenticados podem criar vínculos de clientes" 
  ON public.user_client_links 
  FOR INSERT 
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Usuários autenticados podem atualizar vínculos de clientes" 
  ON public.user_client_links 
  FOR UPDATE 
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Usuários autenticados podem deletar vínculos de clientes" 
  ON public.user_client_links 
  FOR DELETE 
  USING (auth.uid() IS NOT NULL);

-- Função para buscar vínculos de usuário com informações completas
CREATE OR REPLACE FUNCTION public.get_user_links(p_user_id uuid)
RETURNS TABLE (
  user_id uuid,
  consultant_id uuid,
  consultant_name text,
  client_id uuid,
  client_name text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    au.id::uuid as user_id,
    ucl.consultant_id::uuid,
    c.name::text as consultant_name,
    ucl2.client_id::uuid,
    cl.name::text as client_name
  FROM auth.users au
  LEFT JOIN public.user_consultant_links ucl ON au.id = ucl.user_id
  LEFT JOIN public.consultants c ON ucl.consultant_id = c.id
  LEFT JOIN public.user_client_links ucl2 ON au.id = ucl2.user_id
  LEFT JOIN public.clients cl ON ucl2.client_id = cl.id
  WHERE au.id = p_user_id
  AND au.deleted_at IS NULL;
END;
$$;

-- Garantir permissões para a função
GRANT EXECUTE ON FUNCTION public.get_user_links(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_links(uuid) TO anon;
