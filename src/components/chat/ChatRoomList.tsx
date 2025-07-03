import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  MoreHorizontal, 
  Users, 
  Hash, 
  MessageSquare,
  Trash2,
  Edit,
  FolderOpen,
  Folder,
  ChevronDown,
  ChevronRight
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
import EditRoomModal from './EditRoomModal';

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
  const [expandedRooms, setExpandedRooms] = useState<Set<string>>(new Set());
  const [editingRoom, setEditingRoom] = useState<ChatRoom | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const handleDeleteRoom = async (roomId: string, roomName: string) => {
    if (!confirm(`Tem certeza que deseja excluir a sala "${roomName}"?\n\nEsta ação não pode ser desfeita.`)) {
      return;
    }

    try {
      await deleteRoom.mutateAsync(roomId);
      toast.success('Sala excluída com sucesso!');
    } catch (error) {
      console.error('Erro ao excluir sala:', error);
      toast.error('Erro ao excluir sala. Tente novamente.');
    }
  };

  const handleEditRoom = (room: ChatRoom) => {
    setEditingRoom(room);
    setIsEditModalOpen(true);
  };

  const toggleRoomExpansion = (roomId: string) => {
    const newExpanded = new Set(expandedRooms);
    if (expandedRooms.has(roomId)) {
      newExpanded.delete(roomId);
    } else {
      newExpanded.add(roomId);
    }
    setExpandedRooms(newExpanded);
  };

  const getLevelIcon = (level: number) => {
    switch (level) {
      case 1:
        return <Hash className="h-4 w-4 text-blue-600" />;
      case 2:
        return <MessageSquare className="h-4 w-4 text-green-600" />;
      case 3:
        return <Users className="h-4 w-4 text-purple-600" />;
      default:
        return <Hash className="h-4 w-4 text-gray-600" />;
    }
  };

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

  const RoomItem = ({ 
    room, 
    isChild = false, 
    hasChildren = false 
  }: { 
    room: ChatRoom; 
    isChild?: boolean;
    hasChildren?: boolean;
  }) => (
    <div
      className={cn(
        'group flex items-center justify-between hover:bg-gray-50 cursor-pointer border-l-4 transition-all duration-200',
        selectedRoom?.id === room.id 
          ? 'bg-blue-50 border-l-blue-500 shadow-sm' 
          : 'border-l-transparent hover:border-l-gray-300',
        isChild && 'ml-6 border-l-2'
      )}
    >
      <div 
        className="flex items-center gap-3 flex-1 min-w-0 p-3"
        onClick={() => onRoomSelect(room)}
      >
        <div className="flex items-center gap-2">
          {hasChildren ? (
            <FolderOpen className="h-4 w-4 text-orange-500" />
          ) : (
            getLevelIcon(room.level)
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <p className="font-medium text-sm truncate text-gray-900">
              {room.name}
            </p>
          </div>
          {room.description && (
            <p className="text-xs text-muted-foreground truncate">
              {room.description}
            </p>
          )}
          <p className="text-xs text-gray-400 mt-1">
            Criada em {new Date(room.created_at).toLocaleDateString('pt-BR')}
          </p>
        </div>
      </div>

      <div className="opacity-0 group-hover:opacity-100 transition-opacity pr-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 w-8 p-0 hover:bg-gray-200"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                handleEditRoom(room);
              }}
            >
              <Edit className="h-4 w-4 mr-2" />
              Editar
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-red-600 focus:text-red-600"
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
    </div>
  );

  if (!rooms || rooms.length === 0) {
    return (
      <div className="p-6 text-center">
        <div className="text-muted-foreground">
          <MessageSquare className="h-16 w-16 mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-medium mb-2">Nenhuma sala de chat</h3>
          <p className="text-sm">Crie sua primeira sala para começar a conversar</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Scrollable area for chat rooms with reduced height */}
      <div className="flex-1 overflow-y-auto pb-4" style={{ maxHeight: 'calc(100vh - 280px)' }}>
        <div className="space-y-1 p-2">
          {organizedRooms.map((room) => (
            <div key={room.id}>
              {/* Main room */}
              <div className="flex items-center">
                {room.children && room.children.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 mr-1 hover:bg-gray-200"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleRoomExpansion(room.id);
                    }}
                  >
                    {expandedRooms.has(room.id) ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </Button>
                )}
                <div className="flex-1">
                  <RoomItem 
                    room={room} 
                    hasChildren={room.children && room.children.length > 0}
                  />
                </div>
              </div>
              
              {/* Sub-rooms (when expanded) */}
              {room.children && 
               room.children.length > 0 && 
               expandedRooms.has(room.id) && (
                <div className="ml-4">
                  {room.children.map((child) => (
                    <RoomItem key={child.id} room={child} isChild />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <EditRoomModal
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        room={editingRoom}
      />
    </>
  );
};

export default ChatRoomList;
