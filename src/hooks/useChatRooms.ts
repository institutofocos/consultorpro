
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface ChatRoom {
  room_id: string;
  project_id: string;
  stage_id: string | null;
  room_type: 'project' | 'stage';
  is_active: boolean;
  project_name: string;
  stage_name: string | null;
  client_name: string | null;
  created_at: string;
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
      
      // Use a direct query instead of RPC to avoid TypeScript issues
      const { data, error } = await supabase
        .from('chat_rooms')
        .select(`
          id,
          project_id,
          stage_id,
          room_type,
          is_active,
          created_at,
          projects!inner (
            name,
            clients (
              name
            )
          ),
          project_stages (
            name
          )
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      
      console.log('📞 Direct query result:', { data, error });
      
      if (error) {
        console.error('❌ Query Error:', error);
        throw error;
      }
      
      // Transform the data to match our ChatRoom interface
      const rooms: ChatRoom[] = (data || []).map((room: any) => ({
        room_id: room.id,
        project_id: room.project_id,
        stage_id: room.stage_id,
        room_type: room.room_type,
        is_active: room.is_active,
        project_name: room.projects?.name || 'Unknown Project',
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
