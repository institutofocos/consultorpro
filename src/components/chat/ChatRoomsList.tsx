import React, { useState, useEffect } from 'react';
import { ChevronRight, ChevronDown, Plus, Loader2, UserPlus, Users, Edit, Trash } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { 
  fetchChatRooms, 
  createChatRoom, 
  createDirectChatRoom, 
  addChatParticipant, 
  updateChatRoom,
  deleteChatRoom,
  ChatRoom 
} from '@/integrations/supabase/chat';
import { fetchConsultants } from '@/integrations/supabase/consultants';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ChatRoomsListProps {
  rooms: ChatRoom[];
  selectedRoomId: string | null;
  onRoomSelect: (roomId: string) => void;
  isLoading: boolean;
  onRoomCreated?: () => void;
}

const ChatRoomsList: React.FC<ChatRoomsListProps> = ({ 
  rooms, 
  selectedRoomId, 
  onRoomSelect, 
  isLoading,
  onRoomCreated
}) => {
  const [expandedRooms, setExpandedRooms] = useState<string[]>([]);
  const [newRoomDialogOpen, setNewRoomDialogOpen] = useState(false);
  const [editRoomDialogOpen, setEditRoomDialogOpen] = useState(false);
  const [deleteRoomDialogOpen, setDeleteRoomDialogOpen] = useState(false);
  const [newRoomParent, setNewRoomParent] = useState<string | null>(null);
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomDescription, setNewRoomDescription] = useState('');
  const [newRoomLevel, setNewRoomLevel] = useState('1');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedRoomForEdit, setSelectedRoomForEdit] = useState<ChatRoom | null>(null);
  const [selectedRoomForDelete, setSelectedRoomForDelete] = useState<ChatRoom | null>(null);
  const [deleteErrorMessage, setDeleteErrorMessage] = useState<string | null>(null);
  
  // Estado para o diálogo de participantes
  const [participantDialogOpen, setParticipantDialogOpen] = useState(false);
  const [selectedRoomForParticipants, setSelectedRoomForParticipants] = useState<string | null>(null);
  const [selectedParticipantId, setSelectedParticipantId] = useState('');
  const [selectedParticipantRole, setSelectedParticipantRole] = useState('consultor');
  
  // Estado para o diálogo de chat direto
  const [directChatDialogOpen, setDirectChatDialogOpen] = useState(false);
  const [selectedUser1Id, setSelectedUser1Id] = useState('');
  const [selectedUser2Id, setSelectedUser2Id] = useState('');
  
  // Buscar consultores
  const [consultants, setConsultants] = useState<any[]>([]);
  const [isLoadingConsultants, setIsLoadingConsultants] = useState(false);

  const { toast } = useToast();
  
  // Buscar consultores ao carregar o componente
  useEffect(() => {
    const loadConsultants = async () => {
      setIsLoadingConsultants(true);
      try {
        const data = await fetchConsultants();
        setConsultants(data);
      } catch (error) {
        console.error('Erro ao buscar consultores:', error);
        toast({
          variant: "destructive",
          title: "Erro",
          description: "Não foi possível carregar os consultores."
        });
      } finally {
        setIsLoadingConsultants(false);
      }
    };
    
    loadConsultants();
  }, [toast]);
  
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
      
      if (onRoomCreated) {
        onRoomCreated();
      }
      
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
  
  const handleAddParticipant = (roomId: string) => {
    setSelectedRoomForParticipants(roomId);
    setSelectedParticipantId('');
    setSelectedParticipantRole('consultor');
    setParticipantDialogOpen(true);
  };
  
  const handleSubmitAddParticipant = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!selectedRoomForParticipants || !selectedParticipantId) {
      toast({
        variant: "destructive",
        title: "Seleção obrigatória",
        description: "Selecione um participante para adicionar."
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const selectedConsultant = consultants.find(c => c.id === selectedParticipantId);
      
      if (!selectedConsultant) {
        throw new Error("Consultor não encontrado");
      }
      
      await addChatParticipant(
        selectedRoomForParticipants,
        selectedParticipantId,
        selectedConsultant.name,
        selectedParticipantRole
      );
      
      toast({
        title: "Participante adicionado",
        description: "O participante foi adicionado à sala com sucesso!"
      });
      
      setParticipantDialogOpen(false);
    } catch (error) {
      console.error('Erro ao adicionar participante:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível adicionar o participante. Tente novamente."
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleOpenDirectChatDialog = () => {
    setSelectedUser1Id('');
    setSelectedUser2Id('');
    setDirectChatDialogOpen(true);
  };
  
  const handleSubmitDirectChat = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!selectedUser1Id || !selectedUser2Id) {
      toast({
        variant: "destructive",
        title: "Seleção obrigatória",
        description: "Selecione dois consultores para a conversa direta."
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const consultant1 = consultants.find(c => c.id === selectedUser1Id);
      const consultant2 = consultants.find(c => c.id === selectedUser2Id);
      
      if (!consultant1 || !consultant2) {
        throw new Error("Consultores não encontrados");
      }
      
      const roomName = `Conversa: ${consultant1.name} e ${consultant2.name}`;
      
      await createDirectChatRoom(
        selectedUser1Id,
        consultant1.name,
        'consultor',
        selectedUser2Id,
        consultant2.name,
        'consultor',
        roomName
      );
      
      toast({
        title: "Conversa direta criada",
        description: "A sala de conversa direta foi criada com sucesso!"
      });
      
      if (onRoomCreated) {
        onRoomCreated();
      }
      
      setDirectChatDialogOpen(false);
    } catch (error) {
      console.error('Erro ao criar conversa direta:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível criar a conversa direta. Tente novamente."
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleEditRoom = (room: ChatRoom, event?: React.MouseEvent) => {
    if (event) {
      event.stopPropagation();
    }
    
    // Check if room is linked to a project
    if (room.project_id && room.projects?.status !== 'completed') {
      toast({
        variant: "destructive",
        title: "Sala de projeto",
        description: "Esta sala não pode ser editada pois está vinculada a um projeto em andamento."
      });
      return;
    }
    
    setSelectedRoomForEdit(room);
    setNewRoomName(room.name);
    setNewRoomDescription(room.description || '');
    setEditRoomDialogOpen(true);
  };
  
  const handleSubmitEditRoom = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!selectedRoomForEdit || !newRoomName.trim()) {
      toast({
        variant: "destructive",
        title: "Nome obrigatório",
        description: "Por favor, digite um nome para a sala."
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      await updateChatRoom(selectedRoomForEdit.id, {
        name: newRoomName,
        description: newRoomDescription || null
      });
      
      toast({
        title: "Sala atualizada",
        description: "A sala foi atualizada com sucesso!"
      });
      
      if (onRoomCreated) {
        onRoomCreated();
      }
      
      setEditRoomDialogOpen(false);
    } catch (error) {
      console.error('Erro ao atualizar sala:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível atualizar a sala. Tente novamente."
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleDeleteRoom = (room: ChatRoom, event?: React.MouseEvent) => {
    if (event) {
      event.stopPropagation();
    }
    
    setSelectedRoomForDelete(room);
    setDeleteErrorMessage(null);
    setDeleteRoomDialogOpen(true);
  };
  
  const handleConfirmDeleteRoom = async () => {
    if (!selectedRoomForDelete) {
      return;
    }
    
    setIsSubmitting(true);
    setDeleteErrorMessage(null);
    
    try {
      await deleteChatRoom(selectedRoomForDelete.id);
      
      toast({
        title: "Sala removida",
        description: "A sala foi removida com sucesso!"
      });
      
      if (onRoomCreated) {
        onRoomCreated();
      }
      
      setDeleteRoomDialogOpen(false);
    } catch (error: any) {
      console.error('Erro ao remover sala:', error);
      setDeleteErrorMessage(error.message || "Não foi possível remover a sala. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const canModifyRoom = (room: ChatRoom) => {
    // A room can be modified if it's not linked to a project or if the project is completed
    return !room.project_id || room.projects?.status === 'completed';
  };
  
  const renderRoom = (room: ChatRoom) => {
    const hasChildren = rooms.some(r => r.parent_id === room.id);
    const isExpanded = expandedRooms.includes(room.id);
    const childRooms = rooms.filter(r => r.parent_id === room.id);
    const isFromProject = room.project_id !== null;
    const isModifiable = canModifyRoom(room);
    
    return (
      <div key={room.id} className="select-none">
        <div 
          className={`flex items-center p-2 rounded-md cursor-pointer group ${
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
            {isFromProject && (
              <span className={`ml-2 text-xs px-1.5 py-0.5 rounded-full ${
                room.projects?.status === 'completed' 
                  ? 'bg-green-100 text-green-600' 
                  : 'bg-blue-100 text-blue-600'
              }`}>
                {room.projects?.status === 'completed' ? 'Projeto Concluído' : 'Projeto'}
              </span>
            )}
          </span>
          
          <div className="opacity-0 group-hover:opacity-100 flex items-center">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleAddParticipant(room.id);
              }}
              className="p-1 hover:bg-muted rounded mr-1"
              title="Adicionar participante"
            >
              <UserPlus size={14} />
            </button>
            
            {isModifiable && (
              <>
                <button
                  onClick={(e) => handleEditRoom(room, e)}
                  className="p-1 hover:bg-muted rounded mr-1"
                  title="Editar sala"
                >
                  <Edit size={14} />
                </button>
                
                <button
                  onClick={(e) => handleDeleteRoom(room, e)}
                  className="p-1 hover:bg-muted rounded mr-1"
                  title="Remover sala"
                >
                  <Trash size={14} />
                </button>
              </>
            )}
            
            {room.level < 3 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleCreateRoom(room.level + 1, room.id);
                }}
                className="p-1 hover:bg-muted rounded"
                title="Criar subsala"
              >
                <Plus size={14} />
              </button>
            )}
          </div>
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
        <div className="flex space-x-1">
          <Button 
            variant="ghost" 
            size="icon"
            className="h-7 w-7"
            onClick={handleOpenDirectChatDialog}
            title="Criar conversa direta"
          >
            <Users size={16} />
          </Button>
          <Button 
            variant="ghost" 
            size="icon"
            className="h-7 w-7"
            onClick={() => handleCreateRoom(1)}
            title="Criar nova sala"
          >
            <Plus size={16} />
          </Button>
        </div>
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
      
      {/* Diálogo para criar nova sala */}
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
      
      {/* Diálogo para adicionar participante */}
      <Dialog open={participantDialogOpen} onOpenChange={setParticipantDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar participante</DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmitAddParticipant} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="participant">Selecione o participante</Label>
              <Select 
                value={selectedParticipantId}
                onValueChange={setSelectedParticipantId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um consultor" />
                </SelectTrigger>
                <SelectContent>
                  {isLoadingConsultants ? (
                    <div className="flex items-center justify-center p-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                    </div>
                  ) : (
                    consultants.map(consultant => (
                      <SelectItem key={consultant.id} value={consultant.id}>
                        {consultant.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="role">Função</Label>
              <Select 
                value={selectedParticipantRole}
                onValueChange={setSelectedParticipantRole}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a função" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="consultor">Consultor</SelectItem>
                  <SelectItem value="cliente">Cliente</SelectItem>
                  <SelectItem value="admin">Administrador</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <DialogFooter>
              <Button 
                type="submit" 
                disabled={isSubmitting || !selectedParticipantId}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Adicionando...
                  </>
                ) : "Adicionar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      {/* Diálogo para criar conversa direta */}
      <Dialog open={directChatDialogOpen} onOpenChange={setDirectChatDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Criar conversa direta</DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmitDirectChat} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="user1">Primeiro participante</Label>
              <Select 
                value={selectedUser1Id}
                onValueChange={setSelectedUser1Id}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o primeiro consultor" />
                </SelectTrigger>
                <SelectContent>
                  {isLoadingConsultants ? (
                    <div className="flex items-center justify-center p-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                    </div>
                  ) : (
                    consultants.map(consultant => (
                      <SelectItem key={consultant.id} value={consultant.id}>
                        {consultant.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="user2">Segundo participante</Label>
              <Select 
                value={selectedUser2Id}
                onValueChange={setSelectedUser2Id}
                disabled={!selectedUser1Id}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o segundo consultor" />
                </SelectTrigger>
                <SelectContent>
                  {isLoadingConsultants ? (
                    <div className="flex items-center justify-center p-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                    </div>
                  ) : (
                    consultants
                      .filter(c => c.id !== selectedUser1Id)
                      .map(consultant => (
                        <SelectItem key={consultant.id} value={consultant.id}>
                          {consultant.name}
                        </SelectItem>
                      ))
                  )}
                </SelectContent>
              </Select>
            </div>
            
            <DialogFooter>
              <Button 
                type="submit" 
                disabled={isSubmitting || !selectedUser1Id || !selectedUser2Id}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Criando...
                  </>
                ) : "Criar conversa"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      {/* Dialog for editing room */}
      <Dialog open={editRoomDialogOpen} onOpenChange={setEditRoomDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar sala</DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmitEditRoom} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-room-name">Nome da sala</Label>
              <Input 
                id="edit-room-name" 
                placeholder="Digite o nome da sala" 
                value={newRoomName}
                onChange={(e) => setNewRoomName(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-room-description">Descrição</Label>
              <Textarea 
                id="edit-room-description" 
                placeholder="Descrição opcional" 
                value={newRoomDescription}
                onChange={(e) => setNewRoomDescription(e.target.value)}
              />
            </div>
            
            <DialogFooter>
              <Button 
                type="submit" 
                disabled={isSubmitting || !newRoomName.trim()}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Atualizando...
                  </>
                ) : "Atualizar sala"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      {/* Alert dialog for deleting room */}
      <AlertDialog open={deleteRoomDialogOpen} onOpenChange={setDeleteRoomDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover sala</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover esta sala? Esta ação não pode ser desfeita.
              Todas as mensagens e participantes serão removidos permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          {deleteErrorMessage && (
            <div className="bg-destructive/10 text-destructive p-3 rounded-md text-sm mb-4">
              {deleteErrorMessage}
            </div>
          )}
          
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmDeleteRoom}
              disabled={isSubmitting}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Removendo...
                </>
              ) : "Remover"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ChatRoomsList;
