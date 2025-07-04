
-- Função para debug das salas de chat (apenas para desenvolvimento)
CREATE OR REPLACE FUNCTION public.get_all_chat_rooms_debug()
RETURNS TABLE(
  id uuid,
  name text,
  participant_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    cr.id,
    cr.name,
    COUNT(crp.user_id) as participant_count
  FROM public.chat_rooms cr
  LEFT JOIN public.chat_room_participants crp ON cr.id = crp.room_id
  WHERE cr.is_active = true
  GROUP BY cr.id, cr.name
  ORDER BY cr.name;
END;
$$;

-- Função para verificar participações de um usuário específico
CREATE OR REPLACE FUNCTION public.get_user_chat_participations(p_user_id uuid)
RETURNS TABLE(
  room_id uuid,
  room_name text,
  can_read boolean,
  can_write boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    crp.room_id,
    cr.name as room_name,
    crp.can_read,
    crp.can_write
  FROM public.chat_room_participants crp
  JOIN public.chat_rooms cr ON crp.room_id = cr.id
  WHERE crp.user_id = p_user_id
  AND cr.is_active = true
  ORDER BY cr.name;
END;
$$;
