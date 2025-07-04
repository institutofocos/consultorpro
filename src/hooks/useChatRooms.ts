import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface ChatRoom {
  id: string;
  name: string;
  description?: string;
  level: number;
  parent_room_id?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
  is_pinned?: boolean;
  meeting_link?: string;
}

export interface ChatMessage {
  id: string;
  room_id: string;
  sender_id: string;
  sender_name: string;
  message: string;
  created_at: string;
  edited_at?: string;
  is_deleted: boolean;
}

export interface ChatUser {
  user_id: string;
  name: string;
  email: string;
  type: 'consultant' | 'client';
}

export const useChatRooms = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['chat-rooms'],
    queryFn: async () => {
      if (!user?.id) {
        console.log('Usuário não está logado, não carregando salas');
        return [];
      }
      
      console.log('Carregando salas de chat para usuário:', user.id);
      
      const { data, error } = await supabase
        .from('chat_rooms')
        .select('*')
        .eq('is_active', true)
        .order('level', { ascending: true })
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erro ao carregar salas:', error);
        throw error;
      }
      
      // Buscar salas fixadas do localStorage para o usuário atual
      const pinnedRooms = JSON.parse(localStorage.getItem(`pinned_rooms_${user?.id}`) || '[]');
      
      // Adicionar a propriedade is_pinned baseada no localStorage
      const roomsWithPinned = data?.map(room => ({
        ...room,
        is_pinned: pinnedRooms.includes(room.id)
      })) || [];
      
      console.log('Salas carregadas com sucesso:', roomsWithPinned.length, 'salas');
      console.log('Detalhes das salas:', roomsWithPinned);
      
      return roomsWithPinned as ChatRoom[];
    },
    enabled: !!user,
  });
};

export const useChatMessages = (roomId: string | null) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['chat-messages', roomId],
    queryFn: async () => {
      if (!roomId) return [];

      console.log('Carregando mensagens para sala:', roomId);
      
      // Buscar mensagens do último dia para evitar sobrecarga
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('room_id', roomId)
        .eq('is_deleted', false)
        .gte('created_at', yesterday.toISOString())
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Erro ao carregar mensagens:', error);
        throw error;
      }
      
      console.log('Mensagens carregadas:', data?.length || 0);
      return data as ChatMessage[];
    },
    enabled: !!user && !!roomId,
  });
};

export const useAvailableUsers = () => {
  return useQuery({
    queryKey: ['available-chat-users'],
    queryFn: async () => {
      console.log('Carregando usuários disponíveis...');
      
      // Buscar consultores
      const { data: consultants, error: consultantsError } = await supabase
        .from('consultants')
        .select('id, name, email');
      
      if (consultantsError) {
        console.error('Erro ao carregar consultores:', consultantsError);
      }
      
      // Buscar clientes
      const { data: clients, error: clientsError } = await supabase
        .from('clients')
        .select('id, name, email, contact_name');
      
      if (clientsError) {
        console.error('Erro ao carregar clientes:', clientsError);
      }
      
      // Combinar e formatar os dados
      const users: ChatUser[] = [];
      
      if (consultants) {
        consultants.forEach(consultant => {
          users.push({
            user_id: consultant.id,
            name: consultant.name,
            email: consultant.email || '',
            type: 'consultant'
          });
        });
      }
      
      if (clients) {
        clients.forEach(client => {
          users.push({
            user_id: client.id,
            name: client.contact_name || client.name,
            email: client.email || '',
            type: 'client'
          });
        });
      }
      
      console.log('Usuários disponíveis:', users.length);
      return users;
    },
  });
};

export const useCreateChatRoom = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (params: {
      name: string;
      description?: string;
      parent_room_id?: string;
      level: number;
      participants: { user_id: string; can_read: boolean; can_write: boolean }[];
    }) => {
      console.log('Criando sala de chat:', params);
      
      // Criar a sala de chat
      const { data: room, error: roomError } = await supabase
        .from('chat_rooms')
        .insert([
          {
            name: params.name,
            description: params.description,
            parent_room_id: params.parent_room_id,
            level: params.level,
            created_by: user?.id,
          },
        ])
        .select()
        .single();

      if (roomError) {
        console.error('Erro ao criar sala:', roomError);
        throw roomError;
      }

      console.log('Sala criada:', room);

      // Adicionar participantes se fornecidos
      if (params.participants.length > 0) {
        const participantsData = params.participants.map((p) => ({
          room_id: room.id,
          user_id: p.user_id,
          can_read: p.can_read,
          can_write: p.can_write,
          added_by: user?.id,
        }));

        console.log('Adicionando participantes:', participantsData);

        const { error: participantsError } = await supabase
          .from('chat_room_participants')
          .insert(participantsData);

        if (participantsError) {
          console.error('Erro ao adicionar participantes:', participantsError);
          throw participantsError;
        }
      }

      return room;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat-rooms'] });
    },
  });
};

