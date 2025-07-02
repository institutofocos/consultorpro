
-- Function to get chat rooms with details
CREATE OR REPLACE FUNCTION public.get_chat_rooms_with_details()
RETURNS TABLE (
  id UUID,
  project_id UUID,
  stage_id UUID,
  room_type TEXT,
  is_active BOOLEAN,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  project JSONB,
  stage JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    cr.id,
    cr.project_id,
    cr.stage_id,
    cr.room_type,
    cr.is_active,
    cr.created_at,
    cr.updated_at,
    CASE 
      WHEN cr.room_type = 'project' THEN
        jsonb_build_object(
          'id', p.id,
          'name', p.name,
          'client_id', p.client_id,
          'clients', jsonb_build_object(
            'id', c.id,
            'name', c.name
          )
        )
      ELSE NULL
    END as project,
    CASE 
      WHEN cr.room_type = 'stage' THEN
        jsonb_build_object(
          'id', ps.id,
          'name', ps.name
        )
      ELSE NULL
    END as stage
  FROM public.chat_rooms cr
  LEFT JOIN public.projects p ON cr.project_id = p.id
  LEFT JOIN public.clients c ON p.client_id = c.id
  LEFT JOIN public.project_stages ps ON cr.stage_id = ps.id
  WHERE cr.is_active = true
  ORDER BY cr.created_at DESC;
END;
$$;

-- Function to send a chat message
CREATE OR REPLACE FUNCTION public.send_chat_message(
  p_room_id UUID,
  p_message_text TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  message_id UUID;
BEGIN
  INSERT INTO public.chat_messages (room_id, user_id, message_text)
  VALUES (p_room_id, auth.uid(), p_message_text)
  RETURNING id INTO message_id;
  
  RETURN message_id;
END;
$$;

-- Function to get chat messages
CREATE OR REPLACE FUNCTION public.get_chat_messages(p_room_id UUID)
RETURNS TABLE (
  id UUID,
  room_id UUID,
  user_id UUID,
  message_text TEXT,
  message_type TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  profiles JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    cm.id,
    cm.room_id,
    cm.user_id,
    cm.message_text,
    cm.message_type,
    cm.created_at,
    cm.updated_at,
    jsonb_build_object(
      'id', pr.id,
      'full_name', pr.full_name
    ) as profiles
  FROM public.chat_messages cm
  LEFT JOIN public.profiles pr ON cm.user_id = pr.id
  WHERE cm.room_id = p_room_id
  ORDER BY cm.created_at ASC;
END;
$$;

-- Function to add a chat participant
CREATE OR REPLACE FUNCTION public.add_chat_participant(
  p_room_id UUID,
  p_user_id UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  participant_id UUID;
BEGIN
  INSERT INTO public.chat_room_participants (room_id, user_id, added_by)
  VALUES (p_room_id, p_user_id, auth.uid())
  RETURNING id INTO participant_id;
  
  RETURN participant_id;
END;
$$;

-- Function to remove a chat participant
CREATE OR REPLACE FUNCTION public.remove_chat_participant(
  p_room_id UUID,
  p_user_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM public.chat_room_participants
  WHERE room_id = p_room_id AND user_id = p_user_id;
  
  RETURN TRUE;
END;
$$;

-- Function to get chat participants
CREATE OR REPLACE FUNCTION public.get_chat_participants(p_room_id UUID)
RETURNS TABLE (
  id UUID,
  room_id UUID,
  user_id UUID,
  added_by UUID,
  added_at TIMESTAMPTZ,
  profiles JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    crp.id,
    crp.room_id,
    crp.user_id,
    crp.added_by,
    crp.added_at,
    jsonb_build_object(
      'id', pr.id,
      'full_name', pr.full_name
    ) as profiles
  FROM public.chat_room_participants crp
  LEFT JOIN public.profiles pr ON crp.user_id = pr.id
  WHERE crp.room_id = p_room_id
  ORDER BY crp.added_at ASC;
END;
$$;
