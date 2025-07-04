
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { useUpdateChatRoom } from '@/hooks/useChatRooms';
import { toast } from 'sonner';
import { Video, ExternalLink } from 'lucide-react';
import type { ChatRoom } from '@/hooks/useChatRooms';

interface MeetingLinkModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  room: ChatRoom | null;
}

const MeetingLinkModal: React.FC<MeetingLinkModalProps> = ({
  open,
  onOpenChange,
  room,
}) => {
  const [meetingLink, setMeetingLink] = useState(room?.meeting_link || '');
  const updateRoom = useUpdateChatRoom();

  React.useEffect(() => {
    if (room) {
      setMeetingLink(room.meeting_link || '');
    }
  }, [room]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!room) return;

    try {
      await updateRoom.mutateAsync({
        id: room.id,
        name: room.name,
        description: room.description,
        meeting_link: meetingLink.trim() || null,
      });

      toast.success(meetingLink.trim() ? 'Link da reunião salvo!' : 'Link da reunião removido!');
      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao salvar link da reunião:', error);
      toast.error('Erro ao salvar link da reunião. Tente novamente.');
    }
  };

  const handleOpenMeeting = () => {
    if (meetingLink) {
      window.open(meetingLink, '_blank');
    }
  };

  const isValidUrl = (url: string) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Video className="h-5 w-5" />
            {room?.meeting_link ? 'Editar Reunião' : 'Adicionar Reunião'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="roomName">Sala</Label>
              <Input
                id="roomName"
                value={room?.name || ''}
                disabled
                className="bg-gray-50"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="meetingLink">Link da Reunião</Label>
              <Input
                id="meetingLink"
                value={meetingLink}
                onChange={(e) => setMeetingLink(e.target.value)}
                placeholder="https://meet.google.com/xxx-xxxx-xxx"
                type="url"
              />
              <p className="text-xs text-muted-foreground">
                Cole aqui o link do Google Meet, Zoom ou outra plataforma
              </p>
            </div>

            {meetingLink && isValidUrl(meetingLink) && (
              <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
                <Video className="h-4 w-4 text-blue-600" />
                <span className="text-sm text-blue-700 flex-1">
                  Link válido encontrado
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleOpenMeeting}
                  className="flex items-center gap-1"
                >
                  <ExternalLink className="h-3 w-3" />
                  Abrir
                </Button>
              </div>
            )}
          </div>

          <DialogFooter className="mt-6">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={updateRoom.isPending}
            >
              Cancelar
            </Button>
            {room?.meeting_link && (
              <Button
                type="button"
                variant="destructive"
                onClick={() => {
                  setMeetingLink('');
                  handleSubmit(e as any);
                }}
                disabled={updateRoom.isPending}
              >
                Remover
              </Button>
            )}
            <Button 
              type="submit" 
              disabled={updateRoom.isPending}
            >
              {updateRoom.isPending ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default MeetingLinkModal;
