
-- Melhorar a função get_available_chat_users para incluir mais informações
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
  WHERE c.id IS NOT NULL
  UNION ALL
  SELECT 
    cl.id::UUID as user_id,
    COALESCE(cl.contact_name, cl.name)::TEXT as name,
    COALESCE(cl.email, '')::TEXT,
    'client'::TEXT as type
  FROM public.clients cl
  WHERE cl.id IS NOT NULL;
END;
$$;

-- Criar função para verificar se usuário pode ver uma sala específica
CREATE OR REPLACE FUNCTION user_can_view_chat_room(room_id UUID, user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  participant_count INTEGER;
  user_is_participant BOOLEAN;
BEGIN
  -- Contar quantos participantes a sala tem
  SELECT COUNT(*) INTO participant_count
  FROM chat_room_participants crp
  WHERE crp.room_id = room_id;
  
  -- Se não há participantes, todos podem ver
  IF participant_count = 0 THEN
    RETURN TRUE;
  END IF;
  
  -- Se há participantes, verificar se o usuário está entre eles
  SELECT EXISTS(
    SELECT 1 FROM chat_room_participants crp
    WHERE crp.room_id = room_id AND crp.user_id = user_id AND crp.can_read = true
  ) INTO user_is_participant;
  
  RETURN user_is_participant;
END;
$$;

-- Atualizar políticas das salas de chat para usar a nova função
DROP POLICY IF EXISTS "Allow authenticated users to view all chat rooms" ON public.chat_rooms;

CREATE POLICY "Users can view chat rooms based on participation" ON public.chat_rooms
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND 
    user_can_view_chat_room(id, auth.uid())
  );

-- Criar função para adicionar usuário a uma sala e suas sub-salas automaticamente
CREATE OR REPLACE FUNCTION add_user_to_room_and_subrooms(
  p_room_id UUID,
  p_user_id UUID,
  p_added_by UUID,
  p_can_read BOOLEAN DEFAULT TRUE,
  p_can_write BOOLEAN DEFAULT TRUE
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  subroom RECORD;
BEGIN
  -- Adicionar usuário à sala principal
  INSERT INTO chat_room_participants (room_id, user_id, added_by, can_read, can_write)
  VALUES (p_room_id, p_user_id, p_added_by, p_can_read, p_can_write)
  ON CONFLICT (room_id, user_id) DO UPDATE SET
    can_read = EXCLUDED.can_read,
    can_write = EXCLUDED.can_write,
    added_by = EXCLUDED.added_by;
  
  -- Adicionar usuário a todas as sub-salas recursivamente
  FOR subroom IN 
    SELECT id FROM chat_rooms 
    WHERE parent_room_id = p_room_id
  LOOP
    -- Chamada recursiva para sub-salas
    PERFORM add_user_to_room_and_subrooms(
      subroom.id, 
      p_user_id, 
      p_added_by, 
      p_can_read, 
      p_can_write
    );
  END LOOP;
END;
$$;

-- Criar função para remover usuário de uma sala específica (sem afetar outras)
CREATE OR REPLACE FUNCTION remove_user_from_specific_room(
  p_room_id UUID,
  p_user_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM chat_room_participants 
  WHERE room_id = p_room_id AND user_id = p_user_id;
END;
$$;

-- Função para buscar participantes de uma sala específica
CREATE OR REPLACE FUNCTION get_room_participants(p_room_id UUID)
RETURNS TABLE(
  user_id UUID,
  name TEXT,
  email TEXT,
  type TEXT,
  can_read BOOLEAN,
  can_write BOOLEAN,
  added_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    crp.user_id::UUID,
    COALESCE(c.name, cl.name, cl.contact_name)::TEXT as name,
    COALESCE(c.email, cl.email, '')::TEXT as email,
    CASE 
      WHEN c.id IS NOT NULL THEN 'consultant'::TEXT
      WHEN cl.id IS NOT NULL THEN 'client'::TEXT
      ELSE 'unknown'::TEXT
    END as type,
    crp.can_read,
    crp.can_write,
    crp.added_at
  FROM chat_room_participants crp
  LEFT JOIN consultants c ON crp.user_id = c.id
  LEFT JOIN clients cl ON crp.user_id = cl.id
  WHERE crp.room_id = p_room_id
  ORDER BY crp.added_at DESC;
END;
$$;
