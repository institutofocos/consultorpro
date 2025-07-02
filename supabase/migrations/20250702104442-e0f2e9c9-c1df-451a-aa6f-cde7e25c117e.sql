
-- Create chat_rooms table
CREATE TABLE public.chat_rooms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  stage_id UUID REFERENCES public.project_stages(id) ON DELETE CASCADE,
  room_type TEXT NOT NULL CHECK (room_type IN ('project', 'stage')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create chat_messages table
CREATE TABLE public.chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID NOT NULL REFERENCES public.chat_rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message_text TEXT NOT NULL,
  message_type TEXT NOT NULL DEFAULT 'user' CHECK (message_type IN ('user', 'ai', 'system')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create chat_room_participants table
CREATE TABLE public.chat_room_participants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID NOT NULL REFERENCES public.chat_rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  added_by UUID REFERENCES auth.users(id),
  added_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(room_id, user_id)
);

-- Enable RLS on all chat tables
ALTER TABLE public.chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_room_participants ENABLE ROW LEVEL SECURITY;

-- RLS policies for chat_rooms
CREATE POLICY "Users can view chat rooms they have access to" ON public.chat_rooms
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.chat_room_participants crp 
      WHERE crp.room_id = id AND crp.user_id = auth.uid()
    ) OR user_is_super_admin()
  );

CREATE POLICY "Super admins can manage chat rooms" ON public.chat_rooms
  FOR ALL USING (user_is_super_admin());

-- RLS policies for chat_messages
CREATE POLICY "Users can view messages in rooms they participate in" ON public.chat_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.chat_room_participants crp 
      WHERE crp.room_id = room_id AND crp.user_id = auth.uid()
    ) OR user_is_super_admin()
  );

CREATE POLICY "Users can send messages to rooms they participate in" ON public.chat_messages
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    (EXISTS (
      SELECT 1 FROM public.chat_room_participants crp 
      WHERE crp.room_id = room_id AND crp.user_id = auth.uid()
    ) OR user_is_super_admin())
  );

-- RLS policies for chat_room_participants
CREATE POLICY "Users can view participants in rooms they participate in" ON public.chat_room_participants
  FOR SELECT USING (
    user_id = auth.uid() OR 
    EXISTS (
      SELECT 1 FROM public.chat_room_participants crp 
      WHERE crp.room_id = room_id AND crp.user_id = auth.uid()
    ) OR user_is_super_admin()
  );

CREATE POLICY "Super admins can manage participants" ON public.chat_room_participants
  FOR ALL USING (user_is_super_admin());

-- Triggers to create chat rooms automatically
CREATE OR REPLACE FUNCTION public.create_project_chat_room()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.chat_rooms (project_id, room_type)
  VALUES (NEW.id, 'project');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.create_stage_chat_room()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.chat_rooms (project_id, stage_id, room_type)
  VALUES (NEW.project_id, NEW.id, 'stage');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers
CREATE TRIGGER trigger_create_project_chat_room
  AFTER INSERT ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.create_project_chat_room();

CREATE TRIGGER trigger_create_stage_chat_room
  AFTER INSERT ON public.project_stages
  FOR EACH ROW EXECUTE FUNCTION public.create_stage_chat_room();
