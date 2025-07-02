
import React, { useState, useRef, useEffect } from 'react';
import { ChatRoom } from '@/types/chat';
import { useChatMessages, useChatParticipants, useChatRooms } from '@/hooks/useChatRooms';
import { useUserPermissions } from '@/hooks/useUserPermissions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Send, Users, UserPlus, UserMinus, FolderOpen, Target } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ParticipantManagement } from './ParticipantManagement';

interface ChatWindowProps {
  room: ChatRoom;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({ room }) => {
  const [message, setMessage] = useState('');
  const [showParticipants, setShowParticipants] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const { data: messages, isLoading: messagesLoading } = useChatMessages(room.id);
  const { data: participants } = useChatParticipants(room.id);
  const { sendMessage } = useChatRooms();
  const { isSuperAdmin } = useUserPermissions();

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
        roomId: room.id,
        message: message.trim(),
      });
      setMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const roomTitle = room.room_type === 'project' 
    ? room.project?.name || 'Projeto'
    : `${room.stage?.name || 'Etapa'} - ${room.project?.name || 'Projeto'}`;

  const roomIcon = room.room_type === 'project' 
    ? <FolderOpen className="h-5 w-5" />
    : <Target className="h-5 w-5" />;

  const roomBadgeColor = room.room_type === 'project' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800';

  return (
    <div className="bg-white rounded-lg border shadow-sm h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b flex items-center justify-between">
        <div className="flex items-center gap-3">
          {roomIcon}
          <div>
            <h2 className="font-semibold truncate">{roomTitle}</h2>
            <div className="flex items-center gap-2">
              <Badge className={roomBadgeColor}>
                {room.room_type === 'project' ? 'Projeto' : 'Etapa'}
              </Badge>
              <span className="text-sm text-gray-500">
                {participants?.length || 0} participantes
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowParticipants(!showParticipants)}
          >
            <Users className="h-4 w-4 mr-2" />
            Participantes
          </Button>
        </div>
      </div>

      <div className="flex-1 flex">
        {/* Messages Area */}
        <div className="flex-1 flex flex-col">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messagesLoading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              </div>
            ) : messages?.length === 0 ? (
              <div className="flex items-center justify-center h-32 text-gray-500">
                <div className="text-center">
                  <p>Nenhuma mensagem ainda</p>
                  <p className="text-sm">Seja o primeiro a enviar uma mensagem!</p>
                </div>
              </div>
            ) : (
              messages?.map((msg) => (
                <div key={msg.id} className="flex gap-3">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                      {(msg.profiles?.full_name || 'U')[0].toUpperCase()}
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm">
                        {msg.profiles?.full_name || 'Usuário'}
                      </span>
                      <span className="text-xs text-gray-500">
                        {format(new Date(msg.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                      </span>
                    </div>
                    <div className="bg-gray-100 rounded-lg p-3">
                      <p className="text-sm whitespace-pre-wrap">{msg.message_text}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input */}
          <div className="p-4 border-t">
            <form onSubmit={handleSendMessage} className="flex gap-2">
              <Input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Digite sua mensagem..."
                className="flex-1"
                disabled={sendMessage.isPending}
              />
              <Button 
                type="submit" 
                disabled={!message.trim() || sendMessage.isPending}
                size="icon"
              >
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </div>

        {/* Participants Panel */}
        {showParticipants && (
          <ParticipantManagement
            room={room}
            participants={participants || []}
            onClose={() => setShowParticipants(false)}
          />
        )}
      </div>
    </div>
  );
};
