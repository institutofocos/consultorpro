
import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Send, Users, Clock, MoreVertical } from 'lucide-react';
import { useChatMessages, useSendMessage } from '@/hooks/useChatRooms';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { ChatRoom } from '@/hooks/useChatRooms';

interface ChatWindowProps {
  room: ChatRoom;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ room }) => {
  const [message, setMessage] = useState('');
  const [userName, setUserName] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  
  const { data: messages, isLoading } = useChatMessages(room.id);
  const sendMessage = useSendMessage();

  // Buscar nome do usuário (temporário - idealmente viria do contexto)
  useEffect(() => {
    if (user?.email) {
      setUserName(user.email.split('@')[0]);
    }
  }, [user]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim()) return;

    try {
      await sendMessage.mutateAsync({
        room_id: room.id,
        message: message.trim(),
        sender_name: userName || 'Usuário Anônimo',
      });
      
      setMessage('');
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      toast.error('Erro ao enviar mensagem');
    }
  };

  const formatMessageTime = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, 'HH:mm', { locale: ptBR });
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              {room.name}
              <Badge variant="outline" className="text-xs">
                Nível {room.level}
              </Badge>
            </CardTitle>
            {room.description && (
              <p className="text-sm text-muted-foreground mt-1">
                {room.description}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Users className="h-4 w-4 mr-2" />
              Participantes
            </Button>
            <Button variant="ghost" size="sm">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0">
        {/* Área de mensagens */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {isLoading ? (
            <div className="text-center text-muted-foreground">
              Carregando mensagens...
            </div>
          ) : messages?.length === 0 ? (
            <div className="text-center text-muted-foreground">
              <div className="flex flex-col items-center gap-2">
                <Clock className="h-8 w-8 opacity-50" />
                <p>Nenhuma mensagem hoje</p>
                <p className="text-xs">Seja o primeiro a enviar uma mensagem!</p>
              </div>
            </div>
          ) : (
            messages?.map((msg, index) => {
              const isOwnMessage = msg.sender_id === user?.id;
              const showTime = index === 0 || 
                messages[index - 1]?.sender_id !== msg.sender_id ||
                new Date(msg.created_at).getTime() - new Date(messages[index - 1]?.created_at).getTime() > 300000; // 5 minutos

              return (
                <div
                  key={msg.id}
                  className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[70%] ${isOwnMessage ? 'order-2' : 'order-1'}`}>
                    {showTime && (
                      <div className={`text-xs text-muted-foreground mb-1 ${isOwnMessage ? 'text-right' : 'text-left'}`}>
                        <span className="font-medium">{msg.sender_name}</span>
                        <span className="ml-2">{formatMessageTime(msg.created_at)}</span>
                      </div>
                    )}
                    <div
                      className={`px-4 py-2 rounded-lg ${
                        isOwnMessage
                          ? 'bg-blue-500 text-white rounded-br-sm'
                          : 'bg-gray-100 text-gray-900 rounded-bl-sm'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Formulário de envio */}
        <div className="border-t p-4">
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Digite sua mensagem..."
              disabled={sendMessage.isPending}
              className="flex-1"
            />
            <Button 
              type="submit" 
              disabled={!message.trim() || sendMessage.isPending}
              size="sm"
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </CardContent>
    </Card>
  );
};

export default ChatWindow;
