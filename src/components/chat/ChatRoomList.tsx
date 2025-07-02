
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { MessageCircle, Plus, Settings } from 'lucide-react';
import { useChatRooms } from '@/hooks/useChatRooms';
import CreateManualRoomModal from './CreateManualRoomModal';

interface ChatRoomListProps {
  selectedRoomId: string | null;
  onSelectRoom: (roomId: string, roomInfo: any) => void;
}

const ChatRoomList: React.FC<ChatRoomListProps> = ({
  selectedRoomId,
  onSelectRoom
}) => {
  const { chatRooms, isLoading, error, refreshRooms } = useChatRooms();
  const [showCreateModal, setShowCreateModal] = useState(false);

  console.log('🏠 ChatRoomList render:', { 
    isLoading, 
    error, 
    roomsCount: chatRooms?.length || 0,
    rooms: chatRooms 
  });

  // Refresh rooms on mount to ensure we have the latest data
  useEffect(() => {
    refreshRooms();
  }, [refreshRooms]);

  if (isLoading) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Salas de Chat
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-40">
            <div className="text-gray-500">Carregando salas...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    console.error('💥 Error in ChatRoomList:', error);
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Salas de Chat
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center h-40 space-y-2">
            <div className="text-red-500">
              Erro ao carregar salas
            </div>
            <button 
              onClick={refreshRooms}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Tentar novamente
            </button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              Salas de Chat ({chatRooms.length})
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowCreateModal(true)}
                className="h-8 w-8 p-0"
              >
                <Plus className="h-4 w-4" />
              </Button>
              <button 
                onClick={refreshRooms}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                🔄
              </button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[calc(100vh-8rem)]">
            <div className="p-4 space-y-4">
              {/* Manual Rooms */}
              {chatRooms.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                    <Settings className="h-4 w-4" />
                    Salas Manuais ({chatRooms.length})
                  </h3>
                  <div className="space-y-2">
                    {chatRooms.map((room) => (
                      <div
                        key={room.room_id}
                        className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                          selectedRoomId === room.room_id
                            ? 'bg-blue-50 border-blue-200'
                            : 'bg-white hover:bg-gray-50 border-gray-200'
                        }`}
                        onClick={() => onSelectRoom(room.room_id, room)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium text-sm text-gray-900">
                              {room.room_name || 'Sala sem nome'}
                            </h4>
                            {room.room_description && (
                              <p className="text-xs text-gray-500 mt-1">
                                {room.room_description}
                              </p>
                            )}
                            {room.parent_room_id && (
                              <p className="text-xs text-blue-500 mt-1">
                                Sub-sala
                              </p>
                            )}
                          </div>
                          <Badge variant="default" className="text-xs">
                            Manual
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {chatRooms.length === 0 && (
                <div className="flex flex-col items-center justify-center h-40 space-y-2">
                  <div className="text-gray-500">
                    <p>Nenhuma sala disponível</p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => setShowCreateModal(true)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Criar Sala
                  </Button>
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      <CreateManualRoomModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={refreshRooms}
      />
    </>
  );
};

export default ChatRoomList;
