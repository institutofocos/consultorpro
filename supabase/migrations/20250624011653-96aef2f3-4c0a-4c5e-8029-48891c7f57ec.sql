
-- Limpar dados existentes de usuários
DELETE FROM public.module_permissions;
DELETE FROM public.user_profiles;

-- Recriar a tabela user_profiles com a estrutura correta
DROP TABLE IF EXISTS public.user_profiles CASCADE;
DROP TABLE IF EXISTS public.module_permissions CASCADE;

-- Criar tabela de perfis de usuário
CREATE TABLE public.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  role TEXT NOT NULL CHECK (role IN ('admin', 'consultant', 'manager', 'financial', 'client')),
  is_active BOOLEAN DEFAULT true,
  email_confirmed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login TIMESTAMP WITH TIME ZONE
);

-- Criar tabela de permissões de módulos
CREATE TABLE public.module_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  module_name TEXT NOT NULL CHECK (module_name IN ('dashboard', 'consultants', 'clients', 'projects', 'services', 'demands', 'calendar', 'financial', 'settings')),
  can_view BOOLEAN DEFAULT false,
  can_edit BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, module_name)
);

-- Habilitar RLS nas tabelas
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.module_permissions ENABLE ROW LEVEL SECURITY;

-- Políticas RLS simplificadas para user_profiles
CREATE POLICY "Allow all authenticated operations on user_profiles" 
ON public.user_profiles 
FOR ALL 
TO authenticated
USING (true)
WITH CHECK (true);

-- Políticas RLS simplificadas para module_permissions
CREATE POLICY "Allow all authenticated operations on module_permissions" 
ON public.module_permissions 
FOR ALL 
TO authenticated
USING (true)
WITH CHECK (true);

-- Função para criar perfil automaticamente quando usuário se registra
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
    email,
    role,
    is_active,
    email_confirmed,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Novo Usuário'), 
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'client'),
    true,
    NEW.email_confirmed_at IS NOT NULL,
    NOW(),
    NOW()
  ) ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    email = EXCLUDED.email,
    role = EXCLUDED.role,
    email_confirmed = NEW.email_confirmed_at IS NOT NULL,
    updated_at = NOW();
    
  RETURN NEW;
EXCEPTION 
  WHEN OTHERS THEN
    -- Log erro mas não falha a criação do usuário
    INSERT INTO public.system_logs (log_type, category, message, details)
    VALUES (
      'error', 
      'user_profile_creation', 
      'Erro ao criar perfil: ' || SQLERRM,
      jsonb_build_object('user_id', NEW.id, 'error', SQLERRM)
    );
    RETURN NEW;
END;
$$;

-- Recriar trigger para usuários novos
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_module_permissions_updated_at
  BEFORE UPDATE ON public.module_permissions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Índices para performance
CREATE INDEX idx_user_profiles_email ON public.user_profiles(email);
CREATE INDEX idx_user_profiles_role ON public.user_profiles(role);
CREATE INDEX idx_module_permissions_user_id ON public.module_permissions(user_id);
CREATE INDEX idx_module_permissions_module_name ON public.module_permissions(module_name);
