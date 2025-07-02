
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, MessageCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { useChatRooms } from '@/hooks/useChatRooms';
import { useAuth } from '@/contexts/AuthContext';
import ChatRoomList from './ChatRoomList';
import ChatWindow from './ChatWindow';
import CreateRoomModal from './CreateRoomModal';
import { toast } from 'sonner';
import type { ChatRoom } from '@/hooks/useChatRooms';

const ChatPage = () => {
  const [selectedRoom, setSelectedRoom] = useState<ChatRoom | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const { user } = useAuth();
  const { data: rooms, isLoading, error, refetch } = useChatRooms();

  // Auto-selecionar primeira sala se disponível
  useEffect(() => {
    if (rooms && rooms.length > 0 && !selectedRoom) {
      setSelectedRoom(rooms[0]);
    }
  }, [rooms, selectedRoom]);

  // Verificar se usuário está autenticado
  useEffect(() => {
    if (!user) {
      toast.error('Você precisa estar logado para acessar o chat');
    }
  }, [user]);

  if (!user) {
    return (
      <div className="container mx-auto py-6">
        <Card className="max-w-md mx-auto">
          <CardContent className="p-6 text-center">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-yellow-500" />
            <h2 className="text-lg font-semibold mb-2">Acesso Restrito</h2>
            <p className="text-muted-foreground">
              Você precisa estar logado para acessar o sistema de chat.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-6">
        <Card className="max-w-md mx-auto">
          <CardContent className="p-6 text-center">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-red-500" />
            <h2 className="text-lg font-semibold mb-2">Erro ao Carregar</h2>
            <p className="text-muted-foreground mb-4">
              Não foi possível carregar as salas de chat.
            </p>
            <Button onClick={() => refetch()} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Tentar Novamente
            </Button>
          </CardContent>
        </Card>
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
        <Button 
          onClick={() => setIsCreateModalOpen(true)} 
          className="flex items-center gap-2"
          disabled={isLoading}
        >
          <Plus className="h-4 w-4" />
          Nova Sala
        </Button>
      </div>

      <div className="grid grid-cols-12 gap-6 h-[calc(100vh-200px)]">
        <div className="col-span-4">
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="text-lg flex items-center justify-between">
                Salas de Chat
                {isLoading && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                )}
              </CardTitle>
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
                <p className="text-lg mb-2">Selecione uma sala de chat para começar</p>
                <p className="text-sm">
                  {rooms && rooms.length > 0 
                    ? 'Escolha uma das salas disponíveis na lista'
                    : 'Crie sua primeira sala para começar a conversar'
                  }
                </p>
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
