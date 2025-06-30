
-- Fix the type casting issues in RLS policies
-- The problem is likely in the module_name comparison where we're comparing enum to text

-- First, let's fix the user_can_access_module function
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

-- Now let's recreate the other functions with proper error handling
CREATE OR REPLACE FUNCTION public.user_is_super_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  -- Verificar se o usuário tem perfil Super Admin
  RETURN EXISTS (
    SELECT 1 
    FROM public.user_profiles up
    JOIN public.access_profiles ap ON up.profile_id = ap.id
    WHERE up.user_id = auth.uid()
    AND ap.name = 'Super Admin'
    AND ap.is_active = true
  );
EXCEPTION
  WHEN OTHERS THEN
    -- Em caso de erro, retornar false para não bloquear o sistema
    RETURN false;
END;
$$;

-- Função para verificar se usuário tem acesso de consultor
CREATE OR REPLACE FUNCTION public.user_has_consultant_access(target_consultant_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  -- Se target_consultant_id é NULL, retornar false
  IF target_consultant_id IS NULL THEN
    RETURN false;
  END IF;
  
  -- Se é Super Admin, tem acesso total
  IF public.user_is_super_admin() THEN
    RETURN true;
  END IF;
  
  -- Verificar se o usuário está vinculado a este consultor
  RETURN EXISTS (
    SELECT 1 
    FROM public.user_consultant_links ucl
    WHERE ucl.user_id = auth.uid()
    AND ucl.consultant_id = target_consultant_id
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN false;
END;
$$;

-- Função para verificar se usuário tem acesso de cliente
CREATE OR REPLACE FUNCTION public.user_has_client_access(target_client_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  -- Se target_client_id é NULL, retornar false
  IF target_client_id IS NULL THEN
    RETURN false;
  END IF;
  
  -- Se é Super Admin, tem acesso total
  IF public.user_is_super_admin() THEN
    RETURN true;
  END IF;
  
  -- Verificar se o usuário está vinculado a este cliente
  RETURN EXISTS (
    SELECT 1 
    FROM public.user_client_links ucl
    WHERE ucl.user_id = auth.uid()
    AND ucl.client_id = target_client_id
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN false;
END;
$$;

-- Função para verificar se usuário tem um perfil específico
CREATE OR REPLACE FUNCTION public.user_has_profile(profile_name text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM public.user_profiles up
    JOIN public.access_profiles ap ON up.profile_id = ap.id
    WHERE up.user_id = auth.uid()
    AND ap.name = profile_name
    AND ap.is_active = true
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN false;
END;
$$;

-- Now let's create safer RLS policies for consultants
DROP POLICY IF EXISTS "Users can view consultants based on access" ON public.consultants;
DROP POLICY IF EXISTS "Users can update consultants based on access" ON public.consultants;
DROP POLICY IF EXISTS "Users can delete consultants based on access" ON public.consultants;
DROP POLICY IF EXISTS "Users can insert consultants based on access" ON public.consultants;

CREATE POLICY "Users can view consultants based on access"
ON public.consultants
FOR SELECT
TO authenticated
USING (
  public.user_is_super_admin() OR
  public.user_can_access_module('consultants', 'view') OR
  public.user_has_consultant_access(id)
);

CREATE POLICY "Users can update consultants based on access"
ON public.consultants
FOR UPDATE
TO authenticated
USING (
  public.user_is_super_admin() OR
  (public.user_can_access_module('consultants', 'edit') AND NOT public.user_has_consultant_access(id)) OR
  public.user_has_consultant_access(id)
);

CREATE POLICY "Users can delete consultants based on access"
ON public.consultants
FOR DELETE
TO authenticated
USING (
  public.user_is_super_admin() OR
  public.user_can_access_module('consultants', 'delete')
);

CREATE POLICY "Users can insert consultants based on access"
ON public.consultants
FOR INSERT
TO authenticated
WITH CHECK (
  public.user_is_super_admin() OR
  public.user_can_access_module('consultants', 'edit')
);

-- RLS policies for clients
DROP POLICY IF EXISTS "Users can view clients based on access" ON public.clients;
DROP POLICY IF EXISTS "Users can update clients based on access" ON public.clients;
DROP POLICY IF EXISTS "Users can delete clients based on access" ON public.clients;
DROP POLICY IF EXISTS "Users can insert clients based on access" ON public.clients;

CREATE POLICY "Users can view clients based on access"
ON public.clients
FOR SELECT
TO authenticated
USING (
  public.user_is_super_admin() OR
  public.user_can_access_module('clients', 'view') OR
  public.user_has_client_access(id)
);

CREATE POLICY "Users can update clients based on access"
ON public.clients
FOR UPDATE
TO authenticated
USING (
  public.user_is_super_admin() OR
  (public.user_can_access_module('clients', 'edit') AND NOT public.user_has_client_access(id)) OR
  public.user_has_client_access(id)
);

CREATE POLICY "Users can delete clients based on access"
ON public.clients
FOR DELETE
TO authenticated
USING (
  public.user_is_super_admin() OR
  public.user_can_access_module('clients', 'delete')
);

CREATE POLICY "Users can insert clients based on access"
ON public.clients
FOR INSERT
TO authenticated
WITH CHECK (
  public.user_is_super_admin() OR
  public.user_can_access_module('clients', 'edit')
);

-- Enable RLS on tables if not already enabled
ALTER TABLE public.consultants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

-- Grant permissions to functions
GRANT EXECUTE ON FUNCTION public.user_is_super_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.user_has_consultant_access(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.user_has_client_access(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.user_has_profile(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.user_can_access_module(text, text) TO authenticated;

-- Log da correção
INSERT INTO public.system_logs (log_type, category, message, details)
VALUES (
  'info', 
  'rls_policies_fix_v2', 
  'Políticas RLS corrigidas com tratamento de tipos e valores NULL',
  jsonb_build_object(
    'timestamp', NOW(),
    'action', 'rls_policies_correction_v2',
    'functions_updated', 5,
    'policies_updated', 8,
    'tables_secured', ARRAY['consultants', 'clients']
  )
);
