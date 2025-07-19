-- Remover todas as políticas conflitantes na tabela projects
DROP POLICY IF EXISTS "Clients can view their projects" ON public.projects;
DROP POLICY IF EXISTS "Super admins can delete projects" ON public.projects;
DROP POLICY IF EXISTS "Super admins can insert projects" ON public.projects;
DROP POLICY IF EXISTS "Super admins can update projects" ON public.projects;
DROP POLICY IF EXISTS "Super admins can view all projects" ON public.projects;
DROP POLICY IF EXISTS "Unified project access policy" ON public.projects;
DROP POLICY IF EXISTS "Users can delete projects based on access" ON public.projects;
DROP POLICY IF EXISTS "Users can insert projects based on access" ON public.projects;
DROP POLICY IF EXISTS "Users can update projects based on access" ON public.projects;

-- Criar políticas limpas e funcionais

-- Política para SELECT (visualização) - usar a função user_has_project_access
CREATE POLICY "Users can view projects they have access to" 
ON public.projects 
FOR SELECT 
TO authenticated
USING (user_has_project_access(id));

-- Políticas para INSERT - apenas super admins podem criar projetos
CREATE POLICY "Only super admins can create projects" 
ON public.projects 
FOR INSERT 
TO authenticated
WITH CHECK (user_is_super_admin());

-- Políticas para UPDATE - super admins ou quem tem acesso ao projeto
CREATE POLICY "Users can update projects they have access to" 
ON public.projects 
FOR UPDATE 
TO authenticated
USING (user_is_super_admin() OR user_has_project_access(id));

-- Políticas para DELETE - apenas super admins
CREATE POLICY "Only super admins can delete projects" 
ON public.projects 
FOR DELETE 
TO authenticated
USING (user_is_super_admin());

-- Log da correção
INSERT INTO public.system_logs (log_type, category, message, details)
VALUES (
  'info', 
  'rls_cleanup', 
  'Políticas RLS da tabela projects reorganizadas e simplificadas',
  jsonb_build_object(
    'updated_at', NOW(),
    'change_type', 'rls_policies_cleanup',
    'affected_table', 'projects',
    'remaining_policies', 4
  )
);