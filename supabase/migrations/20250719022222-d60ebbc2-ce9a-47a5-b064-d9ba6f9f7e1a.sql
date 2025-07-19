-- Atualizar permissões do perfil "Consultor" para restringir aos dados vinculados
UPDATE public.profile_module_permissions 
SET restrict_to_linked = true
WHERE profile_id = (
  SELECT id FROM public.access_profiles 
  WHERE name = 'Consultor' AND is_active = true
) 
AND module_name = 'projects';

-- Remover políticas problemáticas e criar políticas mais específicas
DROP POLICY IF EXISTS "Users can view projects based on access" ON public.projects;
DROP POLICY IF EXISTS "Consultants can view assigned projects" ON public.projects;
DROP POLICY IF EXISTS "All authenticated users can view demands" ON public.projects;

-- Política principal que usa a função user_has_project_access (que já considera as restrições)
CREATE POLICY "Unified project access policy" 
ON public.projects 
FOR SELECT 
USING (user_has_project_access(id));

-- Log da alteração
INSERT INTO public.system_logs (log_type, category, message, details)
VALUES (
  'info', 
  'rls_update', 
  'Políticas de projetos atualizadas para restringir consultores aos dados vinculados',
  jsonb_build_object(
    'updated_at', NOW(),
    'change_type', 'consultant_access_restriction',
    'affected_table', 'projects'
  )
);