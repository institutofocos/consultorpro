
-- Adicionar 'chat' ao enum module_type
ALTER TYPE public.module_type ADD VALUE 'chat';

-- Sincronizar permissões do Super Admin para incluir o novo módulo chat
SELECT public.sync_super_admin_permissions();

-- Adicionar permissões de chat para os perfis existentes
-- Admin: acesso total exceto settings
INSERT INTO public.profile_module_permissions (profile_id, module_name, can_view, can_edit, can_delete, restrict_to_linked)
SELECT 
  ap.id,
  'chat'::module_type,
  true,
  true,
  true,
  false
FROM public.access_profiles ap
WHERE ap.name = 'Admin'
ON CONFLICT (profile_id, module_name) DO NOTHING;

-- Gestor: acesso total
INSERT INTO public.profile_module_permissions (profile_id, module_name, can_view, can_edit, can_delete, restrict_to_linked)
SELECT 
  ap.id,
  'chat'::module_type,
  true,
  true,
  true,
  false
FROM public.access_profiles ap
WHERE ap.name = 'Gestor'
ON CONFLICT (profile_id, module_name) DO NOTHING;

-- Consultor: apenas visualização com restrição a vinculados
INSERT INTO public.profile_module_permissions (profile_id, module_name, can_view, can_edit, can_delete, restrict_to_linked)
SELECT 
  ap.id,
  'chat'::module_type,
  true,
  false,
  false,
  true
FROM public.access_profiles ap
WHERE ap.name = 'Consultor'
ON CONFLICT (profile_id, module_name) DO NOTHING;
