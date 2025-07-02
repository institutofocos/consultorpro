
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface CreateManualRoomParams {
  room_name: string;
  room_description?: string;
  parent_room_id?: string;
}

interface AddRoomMemberParams {
  room_id: string;
  participant_type: 'user' | 'consultant' | 'client';
  participant_id: string;
  can_view?: boolean;
  can_send_messages?: boolean;
  can_manage_room?: boolean;
}

export const useManualChatRooms = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const createManualRoomMutation = useMutation({
    mutationFn: async (params: CreateManualRoomParams) => {
      if (!user?.id) throw new Error('User not authenticated');
      
      console.log('🏗️ Creating manual chat room:', params);
      
      const { data, error } = await supabase
        .from('chat_rooms')
        .insert({
          is_manual: true,
          room_type: 'manual',
          room_name: params.room_name,
          room_description: params.room_description,
          parent_room_id: params.parent_room_id,
          created_by: user.id,
          project_id: null // Manual rooms don't need a project
        })
        .select()
        .single();
      
      if (error) {
        console.error('❌ Error creating manual room:', error);
        throw error;
      }
      
      // Automatically add the creator as a room manager
      await supabase.rpc('add_chat_room_member', {
        p_room_id: data.id,
        p_participant_type: 'user',
        p_participant_id: user.id,
        p_can_view: true,
        p_can_send_messages: true,
        p_can_manage_room: true
      });
      
      console.log('✅ Manual room created successfully:', data);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat-rooms'] });
      toast.success('Sala de chat criada com sucesso!');
    },
    onError: (error: any) => {
      console.error('💥 Error creating manual room:', error);
      toast.error('Erro ao criar sala de chat: ' + (error.message || 'Erro desconhecido'));
    }
  });

  const addRoomMemberMutation = useMutation({
    mutationFn: async (params: AddRoomMemberParams) => {
      console.log('👥 Adding member to room:', params);
      
      const { data, error } = await supabase.rpc('add_chat_room_member', {
        p_room_id: params.room_id,
        p_participant_type: params.participant_type,
        p_participant_id: params.participant_id,
        p_can_view: params.can_view ?? true,
        p_can_send_messages: params.can_send_messages ?? true,
        p_can_manage_room: params.can_manage_room ?? false
      });
      
      if (error) {
        console.error('❌ Error adding room member:', error);
        throw error;
      }
      
      console.log('✅ Member added successfully');
      return data;
    },
    onSuccess: () => {
      toast.success('Membro adicionado com sucesso!');
    },
    onError: (error: any) => {
      console.error('💥 Error adding room member:', error);
      toast.error('Erro ao adicionar membro: ' + (error.message || 'Erro desconhecido'));
    }
  });

  const createManualRoom = (params: CreateManualRoomParams) => {
    createManualRoomMutation.mutate(params);
  };

  const addRoomMember = (params: AddRoomMemberParams) => {
    addRoomMemberMutation.mutate(params);
  };

  return {
    createManualRoom,
    addRoomMember,
    isCreatingRoom: createManualRoomMutation.isPending,
    isAddingMember: addRoomMemberMutation.isPending
  };
};
