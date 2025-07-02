
import React, { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, Users, X } from 'lucide-react';
import type { ChatUser } from '@/hooks/useChatRooms';

interface ParticipantPermission {
  user_id: string;
  can_read: boolean;
  can_write: boolean;
}

interface ParticipantSelectorProps {
  availableUsers: ChatUser[];
  selectedParticipants: ParticipantPermission[];
  onParticipantsChange: (participants: ParticipantPermission[]) => void;
  isLoading?: boolean;
}

const ParticipantSelector: React.FC<ParticipantSelectorProps> = ({
  availableUsers,
  selectedParticipants,
  onParticipantsChange,
  isLoading = false,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredUsers = useMemo(() => {
    if (!searchTerm.trim()) return availableUsers;
    
    const search = searchTerm.toLowerCase();
    return availableUsers.filter(user => 
      user.name.toLowerCase().includes(search) ||
      user.email.toLowerCase().includes(search)
    );
  }, [availableUsers, searchTerm]);

  const selectedUsers = useMemo(() => {
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
      onParticipantsChange(newParticipants);
    } else {
      const newParticipants = selectedParticipants.filter(p => p.user_id !== user.user_id);
      onParticipantsChange(newParticipants);
    }
  };

  const handlePermissionChange = (userId: string, permission: 'can_read' | 'can_write', value: boolean) => {
    const newParticipants = selectedParticipants.map(p =>
      p.user_id === userId ? { ...p, [permission]: value } : p
    );
    onParticipantsChange(newParticipants);
  };

  const removeUser = (userId: string) => {
    const newParticipants = selectedParticipants.filter(p => p.user_id !== userId);
    onParticipantsChange(newParticipants);
  };

  const isUserSelected = (userId: string) => {
    return selectedParticipants.some(p => p.user_id === userId);
  };

  const getUserPermissions = (userId: string) => {
    return selectedParticipants.find(p => p.user_id === userId);
  };

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="text-sm text-muted-foreground mt-2">Carregando usuários...</p>
      </div>
    );
  }

  if (!availableUsers || availableUsers.length === 0) {
    return (
      <Card className="bg-yellow-50 border-yellow-200">
        <CardContent className="p-4 text-center">
          <Users className="h-12 w-12 mx-auto mb-2 text-yellow-600" />
          <p className="text-yellow-800 font-medium">Nenhum usuário disponível</p>
          <p className="text-xs text-yellow-600 mt-1">
            Certifique-se de que existem consultores ou clientes cadastrados
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Campo de busca */}
      <div className="space-y-2">
        <Label>Buscar Participantes</Label>
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
            {selectedUsers.map((user) => {
              const permissions = getUserPermissions(user.user_id);
              return (
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
              );
            })}
          </div>
        </div>
      )}

      {/* Lista de usuários para seleção */}
      <div className="space-y-2">
        <Label>Selecionar Participantes</Label>
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
                <Card key={user.user_id} className="p-3">
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
                </Card>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default ParticipantSelector;
