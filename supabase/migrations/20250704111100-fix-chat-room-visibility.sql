
-- Corrigir a função de visibilidade das salas de chat para funcionar corretamente
CREATE OR REPLACE FUNCTION public.user_can_view_chat_room(room_id uuid, user_id uuid)
RETURNS boolean
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

-- Recriar a política RLS para chat_rooms de forma mais restritiva
DROP POLICY IF EXISTS "Users can view chat rooms based on participation" ON public.chat_rooms;

CREATE POLICY "Users can view chat rooms based on participation"
ON public.chat_rooms
FOR SELECT
TO authenticated
USING (
  auth.uid() IS NOT NULL AND user_can_view_chat_room(id, auth.uid())
);

-- Log para debug
INSERT INTO public.system_logs (log_type, category, message, details)
VALUES (
  'info', 
  'chat_visibility_fix', 
  'Política RLS de visibilidade das salas de chat corrigida',
  jsonb_build_object(
    'timestamp', NOW(),
    'action', 'fix_chat_room_visibility',
    'description', 'Removida verificação duplicada de Super Admin na política RLS'
  )
);
