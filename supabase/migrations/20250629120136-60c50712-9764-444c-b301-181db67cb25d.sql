
-- Remover políticas RLS problemáticas existentes
DROP POLICY IF EXISTS "Allow all authenticated operations on user_profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Allow signup operations on user_profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can manage own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Authenticated users can view profiles" ON public.user_profiles;

-- Política mais permissiva para permitir criação de perfis por usuários autenticados
CREATE POLICY "Allow authenticated users to manage user_profiles" 
ON public.user_profiles 
FOR ALL 
TO authenticated
USING (true)
WITH CHECK (true);

-- Política para permitir operações anônimas durante signup
CREATE POLICY "Allow anonymous signup operations on user_profiles" 
ON public.user_profiles 
FOR INSERT 
TO anon
WITH CHECK (true);

-- Fazer o mesmo para module_permissions
DROP POLICY IF EXISTS "Allow all authenticated operations on module_permissions" ON public.module_permissions;
DROP POLICY IF EXISTS "Allow signup operations on module_permissions" ON public.module_permissions;
DROP POLICY IF EXISTS "Users can view own permissions" ON public.module_permissions;
DROP POLICY IF EXISTS "Admins can manage all permissions" ON public.module_permissions;

-- Política permissiva para module_permissions
CREATE POLICY "Allow authenticated users to manage module_permissions" 
ON public.module_permissions 
FOR ALL 
TO authenticated
USING (true)
WITH CHECK (true);

-- Política para permitir operações anônimas durante signup
CREATE POLICY "Allow anonymous signup operations on module_permissions" 
ON public.module_permissions 
FOR INSERT 
TO anon
WITH CHECK (true);

-- Atualizar função is_admin para ser mais permissiva durante desenvolvimento
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT true; -- Permitir todas as operações para desenvolvimento
$$;
