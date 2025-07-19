-- Habilitar RLS na tabela project_stages se não estiver habilitado
ALTER TABLE public.project_stages ENABLE ROW LEVEL SECURITY;

-- Criar policies para project_stages baseadas no acesso aos projetos
DROP POLICY IF EXISTS "Users can view project stages based on project access" ON public.project_stages;
DROP POLICY IF EXISTS "Users can insert project stages based on project access" ON public.project_stages;
DROP POLICY IF EXISTS "Users can update project stages based on project access" ON public.project_stages;
DROP POLICY IF EXISTS "Users can delete project stages based on project access" ON public.project_stages;

-- Policy para visualizar etapas - baseada no acesso ao projeto
CREATE POLICY "Users can view project stages based on project access" 
ON public.project_stages 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.projects p 
    WHERE p.id = project_id 
    AND public.user_has_project_access(p.id)
  )
);

-- Policy para inserir etapas - apenas super admins ou quem tem acesso ao projeto
CREATE POLICY "Users can insert project stages based on project access" 
ON public.project_stages 
FOR INSERT 
WITH CHECK (
  public.user_is_super_admin() OR
  EXISTS (
    SELECT 1 FROM public.projects p 
    WHERE p.id = project_id 
    AND public.user_has_project_access(p.id)
  )
);

-- Policy para atualizar etapas - super admins ou quem tem acesso ao projeto
CREATE POLICY "Users can update project stages based on project access" 
ON public.project_stages 
FOR UPDATE 
USING (
  public.user_is_super_admin() OR
  EXISTS (
    SELECT 1 FROM public.projects p 
    WHERE p.id = project_id 
    AND public.user_has_project_access(p.id)
  )
);

-- Policy para deletar etapas - apenas super admins
CREATE POLICY "Users can delete project stages based on project access" 
ON public.project_stages 
FOR DELETE 
USING (public.user_is_super_admin());