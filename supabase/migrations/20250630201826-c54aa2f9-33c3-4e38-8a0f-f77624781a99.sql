
-- Primeiro, vamos verificar e corrigir a função user_can_access_module
CREATE OR REPLACE FUNCTION public.user_can_access_module(module_name text, permission_type text DEFAULT 'view')
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  -- Se é Super Admin, tem acesso total
  IF public.user_is_super_admin() THEN
    RETURN true;
  END IF;
  
  -- Verificar permissões específicas do módulo
  RETURN EXISTS (
    SELECT 1 
    FROM public.user_profiles up
    JOIN public.access_profiles ap ON up.profile_id = ap.id
    JOIN public.profile_module_permissions pmp ON ap.id = pmp.profile_id
    WHERE up.user_id = auth.uid()
    AND pmp.module_name::text = module_name
    AND ap.is_active = true
    AND (
      (permission_type = 'view' AND pmp.can_view = true) OR
      (permission_type = 'edit' AND pmp.can_edit = true) OR
      (permission_type = 'delete' AND pmp.can_delete = true)
    )
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN false;
END;
$$;

-- Função para verificar se usuário deve ter acesso restrito a dados vinculados
CREATE OR REPLACE FUNCTION public.user_is_restricted_to_linked(module_name text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  -- Se é Super Admin, não há restrições
  IF public.user_is_super_admin() THEN
    RETURN false;
  END IF;
  
  -- Verificar se o usuário tem restrição a dados vinculados para este módulo
  RETURN EXISTS (
    SELECT 1 
    FROM public.user_profiles up
    JOIN public.access_profiles ap ON up.profile_id = ap.id
    JOIN public.profile_module_permissions pmp ON ap.id = pmp.profile_id
    WHERE up.user_id = auth.uid()
    AND pmp.module_name::text = module_name
    AND ap.is_active = true
    AND pmp.restrict_to_linked = true
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN true; -- Em caso de erro, aplicar restrição por segurança
END;
$$;

-- Função para verificar se usuário tem acesso a um projeto específico
CREATE OR REPLACE FUNCTION public.user_has_project_access(project_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  project_record RECORD;
BEGIN
  -- Se é Super Admin, tem acesso total
  IF public.user_is_super_admin() THEN
    RETURN true;
  END IF;
  
  -- Se não tem permissão básica para ver projetos, retornar false
  IF NOT public.user_can_access_module('projects', 'view') THEN
    RETURN false;
  END IF;
  
  -- Se não está restrito a dados vinculados, pode ver todos os projetos
  IF NOT public.user_is_restricted_to_linked('projects') THEN
    RETURN true;
  END IF;
  
  -- Buscar dados do projeto
  SELECT p.main_consultant_id, p.support_consultant_id, p.client_id
  INTO project_record
  FROM public.projects p
  WHERE p.id = project_id;
  
  -- Se projeto não existe, retornar false
  IF project_record IS NULL THEN
    RETURN false;
  END IF;
  
  -- Verificar se o usuário tem acesso via consultor vinculado
  IF project_record.main_consultant_id IS NOT NULL 
     AND public.user_has_consultant_access(project_record.main_consultant_id) THEN
    RETURN true;
  END IF;
  
  IF project_record.support_consultant_id IS NOT NULL 
     AND public.user_has_consultant_access(project_record.support_consultant_id) THEN
    RETURN true;
  END IF;
  
  -- Verificar se o usuário tem acesso via cliente vinculado
  IF project_record.client_id IS NOT NULL 
     AND public.user_has_client_access(project_record.client_id) THEN
    RETURN true;
  END IF;
  
  RETURN false;
EXCEPTION
  WHEN OTHERS THEN
    RETURN false;
END;
$$;

-- Remover políticas antigas da tabela projects
DROP POLICY IF EXISTS "Users can view projects based on access" ON public.projects;
DROP POLICY IF EXISTS "Users can update projects based on access" ON public.projects;
DROP POLICY IF EXISTS "Users can delete projects based on access" ON public.projects;
DROP POLICY IF EXISTS "Users can insert projects based on access" ON public.projects;

-- Criar novas políticas RLS para projects
CREATE POLICY "Users can view projects based on access"
ON public.projects
FOR SELECT
TO authenticated
USING (public.user_has_project_access(id));

CREATE POLICY "Users can update projects based on access"
ON public.projects
FOR UPDATE
TO authenticated
USING (
  public.user_is_super_admin() OR
  (public.user_can_access_module('projects', 'edit') AND public.user_has_project_access(id))
);

CREATE POLICY "Users can delete projects based on access"
ON public.projects
FOR DELETE
TO authenticated
USING (
  public.user_is_super_admin() OR
  public.user_can_access_module('projects', 'delete')
);

CREATE POLICY "Users can insert projects based on access"
ON public.projects
FOR INSERT
TO authenticated
WITH CHECK (
  public.user_is_super_admin() OR
  public.user_can_access_module('projects', 'edit')
);

-- Habilitar RLS na tabela projects se não estiver habilitado
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- Conceder permissões para as funções
GRANT EXECUTE ON FUNCTION public.user_can_access_module(text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.user_is_restricted_to_linked(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.user_has_project_access(uuid) TO authenticated;

-- Log da correção
INSERT INTO public.system_logs (log_type, category, message, details)
VALUES (
  'info', 
  'projects_rls_fix', 
  'Políticas RLS para projetos corrigidas com controle de acesso por vínculos',
  jsonb_build_object(
    'timestamp', NOW(),
    'action', 'projects_rls_correction',
    'functions_created', 2,
    'policies_updated', 4,
    'security_level', 'enhanced'
  )
);
