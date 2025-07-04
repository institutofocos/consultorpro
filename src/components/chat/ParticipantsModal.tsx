
import React, { useState } from 'react';
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
import { Search, Users, X } from 'lucide-react';
import { useAvailableUsers, useRoomParticipants, useUpdateRoomParticipants } from '@/hooks/useChatRooms';
import type { ChatUser } from '@/hooks/useChatRooms';
import { toast } from 'sonner';

interface ParticipantPermission {
  user_id: string;
  can_read: boolean;
  can_write: boolean;
}

interface ParticipantsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  roomId: string;
  roomName: string;
}

const ParticipantsModal: React.FC<ParticipantsModalProps> = ({
  open,
  onOpenChange,
  roomId,
  roomName,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedParticipants, setSelectedParticipants] = useState<ParticipantPermission[]>([]);
  
  const { data: availableUsers, isLoading: loadingUsers } = useAvailableUsers();
  const { data: currentParticipants, isLoading: loadingParticipants } = useRoomParticipants(roomId);
  const updateParticipants = useUpdateRoomParticipants();

  // Initialize selected participants when modal opens and participants are loaded
  React.useEffect(() => {
    if (open && currentParticipants) {
      const participantsData = currentParticipants.map((p: any) => ({
        user_id: p.user_id,
        can_read: p.can_read,
        can_write: p.can_write,
      }));
      setSelectedParticipants(participantsData);
    }
  }, [open, currentParticipants]);

  const filteredUsers = React.useMemo(() => {
    if (!availableUsers) return [];
    if (!searchTerm.trim()) return availableUsers;
    
    const search = searchTerm.toLowerCase();
    return availableUsers.filter(user => 
      user.name.toLowerCase().includes(search) ||
      user.email.toLowerCase().includes(search)
    );
  }, [availableUsers, searchTerm]);

  const selectedUsers = React.useMemo(() => {
    if (!availableUsers) return [];
    return selectedParticipants.map(p => 
      availableUsers.find(u => u.user_id === p.user_id)
    ).filter(Boolean) as ChatUser[];
  }, [selectedParticipants, availableUsers]);

  const handleUserToggle = (user: ChatUser, checked: boolean) => {
    if (checked) {
      const newParticipants = [...selectedParticipants, {
        user_id: user.user_id,
        can_read: true,
        can_write: true,
      }];
      setSelectedParticipants(newParticipants);
    } else {
      const newParticipants = selectedParticipants.filter(p => p.user_id !== user.user_id);
      setSelectedParticipants(newParticipants);
    }
  };

  const handlePermissionChange = (userId: string, permission: 'can_read' | 'can_write', value: boolean) => {
    const newParticipants = selectedParticipants.map(p =>
      p.user_id === userId ? { ...p, [permission]: value } : p
    );
    setSelectedParticipants(newParticipants);
  };

  const removeUser = (userId: string) => {
    const newParticipants = selectedParticipants.filter(p => p.user_id !== userId);
    setSelectedParticipants(newParticipants);
  };

  const isUserSelected = (userId: string) => {
    return selectedParticipants.some(p => p.user_id === userId);
  };

  const getUserPermissions = (userId: string) => {
    return selectedParticipants.find(p => p.user_id === userId);
  };

  const handleSave = async () => {
    try {
      await updateParticipants.mutateAsync({
        roomId,
        participants: selectedParticipants,
      });
      toast.success('Participantes atualizados com sucesso!');
      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao atualizar participantes:', error);
      toast.error('Erro ao atualizar participantes. Tente novamente.');
    }
  };

  const handleCancel = () => {
    if (currentParticipants) {
      const participantsData = currentParticipants.map((p: any) => ({
        user_id: p.user_id,
        can_read: p.can_read,
        can_write: p.can_write,
      }));
      setSelectedParticipants(participantsData);
    }
    onOpenChange(false);
  };

  if (loadingUsers || loadingParticipants) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh]">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="text-sm text-muted-foreground ml-3">Carregando usuários...</p>
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
          {/* Campo de busca */}
          <div className="space-y-2">
            <Label>Buscar Usuários</Label>
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

          {/* Participantes selecionados */}
          {selectedUsers.length > 0 && (
            <div className="space-y-2">
              <Label>Participantes Selecionados ({selectedUsers.length})</Label>
              <div className="flex flex-wrap gap-2">
                {selectedUsers.map((user) => (
                  <Badge
                    key={user.user_id}
                    variant="secondary"
                    className="flex items-center gap-1 pr-1"
                  >
                    <span className="text-xs">{user.name}</span>
                    <button
                      onClick={() => removeUser(user.user_id)}
                      className="ml-1 hover:bg-gray-200 rounded-full p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Lista de usuários para seleção */}
          <div className="space-y-2">
            <Label>Selecionar Usuários</Label>
            <div className="max-h-60 overflow-y-auto space-y-2 border rounded-md p-2">
              {filteredUsers.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  {searchTerm ? 'Nenhum usuário encontrado' : 'Nenhum usuário disponível'}
                </p>
              ) : (
                filteredUsers.map((user) => {
                  const isSelected = isUserSelected(user.user_id);
                  const permissions = getUserPermissions(user.user_id);

                  return (
                    <div key={user.user_id} className="border rounded-md p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={(checked) =>
                              handleUserToggle(user, checked as boolean)
                            }
                          />
                          <div>
                            <p className="font-medium text-sm">{user.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {user.email} • {user.type === 'consultant' ? 'Consultor' : 'Cliente'}
                            </p>
                          </div>
                        </div>

                        {isSelected && permissions && (
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                              <Checkbox
                                checked={permissions.can_read}
                                onCheckedChange={(checked) =>
                                  handlePermissionChange(user.user_id, 'can_read', checked as boolean)
                                }
                              />
                              <span className="text-xs">Ler</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Checkbox
                                checked={permissions.can_write}
                                onCheckedChange={(checked) =>
                                  handlePermissionChange(user.user_id, 'can_write', checked as boolean)
                                }
                              />
                              <span className="text-xs">Escrever</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel} disabled={updateParticipants.isPending}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={updateParticipants.isPending}>
            {updateParticipants.isPending ? 'Salvando...' : 'Salvar Alterações'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ParticipantsModal;
