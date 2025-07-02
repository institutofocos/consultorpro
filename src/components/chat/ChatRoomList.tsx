
import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  MoreHorizontal, 
  Users, 
  Hash, 
  MessageSquare,
  Trash2,
  Edit
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useDeleteChatRoom } from '@/hooks/useChatRooms';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { ChatRoom } from '@/hooks/useChatRooms';

interface ChatRoomListProps {
  rooms: ChatRoom[];
  selectedRoom: ChatRoom | null;
  onRoomSelect: (room: ChatRoom) => void;
}

const ChatRoomList: React.FC<ChatRoomListProps> = ({
  rooms,
  selectedRoom,
  onRoomSelect,
}) => {
  const deleteRoom = useDeleteChatRoom();

  const handleDeleteRoom = async (roomId: string, roomName: string) => {
    if (!confirm(`Tem certeza que deseja excluir a sala "${roomName}"?`)) {
      return;
    }

    try {
      await deleteRoom.mutateAsync(roomId);
      toast.success('Sala excluída com sucesso!');
    } catch (error) {
      console.error('Erro ao excluir sala:', error);
      toast.error('Erro ao excluir sala');
    }
  };

  const getLevelIcon = (level: number) => {
    switch (level) {
      case 1:
        return <Hash className="h-4 w-4" />;
      case 2:
        return <MessageSquare className="h-4 w-4" />;
      case 3:
        return <Users className="h-4 w-4" />;
      default:
        return <Hash className="h-4 w-4" />;
    }
  };

  const getLevelColor = (level: number) => {
    switch (level) {
      case 1:
        return 'bg-blue-100 text-blue-800';
      case 2:
        return 'bg-green-100 text-green-800';
      case 3:
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Organizar salas por hierarquia
  const organizeRooms = (rooms: ChatRoom[]) => {
    const rootRooms = rooms.filter(room => !room.parent_room_id);
    const childRooms = rooms.filter(room => room.parent_room_id);
    
    const organized: (ChatRoom & { children?: ChatRoom[] })[] = [];
    
    rootRooms.forEach(root => {
      const children = childRooms.filter(child => child.parent_room_id === root.id);
      organized.push({ ...root, children });
    });
    
    return organized;
  };

  const organizedRooms = organizeRooms(rooms);

  const RoomItem = ({ room, isChild = false }: { room: ChatRoom; isChild?: boolean }) => (
    <div
      className={cn(
        'flex items-center justify-between p-3 hover:bg-gray-50 cursor-pointer border-l-4 transition-colors',
        selectedRoom?.id === room.id 
          ? 'bg-blue-50 border-l-blue-500' 
          : 'border-l-transparent',
        isChild && 'ml-4 border-l-2'
      )}
      onClick={() => onRoomSelect(room)}
    >
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {getLevelIcon(room.level)}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-medium text-sm truncate">{room.name}</p>
            <Badge variant="outline" className={cn('text-xs', getLevelColor(room.level))}>
              Nível {room.level}
            </Badge>
          </div>
          {room.description && (
            <p className="text-xs text-muted-foreground truncate mt-1">
              {room.description}
            </p>
          )}
        </div>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem>
            <Edit className="h-4 w-4 mr-2" />
            Editar
          </DropdownMenuItem>
          <DropdownMenuItem
            className="text-red-600"
            onClick={(e) => {
              e.stopPropagation();
              handleDeleteRoom(room.id, room.name);
            }}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Excluir
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );

  return (
    <div className="max-h-full overflow-y-auto">
      {organizedRooms.length === 0 ? (
        <div className="p-4 text-center text-muted-foreground">
          <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p>Nenhuma sala de chat disponível</p>
        </div>
      ) : (
        <div className="space-y-1">
          {organizedRooms.map((room) => (
            <div key={room.id}>
              <RoomItem room={room} />
              {room.children?.map((child) => (
                <RoomItem key={child.id} room={child} isChild />
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ChatRoomList;
