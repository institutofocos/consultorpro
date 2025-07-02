
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ChatRoom, ChatMessage, ChatParticipant } from '@/types/chat';
import { toast } from 'sonner';

export const useChatRooms = () => {
  const queryClient = useQueryClient();

  const { data: rooms, isLoading: roomsLoading } = useQuery({
    queryKey: ['chat-rooms'],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc('get_chat_rooms_with_details');

      if (error) {
        console.error('Error fetching chat rooms:', error);
        return [];
      }
      return data as ChatRoom[];
    },
  });

  const sendMessage = useMutation({
    mutationFn: async ({ roomId, message }: { roomId: string; message: string }) => {
      const { data, error } = await supabase
        .rpc('send_chat_message', {
          p_room_id: roomId,
          p_message_text: message
        });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat-messages'] });
    },
    onError: (error) => {
      console.error('Error sending message:', error);
      toast.error('Erro ao enviar mensagem');
    },
  });

  const addParticipant = useMutation({
    mutationFn: async ({ roomId, userId }: { roomId: string; userId: string }) => {
      const { data, error } = await supabase
        .rpc('add_chat_participant', {
          p_room_id: roomId,
          p_user_id: userId
        });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat-participants'] });
      toast.success('Participante adicionado com sucesso');
    },
    onError: (error) => {
      console.error('Error adding participant:', error);
      toast.error('Erro ao adicionar participante');
    },
  });

  const removeParticipant = useMutation({
    mutationFn: async ({ roomId, userId }: { roomId: string; userId: string }) => {
      const { data, error } = await supabase
        .rpc('remove_chat_participant', {
          p_room_id: roomId,
          p_user_id: userId
        });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat-participants'] });
      toast.success('Participante removido com sucesso');
    },
    onError: (error) => {
      console.error('Error removing participant:', error);
      toast.error('Erro ao remover participante');
    },
  });

  return {
    rooms,
    roomsLoading,
    sendMessage,
    addParticipant,
    removeParticipant,
  };
};

export const useChatMessages = (roomId: string) => {
  return useQuery({
    queryKey: ['chat-messages', roomId],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc('get_chat_messages', {
          p_room_id: roomId
        });

      if (error) {
        console.error('Error fetching chat messages:', error);
        return [];
      }
      return data as ChatMessage[];
    },
    enabled: !!roomId,
  });
};

export const useChatParticipants = (roomId: string) => {
  return useQuery({
    queryKey: ['chat-participants', roomId],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc('get_chat_participants', {
          p_room_id: roomId
        });

      if (error) {
        console.error('Error fetching chat participants:', error);
        return [];
      }
      return data as ChatParticipant[];
    },
    enabled: !!roomId,
  });
};
