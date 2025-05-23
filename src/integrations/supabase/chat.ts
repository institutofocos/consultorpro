
import { supabase } from './client';
import type { Database } from './types';

// Tipo para salas de chat
export type ChatRoom = Database['public']['Tables']['chat_rooms']['Row'];
export type ChatMessage = Database['public']['Tables']['chat_messages']['Row'];
export type ChatParticipant = Database['public']['Tables']['chat_room_participants']['Row'];
export type ChatRoomType = 'PROJECT' | 'DIRECT' | 'GROUP';

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

// Buscar salas de chat diretas do usuário
export const fetchDirectChatRooms = async (userId: string) => {
  // Primeiro, busque todas as salas em que o usuário é participante
  const { data: participations, error: participationsError } = await supabase
    .from('chat_room_participants')
    .select('room_id')
    .eq('user_id', userId);
  
  if (participationsError) {
    console.error('Erro ao buscar participações do usuário:', participationsError);
    throw participationsError;
  }
  
  if (!participations || participations.length === 0) {
    return [];
  }
  
  // Agora, busque as salas diretas usando os IDs obtidos
  const roomIds = participations.map(p => p.room_id);
  
  const { data, error } = await supabase
    .from('chat_rooms')
    .select('*')
    .in('id', roomIds)
    .is('project_id', null) // Salas diretas não têm projeto associado
    .eq('level', 1) // Salas diretas são de nível 1
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Erro ao buscar salas diretas:', error);
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

// Criar sala de conversa direta entre dois usuários
export const createDirectChatRoom = async (
  user1Id: string, 
  user1Name: string, 
  user1Role: string,
  user2Id: string, 
  user2Name: string,
  user2Role: string,
  roomName: string
) => {
  // Primeiro, crie a sala
  const { data: roomData, error: roomError } = await supabase
    .from('chat_rooms')
    .insert({
      name: roomName,
      description: 'Conversa direta',
      level: 1
    })
    .select();
  
  if (roomError || !roomData) {
    console.error('Erro ao criar sala de conversa direta:', roomError);
    throw roomError;
  }
  
  const roomId = roomData[0].id;
  
  // Adicione os dois usuários como participantes
  const participants = [
    {
      room_id: roomId,
      user_id: user1Id,
      user_name: user1Name,
      user_role: user1Role
    },
    {
      room_id: roomId,
      user_id: user2Id,
      user_name: user2Name,
      user_role: user2Role
    }
  ];
  
  const { error: participantsError } = await supabase
    .from('chat_room_participants')
    .insert(participants);
  
  if (participantsError) {
    console.error('Erro ao adicionar participantes:', participantsError);
    throw participantsError;
  }
  
  return roomData[0];
};

// Adicionar participante a uma sala
export const addChatParticipant = async (roomId: string, userId: string, userName: string, userRole: string) => {
  // Verificar se o participante já existe
  const { data: existingParticipant, error: checkError } = await supabase
    .from('chat_room_participants')
    .select('*')
    .eq('room_id', roomId)
    .eq('user_id', userId)
    .maybeSingle();
  
  if (checkError) {
    console.error('Erro ao verificar participante existente:', checkError);
    throw checkError;
  }
  
  // Se o participante já existe, retorne-o
  if (existingParticipant) {
    return existingParticipant;
  }
  
  // Caso contrário, adicione o novo participante
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

// Buscar participantes de uma sala
export const fetchChatParticipants = async (roomId: string) => {
  const { data, error } = await supabase
    .from('chat_room_participants')
    .select('*')
    .eq('room_id', roomId);
  
  if (error) {
    console.error('Erro ao buscar participantes:', error);
    throw error;
  }
  
  return data;
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

// Criar sala de chat automaticamente para um projeto
export const ensureProjectChatRoom = async (projectId: string, projectName: string) => {
  // Verificar se já existe uma sala para o projeto
  const { data: existingRooms, error: checkError } = await supabase
    .from('chat_rooms')
    .select('*')
    .eq('project_id', projectId)
    .maybeSingle();
  
  if (checkError) {
    console.error('Erro ao verificar sala de projeto existente:', checkError);
    throw checkError;
  }
  
  // Se a sala já existe, retorne-a
  if (existingRooms) {
    return existingRooms;
  }
  
  // Caso contrário, crie uma nova sala para o projeto
  const { data, error } = await supabase
    .from('chat_rooms')
    .insert({
      name: `Chat: ${projectName}`,
      description: `Sala de chat para o projeto ${projectName}`,
      level: 1,
      project_id: projectId
    })
    .select();
  
  if (error) {
    console.error('Erro ao criar sala de chat para o projeto:', error);
    throw error;
  }
  
  return data[0];
};
