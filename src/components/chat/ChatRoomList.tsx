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
  ChevronRight,
  Pin,
  PinOff,
  Video,
  ExternalLink
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useDeleteChatRoom, usePinChatRoom } from '@/hooks/useChatRooms';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { ChatRoom } from '@/hooks/useChatRooms';
import EditRoomModal from './EditRoomModal';
import MeetingLinkModal from './MeetingLinkModal';

interface ChatRoomListProps {
  rooms: ChatRoom[];
  selectedRoom: ChatRoom | null;
  onRoomSelect: (room: ChatRoom) => void;
  onOpenParticipantsModal?: (room: ChatRoom) => void;
}

const ChatRoomList: React.FC<ChatRoomListProps> = ({
  rooms,
  selectedRoom,
  onRoomSelect,
  onOpenParticipantsModal,
}) => {
  const deleteRoom = useDeleteChatRoom();
  const pinRoom = usePinChatRoom();
  const [expandedRooms, setExpandedRooms] = useState<Set<string>>(new Set());
  const [editingRoom, setEditingRoom] = useState<ChatRoom | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [meetingRoom, setMeetingRoom] = useState<ChatRoom | null>(null);
  const [isMeetingModalOpen, setIsMeetingModalOpen] = useState(false);

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

  const handleParticipants = (room: ChatRoom) => {
    if (onOpenParticipantsModal) {
      onOpenParticipantsModal(room);
    }
  };

  const handlePinRoom = async (room: ChatRoom) => {
    try {
      await pinRoom.mutateAsync({
        roomId: room.id,
        isPinned: !room.is_pinned
      });
      toast.success(room.is_pinned ? 'Sala desfixada!' : 'Sala fixada no topo!');
    } catch (error) {
      console.error('Erro ao fixar/desfixar sala:', error);
      toast.error('Erro ao alterar fixação da sala. Tente novamente.');
    }
  };

  const handleMeeting = (room: ChatRoom) => {
    setMeetingRoom(room);
    setIsMeetingModalOpen(true);
  };

  const handleOpenMeeting = (room: ChatRoom) => {
    if (room.meeting_link) {
      window.open(room.meeting_link, '_blank');
    }
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
    // Separar salas por nível
    const rootRooms = rooms.filter(room => !room.parent_room_id);
    const level2Rooms = rooms.filter(room => room.parent_room_id && room.level === 2);
    const level3Rooms = rooms.filter(room => room.parent_room_id && room.level === 3);
    
    // Organizar salas principais: fixadas primeiro, depois por data
    const pinnedRooms = rootRooms.filter(room => room.is_pinned);
    const unpinnedRooms = rootRooms.filter(room => !room.is_pinned);
    
    // Ordenar cada grupo
    pinnedRooms.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    unpinnedRooms.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    
    // Combinar: fixadas primeiro, depois não fixadas
    const orderedRootRooms = [...pinnedRooms, ...unpinnedRooms];
    
    const organized: (ChatRoom & { children?: (ChatRoom & { children?: ChatRoom[] })[] })[] = [];
    
    orderedRootRooms.forEach(root => {
      const level2Children = level2Rooms.filter(child => child.parent_room_id === root.id);
      
      // Para cada sala de nível 2, buscar suas filhas de nível 3
      const level2WithChildren = level2Children.map(level2Room => {
        const level3Children = level3Rooms.filter(level3 => level3.parent_room_id === level2Room.id);
        return { ...level2Room, children: level3Children };
      });
      
      organized.push({ ...root, children: level2WithChildren });
    });
    
    return organized;
  };

  const organizedRooms = organizeRooms(rooms);

  const RoomItem = ({ 
    room, 
    isChild = false,
    isGrandChild = false,
    hasChildren = false 
  }: { 
    room: ChatRoom; 
    isChild?: boolean;
    isGrandChild?: boolean;
    hasChildren?: boolean;
  }) => (
    <div
      className={cn(
        'group flex items-center justify-between hover:bg-gray-50 cursor-pointer border-l-4 transition-all duration-200',
        selectedRoom?.id === room.id 
          ? 'bg-blue-50 border-l-blue-500 shadow-sm' 
          : 'border-l-transparent hover:border-l-gray-300',
        isChild && 'ml-6 border-l-2',
        isGrandChild && 'ml-12 border-l-2'
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
          {room.is_pinned && !isChild && !isGrandChild && (
            <Pin className="h-3 w-3 text-orange-500" />
          )}
          {room.meeting_link && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 hover:bg-blue-100"
              onClick={(e) => {
                e.stopPropagation();
                handleOpenMeeting(room);
              }}
              title="Abrir reunião"
            >
              <Video className="h-3 w-3 text-blue-600" />
            </Button>
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
                handleParticipants(room);
              }}
            >
              <Users className="h-4 w-4 mr-2" />
              Participantes
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                handleMeeting(room);
              }}
            >
              <Video className="h-4 w-4 mr-2" />
              {room.meeting_link ? 'Editar Reunião' : 'Adicionar Reunião'}
            </DropdownMenuItem>
            {room.meeting_link && (
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  handleOpenMeeting(room);
                }}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Abrir Reunião
              </DropdownMenuItem>
            )}
            {!isChild && !isGrandChild && (
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  handlePinRoom(room);
                }}
              >
                {room.is_pinned ? (
                  <>
                    <PinOff className="h-4 w-4 mr-2" />
                    Desfixar
                  </>
                ) : (
                  <>
                    <Pin className="h-4 w-4 mr-2" />
                    Fixar
                  </>
                )}
              </DropdownMenuItem>
            )}
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
              
              {/* Sub-rooms (level 2) when expanded */}
              {room.children && 
               room.children.length > 0 && 
               expandedRooms.has(room.id) && (
                <div className="ml-4">
                  {room.children.map((child) => (
                    <div key={child.id}>
                      {/* Level 2 room */}
                      <div className="flex items-center">
                        {child.children && child.children.length > 0 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 mr-1 hover:bg-gray-200"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleRoomExpansion(child.id);
                            }}
                          >
                            {expandedRooms.has(child.id) ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </Button>
                        )}
                        <div className="flex-1">
                          <RoomItem 
                            key={child.id} 
                            room={child} 
                            isChild 
                            hasChildren={child.children && child.children.length > 0}
                          />
                        </div>
                      </div>
                      
                      {/* Sub-sub-rooms (level 3) when expanded */}
                      {child.children && 
                       child.children.length > 0 && 
                       expandedRooms.has(child.id) && (
                        <div className="ml-4">
                          {child.children.map((grandChild) => (
                            <RoomItem 
                              key={grandChild.id} 
                              room={grandChild} 
                              isChild 
                              isGrandChild
                            />
                          ))}
                        </div>
                      )}
                    </div>
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

      <MeetingLinkModal
        open={isMeetingModalOpen}
        onOpenChange={setIsMeetingModalOpen}
        room={meetingRoom}
      />
    </>
  );
};

export default ChatRoomList;
