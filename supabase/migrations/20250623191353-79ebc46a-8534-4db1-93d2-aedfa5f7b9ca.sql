
-- Verificar e corrigir a estrutura da tabela user_profiles
-- Garantir que todos os campos necessários existam e estejam configurados corretamente

-- Atualizar a tabela user_profiles para garantir consistência
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS email text,
ADD COLUMN IF NOT EXISTS phone text;

-- Criar índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON public.user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_phone ON public.user_profiles(phone);

-- Atualizar as políticas RLS para permitir que admins criem usuários corretamente
DROP POLICY IF EXISTS "Admins can create profiles" ON public.user_profiles;
CREATE POLICY "Admins can create profiles" 
ON public.user_profiles FOR INSERT 
WITH CHECK (
  -- Permitir inserção durante o processo de signup do Supabase Auth
  auth.uid() IS NULL OR
  EXISTS (
    SELECT 1 FROM public.user_profiles up 
    WHERE up.id = auth.uid() AND up.role = 'admin'
  )
);

-- Função para criar perfil de usuário automaticamente
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (
    id, 
    full_name, 
    role, 
    email,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Novo Usuário'), 
    COALESCE(NEW.raw_user_meta_data->>'role', 'client'),
    NEW.email,
    NOW(),
    NOW()
  ) ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role,
    email = EXCLUDED.email,
    updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recriar trigger para usuários novos
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
