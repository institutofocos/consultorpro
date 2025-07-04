
-- Primeiro, vamos criar uma função para verificar se um usuário pode acessar um módulo
CREATE OR REPLACE FUNCTION public.user_can_access_module(module_name text, permission_type text DEFAULT 'view')
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  -- Se é Super Admin, tem acesso total
  IF public.user_is_super_admin() THEN
    RETURN true;
  END IF;
  
  -- Verificar permissões específicas do módulo
  RETURN EXISTS (
    SELECT 1 
    FROM public.user_profiles up
    JOIN public.access_profiles ap ON up.profile_id = ap.id
    JOIN public.profile_module_permissions pmp ON ap.id = pmp.profile_id
    WHERE up.user_id = auth.uid()
    AND pmp.module_name::text = module_name
    AND ap.is_active = true
    AND (
      (permission_type = 'view' AND pmp.can_view = true) OR
      (permission_type = 'edit' AND pmp.can_edit = true) OR
      (permission_type = 'delete' AND pmp.can_delete = true)
    )
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN false;
END;
$$;

-- Atualizar a função de visibilidade de salas para implementar as regras corretas
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

-- Função para atualizar participantes de uma sala e suas subsalas
CREATE OR REPLACE FUNCTION public.update_room_participants(
  p_room_id uuid, 
  p_participants jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  participant jsonb;
  current_user_id uuid;
BEGIN
  -- Get current user for security
  current_user_id := auth.uid();
  
  -- Verificar se o usuário pode gerenciar esta sala
  IF NOT EXISTS (
    SELECT 1 FROM chat_rooms 
    WHERE id = p_room_id 
    AND (created_by = current_user_id OR public.user_is_super_admin())
  ) THEN
    RAISE EXCEPTION 'Sem permissão para gerenciar esta sala';
  END IF;
  
  -- Limpar participantes existentes da sala específica
  DELETE FROM chat_room_participants WHERE room_id = p_room_id;
  
  -- Adicionar novos participantes
  FOR participant IN SELECT * FROM jsonb_array_elements(p_participants)
  LOOP
    INSERT INTO chat_room_participants (
      room_id, 
      user_id, 
      can_read, 
      can_write, 
      added_by
    ) VALUES (
      p_room_id,
      (participant->>'user_id')::uuid,
      (participant->>'can_read')::boolean,
      (participant->>'can_write')::boolean,
      current_user_id
    );
  END LOOP;
END;
$$;

-- Atualizar RLS policy para salas de chat usando a nova função
DROP POLICY IF EXISTS "Users can view chat rooms based on participation" ON public.chat_rooms;

CREATE POLICY "Users can view chat rooms based on participation"
ON public.chat_rooms
FOR SELECT
TO authenticated
USING (
  auth.uid() IS NOT NULL AND 
  user_can_view_chat_room(id, auth.uid())
);

-- Garantir que as políticas para participantes estejam corretas
DROP POLICY IF EXISTS "Users can manage room participants" ON public.chat_room_participants;

CREATE POLICY "Users can manage room participants"
ON public.chat_room_participants
FOR ALL
TO authenticated
USING (
  auth.uid() IS NOT NULL AND (
    -- Criador da sala pode gerenciar
    EXISTS (
      SELECT 1 FROM chat_rooms cr 
      WHERE cr.id = chat_room_participants.room_id 
      AND cr.created_by = auth.uid()
    ) OR
    -- Super Admin pode gerenciar
    public.user_is_super_admin()
  )
)
WITH CHECK (
  auth.uid() IS NOT NULL AND (
    -- Criador da sala pode gerenciar
    EXISTS (
      SELECT 1 FROM chat_rooms cr 
      WHERE cr.id = chat_room_participants.room_id 
      AND cr.created_by = auth.uid()
    ) OR
    -- Super Admin pode gerenciar
    public.user_is_super_admin()
  )
);
