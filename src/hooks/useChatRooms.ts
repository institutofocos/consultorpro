
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
      
      // Use the RPC function to get chat rooms with details
      const { data, error } = await supabase.rpc('get_chat_rooms_with_details');
      
      console.log('📞 RPC function result:', { data, error });
      
      if (error) {
        console.error('❌ RPC Error:', error);
        throw error;
      }
      
      const rooms = (data || []) as ChatRoom[];
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
