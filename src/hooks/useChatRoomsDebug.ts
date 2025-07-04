
import { supabase } from '@/integrations/supabase/client';

export const debugChatRoomVisibility = async (userId: string) => {
  console.log('=== DEBUG CHAT ROOM VISIBILITY ===');
  console.log('User ID:', userId);
  
  // Verificar todas as salas (bypass RLS para debug)
  const { data: allRooms, error: allRoomsError } = await supabase
    .rpc('get_all_chat_rooms_debug');
  
  if (allRoomsError) {
    console.error('Erro ao buscar todas as salas:', allRoomsError);
  } else {
    console.log('Total de salas no sistema:', allRooms?.length || 0);
  }
  
  // Verificar participações do usuário
  const { data: participations, error: participationsError } = await supabase
    .from('chat_room_participants')
    .select('room_id, can_read, can_write')
    .eq('user_id', userId);
  
  if (participationsError) {
    console.error('Erro ao buscar participações:', participationsError);
  } else {
    console.log('Participações do usuário:', participations);
  }
  
  // Verificar salas visíveis via RLS
  const { data: visibleRooms, error: visibleRoomsError } = await supabase
    .from('chat_rooms')
    .select('id, name')
    .eq('is_active', true);
  
  if (visibleRoomsError) {
    console.error('Erro ao buscar salas visíveis:', visibleRoomsError);
  } else {
    console.log('Salas visíveis via RLS:', visibleRooms);
  }
  
  console.log('=== FIM DEBUG ===');
};
