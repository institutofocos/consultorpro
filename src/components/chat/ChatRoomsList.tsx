
import React, { useState } from 'react';
import { ChevronRight, ChevronDown, Plus } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";

type Room = {
  id: string;
  name: string;
  description: string;
  level: number;
  parentId: string | null;
};

interface ChatRoomsListProps {
  rooms: Room[];
  selectedRoomId: string | null;
  onRoomSelect: (roomId: string) => void;
}

const ChatRoomsList: React.FC<ChatRoomsListProps> = ({ rooms, selectedRoomId, onRoomSelect }) => {
  const [expandedRooms, setExpandedRooms] = useState<string[]>([]);
  const [newRoomDialogOpen, setNewRoomDialogOpen] = useState(false);
  const [newRoomParent, setNewRoomParent] = useState<string | null>(null);
  
  // Organizar salas por níveis para renderização em árvore
  const topLevelRooms = rooms.filter(room => room.level === 1);
  
  const toggleRoomExpansion = (roomId: string) => {
    if (expandedRooms.includes(roomId)) {
      setExpandedRooms(expandedRooms.filter(id => id !== roomId));
    } else {
      setExpandedRooms([...expandedRooms, roomId]);
    }
  };
  
  const handleCreateRoom = (level: number, parentId: string | null = null) => {
    setNewRoomParent(parentId);
    setNewRoomDialogOpen(true);
  };
  
  const handleSubmitNewRoom = (event: React.FormEvent) => {
    event.preventDefault();
    // Aqui implementaremos a lógica para criar uma nova sala no Supabase
    console.log('Nova sala será criada');
    setNewRoomDialogOpen(false);
  };
  
  const renderRoom = (room: Room) => {
    const hasChildren = rooms.some(r => r.parentId === room.id);
    const isExpanded = expandedRooms.includes(room.id);
    const childRooms = rooms.filter(r => r.parentId === room.id);
    
    return (
      <div key={room.id} className="select-none">
        <div 
          className={`flex items-center p-2 rounded-md cursor-pointer ${
            selectedRoomId === room.id ? 'bg-primary/10 text-primary' : 'hover:bg-muted'
          }`}
        >
          {hasChildren ? (
            <button 
              onClick={(e) => {
                e.stopPropagation();
                toggleRoomExpansion(room.id);
              }}
              className="p-1 mr-1"
            >
              {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </button>
          ) : (
            <span className="w-6" />
          )}
          
          <span 
            className="flex-grow text-sm font-medium truncate"
            onClick={() => onRoomSelect(room.id)}
          >
            {room.name}
          </span>
          
          {room.level < 3 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleCreateRoom(room.level + 1, room.id);
              }}
              className="p-1 opacity-0 group-hover:opacity-100 hover:bg-muted rounded"
            >
              <Plus size={14} />
            </button>
          )}
        </div>
        
        {isExpanded && childRooms.length > 0 && (
          <div className="pl-4 border-l border-border ml-3 mt-1">
            {childRooms.map(childRoom => renderRoom(childRoom))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="p-2">
      <div className="flex items-center justify-between p-2 mb-2">
        <span className="text-sm font-medium">Salas de Chat</span>
        <Button 
          variant="ghost" 
          size="icon"
          className="h-7 w-7"
          onClick={() => handleCreateRoom(1)}
        >
          <Plus size={16} />
        </Button>
      </div>
      
      <div className="space-y-1">
        {topLevelRooms.map(room => renderRoom(room))}
      </div>
      
      <Dialog open={newRoomDialogOpen} onOpenChange={setNewRoomDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Criar nova sala</DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmitNewRoom} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="room-name">Nome da sala</Label>
              <Input id="room-name" placeholder="Digite o nome da sala" />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="room-description">Descrição</Label>
              <Textarea id="room-description" placeholder="Descrição opcional" />
            </div>
            
            {!newRoomParent && (
              <div className="space-y-2">
                <Label htmlFor="room-level">Nível</Label>
                <Select defaultValue="1">
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o nível" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Nível 1 (Principal)</SelectItem>
                    <SelectItem value="2">Nível 2 (Subsala)</SelectItem>
                    <SelectItem value="3">Nível 3 (Sub-subsala)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            
            <DialogFooter>
              <Button type="submit">Criar sala</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ChatRoomsList;
