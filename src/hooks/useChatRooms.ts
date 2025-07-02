
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface ChatRoom {
  room_id: string;
  project_id: string | null;
  stage_id: string | null;
  room_type: 'manual';
  is_active: boolean;
  is_manual: boolean;
  room_name: string | null;
  room_description: string | null;
  created_at: string;
  created_by: string | null;
  parent_room_id: string | null;
}

export const useChatRooms = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: chatRooms, isLoading, error } = useQuery({
    queryKey: ['chat-rooms', user?.id],
    queryFn: async (): Promise<ChatRoom[]> => {
      if (!user?.id) {
        console.log('❌ User not authenticated');
        return [];
      }
      
      console.log('🔍 Fetching manual chat rooms for user:', user.id);
      
      // Query only manual chat rooms that the user has permission to access
      const { data, error } = await supabase
        .from('chat_rooms')
        .select(`
          id,
          room_type,
          is_active,
          is_manual,
          room_name,
          room_description,
          created_by,
          parent_room_id,
          created_at
        `)
        .eq('is_active', true)
        .eq('is_manual', true)
        .order('created_at', { ascending: false });
      
      console.log('📞 Manual chat rooms query result:', { data, error });
      
      if (error) {
        console.error('❌ Query Error:', error);
        throw error;
      }
      
      // Transform the data to match our ChatRoom interface
      const rooms: ChatRoom[] = (data || []).map((room) => ({
        room_id: room.id,
        project_id: null,
        stage_id: null,
        room_type: 'manual' as const,
        is_active: room.is_active,
        is_manual: true,
        room_name: room.room_name,
        room_description: room.room_description,
        created_by: room.created_by,
        parent_room_id: room.parent_room_id,
        created_at: room.created_at
      }));
      
      console.log('✅ Final manual chat rooms:', rooms.length, rooms);
      
      return rooms;
    },
    enabled: !!user?.id,
  });

  const refreshRooms = () => {
    queryClient.invalidateQueries({ queryKey: ['chat-rooms'] });
  };

  return {
    chatRooms: chatRooms || [],
    isLoading,
    error,
    refreshRooms
  };
};
