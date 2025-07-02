
-- Corrigir as políticas RLS que estão causando recursão infinita na tabela chat_room_participants
DROP POLICY IF EXISTS "Users can view participants in rooms they have access to" ON chat_room_participants;
DROP POLICY IF EXISTS "Users can join rooms they have access to" ON chat_room_participants;

-- Criar políticas mais simples que não causem recursão
CREATE POLICY "Users can view chat room participants"
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

CREATE POLICY "Users can manage their own participation"
ON chat_room_participants FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Permitir que super admins gerenciem participantes
CREATE POLICY "Super admins can manage all participants"
ON chat_room_participants FOR ALL
USING (user_is_super_admin())
WITH CHECK (user_is_super_admin());

-- Corrigir também as políticas da tabela chat_rooms para evitar problemas similares
DROP POLICY IF EXISTS "Users can view chat rooms they have access to" ON chat_rooms;
DROP POLICY IF EXISTS "Users can view chat rooms based on project access" ON chat_rooms;

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
      user_has_client_access(p.client_id)
    )
  )
);

-- Garantir que as salas de chat sejam criadas para todos os projetos e etapas existentes
-- Primeiro, criar salas para projetos que ainda não têm
INSERT INTO chat_rooms (project_id, room_type, is_active)
SELECT p.id, 'project', true
FROM projects p
WHERE NOT EXISTS (
  SELECT 1 FROM chat_rooms cr 
  WHERE cr.project_id = p.id AND cr.room_type = 'project'
);

-- Criar salas para etapas que ainda não têm
INSERT INTO chat_rooms (project_id, stage_id, room_type, is_active)
SELECT ps.project_id, ps.id, 'stage', true
FROM project_stages ps
WHERE NOT EXISTS (
  SELECT 1 FROM chat_rooms cr 
  WHERE cr.stage_id = ps.id AND cr.room_type = 'stage'
);

-- Criar função para adicionar participantes automaticamente às salas de chat
CREATE OR REPLACE FUNCTION add_project_participants_to_chat_room(p_project_id uuid, p_room_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  project_record RECORD;
  consultant_user_id uuid;
  support_user_id uuid;
  client_user_id uuid;
BEGIN
  -- Buscar dados do projeto
  SELECT * INTO project_record 
  FROM projects 
  WHERE id = p_project_id;
  
  -- Adicionar consultor principal se existir usuário vinculado
  IF project_record.main_consultant_id IS NOT NULL THEN
    SELECT user_id INTO consultant_user_id
    FROM user_consultant_links
    WHERE consultant_id = project_record.main_consultant_id
    LIMIT 1;
    
    IF consultant_user_id IS NOT NULL THEN
      INSERT INTO chat_room_participants (room_id, user_id, added_by)
      VALUES (p_room_id, consultant_user_id, null)
      ON CONFLICT (room_id, user_id) DO NOTHING;
    END IF;
  END IF;
  
  -- Adicionar consultor de apoio se existir usuário vinculado
  IF project_record.support_consultant_id IS NOT NULL THEN
    SELECT user_id INTO support_user_id
    FROM user_consultant_links
    WHERE consultant_id = project_record.support_consultant_id
    LIMIT 1;
    
    IF support_user_id IS NOT NULL THEN
      INSERT INTO chat_room_participants (room_id, user_id, added_by)
      VALUES (p_room_id, support_user_id, null)
      ON CONFLICT (room_id, user_id) DO NOTHING;
    END IF;
  END IF;
  
  -- Adicionar cliente se existir usuário vinculado
  IF project_record.client_id IS NOT NULL THEN
    SELECT user_id INTO client_user_id
    FROM user_client_links
    WHERE client_id = project_record.client_id
    LIMIT 1;
    
    IF client_user_id IS NOT NULL THEN
      INSERT INTO chat_room_participants (room_id, user_id, added_by)
      VALUES (p_room_id, client_user_id, null)
      ON CONFLICT (room_id, user_id) DO NOTHING;
    END IF;
  END IF;
END;
$$;

-- Adicionar participantes às salas existentes
DO $$
DECLARE
  room_record RECORD;
BEGIN
  FOR room_record IN 
    SELECT id, project_id FROM chat_rooms WHERE room_type IN ('project', 'stage')
  LOOP
    PERFORM add_project_participants_to_chat_room(room_record.project_id, room_record.id);
  END LOOP;
END $$;
