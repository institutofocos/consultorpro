
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface ChatMessage {
  id: string;
  room_id: string;
  user_id: string;
  message_text: string;
  message_type: 'user' | 'system';
  created_at: string;
  updated_at: string;
}

export const useChatMessages = (roomId: string | null) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: messages, isLoading } = useQuery({
    queryKey: ['chat-messages', roomId],
    queryFn: async () => {
      if (!roomId) return [];
      
      console.log('🔍 Fetching messages for room:', roomId);
      
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('room_id', roomId)
        .order('created_at', { ascending: true });
      
      if (error) {
        console.error('❌ Error fetching messages:', error);
        throw error;
      }
      
      console.log('✅ Messages fetched:', data?.length || 0);
      return data as ChatMessage[];
    },
    enabled: !!roomId && !!user?.id,
  });

  const sendMessageMutation = useMutation({
    mutationFn: async ({ roomId, messageText }: { roomId: string; messageText: string }) => {
      if (!user?.id) throw new Error('User not authenticated');
      
      console.log('📤 Sending message to room:', roomId);
      
      const { data, error } = await supabase
        .from('chat_messages')
        .insert({
          room_id: roomId,
          user_id: user.id,
          message_text: messageText,
          message_type: 'user'
        })
        .select()
        .single();
      
      if (error) {
        console.error('❌ Error sending message:', error);
        throw error;
      }
      
      console.log('✅ Message sent successfully');
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat-messages', roomId] });
    },
    onError: (error: any) => {
      console.error('💥 Error sending message:', error);
      toast.error('Erro ao enviar mensagem: ' + (error.message || 'Erro desconhecido'));
    }
  });

  // Set up real-time subscription for new messages
  useEffect(() => {
    if (!roomId) return;

    console.log('🔄 Setting up real-time subscription for room:', roomId);

    const channel = supabase
      .channel(`chat_messages_${roomId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `room_id=eq.${roomId}`
        },
        (payload) => {
          console.log('📨 New message received:', payload);
          queryClient.invalidateQueries({ queryKey: ['chat-messages', roomId] });
        }
      )
      .subscribe();

    return () => {
      console.log('🔌 Cleaning up real-time subscription');
      supabase.removeChannel(channel);
    };
  }, [roomId, queryClient]);

  const sendMessage = (messageText: string) => {
    if (!roomId || !messageText.trim()) return;
    sendMessageMutation.mutate({ roomId, messageText: messageText.trim() });
  };

  return {
    messages: messages || [],
    isLoading,
    sendMessage,
    isSending: sendMessageMutation.isPending
  };
};
