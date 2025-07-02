
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, MessageCircle } from 'lucide-react';
import { useChatRooms } from '@/hooks/useChatRooms';
import ChatRoomList from './ChatRoomList';
import ChatWindow from './ChatWindow';
import CreateRoomModal from './CreateRoomModal';
import type { ChatRoom } from '@/hooks/useChatRooms';

const ChatPage = () => {
  const [selectedRoom, setSelectedRoom] = useState<ChatRoom | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const { data: rooms, isLoading } = useChatRooms();

  if (isLoading) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center">Carregando salas de chat...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 h-screen">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <MessageCircle className="h-8 w-8" />
            Chat
          </h1>
          <p className="text-muted-foreground">
            Comunique-se em tempo real com consultores e clientes
          </p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Nova Sala
        </Button>
      </div>

      <div className="grid grid-cols-12 gap-6 h-[calc(100vh-200px)]">
        <div className="col-span-4">
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="text-lg">Salas de Chat</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ChatRoomList
                rooms={rooms || []}
                selectedRoom={selectedRoom}
                onRoomSelect={setSelectedRoom}
              />
            </CardContent>
          </Card>
        </div>

        <div className="col-span-8">
          {selectedRoom ? (
            <ChatWindow room={selectedRoom} />
          ) : (
            <Card className="h-full flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <MessageCircle className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg">Selecione uma sala de chat para começar</p>
              </div>
            </Card>
          )}
        </div>
      </div>

      <CreateRoomModal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        parentRooms={rooms || []}
      />
    </div>
  );
};

export default ChatPage;
