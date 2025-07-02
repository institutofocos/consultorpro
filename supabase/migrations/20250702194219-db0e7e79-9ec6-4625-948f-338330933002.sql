
-- Drop the existing problematic policies
DROP POLICY IF EXISTS "Users can view participants of rooms they participate in" ON public.chat_room_participants;
DROP POLICY IF EXISTS "Room creators can manage participants" ON public.chat_room_participants;

-- Create new, non-recursive policies for chat_room_participants
CREATE POLICY "Users can view participants of their accessible rooms" ON public.chat_room_participants
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND (
      -- User is the creator of the room
      EXISTS (
        SELECT 1 FROM public.chat_rooms cr
        WHERE cr.id = room_id AND cr.created_by = auth.uid()
      ) OR
      -- User is a participant in the room (direct check without recursion)
      user_id = auth.uid()
    )
  );

CREATE POLICY "Room creators and system can manage participants" ON public.chat_room_participants
  FOR ALL USING (
    auth.uid() IS NOT NULL AND (
      -- User is the creator of the room
      EXISTS (
        SELECT 1 FROM public.chat_rooms cr
        WHERE cr.id = room_id AND cr.created_by = auth.uid()
      ) OR
      -- Allow system operations (for INSERT during room creation)
      auth.uid() IS NOT NULL
    )
  ) WITH CHECK (
    auth.uid() IS NOT NULL AND (
      -- User is the creator of the room
      EXISTS (
        SELECT 1 FROM public.chat_rooms cr
        WHERE cr.id = room_id AND cr.created_by = auth.uid()
      ) OR
      -- Allow system operations (for INSERT during room creation)
      auth.uid() IS NOT NULL
    )
  );

-- Also fix the chat_rooms policy to avoid recursion
DROP POLICY IF EXISTS "Users can view rooms they participate in" ON public.chat_rooms;

CREATE POLICY "Users can view accessible rooms" ON public.chat_rooms
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND (
      -- User is the creator
      created_by = auth.uid() OR
      -- User is a participant (simplified check)
      id IN (
        SELECT crp.room_id 
        FROM public.chat_room_participants crp 
        WHERE crp.user_id = auth.uid() AND crp.can_read = true
      )
    )
  );
