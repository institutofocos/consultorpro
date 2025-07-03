
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, MessageCircle, AlertCircle, RefreshCw, Search, Users } from 'lucide-react';
import { useChatRooms } from '@/hooks/useChatRooms';
import { useAuth } from '@/contexts/AuthContext';
import ChatRoomList from './ChatRoomList';
import ChatWindow from './ChatWindow';
import CreateRoomModal from './CreateRoomModal';
import ParticipantsModal from './ParticipantsModal';
import { toast } from 'sonner';
import type { ChatRoom } from '@/hooks/useChatRooms';

interface ParticipantPermission {
  user_id: string;
  can_read: boolean;
  can_write: boolean;
}

const ChatPage = () => {
  const [selectedRoom, setSelectedRoom] = useState<ChatRoom | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [showParticipantsModal, setShowParticipantsModal] = useState(false);
  const [currentParticipants, setCurrentParticipants] = useState<ParticipantPermission[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const { user } = useAuth();
  const { data: rooms, isLoading, error, refetch } = useChatRooms();

  // Prevent body scroll when on chat page
  useEffect(() => {
    // Save current state
    const originalOverflow = document.body.style.overflow;
    const originalHtmlOverflow = document.documentElement.style.overflow;
    
    // Apply overflow hidden to prevent any scrolling on the page itself
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    
    // Cleanup: restore scrollbar when leaving the page  
    return () => {
      document.body.style.overflow = originalOverflow;
      document.documentElement.style.overflow = originalHtmlOverflow;
    };
  }, []);

  console.log('ChatPage renderizado - searchTerm:', searchTerm);
  console.log('Total de salas:', rooms?.length || 0);

  // Filter rooms by name
  const filteredRooms = rooms?.filter(room => 
    room.name.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  console.log('Salas filtradas:', filteredRooms.length);

  // Auto-select first room if available
  useEffect(() => {
    if (filteredRooms && filteredRooms.length > 0 && !selectedRoom) {
      setSelectedRoom(filteredRooms[0]);
    }
  }, [filteredRooms, selectedRoom]);

  // Check if user is authenticated
  useEffect(() => {
    if (!user) {
      toast.error('Você precisa estar logado para acessar o chat');
    }
  }, [user]);

  const handleOpenParticipantsModal = () => {
    if (!selectedRoom) {
      toast.error('Selecione uma sala primeiro');
      return;
    }
    setShowParticipantsModal(true);
  };

  const handleUpdateParticipants = (participants: ParticipantPermission[]) => {
    setCurrentParticipants(participants);
    console.log('Atualizando participantes:', participants);
  };

  if (!user) {
    return (
      <div className="h-screen flex items-center justify-center p-6">
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
      <div className="h-screen flex items-center justify-center p-6">
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
    <div className="h-screen flex flex-col w-full p-4 max-w-7xl mx-auto">
      {/* Fixed header */}
      <div className="flex-shrink-0 p-4 border-b bg-white rounded-t-lg">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <MessageCircle className="h-8 w-8" />
              Chat
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              onClick={handleOpenParticipantsModal} 
              variant="outline"
              className="flex items-center gap-2"
              disabled={!selectedRoom}
            >
              <Users className="h-4 w-4" />
              Participantes
            </Button>
            <Button 
              onClick={() => setIsCreateModalOpen(true)} 
              className="flex items-center gap-2"
              disabled={isLoading}
            >
              <Plus className="h-4 w-4" />
              Nova Sala
            </Button>
          </div>
        </div>
      </div>

      {/* Main content area with proper height calculation and border */}
      <div className="flex-1 flex min-h-0 border border-t-0 rounded-b-lg overflow-hidden bg-white">
        {/* Sidebar with chat rooms */}
        <div className="w-1/3 flex flex-col border-r">
          {/* Search bar - fixed */}
          <div className="flex-shrink-0 p-4 border-b bg-gray-50">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                type="text"
                placeholder="Buscar salas..."
                value={searchTerm}
                onChange={(e) => {
                  console.log('Termo de busca alterado para:', e.target.value);
                  setSearchTerm(e.target.value);
                }}
                className="pl-10"
              />
            </div>
          </div>
          
          {/* Chat rooms list - scrollable area */}
          <div className="flex-1 min-h-0">
            <ChatRoomList
              rooms={filteredRooms}
              selectedRoom={selectedRoom}
              onRoomSelect={setSelectedRoom}
            />
          </div>
        </div>

        {/* Chat area */}
        <div className="flex-1 flex flex-col min-h-0">
          {selectedRoom ? (
            <ChatWindow room={selectedRoom} />
          ) : (
            <div className="flex-1 flex items-center justify-center bg-gray-50">
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
            </div>
          )}
        </div>
      </div>

      <CreateRoomModal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        parentRooms={rooms || []}
      />

      {selectedRoom && (
        <ParticipantsModal
          open={showParticipantsModal}
          onOpenChange={setShowParticipantsModal}
          roomId={selectedRoom.id}
          roomName={selectedRoom.name}
          currentParticipants={currentParticipants}
          onUpdateParticipants={handleUpdateParticipants}
        />
      )}
    </div>
  );
};

export default ChatPage;
