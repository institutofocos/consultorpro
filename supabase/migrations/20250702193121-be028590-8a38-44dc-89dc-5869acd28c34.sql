
-- Criar tabela para salas de chat com estrutura hierárquica
CREATE TABLE public.chat_rooms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  level INTEGER NOT NULL DEFAULT 1 CHECK (level >= 1 AND level <= 3),
  parent_room_id UUID REFERENCES public.chat_rooms(id) ON DELETE CASCADE,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_active BOOLEAN NOT NULL DEFAULT true
);

-- Criar tabela para participantes das salas (controle de acesso)
CREATE TABLE public.chat_room_participants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID NOT NULL REFERENCES public.chat_rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  can_read BOOLEAN NOT NULL DEFAULT true,
  can_write BOOLEAN NOT NULL DEFAULT true,
  added_by UUID NOT NULL,
  added_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(room_id, user_id)
);

-- Criar tabela para mensagens de chat
CREATE TABLE public.chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID NOT NULL REFERENCES public.chat_rooms(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  sender_name TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  edited_at TIMESTAMP WITH TIME ZONE,
  is_deleted BOOLEAN NOT NULL DEFAULT false
);

-- Habilitar RLS nas tabelas
ALTER TABLE public.chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_room_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para chat_rooms
CREATE POLICY "Users can view rooms they participate in" ON public.chat_rooms
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND (
      created_by = auth.uid() OR
      EXISTS (
        SELECT 1 FROM public.chat_room_participants 
        WHERE room_id = id AND user_id = auth.uid() AND can_read = true
      )
    )
  );

CREATE POLICY "Users can create rooms" ON public.chat_rooms
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Room creators can update rooms" ON public.chat_rooms
  FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "Room creators can delete rooms" ON public.chat_rooms
  FOR DELETE USING (auth.uid() = created_by);

-- Políticas RLS para chat_room_participants
CREATE POLICY "Users can view participants of rooms they participate in" ON public.chat_room_participants
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM public.chat_room_participants crp
      WHERE crp.room_id = room_id AND crp.user_id = auth.uid()
    )
  );

CREATE POLICY "Room creators can manage participants" ON public.chat_room_participants
  FOR ALL USING (
    auth.uid() IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM public.chat_rooms cr
      WHERE cr.id = room_id AND cr.created_by = auth.uid()
    )
  );

-- Políticas RLS para chat_messages
CREATE POLICY "Users can view messages in rooms they participate in" ON public.chat_messages
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM public.chat_room_participants 
      WHERE room_id = chat_messages.room_id AND user_id = auth.uid() AND can_read = true
    )
  );

CREATE POLICY "Users can send messages to rooms they can write in" ON public.chat_messages
  FOR INSERT WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM public.chat_room_participants 
      WHERE room_id = chat_messages.room_id AND user_id = auth.uid() AND can_write = true
    )
  );

CREATE POLICY "Users can edit their own messages" ON public.chat_messages
  FOR UPDATE USING (auth.uid() = sender_id);

-- Criar índices para performance
CREATE INDEX idx_chat_rooms_parent_id ON public.chat_rooms(parent_room_id);
CREATE INDEX idx_chat_room_participants_room_user ON public.chat_room_participants(room_id, user_id);
CREATE INDEX idx_chat_messages_room_created ON public.chat_messages(room_id, created_at DESC);

-- Criar triggers para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER chat_rooms_updated_at 
  BEFORE UPDATE ON public.chat_rooms 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER chat_room_participants_updated_at 
  BEFORE UPDATE ON public.chat_room_participants 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Função para obter usuários disponíveis (consultores e clientes)
CREATE OR REPLACE FUNCTION get_available_chat_users()
RETURNS TABLE(
  user_id UUID,
  name TEXT,
  email TEXT,
  type TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id::UUID as user_id,
    c.name::TEXT,
    c.email::TEXT,
    'consultant'::TEXT as type
  FROM public.consultants c
  UNION ALL
  SELECT 
    cl.id::UUID as user_id,
    cl.name::TEXT,
    cl.email::TEXT,
    'client'::TEXT as type
  FROM public.clients cl;
END;
$$;
