
import React from 'react';
import { ChatRoom } from '@/types/chat';
import { cn } from '@/lib/utils';
import { FolderOpen, Target, MessageCircle, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface ChatRoomListProps {
  rooms: ChatRoom[];
  selectedRoom: ChatRoom | null;
  onSelectRoom: (room: ChatRoom) => void;
}

export const ChatRoomList: React.FC<ChatRoomListProps> = ({
  rooms,
  selectedRoom,
  onSelectRoom,
}) => {
  // Organizar salas por projeto
  const groupedRooms = rooms.reduce((acc, room) => {
    const projectId = room.project_id;
    if (!acc[projectId]) {
      acc[projectId] = {
        projectRoom: null,
        stageRooms: [],
        projectName: '',
        clientName: '',
      };
    }

    if (room.room_type === 'project') {
      acc[projectId].projectRoom = room;
      acc[projectId].projectName = room.project?.name || 'Projeto sem nome';
      acc[projectId].clientName = (room.project as any)?.clients?.name || 'Cliente';
    } else {
      acc[projectId].stageRooms.push(room);
    }

    return acc;
  }, {} as Record<string, {
    projectRoom: ChatRoom | null;
    stageRooms: ChatRoom[];
    projectName: string;
    clientName: string;
  }>);

  return (
    <div className="bg-white rounded-lg border shadow-sm h-full">
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          Salas de Chat
        </h2>
      </div>

      <div className="overflow-y-auto h-full max-h-[calc(100%-80px)]">
        {Object.entries(groupedRooms).map(([projectId, group]) => (
          <div key={projectId} className="border-b last:border-b-0">
            {/* Sala do Projeto */}
            {group.projectRoom && (
              <div
                className={cn(
                  "p-3 cursor-pointer hover:bg-gray-50 transition-colors border-l-4",
                  selectedRoom?.id === group.projectRoom.id
                    ? "bg-blue-50 border-l-blue-500"
                    : "border-l-transparent"
                )}
                onClick={() => onSelectRoom(group.projectRoom!)}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0">
                    <FolderOpen className="h-5 w-5 text-blue-600 mt-0.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-sm truncate">{group.projectName}</h3>
                    <p className="text-xs text-gray-500 truncate">{group.clientName}</p>
                    <Badge variant="outline" className="mt-1 text-xs">
                      Projeto
                    </Badge>
                  </div>
                </div>
              </div>
            )}

            {/* Salas das Etapas */}
            {group.stageRooms.map((stageRoom) => (
              <div
                key={stageRoom.id}
                className={cn(
                  "p-3 pl-6 cursor-pointer hover:bg-gray-50 transition-colors border-l-4",
                  selectedRoom?.id === stageRoom.id
                    ? "bg-green-50 border-l-green-500"
                    : "border-l-transparent"
                )}
                onClick={() => onSelectRoom(stageRoom)}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0">
                    <Target className="h-4 w-4 text-green-600 mt-0.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm truncate">
                      {stageRoom.stage?.name || 'Etapa'}
                    </h4>
                    <p className="text-xs text-gray-500 truncate">{group.projectName}</p>
                    <Badge variant="outline" className="mt-1 text-xs">
                      Etapa
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ))}

        {rooms.length === 0 && (
          <div className="p-6 text-center">
            <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma sala encontrada</h3>
            <p className="text-gray-500 text-sm">
              As salas de chat são criadas automaticamente quando projetos e etapas são criados.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
