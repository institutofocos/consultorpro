
-- Corrigir erro na tabela chat_rooms removendo referência incorreta a project_id
-- e simplificar as políticas RLS para evitar interferência com projetos

-- Primeiro, vamos corrigir a função user_can_view_chat_room para ser mais simples
CREATE OR REPLACE FUNCTION public.user_can_view_chat_room(room_id uuid, user_id uuid)
RETURNS boolean
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
  
  -- Se não há participantes, todos podem ver (salas públicas)
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

-- Simplificar a política RLS para chat_rooms
DROP POLICY IF EXISTS "Users can view chat rooms based on participation" ON public.chat_rooms;

CREATE POLICY "Users can view chat rooms based on participation"
ON public.chat_rooms
FOR SELECT
TO authenticated
USING (
  auth.uid() IS NOT NULL AND user_can_view_chat_room(id, auth.uid())
);

-- Garantir que as políticas RLS para outras tabelas não tenham conflitos
-- Verificar se há alguma política problemática que possa estar interferindo

-- Log de correção
INSERT INTO public.system_logs (log_type, category, message, details)
VALUES (
  'info', 
  'chat_fix_project_interference', 
  'Corrigido problema de interferência do chat com projetos',
  jsonb_build_object(
    'timestamp', NOW(),
    'action', 'remove_project_interference',
    'description', 'Removidas referências incorretas que causavam erro ao criar projetos'
  )
);
