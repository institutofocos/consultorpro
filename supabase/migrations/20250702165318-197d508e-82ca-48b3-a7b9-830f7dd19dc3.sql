
-- Primeiro, vamos verificar se existem projetos e etapas no banco
-- e garantir que as salas de chat sejam criadas para todos eles

-- Criar salas de chat para todos os projetos existentes que não têm sala
INSERT INTO chat_rooms (project_id, room_type, is_active)
SELECT p.id, 'project', true
FROM projects p
WHERE NOT EXISTS (
  SELECT 1 FROM chat_rooms cr 
  WHERE cr.project_id = p.id AND cr.room_type = 'project'
);

-- Criar sub-salas de chat para todas as etapas existentes que não têm sala
INSERT INTO chat_rooms (project_id, stage_id, room_type, is_active)
SELECT ps.project_id, ps.id, 'stage', true
FROM project_stages ps
WHERE NOT EXISTS (
  SELECT 1 FROM chat_rooms cr 
  WHERE cr.stage_id = ps.id AND cr.room_type = 'stage'
);

-- Corrigir as políticas RLS da tabela chat_rooms para garantir acesso correto
DROP POLICY IF EXISTS "Users can view chat rooms they have access to" ON chat_rooms;
DROP POLICY IF EXISTS "Super admins can manage chat rooms" ON chat_rooms;

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

-- Permitir que super admins gerenciem salas de chat
CREATE POLICY "Super admins can manage chat rooms"
ON chat_rooms FOR ALL
USING (user_is_super_admin())
WITH CHECK (user_is_super_admin());

-- Adicionar participantes automaticamente às salas de chat baseado nos projetos
DO $$
DECLARE
  room_record RECORD;
  project_record RECORD;
  consultant_user_id uuid;
  support_user_id uuid;
  client_user_id uuid;
BEGIN
  -- Para cada sala de chat, adicionar os participantes apropriados
  FOR room_record IN 
    SELECT cr.id as room_id, cr.project_id, cr.room_type
    FROM chat_rooms cr
    WHERE cr.is_active = true
  LOOP
    -- Buscar dados do projeto
    SELECT * INTO project_record 
    FROM projects 
    WHERE id = room_record.project_id;
    
    -- Adicionar consultor principal se existir usuário vinculado
    IF project_record.main_consultant_id IS NOT NULL THEN
      SELECT user_id INTO consultant_user_id
      FROM user_consultant_links
      WHERE consultant_id = project_record.main_consultant_id
      LIMIT 1;
      
      IF consultant_user_id IS NOT NULL THEN
        INSERT INTO chat_room_participants (room_id, user_id, added_by)
        VALUES (room_record.room_id, consultant_user_id, null)
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
        VALUES (room_record.room_id, support_user_id, null)
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
        VALUES (room_record.room_id, client_user_id, null)
        ON CONFLICT (room_id, user_id) DO NOTHING;
      END IF;
    END IF;
  END LOOP;
END $$;

-- Verificar se as salas foram criadas corretamente
SELECT 
  'Total de projetos' as tipo,
  COUNT(*) as quantidade
FROM projects
UNION ALL
SELECT 
  'Salas de projetos criadas' as tipo,
  COUNT(*) as quantidade
FROM chat_rooms 
WHERE room_type = 'project'
UNION ALL
SELECT 
  'Total de etapas' as tipo,
  COUNT(*) as quantidade
FROM project_stages
UNION ALL
SELECT 
  'Sub-salas de etapas criadas' as tipo,
  COUNT(*) as quantidade
FROM chat_rooms 
WHERE room_type = 'stage';
