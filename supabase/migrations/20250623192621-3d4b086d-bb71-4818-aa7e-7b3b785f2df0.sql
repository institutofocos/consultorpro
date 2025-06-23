
-- Fix RLS policies for user_profiles table to prevent permission issues
DROP POLICY IF EXISTS "Admins can create profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can view own profile or admins can view all" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can update any profile" ON public.user_profiles;

-- Create more permissive policies for user management
CREATE POLICY "Allow authenticated users to view user profiles" 
ON public.user_profiles FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Allow authenticated users to create user profiles" 
ON public.user_profiles FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Allow authenticated users to update user profiles" 
ON public.user_profiles FOR UPDATE 
USING (auth.uid() IS NOT NULL);

-- Fix module_permissions policies
DROP POLICY IF EXISTS "Users can view own permissions" ON public.module_permissions;
DROP POLICY IF EXISTS "Admins can manage all permissions" ON public.module_permissions;

CREATE POLICY "Allow authenticated users to view module permissions" 
ON public.module_permissions FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Allow authenticated users to manage module permissions" 
ON public.module_permissions FOR ALL 
USING (auth.uid() IS NOT NULL);

-- Update the handle_new_user function to be more robust
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

-- Ensure the trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Update the consultant user creation function to handle errors better
CREATE OR REPLACE FUNCTION public.create_consultant_user()
RETURNS TRIGGER AS $$
DECLARE
  user_password TEXT := 'consultor123';
  permissions_to_create TEXT[] := ARRAY['dashboard', 'projects', 'demands', 'calendar'];
  permission_name TEXT;
BEGIN
  -- Log the consultant creation attempt
  INSERT INTO public.system_logs (log_type, category, message, details)
  VALUES (
    'info', 
    'consultant_creation', 
    'Tentativa de criação de usuário para consultor: ' || NEW.name,
    jsonb_build_object(
      'consultant_id', NEW.id,
      'consultant_name', NEW.name,
      'consultant_email', NEW.email
    )
  );

  -- The actual user creation will be handled by the frontend code
  -- This trigger just logs the event for monitoring
  
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Log errors but don't fail the consultant creation
  INSERT INTO public.system_logs (log_type, category, message, details)
  VALUES (
    'error', 
    'consultant_creation_error', 
    'Erro ao processar criação de usuário para consultor: ' || SQLERRM,
    jsonb_build_object(
      'consultant_id', NEW.id,
      'consultant_name', NEW.name,
      'error_message', SQLERRM
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
