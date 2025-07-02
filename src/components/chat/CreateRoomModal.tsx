
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useCreateChatRoom, useAvailableUsers } from '@/hooks/useChatRooms';
import { toast } from 'sonner';
import { Users, Settings, Info } from 'lucide-react';
import type { ChatRoom, ChatUser } from '@/hooks/useChatRooms';

interface CreateRoomModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  parentRooms: ChatRoom[];
}

interface ParticipantPermission {
  user_id: string;
  can_read: boolean;
  can_write: boolean;
}

const CreateRoomModal: React.FC<CreateRoomModalProps> = ({
  open,
  onOpenChange,
  parentRooms,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [level, setLevel] = useState<number>(1);
  const [parentRoomId, setParentRoomId] = useState<string>('');
  const [participants, setParticipants] = useState<ParticipantPermission[]>([]);

  const createRoom = useCreateChatRoom();
  const { data: availableUsers } = useAvailableUsers();

  const handleParticipantToggle = (user: ChatUser, checked: boolean) => {
    setParticipants(prev => {
      if (checked) {
        return [...prev, {
          user_id: user.user_id,
          can_read: true,
          can_write: true,
        }];
      } else {
        return prev.filter(p => p.user_id !== user.user_id);
      }
    });
  };

  const handlePermissionChange = (userId: string, permission: 'can_read' | 'can_write', value: boolean) => {
    setParticipants(prev =>
      prev.map(p =>
        p.user_id === userId ? { ...p, [permission]: value } : p
      )
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error('Nome da sala é obrigatório');
      return;
    }

    const actualLevel = parentRoomId ? 
      (parentRooms.find(r => r.id === parentRoomId)?.level || 1) + 1 : 
      1;

    if (actualLevel > 3) {
      toast.error('Não é possível criar salas com mais de 3 níveis');
      return;
    }

    try {
      await createRoom.mutateAsync({
        name: name.trim(),
        description: description.trim() || undefined,
        parent_room_id: parentRoomId || undefined,
        level: actualLevel,
        participants,
      });

      toast.success('Sala criada com sucesso!');
      onOpenChange(false);
      
      // Reset form
      setName('');
      setDescription('');
      setLevel(1);
      setParentRoomId('');
      setParticipants([]);
    } catch (error) {
      console.error('Erro ao criar sala:', error);
      toast.error('Erro ao criar sala');
    }
  };

  const getParentRoomLevel = () => {
    if (!parentRoomId) return 1;
    const parent = parentRooms.find(r => r.id === parentRoomId);
    return parent ? parent.level + 1 : 1;
  };

  const availableParentRooms = parentRooms.filter(room => room.level < 3);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Criar Nova Sala de Chat</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="basic" className="flex items-center gap-2">
                <Info className="h-4 w-4" />
                Básico
              </TabsTrigger>
              <TabsTrigger value="structure" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Estrutura
              </TabsTrigger>
              <TabsTrigger value="participants" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Participantes ({participants.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome da Sala *</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Equipe de Desenvolvimento"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Descreva o propósito desta sala..."
                  rows={3}
                />
              </div>
            </TabsContent>

            <TabsContent value="structure" className="space-y-4">
              <div className="space-y-2">
                <Label>Sala Pai (Opcional)</Label>
                <Select value={parentRoomId} onValueChange={setParentRoomId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma sala pai" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Sala Raiz (Nível 1)</SelectItem>
                    {availableParentRooms.map((room) => (
                      <SelectItem key={room.id} value={room.id}>
                        {room.name} (Nível {room.level})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">
                    Nível {getParentRoomLevel()}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    Esta sala será criada no nível {getParentRoomLevel()}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground mt-2">
                  • Nível 1: Salas principais
                  • Nível 2: Sub-salas
                  • Nível 3: Salas específicas
                </div>
              </div>
            </TabsContent>

            <TabsContent value="participants" className="space-y-4">
              <div className="space-y-2">
                <Label>Selecionar Participantes</Label>
                <p className="text-sm text-muted-foreground">
                  Escolha quem pode participar desta sala e defina suas permissões.
                </p>
              </div>

              {availableUsers?.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Nenhum usuário disponível</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {availableUsers?.map((user) => {
                    const isSelected = participants.some(p => p.user_id === user.user_id);
                    const userPermissions = participants.find(p => p.user_id === user.user_id);

                    return (
                      <Card key={user.user_id} className="p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={(checked) => 
                                handleParticipantToggle(user, checked as boolean)
                              }
                            />
                            <div>
                              <p className="font-medium text-sm">{user.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {user.email} • {user.type === 'consultant' ? 'Consultor' : 'Cliente'}
                              </p>
                            </div>
                          </div>

                          {isSelected && (
                            <div className="flex items-center gap-4">
                              <div className="flex items-center gap-2">
                                <Checkbox
                                  checked={userPermissions?.can_read}
                                  onCheckedChange={(checked) =>
                                    handlePermissionChange(user.user_id, 'can_read', checked as boolean)
                                  }
                                />
                                <span className="text-xs">Ler</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Checkbox
                                  checked={userPermissions?.can_write}
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
                  })}
                </div>
              )}
            </TabsContent>
          </Tabs>

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={createRoom.isPending}>
              {createRoom.isPending ? 'Criando...' : 'Criar Sala'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateRoomModal;
