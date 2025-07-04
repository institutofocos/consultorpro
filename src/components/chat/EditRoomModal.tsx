
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useUpdateChatRoom } from '@/hooks/useChatRooms';
import { toast } from 'sonner';
import type { ChatRoom } from '@/hooks/useChatRooms';

interface EditRoomModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  room: ChatRoom | null;
}

const EditRoomModal: React.FC<EditRoomModalProps> = ({
  open,
  onOpenChange,
  room,
}) => {
  const [roomName, setRoomName] = useState(room?.name || '');
  const updateRoom = useUpdateChatRoom();

  // Atualizar o nome quando a sala muda
  React.useEffect(() => {
    if (room) {
      setRoomName(room.name);
    }
  }, [room]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!room) return;
    
    if (!roomName.trim()) {
      toast.error('Nome da sala é obrigatório');
      return;
    }

    try {
      await updateRoom.mutateAsync({
        id: room.id,
        name: roomName.trim(),
      });
      
      toast.success('Nome da sala atualizado com sucesso!');
      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao atualizar sala:', error);
      toast.error('Erro ao atualizar nome da sala. Tente novamente.');
    }
  };

  const handleClose = () => {
    setRoomName(room?.name || '');
    onOpenChange(false);
  };

  if (!room) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Editar Nome da Sala</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="roomName">Nome da Sala</Label>
            <Input
              id="roomName"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              placeholder="Digite o nome da sala..."
              maxLength={100}
              className="mt-1"
            />
          </div>
          
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={updateRoom.isPending}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={updateRoom.isPending || !roomName.trim()}
            >
              {updateRoom.isPending ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditRoomModal;
