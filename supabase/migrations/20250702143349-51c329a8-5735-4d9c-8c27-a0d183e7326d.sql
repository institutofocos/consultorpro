
-- First, let's check if the module_type enum includes 'chat'
DO $$
BEGIN
    -- Try to add 'chat' to the module_type enum if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'chat' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'module_type')
    ) THEN
        ALTER TYPE module_type ADD VALUE 'chat';
    END IF;
END $$;

-- Create the user_can_access_module function if it doesn't exist
CREATE OR REPLACE FUNCTION public.user_can_access_module(module_name text, action_type text DEFAULT 'view')
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
AS $$
BEGIN
  -- Se é Super Admin, tem acesso total
  IF public.user_is_super_admin() THEN
    RETURN true;
  END IF;
  
  -- Verificar se o usuário tem permissão específica para este módulo
  RETURN EXISTS (
    SELECT 1 
    FROM public.user_profiles up
    JOIN public.profile_module_permissions pmp ON up.profile_id = pmp.profile_id
    WHERE up.user_id = auth.uid()
    AND pmp.module_name::text = module_name
    AND (
      (action_type = 'view' AND pmp.can_view = true) OR
      (action_type = 'edit' AND pmp.can_edit = true) OR
      (action_type = 'delete' AND pmp.can_delete = true)
    )
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN false;
END;
$$;

-- Fix the chat_room_participants RLS policies to avoid infinite recursion
DROP POLICY IF EXISTS "System can manage chat room participants" ON chat_room_participants;
DROP POLICY IF EXISTS "Users can view chat room participants" ON chat_room_participants;
DROP POLICY IF EXISTS "Users can manage chat room participants" ON chat_room_participants;

-- Simple policies for chat_room_participants
CREATE POLICY "Users can view participants in rooms they have access to"
ON chat_room_participants FOR SELECT
USING (
  user_is_super_admin() OR
  EXISTS (
    SELECT 1 FROM chat_rooms cr
    JOIN projects p ON cr.project_id = p.id
    WHERE cr.id = room_id
    AND (
      user_has_consultant_access(p.main_consultant_id) OR
      user_has_consultant_access(p.support_consultant_id) OR
      user_has_client_access(p.client_id)
    )
  )
);

CREATE POLICY "Users can join rooms they have access to"
ON chat_room_participants FOR INSERT
WITH CHECK (
  auth.uid() = user_id AND (
    user_is_super_admin() OR
    EXISTS (
      SELECT 1 FROM chat_rooms cr
      JOIN projects p ON cr.project_id = p.id
      WHERE cr.id = room_id
      AND (
        user_has_consultant_access(p.main_consultant_id) OR
        user_has_consultant_access(p.support_consultant_id) OR
        user_has_client_access(p.client_id)
      )
    )
  )
);
