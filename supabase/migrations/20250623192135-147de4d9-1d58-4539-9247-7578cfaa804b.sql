
-- Corrigir a função de criação automática de perfil de usuário
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

-- Atualizar a política RLS para permitir criação durante o signup
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

-- Política para permitir que usuários vejam seu próprio perfil ou admins vejam todos
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

-- Política para permitir que admins atualizem qualquer perfil
DROP POLICY IF EXISTS "Admins can update any profile" ON public.user_profiles;
CREATE POLICY "Admins can update any profile" 
ON public.user_profiles FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles up 
    WHERE up.id = auth.uid() AND up.role = 'admin'
  )
);

-- Função para criar usuário automaticamente para consultores
CREATE OR REPLACE FUNCTION public.create_consultant_user()
RETURNS TRIGGER AS $$
DECLARE
  user_password TEXT := 'consultor123'; -- Senha padrão
  auth_user_id UUID;
  permissions_to_create TEXT[] := ARRAY['dashboard', 'projects', 'demands', 'calendar'];
  permission_name TEXT;
BEGIN
  -- Criar usuário no Supabase Auth
  BEGIN
    -- Tentar criar o usuário usando a API administrativa
    -- Como não podemos fazer chamadas HTTP direto, vamos criar apenas o perfil
    -- O usuário será criado via código JavaScript
    
    -- Gerar UUID para o novo usuário
    auth_user_id := gen_random_uuid();
    
    -- Criar perfil do usuário
    INSERT INTO public.user_profiles (
      id,
      full_name,
      role,
      email,
      created_at,
      updated_at
    ) VALUES (
      auth_user_id,
      NEW.name,
      'consultant',
      NEW.email,
      NOW(),
      NOW()
    );
    
    -- Criar permissões para os módulos especificados
    FOREACH permission_name IN ARRAY permissions_to_create
    LOOP
      INSERT INTO public.module_permissions (
        user_id,
        module_name,
        can_view,
        can_edit,
        created_at,
        updated_at
      ) VALUES (
        auth_user_id,
        permission_name,
        true,
        false, -- Apenas visualização por padrão
        NOW(),
        NOW()
      );
    END LOOP;
    
  EXCEPTION WHEN OTHERS THEN
    -- Log do erro mas não falhar a criação do consultor
    RAISE NOTICE 'Erro ao criar usuário para consultor: %', SQLERRM;
  END;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para criar usuário quando consultor é criado
DROP TRIGGER IF EXISTS create_user_for_consultant ON public.consultants;
CREATE TRIGGER create_user_for_consultant
  AFTER INSERT ON public.consultants
  FOR EACH ROW 
  EXECUTE FUNCTION public.create_consultant_user();

-- Garantir que as políticas RLS estão habilitadas
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.module_permissions ENABLE ROW LEVEL SECURITY;

-- Política para module_permissions
DROP POLICY IF EXISTS "Users can view own permissions" ON public.module_permissions;
CREATE POLICY "Users can view own permissions" 
ON public.module_permissions FOR SELECT 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can manage all permissions" ON public.module_permissions;
CREATE POLICY "Admins can manage all permissions" 
ON public.module_permissions FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles up 
    WHERE up.id = auth.uid() AND up.role = 'admin'
  )
);
