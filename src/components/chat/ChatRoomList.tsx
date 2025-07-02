import React, { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageCircle, Users, FolderOpen } from 'lucide-react';
import { useChatRooms } from '@/hooks/useChatRooms';

interface ChatRoomListProps {
  selectedRoomId: string | null;
  onSelectRoom: (roomId: string, roomInfo: any) => void;
}

const ChatRoomList: React.FC<ChatRoomListProps> = ({
  selectedRoomId,
  onSelectRoom
}) => {
  const { chatRooms, isLoading, error, refreshRooms } = useChatRooms();

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

  if (!chatRooms.length) {
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
            <div className="text-gray-500">
              <p>Nenhuma sala disponível</p>
            </div>
            <button 
              onClick={refreshRooms}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Atualizar
            </button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const projectRooms = chatRooms.filter(room => room.room_type === 'project');
  const stageRooms = chatRooms.filter(room => room.room_type === 'stage');

  console.log('📊 Room distribution:', { 
    total: chatRooms.length,
    projects: projectRooms.length, 
    stages: stageRooms.length 
  });

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Salas de Chat ({chatRooms.length})
          </div>
          <button 
            onClick={refreshRooms}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            🔄
          </button>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[calc(100vh-8rem)]">
          <div className="p-4 space-y-4">
            {/* Project Rooms */}
            {projectRooms.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                  <FolderOpen className="h-4 w-4" />
                  Projetos ({projectRooms.length})
                </h3>
                <div className="space-y-2">
                  {projectRooms.map((room) => (
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
                            {room.project_name}
                          </h4>
                          {room.client_name && (
                            <p className="text-xs text-gray-500 mt-1">
                              Cliente: {room.client_name}
                            </p>
                          )}
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          Projeto
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Stage Rooms */}
            {stageRooms.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  Etapas ({stageRooms.length})
                </h3>
                <div className="space-y-2">
                  {stageRooms.map((room) => (
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
                            {room.stage_name}
                          </h4>
                          <p className="text-xs text-gray-500 mt-1">
                            Projeto: {room.project_name}
                          </p>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          Etapa
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default ChatRoomList;
