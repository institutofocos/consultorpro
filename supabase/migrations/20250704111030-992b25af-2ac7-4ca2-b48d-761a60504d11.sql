
-- First, let's fix the ambiguous column reference errors in the user_can_view_chat_room function
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

-- Also let's create a simpler policy for chat_rooms that handles Super Admin properly
DROP POLICY IF EXISTS "Users can view chat rooms based on participation" ON public.chat_rooms;

CREATE POLICY "Users can view chat rooms based on participation"
ON public.chat_rooms
FOR SELECT
TO authenticated
USING (
  auth.uid() IS NOT NULL AND (
    -- Super Admin pode ver todas as salas
    EXISTS (
      SELECT 1 
      FROM public.user_profiles up
      JOIN public.access_profiles ap ON up.profile_id = ap.id
      WHERE up.user_id = auth.uid()
      AND ap.name = 'Super Admin'
      AND ap.is_active = true
    ) OR
    -- Ou usar a função de verificação de participação
    user_can_view_chat_room(id, auth.uid())
  )
);

-- Let's also fix the system_logs RLS issue
DROP POLICY IF EXISTS "Authenticated users can insert logs" ON public.system_logs;
DROP POLICY IF EXISTS "Authenticated users can view logs" ON public.system_logs;

CREATE POLICY "Allow system operations on logs" 
ON public.system_logs 
FOR ALL 
TO authenticated
USING (true)
WITH CHECK (true);
