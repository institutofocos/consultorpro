
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useManualChatRooms } from '@/hooks/useManualChatRooms';

interface CreateManualRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  parentRoomId?: string;
}

const CreateManualRoomModal: React.FC<CreateManualRoomModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  parentRoomId
}) => {
  const [roomName, setRoomName] = useState('');
  const [roomDescription, setRoomDescription] = useState('');
  const { createManualRoom, isCreatingRoom } = useManualChatRooms();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!roomName.trim()) return;

    createManualRoom({
      room_name: roomName.trim(),
      room_description: roomDescription.trim() || undefined,
      parent_room_id: parentRoomId
    });

    // Reset form and close modal
    setRoomName('');
    setRoomDescription('');
    onClose();
    onSuccess();
  };

  const handleClose = () => {
    setRoomName('');
    setRoomDescription('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {parentRoomId ? 'Criar Sub-sala' : 'Criar Nova Sala de Chat'}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="room-name">Nome da Sala *</Label>
            <Input
              id="room-name"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              placeholder="Digite o nome da sala..."
              required
              disabled={isCreatingRoom}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="room-description">Descrição (opcional)</Label>
            <Textarea
              id="room-description"
              value={roomDescription}
              onChange={(e) => setRoomDescription(e.target.value)}
              placeholder="Descreva o propósito da sala..."
              rows={3}
              disabled={isCreatingRoom}
            />
          </div>

          {parentRoomId && (
            <div className="text-sm text-blue-600 bg-blue-50 p-2 rounded">
              Esta será uma sub-sala vinculada à sala principal.
            </div>
          )}

          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isCreatingRoom}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={!roomName.trim() || isCreatingRoom}
            >
              {isCreatingRoom ? 'Criando...' : 'Criar Sala'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateManualRoomModal;