export const useSendMessage = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (params: {
      room_id: string;
      message: string;
      sender_name: string;
    }) => {
      console.log('Enviando mensagem:', params);
      console.log('Usuário logado:', user?.id);
      
      if (!user?.id) {
        throw new Error('Usuário não autenticado');
      }
      
      const { data, error } = await supabase
        .from('chat_messages')
        .insert([
          {
            room_id: params.room_id,
            sender_id: user.id,
            sender_name: params.sender_name,
            message: params.message,
          },
        ])
        .select()
        .single();

      if (error) {
        console.error('Erro detalhado ao enviar mensagem:', error);
        throw error;
      }
      
      console.log('Mensagem enviada com sucesso:', data);
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['chat-messages', variables.room_id] });
    },
  });
};

export const useDeleteChatRoom = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (roomId: string) => {
      console.log('Excluindo sala:', roomId);
      
      const { error } = await supabase
        .from('chat_rooms')
        .update({ is_active: false })
        .eq('id', roomId);

      if (error) {
        console.error('Erro ao excluir sala:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat-rooms'] });
    },
  });
};

export const useUpdateChatRoom = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      id: string;
      name: string;
      description?: string;
      meeting_link?: string | null;
    }) => {
      console.log('Atualizando sala de chat:', params);
      
      const { data, error } = await supabase
        .from('chat_rooms')
        .update({
          name: params.name,
          description: params.description,
          meeting_link: params.meeting_link,
          updated_at: new Date().toISOString(),
        })
        .eq('id', params.id)
        .select()
        .single();

      if (error) {
        console.error('Erro ao atualizar sala:', error);
        throw error;
      }
      
      console.log('Sala atualizada:', data);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat-rooms'] });
    },
  });
};

export const usePinChatRoom = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (params: { roomId: string; isPinned: boolean }) => {
      if (!user?.id) {
        throw new Error('Usuário não autenticado');
      }

      console.log('Alterando status de fixação da sala:', params);
      
      // Buscar salas fixadas atuais do localStorage
      const pinnedRooms = JSON.parse(localStorage.getItem(`pinned_rooms_${user.id}`) || '[]');
      
      let updatedPinnedRooms;
      if (params.isPinned) {
        // Adicionar à lista de fixadas se não estiver
        if (!pinnedRooms.includes(params.roomId)) {
          updatedPinnedRooms = [...pinnedRooms, params.roomId];
        } else {
          updatedPinnedRooms = pinnedRooms;
        }
      } else {
        // Remover da lista de fixadas
        updatedPinnedRooms = pinnedRooms.filter((id: string) => id !== params.roomId);
      }
      
      // Salvar no localStorage
      localStorage.setItem(`pinned_rooms_${user.id}`, JSON.stringify(updatedPinnedRooms));
      
      return { roomId: params.roomId, isPinned: params.isPinned };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat-rooms'] });
    },
  });
};

export const useRoomParticipants = (roomId: string | null) => {
  return useQuery({
    queryKey: ['room-participants', roomId],
    queryFn: async () => {
      if (!roomId) return [];

      console.log('Carregando participantes da sala:', roomId);
      
      const { data, error } = await supabase.rpc('get_room_participants', {
        p_room_id: roomId
      });

      if (error) {
        console.error('Erro ao carregar participantes:', error);
        throw error;
      }
      
      console.log('Participantes carregados:', data?.length || 0);
      return data || [];
    },
    enabled: !!roomId,
  });
};

export const useUpdateRoomParticipants = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      roomId: string;
      participants: { user_id: string; can_read: boolean; can_write: boolean }[];
    }) => {
      console.log('Atualizando participantes da sala:', params);
      
      const { error } = await supabase.rpc('update_room_participants', {
        p_room_id: params.roomId,
        p_participants: params.participants
      });

      if (error) {
        console.error('Erro ao atualizar participantes:', error);
        throw error;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['chat-rooms'] });
      queryClient.invalidateQueries({ queryKey: ['room-participants', variables.roomId] });
    },
  });
};
