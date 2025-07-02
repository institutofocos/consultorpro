
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface ChatRoom {
  room_id: string;
  project_id: string | null;
  stage_id: string | null;
  room_type: 'project' | 'stage';
  is_active: boolean;
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
      
      console.log('🔍 Fetching chat rooms for user:', user.id);
      
      // Query basic chat rooms from existing structure
      const { data, error } = await supabase
        .from('chat_rooms')
        .select(`
          id,
          project_id,
          stage_id,
          room_type,
          is_active,
          created_at
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      
      console.log('📞 Chat rooms query result:', { data, error });
      
      if (error) {
        console.error('❌ Query Error:', error);
        throw error;
      }
      
      // Transform the data to match our ChatRoom interface
      const rooms: ChatRoom[] = (data || []).map((room) => ({
        room_id: room.id,
        project_id: room.project_id,
        stage_id: room.stage_id,
        room_type: room.room_type as 'project' | 'stage',
        is_active: room.is_active,
        room_name: `Room ${room.id.slice(0, 8)}`,
        room_description: null,
        created_by: null,
        parent_room_id: null,
        created_at: room.created_at
      }));
      
      console.log('✅ Final chat rooms:', rooms.length, rooms);
      
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
