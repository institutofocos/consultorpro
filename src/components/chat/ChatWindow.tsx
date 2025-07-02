
import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Send, MessageCircle } from 'lucide-react';
import { useChatMessages } from '@/hooks/useChatMessages';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ChatWindowProps {
  roomId: string | null;
  roomInfo: any;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ roomId, roomInfo }) => {
  const [messageText, setMessageText] = useState('');
  const { user } = useAuth();
  const { messages, isLoading, sendMessage, isSending } = useChatMessages(roomId);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim()) return;
    
    sendMessage(messageText);
    setMessageText('');
  };

  if (!roomId || !roomInfo) {
    return (
      <Card className="h-full">
        <CardContent className="flex items-center justify-center h-full">
          <div className="text-center text-gray-500">
            <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Selecione uma sala de chat para começar</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">
              {roomInfo.room_type === 'project' ? roomInfo.project_name : roomInfo.stage_name}
            </CardTitle>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant={roomInfo.room_type === 'project' ? 'secondary' : 'outline'}>
                {roomInfo.room_type === 'project' ? 'Projeto' : 'Etapa'}
              </Badge>
              {roomInfo.room_type === 'stage' && (
                <span className="text-sm text-gray-500">
                  Projeto: {roomInfo.project_name}
                </span>
              )}
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0">
        <ScrollArea className="flex-1 px-4" ref={scrollAreaRef}>
          <div className="space-y-4 py-4">
            {isLoading ? (
              <div className="flex items-center justify-center h-20">
                <div className="text-gray-500">Carregando mensagens...</div>
              </div>
            ) : messages.length === 0 ? (
              <div className="flex items-center justify-center h-20">
                <div className="text-gray-500">Nenhuma mensagem ainda. Seja o primeiro a escrever!</div>
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.user_id === user?.id ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      message.user_id === user?.id
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    <p className="text-sm">{message.message_text}</p>
                    <p
                      className={`text-xs mt-1 ${
                        message.user_id === user?.id ? 'text-blue-100' : 'text-gray-500'
                      }`}
                    >
                      {format(new Date(message.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                    </p>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        <div className="border-t p-4">
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <Input
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              placeholder="Digite sua mensagem..."
              disabled={isSending}
              className="flex-1"
              maxLength={1000}
            />
            <Button 
              type="submit" 
              disabled={!messageText.trim() || isSending}
              size="icon"
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
