
-- Primeiro, vamos criar uma função específica para verificar acesso a etapas
CREATE OR REPLACE FUNCTION public.user_has_stage_access(stage_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  stage_record RECORD;
BEGIN
  -- Se é Super Admin, tem acesso total
  IF public.user_is_super_admin() THEN
    RETURN true;
  END IF;
  
  -- Se não tem permissão básica para ver projetos, retornar false
  IF NOT public.user_can_access_module('projects', 'view') THEN
    RETURN false;
  END IF;
  
  -- Buscar dados da etapa e do projeto relacionado
  SELECT 
    ps.id,
    ps.project_id,
    ps.consultant_id,
    p.main_consultant_id,
    p.support_consultant_id,
    p.client_id
  INTO stage_record
  FROM public.project_stages ps
  JOIN public.projects p ON ps.project_id = p.id
  WHERE ps.id = stage_id;
  
  -- Se etapa não existe, retornar false
  IF stage_record IS NULL THEN
    RETURN false;
  END IF;
  
  -- Se não está restrito a dados vinculados, pode ver todas as etapas
  IF NOT public.user_is_restricted_to_linked('projects') THEN
    RETURN true;
  END IF;
  
  -- Verificar se o usuário tem acesso via consultor da etapa
  IF stage_record.consultant_id IS NOT NULL 
     AND public.user_has_consultant_access(stage_record.consultant_id) THEN
    RETURN true;
  END IF;
  
  -- Verificar se o usuário tem acesso via consultor principal do projeto
  IF stage_record.main_consultant_id IS NOT NULL 
     AND public.user_has_consultant_access(stage_record.main_consultant_id) THEN
    RETURN true;
  END IF;
  
  -- Verificar se o usuário tem acesso via consultor de apoio do projeto
  IF stage_record.support_consultant_id IS NOT NULL 
     AND public.user_has_consultant_access(stage_record.support_consultant_id) THEN
    RETURN true;
  END IF;
  
  -- Verificar se o usuário tem acesso via cliente vinculado
  IF stage_record.client_id IS NOT NULL 
     AND public.user_has_client_access(stage_record.client_id) THEN
    RETURN true;
  END IF;
  
  RETURN false;
EXCEPTION
  WHEN OTHERS THEN
    RETURN false;
END;
$$;

-- Remover políticas antigas da tabela project_stages
DROP POLICY IF EXISTS "Users can view project stages based on access" ON public.project_stages;
DROP POLICY IF EXISTS "Users can update project stages based on access" ON public.project_stages;
DROP POLICY IF EXISTS "Users can delete project stages based on access" ON public.project_stages;
DROP POLICY IF EXISTS "Users can insert project stages based on access" ON public.project_stages;

-- Criar novas políticas RLS para project_stages
CREATE POLICY "Users can view project stages based on access"
ON public.project_stages
FOR SELECT
TO authenticated
USING (public.user_has_stage_access(id));

CREATE POLICY "Users can update project stages based on access"
ON public.project_stages
FOR UPDATE
TO authenticated
USING (
  public.user_is_super_admin() OR
  (public.user_can_access_module('projects', 'edit') AND public.user_has_stage_access(id))
);

CREATE POLICY "Users can delete project stages based on access"
ON public.project_stages
FOR DELETE
TO authenticated
USING (
  public.user_is_super_admin() OR
  (public.user_can_access_module('projects', 'delete') AND public.user_has_stage_access(id))
);

CREATE POLICY "Users can insert project stages based on access"
ON public.project_stages
FOR INSERT
TO authenticated
WITH CHECK (
  public.user_is_super_admin() OR
  (public.user_can_access_module('projects', 'edit') AND public.user_has_project_access(project_id))
);

-- Habilitar RLS na tabela project_stages se não estiver habilitado
ALTER TABLE public.project_stages ENABLE ROW LEVEL SECURITY;

-- Conceder permissões para a nova função
GRANT EXECUTE ON FUNCTION public.user_has_stage_access(uuid) TO authenticated;

-- Também vamos corrigir a função de acesso a projetos para ser mais restritiva
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
  
  -- Buscar dados do projeto
  SELECT p.main_consultant_id, p.support_consultant_id, p.client_id
  INTO project_record
  FROM public.projects p
  WHERE p.id = project_id;
  
  -- Se projeto não existe, retornar false
  IF project_record IS NULL THEN
    RETURN false;
  END IF;
  
  -- Se não está restrito a dados vinculados, pode ver todos os projetos
  IF NOT public.user_is_restricted_to_linked('projects') THEN
    RETURN true;
  END IF;
  
  -- Verificar se o usuário tem acesso via consultor principal vinculado
  IF project_record.main_consultant_id IS NOT NULL 
     AND public.user_has_consultant_access(project_record.main_consultant_id) THEN
    RETURN true;
  END IF;
  
  -- Verificar se o usuário tem acesso via consultor de apoio vinculado
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

-- Log da correção
INSERT INTO public.system_logs (log_type, category, message, details)
VALUES (
  'info', 
  'stages_rls_fix', 
  'Políticas RLS para etapas de projetos corrigidas com controle de acesso por vínculos',
  jsonb_build_object(
    'timestamp', NOW(),
    'action', 'project_stages_rls_correction',
    'functions_created', 1,
    'policies_updated', 4,
    'security_level', 'enhanced'
  )
);
