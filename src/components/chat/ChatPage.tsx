
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, MessageCircle, AlertCircle, RefreshCw, Search } from 'lucide-react';
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
  const [searchTerm, setSearchTerm] = useState('');
  const { user } = useAuth();
  const { data: rooms, isLoading, error, refetch } = useChatRooms();

  // Esconder barra de rolagem externa apenas na página de chat
  useEffect(() => {
    // Salvar o estado atual
    const originalOverflow = document.body.style.overflow;
    const originalHtmlOverflow = document.documentElement.style.overflow;
    
    // Aplicar overflow hidden
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    
    // Cleanup: restaurar scrollbar quando sair da página  
    return () => {
      document.body.style.overflow = originalOverflow;
      document.documentElement.style.overflow = originalHtmlOverflow;
    };
  }, []);

  // Log para debug
  console.log('ChatPage renderizado - searchTerm:', searchTerm);
  console.log('Total de salas:', rooms?.length || 0);

  // Filtrar salas por nome
  const filteredRooms = rooms?.filter(room => 
    room.name.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  console.log('Salas filtradas:', filteredRooms.length);

  // Auto-selecionar primeira sala se disponível
  useEffect(() => {
    if (filteredRooms && filteredRooms.length > 0 && !selectedRoom) {
      setSelectedRoom(filteredRooms[0]);
    }
  }, [filteredRooms, selectedRoom]);

  // Verificar se usuário está autenticado
  useEffect(() => {
    if (!user) {
      toast.error('Você precisa estar logado para acessar o chat');
    }
  }, [user]);

  if (!user) {
    return (
      <div className="h-screen flex items-center justify-center">
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
      <div className="h-screen flex items-center justify-center">
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
    <div className="h-screen flex flex-col overflow-hidden w-full">
      {/* Header fixo */}
      <div className="flex-shrink-0 p-4 border-b bg-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <MessageCircle className="h-8 w-8" />
              Chat
            </h1>
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
      </div>

      {/* Conteúdo principal */}
      <div className="flex-1 flex overflow-hidden">
        <div className="w-1/3 flex flex-col border-r">
          <Card className="h-full border-0 rounded-none">
            <CardHeader className="flex-shrink-0 p-4">
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
            </CardHeader>
            <CardContent className="p-0 flex-1 overflow-hidden">
              <ChatRoomList
                rooms={filteredRooms}
                selectedRoom={selectedRoom}
                onRoomSelect={setSelectedRoom}
              />
            </CardContent>
          </Card>
        </div>

        <div className="flex-1 flex flex-col">
          {selectedRoom ? (
            <ChatWindow room={selectedRoom} />
          ) : (
            <Card className="h-full flex items-center justify-center border-0 rounded-none">
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
