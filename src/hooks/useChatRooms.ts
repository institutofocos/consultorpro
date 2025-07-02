
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
        .from('chat_rooms')
        .select(`
          *,
          projects:project_id (
            id,
            name,
            client_id,
            clients (
              id,
              name
            )
          ),
          project_stages:stage_id (
            id,
            name
          )
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as ChatRoom[];
    },
  });

  const sendMessage = useMutation({
    mutationFn: async ({ roomId, message }: { roomId: string; message: string }) => {
      const { data, error } = await supabase
        .from('chat_messages')
        .insert({
          room_id: roomId,
          message_text: message,
          user_id: (await supabase.auth.getUser()).data.user?.id!,
        })
        .select()
        .single();

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
        .from('chat_room_participants')
        .insert({
          room_id: roomId,
          user_id: userId,
          added_by: (await supabase.auth.getUser()).data.user?.id!,
        })
        .select()
        .single();

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
      const { error } = await supabase
        .from('chat_room_participants')
        .delete()
        .eq('room_id', roomId)
        .eq('user_id', userId);

      if (error) throw error;
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
        .from('chat_messages')
        .select(`
          *,
          profiles:user_id (
            id,
            full_name
          )
        `)
        .eq('room_id', roomId)
        .order('created_at', { ascending: true });

      if (error) throw error;
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
        .from('chat_room_participants')
        .select(`
          *,
          profiles:user_id (
            id,
            full_name
          )
        `)
        .eq('room_id', roomId)
        .order('added_at', { ascending: true });

      if (error) throw error;
      return data as ChatParticipant[];
    },
    enabled: !!roomId,
  });
};
