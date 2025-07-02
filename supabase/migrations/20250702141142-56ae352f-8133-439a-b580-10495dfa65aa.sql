
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
