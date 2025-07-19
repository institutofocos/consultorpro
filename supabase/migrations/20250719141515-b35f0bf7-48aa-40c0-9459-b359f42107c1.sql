-- Criar função para automaticamente criar consultor/cliente quando perfil é atribuído
CREATE OR REPLACE FUNCTION public.handle_profile_assignment()
RETURNS TRIGGER AS $$
DECLARE
  profile_name TEXT;
  user_email TEXT;
  user_id UUID;
BEGIN
  -- Buscar o nome do perfil
  SELECT name INTO profile_name 
  FROM public.access_profiles 
  WHERE id = NEW.profile_id;
  
  -- Buscar o email do usuário
  SELECT email INTO user_email 
  FROM auth.users 
  WHERE id = NEW.user_id;
  
  user_id := NEW.user_id;
  
  -- Se o perfil for Consultor, criar registro na tabela consultants
  IF profile_name = 'Consultor' THEN
    INSERT INTO public.consultants (
      id,
      name,
      email,
      commission_percentage,
      hours_per_month,
      created_at,
      updated_at
    ) VALUES (
      user_id,
      COALESCE(user_email, 'Novo Consultor'),
      user_email,
      0,
      160,
      NOW(),
      NOW()
    ) ON CONFLICT (id) DO NOTHING;
    
    -- Log da criação
    INSERT INTO public.system_logs (log_type, category, message, details)
    VALUES (
      'info', 
      'user_profile_assignment', 
      'Consultor criado automaticamente via atribuição de perfil',
      jsonb_build_object(
        'user_id', user_id,
        'email', user_email,
        'profile_name', profile_name,
        'created_at', NOW()
      )
    );
  END IF;
  
  -- Se o perfil for Cliente, criar registro na tabela clients
  IF profile_name = 'Cliente' THEN
    INSERT INTO public.clients (
      id,
      name,
      contact_name,
      email,
      created_at
    ) VALUES (
      user_id,
      COALESCE(user_email, 'Novo Cliente'),
      COALESCE(user_email, 'Novo Cliente'),
      user_email,
      NOW()
    ) ON CONFLICT (id) DO NOTHING;
    
    -- Log da criação
    INSERT INTO public.system_logs (log_type, category, message, details)
    VALUES (
      'info', 
      'user_profile_assignment', 
      'Cliente criado automaticamente via atribuição de perfil',
      jsonb_build_object(
        'user_id', user_id,
        'email', user_email,
        'profile_name', profile_name,
        'created_at', NOW()
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Criar trigger para executar após inserção ou atualização na tabela user_profiles
DROP TRIGGER IF EXISTS trigger_handle_profile_assignment ON public.user_profiles;
CREATE TRIGGER trigger_handle_profile_assignment
  AFTER INSERT OR UPDATE ON public.user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_profile_assignment();

-- Função para remover automaticamente consultor/cliente quando perfil é removido
CREATE OR REPLACE FUNCTION public.handle_profile_removal()
RETURNS TRIGGER AS $$
DECLARE
  profile_name TEXT;
BEGIN
  -- Buscar o nome do perfil que foi removido
  SELECT name INTO profile_name 
  FROM public.access_profiles 
  WHERE id = OLD.profile_id;
  
  -- Se o perfil era Consultor, remover da tabela consultants
  IF profile_name = 'Consultor' THEN
    DELETE FROM public.consultants WHERE id = OLD.user_id;
    
    -- Log da remoção
    INSERT INTO public.system_logs (log_type, category, message, details)
    VALUES (
      'info', 
      'user_profile_removal', 
      'Consultor removido automaticamente via remoção de perfil',
      jsonb_build_object(
        'user_id', OLD.user_id,
        'profile_name', profile_name,
        'removed_at', NOW()
      )
    );
  END IF;
  
  -- Se o perfil era Cliente, remover da tabela clients
  IF profile_name = 'Cliente' THEN
    DELETE FROM public.clients WHERE id = OLD.user_id;
    
    -- Log da remoção
    INSERT INTO public.system_logs (log_type, category, message, details)
    VALUES (
      'info', 
      'user_profile_removal', 
      'Cliente removido automaticamente via remoção de perfil',
      jsonb_build_object(
        'user_id', OLD.user_id,
        'profile_name', profile_name,
        'removed_at', NOW()
      )
    );
  END IF;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Criar trigger para executar antes da remoção na tabela user_profiles
DROP TRIGGER IF EXISTS trigger_handle_profile_removal ON public.user_profiles;
CREATE TRIGGER trigger_handle_profile_removal
  BEFORE DELETE ON public.user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_profile_removal();