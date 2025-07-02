
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface ChatRoom {
  room_id: string;
  project_id: string | null;
  stage_id: string | null;
  room_type: 'project' | 'stage' | 'manual';
  is_active: boolean;
  is_manual: boolean;
  room_name: string | null;
  room_description: string | null;
  project_name: string | null;
  stage_name: string | null;
  client_name: string | null;
  created_at: string;
  created_by: string | null;
  parent_room_id: string | null;
}

export const useChatRooms = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: chatRooms, isLoading, error } = useQuery({
    queryKey: ['chat-rooms', user?.id],
    queryFn: async () => {
      if (!user?.id) {
        console.log('❌ User not authenticated');
        return [];
      }
      
      console.log('🔍 Fetching chat rooms for user:', user.id);
      
      // Query both automatic and manual chat rooms
      const { data, error } = await supabase
        .from('chat_rooms')
        .select(`
          id,
          project_id,
          stage_id,
          room_type,
          is_active,
          is_manual,
          room_name,
          room_description,
          created_by,
          parent_room_id,
          created_at,
          projects (
            id,
            name,
            clients (
              id,
              name
            )
          ),
          project_stages (
            id,
            name
          )
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      
      console.log('📞 Chat rooms query result:', { data, error });
      
      if (error) {
        console.error('❌ Query Error:', error);
        throw error;
      }
      
      // Transform the data to match our ChatRoom interface
      const rooms: ChatRoom[] = (data || []).map((room: any) => ({
        room_id: room.id,
        project_id: room.project_id,
        stage_id: room.stage_id,
        room_type: room.is_manual ? 'manual' : room.room_type,
        is_active: room.is_active,
        is_manual: room.is_manual,
        room_name: room.room_name,
        room_description: room.room_description,
        created_by: room.created_by,
        parent_room_id: room.parent_room_id,
        project_name: room.projects?.name || null,
        stage_name: room.project_stages?.name || null,
        client_name: room.projects?.clients?.name || null,
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
