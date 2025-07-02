
-- Primeiro, vamos remover TODAS as políticas problemáticas das tabelas de chat
DROP POLICY IF EXISTS "Users can view accessible rooms" ON public.chat_rooms;
DROP POLICY IF EXISTS "Users can view participants of their accessible rooms" ON public.chat_room_participants;
DROP POLICY IF EXISTS "Room creators and system can manage participants" ON public.chat_room_participants;

-- Criar políticas simples e não-recursivas para chat_rooms
CREATE POLICY "Users can view rooms they created" ON public.chat_rooms
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND created_by = auth.uid()
  );

CREATE POLICY "Users can view rooms where they are participants" ON public.chat_rooms
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND 
    EXISTS (
      SELECT 1 FROM public.chat_room_participants crp 
      WHERE crp.room_id = id 
      AND crp.user_id = auth.uid() 
      AND crp.can_read = true
    )
  );

-- Criar políticas simples para chat_room_participants
CREATE POLICY "Users can view participants where they are room creators" ON public.chat_room_participants
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND 
    EXISTS (
      SELECT 1 FROM public.chat_rooms cr 
      WHERE cr.id = room_id 
      AND cr.created_by = auth.uid()
    )
  );

CREATE POLICY "Users can view their own participation" ON public.chat_room_participants
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND user_id = auth.uid()
  );

CREATE POLICY "Room creators can manage participants" ON public.chat_room_participants
  FOR ALL USING (
    auth.uid() IS NOT NULL AND 
    EXISTS (
      SELECT 1 FROM public.chat_rooms cr 
      WHERE cr.id = room_id 
      AND cr.created_by = auth.uid()
    )
  ) WITH CHECK (
    auth.uid() IS NOT NULL AND 
    EXISTS (
      SELECT 1 FROM public.chat_rooms cr 
      WHERE cr.id = room_id 
      AND cr.created_by = auth.uid()
    )
  );

-- Garantir que a função get_available_chat_users funcione corretamente
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
    cl.name::TEXT,
    cl.email::TEXT,
    'client'::TEXT as type
  FROM public.clients cl
  WHERE cl.id IS NOT NULL;
END;
$$;
