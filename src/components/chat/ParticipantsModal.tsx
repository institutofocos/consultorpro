
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Search, Users, X, UserPlus } from 'lucide-react';
import { 
  useAvailableUsers, 
  useRoomParticipants, 
  useAddUserToRoom, 
  useRemoveUserFromRoom,
  type ChatUser,
  type RoomParticipant
} from '@/hooks/useChatRooms';
import { toast } from 'sonner';

interface ParticipantsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  roomId: string;
  roomName: string;
  currentParticipants: any[]; // Legacy prop for compatibility
  onUpdateParticipants: (participants: any[]) => void; // Legacy prop for compatibility
}

const ParticipantsModal: React.FC<ParticipantsModalProps> = ({
  open,
  onOpenChange,
  roomId,
  roomName,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  
  const { data: availableUsers, isLoading: loadingUsers } = useAvailableUsers();
  const { data: roomParticipants, isLoading: loadingParticipants } = useRoomParticipants(roomId);
  const addUserMutation = useAddUserToRoom();
  const removeUserMutation = useRemoveUserFromRoom();

  const filteredUsers = React.useMemo(() => {
    if (!availableUsers) return [];
    if (!searchTerm.trim()) return availableUsers;
    
    const search = searchTerm.toLowerCase();
    return availableUsers.filter(user => 
      user.name.toLowerCase().includes(search) ||
      user.email.toLowerCase().includes(search)
    );
  }, [availableUsers, searchTerm]);

  const participantIds = React.useMemo(() => {
    return new Set(roomParticipants?.map(p => p.user_id) || []);
  }, [roomParticipants]);

  const handleAddUser = async (user: ChatUser) => {
    try {
      await addUserMutation.mutateAsync({
        roomId,
        userId: user.user_id,
        canRead: true,
        canWrite: true,
      });
      toast.success(`${user.name} foi adicionado à sala`);
    } catch (error) {
      console.error('Erro ao adicionar usuário:', error);
      toast.error('Erro ao adicionar usuário. Tente novamente.');
    }
  };

  const handleRemoveUser = async (participant: RoomParticipant) => {
    if (!confirm(`Tem certeza que deseja remover ${participant.name} desta sala?`)) {
      return;
    }

    try {
      await removeUserMutation.mutateAsync({
        roomId,
        userId: participant.user_id,
      });
      toast.success(`${participant.name} foi removido da sala`);
    } catch (error) {
      console.error('Erro ao remover usuário:', error);
      toast.error('Erro ao remover usuário. Tente novamente.');
    }
  };

  if (loadingUsers || loadingParticipants) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh]">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="text-sm text-muted-foreground ml-3">Carregando...</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Gerenciar Participantes - {roomName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Participantes atuais */}
          {roomParticipants && roomParticipants.length > 0 && (
            <div className="space-y-2">
              <Label>Participantes Atuais ({roomParticipants.length})</Label>
              <div className="space-y-2 max-h-40 overflow-y-auto border rounded-md p-2">
                {roomParticipants.map((participant) => (
                  <div key={participant.user_id} className="flex items-center justify-between p-2 border rounded-md">
                    <div className="flex-1">
                      <p className="font-medium text-sm">{participant.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {participant.email} • {participant.type === 'consultant' ? 'Consultor' : 'Cliente'}
                      </p>
                      <div className="flex gap-2 mt-1">
                        <Badge variant={participant.can_read ? "default" : "secondary"} className="text-xs">
                          {participant.can_read ? "Pode ler" : "Não pode ler"}
                        </Badge>
                        <Badge variant={participant.can_write ? "default" : "secondary"} className="text-xs">
                          {participant.can_write ? "Pode escrever" : "Não pode escrever"}
                        </Badge>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveUser(participant)}
                      disabled={removeUserMutation.isPending}
                      className="hover:bg-red-50 hover:text-red-600"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Campo de busca */}
          <div className="space-y-2">
            <Label>Adicionar Usuários</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Digite o nome ou email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Lista de usuários disponíveis */}
          <div className="space-y-2">
            <div className="max-h-60 overflow-y-auto space-y-2 border rounded-md p-2">
              {filteredUsers.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  {searchTerm ? 'Nenhum usuário encontrado' : 'Nenhum usuário disponível'}
                </p>
              ) : (
                filteredUsers.map((user) => {
                  const isParticipant = participantIds.has(user.user_id);

                  return (
                    <div key={user.user_id} className="flex items-center justify-between p-3 border rounded-md">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{user.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {user.email} • {user.type === 'consultant' ? 'Consultor' : 'Cliente'}
                        </p>
                      </div>

                      {isParticipant ? (
                        <Badge variant="secondary" className="text-xs">
                          Já participa
                        </Badge>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleAddUser(user)}
                          disabled={addUserMutation.isPending}
                          className="flex items-center gap-1"
                        >
                          <UserPlus className="h-3 w-3" />
                          Adicionar
                        </Button>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ParticipantsModal;
