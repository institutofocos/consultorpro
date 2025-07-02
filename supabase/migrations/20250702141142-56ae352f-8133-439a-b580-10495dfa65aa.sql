
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

-- Create the missing get_chat_rooms_with_details function
CREATE OR REPLACE FUNCTION get_chat_rooms_with_details()
RETURNS TABLE (
  room_id uuid,
  project_id uuid,
  stage_id uuid,
  room_type text,
  is_active boolean,
  project_name text,
  stage_name text,
  client_name text,
  created_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    cr.id as room_id,
    cr.project_id,
    cr.stage_id,
    cr.room_type,
    cr.is_active,
    p.name as project_name,
    ps.name as stage_name,
    c.name as client_name,
    cr.created_at
  FROM chat_rooms cr
  JOIN projects p ON cr.project_id = p.id
  LEFT JOIN project_stages ps ON cr.stage_id = ps.id
  LEFT JOIN clients c ON p.client_id = c.id
  WHERE cr.is_active = true
  AND (
    user_is_super_admin() OR
    user_can_access_module('chat', 'view') OR
    EXISTS (
      SELECT 1 FROM projects proj 
      WHERE proj.id = cr.project_id 
      AND (
        user_has_consultant_access(proj.main_consultant_id) OR
        user_has_consultant_access(proj.support_consultant_id) OR
        user_has_client_access(proj.client_id)
      )
    )
  )
  ORDER BY p.name, ps.stage_order;
END;
$$;

-- Verificar se as salas de chat existem
SELECT 
  cr.id,
  cr.project_id,
  cr.stage_id,
  cr.room_type,
  cr.is_active,
  p.name as project_name,
  ps.name as stage_name
FROM chat_rooms cr
JOIN projects p ON cr.project_id = p.id
LEFT JOIN project_stages ps ON cr.stage_id = ps.id
ORDER BY cr.created_at DESC;

-- Verificar se os triggers estão funcionando
SELECT 
  COUNT(*) as total_projects,
  (SELECT COUNT(*) FROM chat_rooms WHERE room_type = 'project') as project_rooms,
  (SELECT COUNT(*) FROM project_stages) as total_stages,
  (SELECT COUNT(*) FROM chat_rooms WHERE room_type = 'stage') as stage_rooms;

-- Criar as salas de chat para projetos existentes se não existirem
INSERT INTO chat_rooms (project_id, room_type, is_active)
SELECT p.id, 'project', true
FROM projects p
WHERE NOT EXISTS (
  SELECT 1 FROM chat_rooms cr 
  WHERE cr.project_id = p.id AND cr.room_type = 'project'
);

-- Criar as salas de chat para etapas existentes se não existirem
INSERT INTO chat_rooms (project_id, stage_id, room_type, is_active)
SELECT ps.project_id, ps.id, 'stage', true
FROM project_stages ps
WHERE NOT EXISTS (
  SELECT 1 FROM chat_rooms cr 
  WHERE cr.stage_id = ps.id AND cr.room_type = 'stage'
);

-- Atualizar a política RLS para permitir acesso baseado em projetos
DROP POLICY IF EXISTS "Users can view chat rooms they have access to" ON chat_rooms;
DROP POLICY IF EXISTS "Users can view project/stage chat rooms based on access" ON chat_rooms;

CREATE POLICY "Users can view chat rooms based on project access"
ON chat_rooms FOR SELECT
USING (
  user_is_super_admin() OR
  EXISTS (
    SELECT 1 FROM projects p 
    WHERE p.id = project_id 
    AND (
      user_has_consultant_access(p.main_consultant_id) OR
      user_has_consultant_access(p.support_consultant_id) OR
      user_has_client_access(p.client_id) OR
      user_can_access_module('chat', 'view')
    )
  )
);
