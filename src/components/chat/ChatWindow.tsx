
import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Send, Users, Clock, MoreVertical } from 'lucide-react';
import { useChatMessages, useSendMessage } from '@/hooks/useChatRooms';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { ChatRoom } from '@/hooks/useChatRooms';
import ParticipantsModal from './ParticipantsModal';

interface ChatWindowProps {
  room: ChatRoom;
}

interface ParticipantPermission {
  user_id: string;
  can_read: boolean;
  can_write: boolean;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ room }) => {
  const [message, setMessage] = useState('');
  const [userName, setUserName] = useState('');
  const [showParticipantsModal, setShowParticipantsModal] = useState(false);
  const [currentParticipants, setCurrentParticipants] = useState<ParticipantPermission[]>([]);
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

  // Adicionar CSS global para esconder a barra de rolagem do viewport
  useEffect(() => {
    // Adicionar estilos para esconder a barra de rolagem principal
    const style = document.createElement('style');
    style.textContent = `
      html {
        scrollbar-width: none; /* Firefox */
        -ms-overflow-style: none; /* Internet Explorer 10+ */
      }
      html::-webkit-scrollbar {
        display: none; /* Safari and Chrome */
      }
      body {
        scrollbar-width: none; /* Firefox */
        -ms-overflow-style: none; /* Internet Explorer 10+ */
      }
      body::-webkit-scrollbar {
        display: none; /* Safari and Chrome */
      }
    `;
    document.head.appendChild(style);

    // Cleanup: remover o estilo quando o componente for desmontado
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim()) {
      toast.error('Digite uma mensagem antes de enviar');
      return;
    }

    if (!user?.id) {
      toast.error('Você precisa estar logado para enviar mensagens');
      return;
    }

    try {
      await sendMessage.mutateAsync({
        room_id: room.id,
        message: message.trim(),
        sender_name: userName || 'Usuário Anônimo',
      });
      
      setMessage('');
      toast.success('Mensagem enviada!');
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      toast.error('Erro ao enviar mensagem. Tente novamente.');
    }
  };

  const formatMessageTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return formatDistanceToNow(date, { 
        addSuffix: true, 
        locale: ptBR 
      });
    } catch {
      return 'agora';
    }
  };

  const handleOpenParticipantsModal = () => {
    setShowParticipantsModal(true);
  };

  const handleUpdateParticipants = (participants: ParticipantPermission[]) => {
    setCurrentParticipants(participants);
    console.log('Atualizando participantes:', participants);
  };

  return (
    <>
      <Card className="h-full flex flex-col">
        <CardHeader className="pb-3 border-b flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <CardTitle className="text-lg flex items-center gap-2 truncate">
                {room.name}
              </CardTitle>
              {room.description && (
                <p className="text-sm text-muted-foreground mt-1 truncate">
                  {room.description}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Button variant="outline" size="sm" onClick={handleOpenParticipantsModal}>
                <Users className="h-4 w-4 mr-2" />
                Participantes
              </Button>
              <Button variant="ghost" size="sm">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="flex-1 flex flex-col p-0 min-h-0">
          {/* Área de mensagens com scroll */}
          <div 
            className="flex-1 px-4 overflow-y-auto"
            style={{ 
              height: 'calc(100vh - 300px)',
              maxHeight: 'calc(100vh - 300px)'
            }}
          >
            <div className="py-4 space-y-4">
              {isLoading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="text-center text-muted-foreground">
                    <Clock className="h-8 w-8 mx-auto mb-2 opacity-50 animate-spin" />
                    <p>Carregando mensagens...</p>
                  </div>
                </div>
              ) : !messages || messages.length === 0 ? (
                <div className="flex items-center justify-center h-32">
                  <div className="text-center text-muted-foreground">
                    <Clock className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p className="text-lg font-medium">Nenhuma mensagem ainda</p>
                    <p className="text-sm">Seja o primeiro a enviar uma mensagem!</p>
                  </div>
                </div>
              ) : (
                <>
                  {messages.map((msg, index) => {
                    const isOwnMessage = msg.sender_id === user?.id;
                    const showSender = index === 0 || 
                      messages[index - 1]?.sender_id !== msg.sender_id;

                    return (
                      <div
                        key={msg.id}
                        className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`max-w-[80%] ${isOwnMessage ? 'order-2' : 'order-1'}`}>
                          {showSender && (
                            <div className={`text-xs text-muted-foreground mb-1 px-1 ${isOwnMessage ? 'text-right' : 'text-left'}`}>
                              <span className="font-medium">{msg.sender_name}</span>
                              <span className="ml-2">{formatMessageTime(msg.created_at)}</span>
                            </div>
                          )}
                          <div
                            className={`px-4 py-2 rounded-lg shadow-sm ${
                              isOwnMessage
                                ? 'bg-blue-500 text-white rounded-br-sm'
                                : 'bg-gray-100 text-gray-900 rounded-bl-sm border'
                            }`}
                          >
                            <p className="text-sm whitespace-pre-wrap break-words">{msg.message}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>
          </div>

          {/* Formulário de envio fixo na parte inferior */}
          <div className="border-t bg-gray-50 p-4 flex-shrink-0">
            <form onSubmit={handleSendMessage} className="flex gap-2">
              <Input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Digite sua mensagem..."
                disabled={sendMessage.isPending}
                className="flex-1 bg-white"
                maxLength={1000}
              />
              <Button 
                type="submit" 
                disabled={!message.trim() || sendMessage.isPending}
                size="sm"
                className="px-4"
              >
                {sendMessage.isPending ? (
                  <Clock className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </form>
            {message.length > 800 && (
              <p className="text-xs text-muted-foreground mt-1">
                {1000 - message.length} caracteres restantes
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <ParticipantsModal
        open={showParticipantsModal}
        onOpenChange={setShowParticipantsModal}
        roomId={room.id}
        roomName={room.name}
        currentParticipants={currentParticipants}
        onUpdateParticipants={handleUpdateParticipants}
      />
    </>
  );
};

export default ChatWindow;
