
import React, { useState } from 'react';
import { useChatRooms } from '@/hooks/useChatRooms';
import { ChatRoomList } from './ChatRoomList';
import { ChatWindow } from './ChatWindow';
import { ChatRoom } from '@/types/chat';
import { MessageCircle } from 'lucide-react';

const ChatPage: React.FC = () => {
  const [selectedRoom, setSelectedRoom] = useState<ChatRoom | null>(null);
  const { rooms, roomsLoading } = useChatRooms();

  if (roomsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-gray-600">Carregando salas de chat...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <MessageCircle className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-3xl font-bold">Chat</h1>
            <p className="text-muted-foreground">Comunicação por projeto e etapa</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
        {/* Lista de Salas */}
        <div className="lg:col-span-1">
          <ChatRoomList 
            rooms={rooms || []} 
            selectedRoom={selectedRoom}
            onSelectRoom={setSelectedRoom}
          />
        </div>

        {/* Janela de Chat */}
        <div className="lg:col-span-2">
          {selectedRoom ? (
            <ChatWindow room={selectedRoom} />
          ) : (
            <div className="flex items-center justify-center h-full bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
              <div className="text-center">
                <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Selecione uma sala de chat</h3>
                <p className="text-gray-500">Escolha um projeto ou etapa para começar a conversar</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
