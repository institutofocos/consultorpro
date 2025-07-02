
-- Função para criar automaticamente salas de chat para projetos e etapas existentes
CREATE OR REPLACE FUNCTION create_missing_chat_rooms()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- Criar salas para projetos que ainda não têm
  INSERT INTO chat_rooms (project_id, room_type, is_active)
  SELECT p.id, 'project', true
  FROM projects p
  WHERE NOT EXISTS (
    SELECT 1 FROM chat_rooms cr 
    WHERE cr.project_id = p.id AND cr.room_type = 'project'
  );
  
  -- Criar sub-salas para etapas que ainda não têm
  INSERT INTO chat_rooms (project_id, stage_id, room_type, is_active)
  SELECT ps.project_id, ps.id, 'stage', true
  FROM project_stages ps
  WHERE NOT EXISTS (
    SELECT 1 FROM chat_rooms cr 
    WHERE cr.stage_id = ps.id AND cr.room_type = 'stage'
  );
END;
$$;

-- Executar a função para criar salas existentes
SELECT create_missing_chat_rooms();

-- Trigger para criar sala de chat automaticamente quando um projeto é criado
CREATE OR REPLACE FUNCTION create_project_chat_room()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO chat_rooms (project_id, room_type, is_active)
  VALUES (NEW.id, 'project', true);
  RETURN NEW;
END;
$$;

-- Aplicar o trigger se não existir
DROP TRIGGER IF EXISTS trigger_create_project_chat_room ON projects;
CREATE TRIGGER trigger_create_project_chat_room
  AFTER INSERT ON projects
  FOR EACH ROW
  EXECUTE FUNCTION create_project_chat_room();

-- Trigger para criar sub-sala de chat automaticamente quando uma etapa é criada
CREATE OR REPLACE FUNCTION create_stage_chat_room()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO chat_rooms (project_id, stage_id, room_type, is_active)
  VALUES (NEW.project_id, NEW.id, 'stage', true);
  RETURN NEW;
END;
$$;

-- Aplicar o trigger se não existir
DROP TRIGGER IF EXISTS trigger_create_stage_chat_room ON project_stages;
CREATE TRIGGER trigger_create_stage_chat_room
  AFTER INSERT ON project_stages
  FOR EACH ROW
  EXECUTE FUNCTION create_stage_chat_room();

-- Função para buscar salas de chat com informações dos projetos e etapas
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
  ORDER BY p.name, ps.stage_order;
END;
$$;

-- Atualizar políticas RLS para permitir acesso às salas de chat
CREATE POLICY "Users can view project/stage chat rooms based on access"
ON chat_rooms FOR SELECT
USING (
  user_is_super_admin() OR
  user_can_access_module('chat', 'view') OR
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

-- Política para inserção automática de participantes
CREATE POLICY "System can manage chat room participants"
ON chat_room_participants FOR ALL
USING (true)
WITH CHECK (true);

-- Função para adicionar participantes automaticamente às salas
CREATE OR REPLACE FUNCTION add_project_participants_to_chat(p_project_id uuid, p_room_id uuid)
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
