
import { supabase } from './client';
import type { Database } from './types';

// Tipo para salas de chat
export type ChatRoom = Database['public']['Tables']['chat_rooms']['Row'];
export type ChatMessage = Database['public']['Tables']['chat_messages']['Row'];
export type ChatParticipant = Database['public']['Tables']['chat_room_participants']['Row'];

// Buscar salas de chat
export const fetchChatRooms = async () => {
  const { data, error } = await supabase
    .from('chat_rooms')
    .select('*')
    .order('level', { ascending: true })
    .order('created_at', { ascending: true });
  
  if (error) {
    console.error('Erro ao buscar salas de chat:', error);
    throw error;
  }
  
  return data;
};

// Buscar salas de chat por projeto
export const fetchChatRoomsByProject = async (projectId: string) => {
  const { data, error } = await supabase
    .from('chat_rooms')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: true });
  
  if (error) {
    console.error('Erro ao buscar salas de chat do projeto:', error);
    throw error;
  }
  
  return data;
};

// Buscar mensagens de uma sala
export const fetchChatMessages = async (roomId: string) => {
  const { data, error } = await supabase
    .from('chat_messages')
    .select('*')
    .eq('room_id', roomId)
    .order('timestamp', { ascending: true });
  
  if (error) {
    console.error('Erro ao buscar mensagens:', error);
    throw error;
  }
  
  return data;
};

// Enviar uma mensagem
export const sendChatMessage = async (roomId: string, senderId: string, senderName: string, content: string) => {
  const { data, error } = await supabase
    .from('chat_messages')
    .insert({
      room_id: roomId,
      sender_id: senderId,
      sender_name: senderName,
      content
    })
    .select();
  
  if (error) {
    console.error('Erro ao enviar mensagem:', error);
    throw error;
  }
  
  return data[0];
};

// Criar uma sala de chat
export const createChatRoom = async (name: string, description: string | null, level: number, parentId?: string, projectId?: string) => {
  const { data, error } = await supabase
    .from('chat_rooms')
    .insert({
      name,
      description,
      level,
      parent_id: parentId || null,
      project_id: projectId || null
    })
    .select();
  
  if (error) {
    console.error('Erro ao criar sala de chat:', error);
    throw error;
  }
  
  return data[0];
};

// Adicionar participante a uma sala
export const addChatParticipant = async (roomId: string, userId: string, userName: string, userRole: string) => {
  const { data, error } = await supabase
    .from('chat_room_participants')
    .insert({
      room_id: roomId,
      user_id: userId,
      user_name: userName,
      user_role: userRole
    })
    .select();
  
  if (error) {
    console.error('Erro ao adicionar participante:', error);
    throw error;
  }
  
  return data[0];
};

// Escutar por novas mensagens em tempo real
export const subscribeToChatMessages = (roomId: string, callback: (message: ChatMessage) => void) => {
  return supabase
    .channel(`room-${roomId}-messages`)
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'chat_messages',
      filter: `room_id=eq.${roomId}`
    }, (payload) => {
      callback(payload.new as ChatMessage);
    })
    .subscribe();
};
