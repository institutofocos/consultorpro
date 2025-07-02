
-- Criar enum para tipos de participantes
CREATE TYPE participant_type AS ENUM ('user', 'consultant', 'client');

-- Criar tabela para gerenciar participantes das salas de chat com mais flexibilidade
CREATE TABLE chat_room_member_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES chat_rooms(id) ON DELETE CASCADE,
  participant_type participant_type NOT NULL,
  participant_id UUID NOT NULL, -- ID do usuário, consultor ou cliente
  can_view BOOLEAN NOT NULL DEFAULT true,
  can_send_messages BOOLEAN NOT NULL DEFAULT true,
  can_manage_room BOOLEAN NOT NULL DEFAULT false,
  added_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(room_id, participant_type, participant_id)
);

-- Adicionar colunas para salas manuais
ALTER TABLE chat_rooms 
ADD COLUMN is_manual BOOLEAN DEFAULT false,
ADD COLUMN parent_room_id UUID REFERENCES chat_rooms(id) ON DELETE CASCADE,
ADD COLUMN created_by UUID REFERENCES auth.users(id),
ADD COLUMN room_name TEXT,
ADD COLUMN room_description TEXT;

-- Criar políticas RLS para chat_room_member_permissions
ALTER TABLE chat_room_member_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own permissions"
ON chat_room_member_permissions FOR SELECT
USING (
  user_is_super_admin() OR
  (participant_type = 'user' AND participant_id = auth.uid()) OR
  EXISTS (
    SELECT 1 FROM chat_room_member_permissions crmp
    WHERE crmp.room_id = chat_room_member_permissions.room_id
    AND crmp.participant_type = 'user'
    AND crmp.participant_id = auth.uid()
    AND crmp.can_manage_room = true
  )
);

CREATE POLICY "Room managers can manage permissions"
ON chat_room_member_permissions FOR ALL
USING (
  user_is_super_admin() OR
  EXISTS (
    SELECT 1 FROM chat_room_member_permissions crmp
    WHERE crmp.room_id = chat_room_member_permissions.room_id
    AND crmp.participant_type = 'user'
    AND crmp.participant_id = auth.uid()
    AND crmp.can_manage_room = true
  )
);

-- Atualizar políticas de chat_rooms para incluir salas manuais
DROP POLICY IF EXISTS "Users can view chat rooms they have access to" ON chat_rooms;

CREATE POLICY "Users can view accessible chat rooms"
ON chat_rooms FOR SELECT
USING (
  user_is_super_admin() OR
  -- Acesso a salas automáticas (baseadas em projetos)
  (NOT is_manual AND EXISTS (
    SELECT 1 FROM projects p 
    WHERE p.id = project_id 
    AND (
      user_has_consultant_access(p.main_consultant_id) OR
      user_has_consultant_access(p.support_consultant_id) OR
      user_has_client_access(p.client_id)
    )
  )) OR
  -- Acesso a salas manuais (baseadas em permissões)
  (is_manual AND EXISTS (
    SELECT 1 FROM chat_room_member_permissions crmp
    WHERE crmp.room_id = id
    AND crmp.participant_type = 'user'
    AND crmp.participant_id = auth.uid()
    AND crmp.can_view = true
  ))
);

CREATE POLICY "Users can create manual chat rooms"
ON chat_rooms FOR INSERT
WITH CHECK (
  user_is_super_admin() OR
  (is_manual = true AND created_by = auth.uid())
);

CREATE POLICY "Users can update their own manual chat rooms"
ON chat_rooms FOR UPDATE
USING (
  user_is_super_admin() OR
  (is_manual = true AND created_by = auth.uid()) OR
  EXISTS (
    SELECT 1 FROM chat_room_member_permissions crmp
    WHERE crmp.room_id = id
    AND crmp.participant_type = 'user'
    AND crmp.participant_id = auth.uid()
    AND crmp.can_manage_room = true
  )
);

-- Atualizar políticas de chat_messages para considerar as novas permissões
DROP POLICY IF EXISTS "Users can view messages in rooms they participate in" ON chat_messages;
DROP POLICY IF EXISTS "Users can send messages to rooms they participate in" ON chat_messages;

CREATE POLICY "Users can view messages in accessible rooms"
ON chat_messages FOR SELECT
USING (
  user_is_super_admin() OR
  EXISTS (
    SELECT 1 FROM chat_rooms cr
    WHERE cr.id = room_id
    AND (
      -- Salas automáticas
      (NOT cr.is_manual AND EXISTS (
        SELECT 1 FROM projects p 
        WHERE p.id = cr.project_id 
        AND (
          user_has_consultant_access(p.main_consultant_id) OR
          user_has_consultant_access(p.support_consultant_id) OR
          user_has_client_access(p.client_id)
        )
      )) OR
      -- Salas manuais
      (cr.is_manual AND EXISTS (
        SELECT 1 FROM chat_room_member_permissions crmp
        WHERE crmp.room_id = cr.id
        AND crmp.participant_type = 'user'
        AND crmp.participant_id = auth.uid()
        AND crmp.can_view = true
      ))
    )
  )
);

CREATE POLICY "Users can send messages to accessible rooms"
ON chat_messages FOR INSERT
WITH CHECK (
  auth.uid() = user_id AND (
    user_is_super_admin() OR
    EXISTS (
      SELECT 1 FROM chat_rooms cr
      WHERE cr.id = room_id
      AND (
        -- Salas automáticas
        (NOT cr.is_manual AND EXISTS (
          SELECT 1 FROM projects p 
          WHERE p.id = cr.project_id 
          AND (
            user_has_consultant_access(p.main_consultant_id) OR
            user_has_consultant_access(p.support_consultant_id) OR
            user_has_client_access(p.client_id)
          )
        )) OR
        -- Salas manuais
        (cr.is_manual AND EXISTS (
          SELECT 1 FROM chat_room_member_permissions crmp
          WHERE crmp.room_id = cr.id
          AND crmp.participant_type = 'user'
          AND crmp.participant_id = auth.uid()
          AND crmp.can_send_messages = true
        ))
      )
    )
  )
);

-- Criar função para adicionar membros a salas de chat
CREATE OR REPLACE FUNCTION add_chat_room_member(
  p_room_id UUID,
  p_participant_type participant_type,
  p_participant_id UUID,
  p_can_view BOOLEAN DEFAULT true,
  p_can_send_messages BOOLEAN DEFAULT true,
  p_can_manage_room BOOLEAN DEFAULT false
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_member_id UUID;
BEGIN
  -- Verificar se o usuário tem permissão para adicionar membros
  IF NOT (
    user_is_super_admin() OR
    EXISTS (
      SELECT 1 FROM chat_room_member_permissions crmp
      WHERE crmp.room_id = p_room_id
      AND crmp.participant_type = 'user'
      AND crmp.participant_id = auth.uid()
      AND crmp.can_manage_room = true
    ) OR
    EXISTS (
      SELECT 1 FROM chat_rooms cr
      WHERE cr.id = p_room_id
      AND cr.created_by = auth.uid()
    )
  ) THEN
    RAISE EXCEPTION 'Você não tem permissão para adicionar membros a esta sala';
  END IF;

  INSERT INTO chat_room_member_permissions (
    room_id,
    participant_type,
    participant_id,
    can_view,
    can_send_messages,
    can_manage_room,
    added_by
  ) VALUES (
    p_room_id,
    p_participant_type,
    p_participant_id,
    p_can_view,
    p_can_send_messages,
    p_can_manage_room,
    auth.uid()
  ) RETURNING id INTO new_member_id;

  RETURN new_member_id;
END;
$$;
