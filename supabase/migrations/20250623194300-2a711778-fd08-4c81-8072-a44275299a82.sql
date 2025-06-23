
-- Remover todas as políticas existentes que podem estar causando conflitos
DROP POLICY IF EXISTS "Allow service role full access to user profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Allow service role full access to module permissions" ON public.module_permissions;
DROP POLICY IF EXISTS "Allow authenticated users to view user profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Allow authenticated users to create user profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Allow authenticated users to update user profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Allow authenticated users to view module permissions" ON public.module_permissions;
DROP POLICY IF EXISTS "Allow authenticated users to manage module permissions" ON public.module_permissions;

-- Desabilitar temporariamente RLS para permitir operações administrativas
ALTER TABLE public.user_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.module_permissions DISABLE ROW LEVEL SECURITY;

-- Criar políticas mais permissivas para operações administrativas
-- Reabilitar RLS com políticas simplificadas
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.module_permissions ENABLE ROW LEVEL SECURITY;

-- Política que permite operações para usuários autenticados
CREATE POLICY "Allow authenticated operations on user profiles" 
ON public.user_profiles 
FOR ALL 
TO authenticated
USING (true)
WITH CHECK (true);

-- Política que permite operações para usuários autenticados em permissões
CREATE POLICY "Allow authenticated operations on module permissions" 
ON public.module_permissions 
FOR ALL 
TO authenticated
USING (true)
WITH CHECK (true);

-- Política que permite operações para anon (durante signup)
CREATE POLICY "Allow anon operations on user profiles" 
ON public.user_profiles 
FOR ALL 
TO anon
USING (true)
WITH CHECK (true);

-- Política que permite operações para anon em permissões
CREATE POLICY "Allow anon operations on module permissions" 
ON public.module_permissions 
FOR ALL 
TO anon
USING (true)
WITH CHECK (true);

-- Atualizar função para ser mais robusta
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
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
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Garantir que o trigger existe
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
