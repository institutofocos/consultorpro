-- Criar função user_can_access_module que está faltando
CREATE OR REPLACE FUNCTION public.user_can_access_module(module_name text, action_type text)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
AS $$
BEGIN
  -- Se é Super Admin, tem acesso total
  IF public.user_is_super_admin() THEN
    RETURN true;
  END IF;
  
  -- Verificar se o usuário tem permissão para o módulo e ação
  RETURN EXISTS (
    SELECT 1 
    FROM public.user_profiles up
    JOIN public.access_profiles ap ON up.profile_id = ap.id
    JOIN public.profile_module_permissions pmp ON ap.id = pmp.profile_id
    WHERE up.user_id = auth.uid()
    AND ap.is_active = true
    AND pmp.module_name::text = module_name
    AND (
      (action_type = 'view' AND pmp.can_view = true) OR
      (action_type = 'edit' AND pmp.can_edit = true) OR
      (action_type = 'delete' AND pmp.can_delete = true)
    )
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN false;
END;
$$;

-- Criar função user_is_restricted_to_linked que está faltando
CREATE OR REPLACE FUNCTION public.user_is_restricted_to_linked(module_name text)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
AS $$
BEGIN
  -- Se é Super Admin, não tem restrição
  IF public.user_is_super_admin() THEN
    RETURN false;
  END IF;
  
  -- Verificar se o usuário tem restrição para dados vinculados
  RETURN EXISTS (
    SELECT 1 
    FROM public.user_profiles up
    JOIN public.access_profiles ap ON up.profile_id = ap.id
    JOIN public.profile_module_permissions pmp ON ap.id = pmp.profile_id
    WHERE up.user_id = auth.uid()
    AND ap.is_active = true
    AND pmp.module_name::text = module_name
    AND pmp.restrict_to_linked = true
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN true; -- Em caso de erro, assumir restrição por segurança
END;
$$;

-- Atualizar a política de UPDATE para permitir que consultores atualizem projetos relacionados a eles
DROP POLICY IF EXISTS "Users can update projects based on access" ON public.projects;

CREATE POLICY "Users can update projects based on access" ON public.projects
FOR UPDATE
TO authenticated
USING (
  user_is_super_admin() 
  OR user_can_access_module('projects'::text, 'edit'::text)
  OR user_has_consultant_access(main_consultant_id)
  OR user_has_consultant_access(support_consultant_id)
  OR user_has_client_access(client_id)
);

-- Política específica para permitir que consultores manifestem interesse (transformem demands em projetos)
CREATE POLICY "Consultants can claim demands" ON public.projects
FOR UPDATE
TO authenticated
USING (
  main_consultant_id IS NULL 
  AND support_consultant_id IS NULL
  AND auth.uid() IS NOT NULL
);