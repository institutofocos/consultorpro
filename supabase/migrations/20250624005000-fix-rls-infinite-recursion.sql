
-- Remover todas as políticas RLS problemáticas que podem causar recursão infinita
DROP POLICY IF EXISTS "Users can view own profile or admins can view all" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can update any profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can create profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can manage all permissions" ON public.module_permissions;

-- Criar função SECURITY DEFINER para verificar se um usuário é admin
-- Isso evita recursão porque não faz consulta na tabela protegida por RLS
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM auth.users 
    WHERE id = auth.uid() 
    AND email IN (
      'contato@eron.dev.br',
      'augusto.andrademelo@gmail.com', 
      'pedroaugusto.andrademelo@gmail.com'
    )
  );
$$;

-- Função para verificar se é o próprio usuário
CREATE OR REPLACE FUNCTION public.is_own_profile(profile_user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT auth.uid() = profile_user_id;
$$;

-- Política simplificada para user_profiles - permitir visualização para usuários autenticados
CREATE POLICY "Authenticated users can view profiles" 
ON public.user_profiles 
FOR SELECT 
TO authenticated
USING (true);

-- Política para permitir que usuários vejam e editem seu próprio perfil
CREATE POLICY "Users can manage own profile" 
ON public.user_profiles 
FOR ALL 
TO authenticated
USING (public.is_own_profile(id))
WITH CHECK (public.is_own_profile(id));

-- Política para admins gerenciarem todos os perfis
CREATE POLICY "Admins can manage all profiles" 
ON public.user_profiles 
FOR ALL 
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Política para permitir inserção durante signup (anon)
CREATE POLICY "Allow profile creation during signup" 
ON public.user_profiles 
FOR INSERT 
TO anon
WITH CHECK (true);

-- Política simplificada para module_permissions
CREATE POLICY "Users can view own permissions" 
ON public.module_permissions 
FOR SELECT 
TO authenticated
USING (public.is_own_profile(user_id));

CREATE POLICY "Admins can manage all permissions" 
ON public.module_permissions 
FOR ALL 
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Política para permitir inserção de permissões durante signup
CREATE POLICY "Allow permissions creation during signup" 
ON public.module_permissions 
FOR INSERT 
TO anon
WITH CHECK (true);

-- Atualizar a função handle_new_user para ser mais robusta
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Inserir perfil do usuário
  INSERT INTO public.user_profiles (
    id, 
    full_name, 
    role, 
    email,
    created_at,
    updated_at,
    is_active
  )
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Novo Usuário'), 
    COALESCE(NEW.raw_user_meta_data->>'role', 'client'),
    NEW.email,
    NOW(),
    NOW(),
    true
  ) ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role,
    email = EXCLUDED.email,
    updated_at = NOW();
    
  RETURN NEW;
EXCEPTION 
  WHEN OTHERS THEN
    -- Log do erro mas não falha o processo de criação do usuário
    INSERT INTO public.system_logs (log_type, category, message, details)
    VALUES (
      'error', 
      'user_profile_creation', 
      'Erro ao criar perfil de usuário: ' || SQLERRM,
      jsonb_build_object('user_id', NEW.id, 'error', SQLERRM)
    );
    RETURN NEW;
END;
$$;

-- Garantir que o trigger existe
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
