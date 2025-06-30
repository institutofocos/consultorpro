
-- Criar enum para tipos de módulos
CREATE TYPE public.module_type AS ENUM (
  'dashboard',
  'consultants',
  'clients', 
  'projects',
  'demands',
  'services',
  'calendar',
  'financial',
  'settings'
);

-- Criar tabela de perfis de acesso
CREATE TABLE public.access_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  is_system_default BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(name)
);

-- Criar tabela de permissões de módulos por perfil
CREATE TABLE public.profile_module_permissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID NOT NULL REFERENCES public.access_profiles(id) ON DELETE CASCADE,
  module_name module_type NOT NULL,
  can_view BOOLEAN NOT NULL DEFAULT false,
  can_edit BOOLEAN NOT NULL DEFAULT false,
  can_delete BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(profile_id, module_name)
);

-- Alterar tabela user_consultant_links para incluir perfil
ALTER TABLE public.user_consultant_links 
ADD COLUMN profile_id UUID REFERENCES public.access_profiles(id);

-- Alterar tabela user_client_links para incluir perfil  
ALTER TABLE public.user_client_links
ADD COLUMN profile_id UUID REFERENCES public.access_profiles(id);

-- Habilitar RLS nas novas tabelas
ALTER TABLE public.access_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_module_permissions ENABLE ROW LEVEL SECURITY;

-- Políticas para access_profiles
CREATE POLICY "Usuários autenticados podem visualizar perfis de acesso"
  ON public.access_profiles
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Usuários autenticados podem criar perfis de acesso"
  ON public.access_profiles
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Usuários autenticados podem atualizar perfis de acesso"
  ON public.access_profiles
  FOR UPDATE
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Usuários autenticados podem deletar perfis de acesso"
  ON public.access_profiles
  FOR DELETE
  USING (auth.uid() IS NOT NULL);

-- Políticas para profile_module_permissions
CREATE POLICY "Usuários autenticados podem visualizar permissões de módulos"
  ON public.profile_module_permissions
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Usuários autenticados podem criar permissões de módulos"
  ON public.profile_module_permissions
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Usuários autenticados podem atualizar permissões de módulos"
  ON public.profile_module_permissions
  FOR UPDATE
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Usuários autenticados podem deletar permissões de módulos"
  ON public.profile_module_permissions
  FOR DELETE
  USING (auth.uid() IS NOT NULL);

-- Inserir perfis padrão
INSERT INTO public.access_profiles (name, description, is_system_default, is_active) VALUES
('Super Admin', 'Perfil destinado aos programadores do sistema. Possui acesso irrestrito a todas as funcionalidades.', true, true),
('Admin', 'Perfil do proprietário da empresa. Possui acesso completo a todos os módulos da sua própria empresa.', true, true),
('Gestor', 'Perfil com acesso aos principais módulos de gestão da empresa.', true, true),
('Financeiro', 'Acesso exclusivo ao módulo de Financeiro da empresa.', true, true),
('Consultor', 'Acesso restrito aos módulos de projetos, demandas e calendário vinculados ao próprio usuário.', true, true);

-- Inserir permissões para Super Admin (acesso total)
INSERT INTO public.profile_module_permissions (profile_id, module_name, can_view, can_edit, can_delete)
SELECT 
  ap.id,
  m.module_name,
  true,
  true,
  true
FROM public.access_profiles ap
CROSS JOIN (
  SELECT unnest(enum_range(NULL::module_type)) as module_name
) m
WHERE ap.name = 'Super Admin';

-- Inserir permissões para Admin (acesso total exceto settings)
INSERT INTO public.profile_module_permissions (profile_id, module_name, can_view, can_edit, can_delete)
SELECT 
  ap.id,
  m.module_name,
  true,
  true,
  CASE WHEN m.module_name = 'settings' THEN false ELSE true END
FROM public.access_profiles ap
CROSS JOIN (
  SELECT unnest(enum_range(NULL::module_type)) as module_name
) m
WHERE ap.name = 'Admin';

-- Inserir permissões para Gestor
INSERT INTO public.profile_module_permissions (profile_id, module_name, can_view, can_edit, can_delete)
SELECT 
  ap.id,
  m.module_name,
  true,
  true,
  true
FROM public.access_profiles ap
CROSS JOIN (VALUES 
  ('dashboard'::module_type),
  ('consultants'::module_type),
  ('clients'::module_type),
  ('projects'::module_type),
  ('demands'::module_type),
  ('services'::module_type),
  ('calendar'::module_type),
  ('financial'::module_type)
) m(module_name)
WHERE ap.name = 'Gestor';

-- Inserir permissões para Financeiro
INSERT INTO public.profile_module_permissions (profile_id, module_name, can_view, can_edit, can_delete)
SELECT 
  ap.id,
  'financial'::module_type,
  true,
  true,
  true
FROM public.access_profiles ap
WHERE ap.name = 'Financeiro';

-- Inserir permissões para Consultor
INSERT INTO public.profile_module_permissions (profile_id, module_name, can_view, can_edit, can_delete)
SELECT 
  ap.id,
  m.module_name,
  true,
  true,
  false
FROM public.access_profiles ap
CROSS JOIN (VALUES 
  ('projects'::module_type),
  ('demands'::module_type),
  ('calendar'::module_type)
) m(module_name)
WHERE ap.name = 'Consultor';

-- Função para buscar perfis de acesso com permissões
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
          'can_delete', pmp.can_delete
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

-- Garantir permissões para as funções
GRANT EXECUTE ON FUNCTION public.get_access_profiles() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_access_profiles() TO anon;
