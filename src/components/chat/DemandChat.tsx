
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import { useToast } from '@/hooks/use-toast';

interface DemandChatProps {
  demandId: string;
}

interface ChatMessageType {
  id: string;
  message_text: string;
  message_type: 'user' | 'system';
  created_at: string;
  user_id: string;
}

const DemandChat: React.FC<DemandChatProps> = ({ demandId }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!demandId || !user) return;

    loadMessages();
    
    // Subscribe to real-time messages
    const channel = supabase
      .channel(`demand-chat-${demandId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'demand_chat_messages',
          filter: `demand_id=eq.${demandId}`
        },
        (payload) => {
          setMessages(prev => [...prev, payload.new as ChatMessageType]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [demandId, user]);

  const loadMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('demand_chat_messages')
        .select('*')
        .eq('demand_id', demandId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Error loading messages:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as mensagens",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (messageText: string) => {
    if (!user || !demandId) return;

    try {
      const { error } = await supabase
        .from('demand_chat_messages')
        .insert({
          demand_id: demandId,
          user_id: user.id,
          message_text: messageText,
          message_type: 'user'
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Erro",
        description: "Não foi possível enviar a mensagem",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-96 bg-white border rounded-lg">
      <div className="flex-1 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 mt-8">
            Nenhuma mensagem ainda. Seja o primeiro a comentar!
          </div>
        ) : (
          messages.map((message) => (
            <ChatMessage
              key={message.id}
              message={message}
              isCurrentUser={message.user_id === user?.id}
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>
      <ChatInput onSendMessage={sendMessage} />
    </div>
  );
};

export default DemandChat;
