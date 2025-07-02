
-- Remover TODAS as políticas RLS das tabelas de chat e recriar de forma simples
DROP POLICY IF EXISTS "Users can view rooms they created" ON public.chat_rooms;
DROP POLICY IF EXISTS "Users can view rooms where they are participants" ON public.chat_rooms;
DROP POLICY IF EXISTS "Room creators can update rooms" ON public.chat_rooms;
DROP POLICY IF EXISTS "Room creators can delete rooms" ON public.chat_rooms;
DROP POLICY IF EXISTS "Users can create rooms" ON public.chat_rooms;

DROP POLICY IF EXISTS "Users can view participants where they are room creators" ON public.chat_room_participants;
DROP POLICY IF EXISTS "Users can view their own participation" ON public.chat_room_participants;
DROP POLICY IF EXISTS "Room creators can manage participants" ON public.chat_room_participants;

-- Criar políticas MUITO SIMPLES para chat_rooms (sem recursão)
CREATE POLICY "Allow authenticated users to view all chat rooms" ON public.chat_rooms
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Allow authenticated users to create chat rooms" ON public.chat_rooms
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = created_by);

CREATE POLICY "Allow room creators to update their rooms" ON public.chat_rooms
  FOR UPDATE USING (auth.uid() IS NOT NULL AND auth.uid() = created_by);

CREATE POLICY "Allow room creators to delete their rooms" ON public.chat_rooms
  FOR DELETE USING (auth.uid() IS NOT NULL AND auth.uid() = created_by);

-- Criar políticas MUITO SIMPLES para chat_room_participants (sem recursão)
CREATE POLICY "Allow authenticated users to view all participants" ON public.chat_room_participants
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Allow authenticated users to manage participants" ON public.chat_room_participants
  FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

-- Garantir que a tabela chat_room_participants existe e tem as colunas corretas
DO $$
BEGIN
  -- Verificar se a tabela existe, se não, criar
  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'chat_room_participants') THEN
    CREATE TABLE public.chat_room_participants (
      id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
      room_id UUID NOT NULL REFERENCES public.chat_rooms(id) ON DELETE CASCADE,
      user_id UUID NOT NULL,
      can_read BOOLEAN NOT NULL DEFAULT true,
      can_write BOOLEAN NOT NULL DEFAULT true,
      added_by UUID NOT NULL,
      added_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
      UNIQUE(room_id, user_id)
    );
    
    ALTER TABLE public.chat_room_participants ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;
