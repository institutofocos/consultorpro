
-- Verificar e atualizar a tabela user_profiles para sincronizar com o sistema
-- Adicionar campos que podem estar faltando e garantir consistência

-- Primeiro, vamos garantir que a tabela user_profiles tenha todos os campos necessários
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS username text,
ADD COLUMN IF NOT EXISTS password_hash text;

-- Atualizar a tabela module_permissions para garantir timestamps consistentes
ALTER TABLE public.module_permissions 
ADD COLUMN IF NOT EXISTS created_at timestamp with time zone DEFAULT now(),
ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now();

-- Criar trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_module_permissions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar o trigger se não existir
DROP TRIGGER IF EXISTS update_module_permissions_updated_at_trigger ON public.module_permissions;
CREATE TRIGGER update_module_permissions_updated_at_trigger
    BEFORE UPDATE ON public.module_permissions
    FOR EACH ROW
    EXECUTE FUNCTION update_module_permissions_updated_at();

-- Criar trigger para atualizar updated_at em user_profiles
DROP TRIGGER IF EXISTS update_user_profiles_updated_at_trigger ON public.user_profiles;
CREATE TRIGGER update_user_profiles_updated_at_trigger
    BEFORE UPDATE ON public.user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Garantir que existam índices para performance nas consultas de autenticação
CREATE INDEX IF NOT EXISTS idx_user_profiles_username ON public.user_profiles(username);
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON public.user_profiles(role);
CREATE INDEX IF NOT EXISTS idx_module_permissions_user_id ON public.module_permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_module_permissions_module_name ON public.module_permissions(module_name);

-- Criar políticas RLS para user_profiles se não existirem
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Política para usuários verem apenas seu próprio perfil (ou admins verem todos)
DROP POLICY IF EXISTS "Users can view own profile or admins can view all" ON public.user_profiles;
CREATE POLICY "Users can view own profile or admins can view all" 
ON public.user_profiles FOR SELECT 
USING (
  auth.uid() = id OR 
  EXISTS (
    SELECT 1 FROM public.user_profiles up 
    WHERE up.id = auth.uid() AND up.role = 'admin'
  )
);

-- Política para admins poderem atualizar qualquer perfil
DROP POLICY IF EXISTS "Admins can update any profile" ON public.user_profiles;
CREATE POLICY "Admins can update any profile" 
ON public.user_profiles FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles up 
    WHERE up.id = auth.uid() AND up.role = 'admin'
  )
);

-- Política para criação de novos perfis (apenas admins)
DROP POLICY IF EXISTS "Admins can create profiles" ON public.user_profiles;
CREATE POLICY "Admins can create profiles" 
ON public.user_profiles FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_profiles up 
    WHERE up.id = auth.uid() AND up.role = 'admin'
  )
);

-- Criar políticas RLS para module_permissions
ALTER TABLE public.module_permissions ENABLE ROW LEVEL SECURITY;

-- Política para usuários verem suas próprias permissões
DROP POLICY IF EXISTS "Users can view own permissions" ON public.module_permissions;
CREATE POLICY "Users can view own permissions" 
ON public.module_permissions FOR SELECT 
USING (auth.uid() = user_id);

-- Política para admins gerenciarem todas as permissões
DROP POLICY IF EXISTS "Admins can manage all permissions" ON public.module_permissions;
CREATE POLICY "Admins can manage all permissions" 
ON public.module_permissions FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles up 
    WHERE up.id = auth.uid() AND up.role = 'admin'
  )
);

-- Inserir módulos padrão do sistema se não existirem na tabela de configurações
INSERT INTO public.system_settings (setting_key, setting_value, description) 
VALUES 
  ('system_modules', '["dashboard", "consultants", "clients", "projects", "services", "demands", "calendar", "financial", "settings"]', 'Lista de módulos disponíveis no sistema'),
  ('default_user_role', 'client', 'Papel padrão para novos usuários'),
  ('require_email_verification', 'false', 'Requer verificação de email para novos usuários')
ON CONFLICT (setting_key) DO NOTHING;

-- Garantir que existam alguns usuários administradores padrão para o sistema funcionar
-- Isso será útil quando a tela de login for implementada
INSERT INTO public.user_profiles (id, full_name, role, username, is_active, user_type)
SELECT 
  gen_random_uuid(),
  'Administrador Sistema',
  'admin',
  'admin',
  true,
  'admin'
WHERE NOT EXISTS (
  SELECT 1 FROM public.user_profiles WHERE role = 'admin'
);
