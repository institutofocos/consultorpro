
import React, { useState, useEffect } from 'react';
import { ChevronRight, ChevronDown, Plus, Loader2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { fetchChatRooms, createChatRoom, ChatRoom } from '@/integrations/supabase/chat';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";

interface ChatRoomsListProps {
  rooms: ChatRoom[];
  selectedRoomId: string | null;
  onRoomSelect: (roomId: string) => void;
  isLoading: boolean;
}

const ChatRoomsList: React.FC<ChatRoomsListProps> = ({ 
  rooms, 
  selectedRoomId, 
  onRoomSelect, 
  isLoading 
}) => {
  const [expandedRooms, setExpandedRooms] = useState<string[]>([]);
  const [newRoomDialogOpen, setNewRoomDialogOpen] = useState(false);
  const [newRoomParent, setNewRoomParent] = useState<string | null>(null);
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomDescription, setNewRoomDescription] = useState('');
  const [newRoomLevel, setNewRoomLevel] = useState('1');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  
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
    setNewRoomLevel(level.toString());
    setNewRoomName('');
    setNewRoomDescription('');
    setNewRoomDialogOpen(true);
  };
  
  const handleSubmitNewRoom = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!newRoomName.trim()) {
      toast({
        variant: "destructive",
        title: "Nome obrigatório",
        description: "Por favor, digite um nome para a sala."
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      await createChatRoom(
        newRoomName,
        newRoomDescription || null,
        parseInt(newRoomLevel),
        newRoomParent || undefined
      );
      
      toast({
        title: "Sala criada",
        description: "A nova sala foi criada com sucesso!"
      });
      
      setNewRoomDialogOpen(false);
    } catch (error) {
      console.error('Erro ao criar sala:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível criar a sala. Tente novamente."
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const renderRoom = (room: ChatRoom) => {
    const hasChildren = rooms.some(r => r.parent_id === room.id);
    const isExpanded = expandedRooms.includes(room.id);
    const childRooms = rooms.filter(r => r.parent_id === room.id);
    const isFromProject = room.project_id !== null;
    
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
            className="flex-grow text-sm font-medium truncate group"
            onClick={() => onRoomSelect(room.id)}
          >
            {room.name}
            {isFromProject && (
              <span className="ml-2 text-xs bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full">
                Projeto
              </span>
            )}
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
      
      {isLoading ? (
        <div className="flex justify-center items-center p-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="space-y-1">
          {topLevelRooms.length > 0 ? (
            topLevelRooms.map(room => renderRoom(room))
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p>Nenhuma sala disponível</p>
              <p className="text-xs mt-1">Clique no + para criar uma sala</p>
            </div>
          )}
        </div>
      )}
      
      <Dialog open={newRoomDialogOpen} onOpenChange={setNewRoomDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Criar nova sala</DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmitNewRoom} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="room-name">Nome da sala</Label>
              <Input 
                id="room-name" 
                placeholder="Digite o nome da sala" 
                value={newRoomName}
                onChange={(e) => setNewRoomName(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="room-description">Descrição</Label>
              <Textarea 
                id="room-description" 
                placeholder="Descrição opcional" 
                value={newRoomDescription}
                onChange={(e) => setNewRoomDescription(e.target.value)}
              />
            </div>
            
            {!newRoomParent && (
              <div className="space-y-2">
                <Label htmlFor="room-level">Nível</Label>
                <Select 
                  value={newRoomLevel}
                  onValueChange={setNewRoomLevel}
                >
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
              <Button 
                type="submit" 
                disabled={isSubmitting || !newRoomName.trim()}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Criando...
                  </>
                ) : "Criar sala"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ChatRoomsList;
