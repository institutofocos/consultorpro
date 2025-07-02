
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
      console.log('Carregando salas de chat...');
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
      
      console.log('Salas carregadas:', data);
      return data as ChatRoom[];
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
