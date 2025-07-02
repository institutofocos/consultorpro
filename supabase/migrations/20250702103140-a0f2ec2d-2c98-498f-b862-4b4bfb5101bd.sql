
-- Criação das tabelas para o sistema de chat

-- Tabela de salas de chat
CREATE TABLE public.chat_rooms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  stage_id UUID NULL REFERENCES public.project_stages(id) ON DELETE CASCADE,
  room_type TEXT NOT NULL CHECK (room_type IN ('project', 'stage')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(project_id, stage_id)
);

-- Tabela de participantes das salas
CREATE TABLE public.chat_room_participants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID NOT NULL REFERENCES public.chat_rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  added_by UUID NULL REFERENCES auth.users(id),
  added_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(room_id, user_id)
);

-- Tabela de mensagens
CREATE TABLE public.chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID NOT NULL REFERENCES public.chat_rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message_text TEXT NOT NULL,
  message_type TEXT NOT NULL DEFAULT 'user' CHECK (message_type IN ('user', 'ai', 'system')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índices para performance
CREATE INDEX idx_chat_rooms_project_id ON public.chat_rooms(project_id);
CREATE INDEX idx_chat_rooms_stage_id ON public.chat_rooms(stage_id);
CREATE INDEX idx_chat_room_participants_room_id ON public.chat_room_participants(room_id);
CREATE INDEX idx_chat_room_participants_user_id ON public.chat_room_participants(user_id);
CREATE INDEX idx_chat_messages_room_id ON public.chat_messages(room_id);
CREATE INDEX idx_chat_messages_created_at ON public.chat_messages(created_at);

-- Habilitar RLS nas tabelas
ALTER TABLE public.chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_room_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para chat_rooms
CREATE POLICY "Users can view chat rooms they participate in"
  ON public.chat_rooms FOR SELECT
  USING (
    user_is_super_admin() OR
    EXISTS (
      SELECT 1 FROM public.chat_room_participants crp 
      WHERE crp.room_id = id AND crp.user_id = auth.uid()
    )
  );

CREATE POLICY "Super admins can manage chat rooms"
  ON public.chat_rooms FOR ALL
  USING (user_is_super_admin());

-- Políticas RLS para chat_room_participants
CREATE POLICY "Users can view participants of rooms they are in"
  ON public.chat_room_participants FOR SELECT
  USING (
    user_is_super_admin() OR
    EXISTS (
      SELECT 1 FROM public.chat_room_participants crp2 
      WHERE crp2.room_id = room_id AND crp2.user_id = auth.uid()
    )
  );

CREATE POLICY "Super admins can manage participants"
  ON public.chat_room_participants FOR ALL
  USING (user_is_super_admin());

-- Políticas RLS para chat_messages
CREATE POLICY "Users can view messages in rooms they participate in"
  ON public.chat_messages FOR SELECT
  USING (
    user_is_super_admin() OR
    EXISTS (
      SELECT 1 FROM public.chat_room_participants crp 
      WHERE crp.room_id = room_id AND crp.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert messages in rooms they participate in"
  ON public.chat_messages FOR INSERT
  WITH CHECK (
    user_is_super_admin() OR
    EXISTS (
      SELECT 1 FROM public.chat_room_participants crp 
      WHERE crp.room_id = room_id AND crp.user_id = auth.uid()
    )
  );

-- Função para criar salas automaticamente para projetos existentes
CREATE OR REPLACE FUNCTION public.create_chat_rooms_for_existing_projects()
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  project_record RECORD;
  stage_record RECORD;
  room_id UUID;
BEGIN
  -- Criar salas para projetos existentes que ainda não têm sala
  FOR project_record IN 
    SELECT p.id, p.name, p.main_consultant_id, p.support_consultant_id, p.client_id
    FROM public.projects p
    WHERE NOT EXISTS (
      SELECT 1 FROM public.chat_rooms cr 
      WHERE cr.project_id = p.id AND cr.room_type = 'project'
    )
  LOOP
    -- Criar sala do projeto
    INSERT INTO public.chat_rooms (project_id, room_type)
    VALUES (project_record.id, 'project')
    RETURNING id INTO room_id;
    
    -- Adicionar participantes automáticos
    IF project_record.main_consultant_id IS NOT NULL THEN
      INSERT INTO public.chat_room_participants (room_id, user_id)
      SELECT room_id, ucl.user_id
      FROM public.user_consultant_links ucl
      WHERE ucl.consultant_id = project_record.main_consultant_id
      ON CONFLICT (room_id, user_id) DO NOTHING;
    END IF;
    
    IF project_record.support_consultant_id IS NOT NULL THEN
      INSERT INTO public.chat_room_participants (room_id, user_id)
      SELECT room_id, ucl.user_id
      FROM public.user_consultant_links ucl
      WHERE ucl.consultant_id = project_record.support_consultant_id
      ON CONFLICT (room_id, user_id) DO NOTHING;
    END IF;
    
    IF project_record.client_id IS NOT NULL THEN
      INSERT INTO public.chat_room_participants (room_id, user_id)
      SELECT room_id, ucl.user_id
      FROM public.user_client_links ucl
      WHERE ucl.client_id = project_record.client_id
      ON CONFLICT (room_id, user_id) DO NOTHING;
    END IF;
  END LOOP;
  
  -- Criar subsalas para etapas existentes que ainda não têm sala
  FOR stage_record IN 
    SELECT ps.id, ps.project_id, ps.name, ps.consultant_id
    FROM public.project_stages ps
    WHERE NOT EXISTS (
      SELECT 1 FROM public.chat_rooms cr 
      WHERE cr.stage_id = ps.id AND cr.room_type = 'stage'
    )
  LOOP
    -- Criar subsala da etapa
    INSERT INTO public.chat_rooms (project_id, stage_id, room_type)
    VALUES (stage_record.project_id, stage_record.id, 'stage')
    RETURNING id INTO room_id;
    
    -- Adicionar consultor da etapa
    IF stage_record.consultant_id IS NOT NULL THEN
      INSERT INTO public.chat_room_participants (room_id, user_id)
      SELECT room_id, ucl.user_id
      FROM public.user_consultant_links ucl
      WHERE ucl.consultant_id = stage_record.consultant_id
      ON CONFLICT (room_id, user_id) DO NOTHING;
    END IF;
  END LOOP;
END;
$$;

-- Função para criar sala automaticamente quando um projeto é criado
CREATE OR REPLACE FUNCTION public.create_project_chat_room()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  room_id UUID;
BEGIN
  -- Criar sala do projeto
  INSERT INTO public.chat_rooms (project_id, room_type)
  VALUES (NEW.id, 'project')
  RETURNING id INTO room_id;
  
  -- Adicionar participantes automáticos
  IF NEW.main_consultant_id IS NOT NULL THEN
    INSERT INTO public.chat_room_participants (room_id, user_id)
    SELECT room_id, ucl.user_id
    FROM public.user_consultant_links ucl
    WHERE ucl.consultant_id = NEW.main_consultant_id
    ON CONFLICT (room_id, user_id) DO NOTHING;
  END IF;
  
  IF NEW.support_consultant_id IS NOT NULL THEN
    INSERT INTO public.chat_room_participants (room_id, user_id)
    SELECT room_id, ucl.user_id
    FROM public.user_consultant_links ucl
    WHERE ucl.consultant_id = NEW.support_consultant_id
    ON CONFLICT (room_id, user_id) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Função para criar subsala automaticamente quando uma etapa é criada
CREATE OR REPLACE FUNCTION public.create_stage_chat_room()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  room_id UUID;
BEGIN
  -- Criar subsala da etapa
  INSERT INTO public.chat_rooms (project_id, stage_id, room_type)
  VALUES (NEW.project_id, NEW.id, 'stage')
  RETURNING id INTO room_id;
  
  -- Adicionar consultor da etapa
  IF NEW.consultant_id IS NOT NULL THEN
    INSERT INTO public.chat_room_participants (room_id, user_id)
    SELECT room_id, ucl.user_id
    FROM public.user_consultant_links ucl
    WHERE ucl.consultant_id = NEW.consultant_id
    ON CONFLICT (room_id, user_id) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Triggers para criação automática de salas
CREATE TRIGGER create_project_chat_room_trigger
  AFTER INSERT ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION public.create_project_chat_room();

CREATE TRIGGER create_stage_chat_room_trigger
  AFTER INSERT ON public.project_stages
  FOR EACH ROW
  EXECUTE FUNCTION public.create_stage_chat_room();

-- Executar função para criar salas para projetos existentes
SELECT public.create_chat_rooms_for_existing_projects();

-- Adicionar o módulo 'chat' ao enum de módulos (se não existir)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'module_type') THEN
    CREATE TYPE module_type AS ENUM ('dashboard', 'consultants', 'clients', 'projects', 'demands', 'services', 'calendar', 'financial', 'settings', 'chat');
  ELSE
    BEGIN
      ALTER TYPE module_type ADD VALUE 'chat';
    EXCEPTION
      WHEN duplicate_object THEN
        NULL; -- Ignora se já existe
    END;
  END IF;
END$$;

-- Sincronizar permissões do Super Admin
SELECT public.sync_super_admin_permissions();
