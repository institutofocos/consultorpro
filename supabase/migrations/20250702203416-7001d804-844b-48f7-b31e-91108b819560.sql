
-- Primeiro, vamos remover as políticas existentes que estão muito restritivas
DROP POLICY IF EXISTS "Users can send messages to rooms they can write in" ON public.chat_messages;
DROP POLICY IF EXISTS "Users can view messages in rooms they participate in" ON public.chat_messages;
DROP POLICY IF EXISTS "Users can edit their own messages" ON public.chat_messages;

-- Criar políticas mais permissivas para permitir o uso básico do chat
-- Permitir que usuários autenticados vejam todas as mensagens de salas ativas
CREATE POLICY "Authenticated users can view messages in active rooms" ON public.chat_messages
  FOR SELECT USING (
    auth.uid() IS NOT NULL 
    AND EXISTS (
      SELECT 1 FROM chat_rooms cr 
      WHERE cr.id = chat_messages.room_id 
      AND cr.is_active = true
    )
  );

-- Permitir que usuários autenticados enviem mensagens para salas ativas
CREATE POLICY "Authenticated users can send messages to active rooms" ON public.chat_messages
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL 
    AND auth.uid() = sender_id
    AND EXISTS (
      SELECT 1 FROM chat_rooms cr 
      WHERE cr.id = chat_messages.room_id 
      AND cr.is_active = true
    )
  );

-- Permitir que usuários editem suas próprias mensagens
CREATE POLICY "Users can edit their own messages" ON public.chat_messages
  FOR UPDATE USING (auth.uid() = sender_id)
  WITH CHECK (auth.uid() = sender_id);

-- Criar função para obter usuários disponíveis para chat (caso não exista)
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
  FROM consultants c
  UNION ALL
  SELECT 
    cl.id::UUID as user_id,
    COALESCE(cl.contact_name, cl.name)::TEXT as name,
    COALESCE(cl.email, '')::TEXT,
    'client'::TEXT as type
  FROM clients cl;
END;
$$;
