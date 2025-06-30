
-- Adicionar a coluna restrict_to_linked na tabela profile_module_permissions
ALTER TABLE public.profile_module_permissions 
ADD COLUMN IF NOT EXISTS restrict_to_linked boolean NOT NULL DEFAULT false;
