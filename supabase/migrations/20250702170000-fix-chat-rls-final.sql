
-- Fix the infinite recursion issues in chat_room_participants policies
DROP POLICY IF EXISTS "Users can view chat room participants" ON chat_room_participants;
DROP POLICY IF EXISTS "Users can manage their own participation" ON chat_room_participants;
DROP POLICY IF EXISTS "Super admins can manage all participants" ON chat_room_participants;

-- Create non-recursive policies for chat_room_participants
CREATE POLICY "Users can view participants in accessible rooms"
ON chat_room_participants FOR SELECT
USING (
  user_is_super_admin() OR
  auth.uid() = user_id OR
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

CREATE POLICY "Users can join accessible rooms"
ON chat_room_participants FOR INSERT
WITH CHECK (
  user_is_super_admin() OR
  (auth.uid() = user_id AND EXISTS (
    SELECT 1 FROM chat_rooms cr
    JOIN projects p ON cr.project_id = p.id
    WHERE cr.id = room_id
    AND (
      user_has_consultant_access(p.main_consultant_id) OR
      user_has_consultant_access(p.support_consultant_id) OR
      user_has_client_access(p.client_id)
    )
  ))
);

CREATE POLICY "Users can manage their own participation"
ON chat_room_participants FOR UPDATE
USING (auth.uid() = user_id OR user_is_super_admin());

CREATE POLICY "Users can leave rooms"
ON chat_room_participants FOR DELETE
USING (auth.uid() = user_id OR user_is_super_admin());

-- Fix chat_rooms policies to avoid recursion
DROP POLICY IF EXISTS "Users can view chat rooms they have access to" ON chat_rooms;
DROP POLICY IF EXISTS "Users can view chat rooms based on project access" ON chat_rooms;

CREATE POLICY "Users can view accessible chat rooms"
ON chat_rooms FOR SELECT
USING (
  user_is_super_admin() OR
  EXISTS (
    SELECT 1 FROM projects p 
    WHERE p.id = project_id 
    AND (
      user_has_consultant_access(p.main_consultant_id) OR
      user_has_consultant_access(p.support_consultant_id) OR
      user_has_client_access(p.client_id)
    )
  )
);

-- Create chat rooms for existing projects and stages
INSERT INTO chat_rooms (project_id, room_type, is_active)
SELECT p.id, 'project', true
FROM projects p
WHERE NOT EXISTS (
  SELECT 1 FROM chat_rooms cr 
  WHERE cr.project_id = p.id AND cr.room_type = 'project'
);

INSERT INTO chat_rooms (project_id, stage_id, room_type, is_active)
SELECT ps.project_id, ps.id, 'stage', true
FROM project_stages ps
WHERE NOT EXISTS (
  SELECT 1 FROM chat_rooms cr 
  WHERE cr.stage_id = ps.id AND cr.room_type = 'stage'
);

-- Add participants to chat rooms automatically
DO $$
DECLARE
  room_record RECORD;
  project_record RECORD;
  consultant_user_id uuid;
  support_user_id uuid;
  client_user_id uuid;
BEGIN
  FOR room_record IN 
    SELECT cr.id as room_id, cr.project_id
    FROM chat_rooms cr
    WHERE cr.is_active = true
  LOOP
    SELECT * INTO project_record 
    FROM projects 
    WHERE id = room_record.project_id;
    
    -- Add main consultant
    IF project_record.main_consultant_id IS NOT NULL THEN
      SELECT user_id INTO consultant_user_id
      FROM user_consultant_links
      WHERE consultant_id = project_record.main_consultant_id
      LIMIT 1;
      
      IF consultant_user_id IS NOT NULL THEN
        INSERT INTO chat_room_participants (room_id, user_id)
        VALUES (room_record.room_id, consultant_user_id)
        ON CONFLICT (room_id, user_id) DO NOTHING;
      END IF;
    END IF;
    
    -- Add support consultant
    IF project_record.support_consultant_id IS NOT NULL THEN
      SELECT user_id INTO support_user_id
      FROM user_consultant_links
      WHERE consultant_id = project_record.support_consultant_id
      LIMIT 1;
      
      IF support_user_id IS NOT NULL THEN
        INSERT INTO chat_room_participants (room_id, user_id)
        VALUES (room_record.room_id, support_user_id)
        ON CONFLICT (room_id, user_id) DO NOTHING;
      END IF;
    END IF;
    
    -- Add client
    IF project_record.client_id IS NOT NULL THEN
      SELECT user_id INTO client_user_id
      FROM user_client_links
      WHERE client_id = project_record.client_id
      LIMIT 1;
      
      IF client_user_id IS NOT NULL THEN
        INSERT INTO chat_room_participants (room_id, user_id)
        VALUES (room_record.room_id, client_user_id)
        ON CONFLICT (room_id, user_id) DO NOTHING;
      END IF;
    END IF;
  END LOOP;
END $$;
