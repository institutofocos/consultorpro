
import { supabase } from '@/integrations/supabase/client';

export const debugChatRoomVisibility = async (userId: string) => {
  console.log('=== DEBUG CHAT ROOM VISIBILITY ===');
  console.log('User ID:', userId);
  
  // Verificar todas as salas (usando query direta em vez de RPC)
  const { data: allRooms, error: allRoomsError } = await supabase
    .from('chat_rooms')
    .select(`
      id,
      name,
      is_active,
      created_by,
      level,
      parent_room_id
    `)
    .eq('is_active', true);
  
  if (allRoomsError) {
    console.error('Erro ao buscar todas as salas:', allRoomsError);
  } else {
    console.log('Total de salas no sistema:', allRooms?.length || 0);
    console.log('Detalhes das salas:', allRooms);
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
  
  // Verificar se o usuário tem perfil de acesso
  const { data: userProfile, error: profileError } = await supabase
    .from('user_profiles')
    .select(`
      profile_id,
      access_profiles!inner(
        name,
        is_active
      )
    `)
    .eq('user_id', userId)
    .single();
  
  if (profileError) {
    console.log('Usuário não tem perfil de acesso definido:', profileError.message);
  } else {
    console.log('Perfil do usuário:', userProfile);
  }
  
  // Testar função de visibilidade diretamente para cada sala
  if (allRooms && allRooms.length > 0) {
    console.log('=== TESTANDO VISIBILIDADE POR SALA ===');
    for (const room of allRooms) {
      const { data: canView, error: canViewError } = await supabase.rpc('user_can_view_chat_room', {
        room_id: room.id,
        user_id: userId
      });
      
      if (canViewError) {
        console.error(`Erro ao testar visibilidade da sala ${room.name}:`, canViewError);
      } else {
        console.log(`Sala "${room.name}": ${canView ? 'VISÍVEL' : 'NÃO VISÍVEL'}`);
      }
    }
  }
  
  console.log('=== FIM DEBUG ===');
};
