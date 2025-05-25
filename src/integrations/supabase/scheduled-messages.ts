
import { supabase } from './client';
import type { Database } from './types';

export type ScheduledMessage = Database['public']['Tables']['scheduled_messages']['Row'];

// Tipo específico para criar mensagens agendadas
export type CreateScheduledMessageData = {
  title: string;
  message: string;
  room_id: string;
  sender_id: string;
  sender_name: string;
  connection_id?: string | null;
  send_date?: string | null;
  send_time?: string | null;
  is_recurring?: boolean;
  recurrence_type?: string | null;
  recurrence_day?: number | null;
  recurrence_time?: string | null;
  status?: string;
};

// Buscar todas as mensagens agendadas de uma sala
export const fetchScheduledMessages = async (roomId: string) => {
  const { data, error } = await supabase
    .from('scheduled_messages')
    .select('*')
    .eq('room_id', roomId)
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Erro ao buscar mensagens agendadas:', error);
    throw error;
  }
  
  return data;
};

// Criar nova mensagem agendada
export const createScheduledMessage = async (messageData: CreateScheduledMessageData) => {
  const { data, error } = await supabase
    .from('scheduled_messages')
    .insert(messageData)
    .select()
    .single();
  
  if (error) {
    console.error('Erro ao criar mensagem agendada:', error);
    throw error;
  }
  
  return data;
};

// Atualizar mensagem agendada
export const updateScheduledMessage = async (id: string, updates: Partial<ScheduledMessage>) => {
  const { data, error } = await supabase
    .from('scheduled_messages')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  
  if (error) {
    console.error('Erro ao atualizar mensagem agendada:', error);
    throw error;
  }
  
  return data;
};

// Deletar mensagem agendada
export const deleteScheduledMessage = async (id: string) => {
  const { error } = await supabase
    .from('scheduled_messages')
    .delete()
    .eq('id', id);
  
  if (error) {
    console.error('Erro ao deletar mensagem agendada:', error);
    throw error;
  }
};

// Pausar/ativar mensagem agendada
export const toggleScheduledMessage = async (id: string, status: 'active' | 'paused') => {
  return updateScheduledMessage(id, { status });
};
