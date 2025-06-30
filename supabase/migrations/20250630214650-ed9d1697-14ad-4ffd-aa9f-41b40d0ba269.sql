
-- Remover políticas existentes problemáticas se existirem
DROP POLICY IF EXISTS "Users can view projects they have access to" ON public.projects;
DROP POLICY IF EXISTS "Consultants can view demands" ON public.projects;
DROP POLICY IF EXISTS "Super admins can view all projects" ON public.projects;

-- Criar política para Super Admins verem todos os projetos
CREATE POLICY "Super admins can view all projects" 
  ON public.projects 
  FOR SELECT 
  USING (public.user_is_super_admin());

-- Criar política para consultants verem projetos onde são o consultor principal ou de apoio
CREATE POLICY "Consultants can view assigned projects" 
  ON public.projects 
  FOR SELECT 
  USING (
    public.user_has_consultant_access(main_consultant_id) OR
    public.user_has_consultant_access(support_consultant_id)
  );

-- POLÍTICA CHAVE: Permitir que consultores vejam DEMANDAS (projetos sem consultores)
CREATE POLICY "All authenticated users can view demands" 
  ON public.projects 
  FOR SELECT 
  USING (
    auth.uid() IS NOT NULL AND 
    main_consultant_id IS NULL AND 
    support_consultant_id IS NULL
  );

-- Política para clientes verem seus próprios projetos
CREATE POLICY "Clients can view their projects" 
  ON public.projects 
  FOR SELECT 
  USING (public.user_has_client_access(client_id));

-- Políticas para INSERT/UPDATE/DELETE apenas para Super Admins
CREATE POLICY "Super admins can insert projects" 
  ON public.projects 
  FOR INSERT 
  WITH CHECK (public.user_is_super_admin());

CREATE POLICY "Super admins can update projects" 
  ON public.projects 
  FOR UPDATE 
  USING (public.user_is_super_admin());

CREATE POLICY "Super admins can delete projects" 
  ON public.projects 
  FOR DELETE 
  USING (public.user_is_super_admin());
