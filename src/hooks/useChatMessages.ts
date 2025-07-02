
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
      
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('room_id', roomId)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      return data as ChatMessage[];
    },
    enabled: !!roomId && !!user?.id,
  });

  const sendMessageMutation = useMutation({
    mutationFn: async ({ roomId, messageText }: { roomId: string; messageText: string }) => {
      if (!user?.id) throw new Error('User not authenticated');
      
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
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat-messages', roomId] });
    },
    onError: (error) => {
      console.error('Error sending message:', error);
      toast.error('Erro ao enviar mensagem');
    }
  });

  // Set up real-time subscription
  useEffect(() => {
    if (!roomId) return;

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
        () => {
          queryClient.invalidateQueries({ queryKey: ['chat-messages', roomId] });
        }
      )
      .subscribe();

    return () => {
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
