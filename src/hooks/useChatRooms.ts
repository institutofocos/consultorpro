
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
            clients:client_id (
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

      if (error) {
        console.error('Error fetching chat rooms:', error);
        return [];
      }

      // Transform the data to match our ChatRoom interface
      return (data || []).map(room => ({
        id: room.id,
        project_id: room.project_id,
        stage_id: room.stage_id,
        room_type: room.room_type as 'project' | 'stage',
        is_active: room.is_active,
        created_at: room.created_at,
        updated_at: room.updated_at,
        project: room.projects ? {
          id: room.projects.id,
          name: room.projects.name,
          client_id: room.projects.client_id,
          clients: room.projects.clients ? {
            id: room.projects.clients.id,
            name: room.projects.clients.name
          } : undefined
        } : undefined,
        stage: room.project_stages ? {
          id: room.project_stages.id,
          name: room.project_stages.name
        } : undefined
      })) as ChatRoom[];
    },
  });

  const sendMessage = useMutation({
    mutationFn: async ({ roomId, message }: { roomId: string; message: string }) => {
      const { data, error } = await supabase
        .from('chat_messages')
        .insert({
          room_id: roomId,
          message_text: message,
          user_id: (await supabase.auth.getUser()).data.user?.id
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
          added_by: (await supabase.auth.getUser()).data.user?.id
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
      const { data, error } = await supabase
        .from('chat_room_participants')
        .delete()
        .eq('room_id', roomId)
        .eq('user_id', userId);

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

      if (error) {
        console.error('Error fetching chat messages:', error);
        return [];
      }

      // Transform the data to match our ChatMessage interface
      return (data || []).map(message => ({
        id: message.id,
        room_id: message.room_id,
        user_id: message.user_id,
        message_text: message.message_text,
        message_type: message.message_type as 'user' | 'ai' | 'system',
        created_at: message.created_at,
        updated_at: message.updated_at,
        profiles: message.profiles ? {
          id: message.profiles.id,
          full_name: message.profiles.full_name
        } : undefined
      })) as ChatMessage[];
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

      if (error) {
        console.error('Error fetching chat participants:', error);
        return [];
      }

      // Transform the data to match our ChatParticipant interface
      return (data || []).map(participant => ({
        id: participant.id,
        room_id: participant.room_id,
        user_id: participant.user_id,
        added_by: participant.added_by,
        added_at: participant.added_at,
        profiles: participant.profiles ? {
          id: participant.profiles.id,
          full_name: participant.profiles.full_name
        } : undefined
      })) as ChatParticipant[];
    },
    enabled: !!roomId,
  });
};
