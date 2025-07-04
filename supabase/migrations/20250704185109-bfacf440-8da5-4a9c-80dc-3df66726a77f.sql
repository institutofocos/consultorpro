
-- Verificar se existe algum trigger ou função que está causando o problema
-- Remover qualquer referência a chat_rooms no sistema de projetos

-- Verificar se há algum trigger problemático na tabela projects
DROP TRIGGER IF EXISTS project_chat_room_trigger ON projects;
DROP TRIGGER IF EXISTS create_project_chat_room ON projects;

-- Verificar se há alguma função que está tentando criar chat_rooms
DROP FUNCTION IF EXISTS create_project_chat_room();
DROP FUNCTION IF EXISTS link_project_to_chat_room();

-- Garantir que a tabela projects não tenha nenhuma referência a chat_rooms
DO $$
BEGIN
    -- Verificar se existe alguma coluna relacionada a chat
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'projects' 
               AND column_name LIKE '%chat%') THEN
        -- Remover colunas relacionadas a chat se existirem
        ALTER TABLE projects DROP COLUMN IF EXISTS chat_room_id;
        ALTER TABLE projects DROP COLUMN IF EXISTS chat_id;
    END IF;
END $$;

-- Limpar logs de sistema relacionados a chat de projetos
DELETE FROM system_logs 
WHERE message LIKE '%chat%' 
AND message LIKE '%project%';
