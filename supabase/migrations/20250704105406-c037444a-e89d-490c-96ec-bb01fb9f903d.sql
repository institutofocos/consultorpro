
-- Atualizar a função para permitir que Super Admins vejam todas as salas
CREATE OR REPLACE FUNCTION user_can_view_chat_room(room_id UUID, user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  participant_count INTEGER;
  user_is_participant BOOLEAN;
  is_super_admin BOOLEAN;
BEGIN
  -- Verificar se o usuário é Super Admin
  SELECT EXISTS(
    SELECT 1 
    FROM public.user_profiles up
    JOIN public.access_profiles ap ON up.profile_id = ap.id
    WHERE up.user_id = user_id
    AND ap.name = 'Super Admin'
    AND ap.is_active = true
  ) INTO is_super_admin;
  
  -- Se é Super Admin, tem acesso a todas as salas
  IF is_super_admin THEN
    RETURN TRUE;
  END IF;
  
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
