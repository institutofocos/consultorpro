
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
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
import { Card, CardContent } from '@/components/ui/card';
import { useCreateChatRoom, useAvailableUsers } from '@/hooks/useChatRooms';
import { toast } from 'sonner';
import { Users, Settings, Info, MessageSquare } from 'lucide-react';
import ParticipantSelector from './ParticipantSelector';
import type { ChatRoom } from '@/hooks/useChatRooms';

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
  const [parentRoomId, setParentRoomId] = useState<string>('');
  const [participants, setParticipants] = useState<ParticipantPermission[]>([]);

  const createRoom = useCreateChatRoom();
  const { data: availableUsers, isLoading: loadingUsers } = useAvailableUsers();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error('Nome da sala é obrigatório');
      return;
    }

    if (name.trim().length < 3) {
      toast.error('Nome da sala deve ter pelo menos 3 caracteres');
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
      setParentRoomId('');
      setParticipants([]);
    } catch (error) {
      console.error('Erro ao criar sala:', error);
      toast.error('Erro ao criar sala. Tente novamente.');
    }
  };

  const getParentRoomLevel = () => {
    if (!parentRoomId) return 1;
    const parent = parentRooms.find(r => r.id === parentRoomId);
    return parent ? parent.level + 1 : 1;
  };

  // Permitir salas de nível 1 e 2 como pais (para criar sub-salas de nível 2 e 3)
  const availableParentRooms = parentRooms.filter(room => room.level < 3);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Criar Nova Sala de Chat
          </DialogTitle>
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

            <TabsContent value="basic" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome da Sala *</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Equipe de Desenvolvimento"
                  required
                  maxLength={100}
                />
                <p className="text-xs text-muted-foreground">
                  {name.length}/100 caracteres
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Descreva o propósito desta sala..."
                  rows={3}
                  maxLength={500}
                />
                <p className="text-xs text-muted-foreground">
                  {description.length}/500 caracteres
                </p>
              </div>
            </TabsContent>

            <TabsContent value="structure" className="space-y-4 mt-4">
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

              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline" className="bg-blue-100 text-blue-800">
                      Nível {getParentRoomLevel()}
                    </Badge>
                    <span className="text-sm text-blue-700 font-medium">
                      Esta sala será criada no nível {getParentRoomLevel()}
                    </span>
                  </div>
                  <div className="text-xs text-blue-600 space-y-1">
                    <p>• <strong>Nível 1:</strong> Salas principais para tópicos gerais</p>
                    <p>• <strong>Nível 2:</strong> Sub-salas para discussões específicas</p>
                    <p>• <strong>Nível 3:</strong> Salas para conversas pontuais</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-yellow-50 border-yellow-200">
                <CardContent className="p-4">
                  <h4 className="text-sm font-medium text-yellow-800 mb-2">Sistema de Visibilidade</h4>
                  <div className="text-xs text-yellow-700 space-y-1">
                    <p>• <strong>Sem participantes:</strong> Todos os usuários podem ver a sala</p>
                    <p>• <strong>Com participantes:</strong> Apenas participantes podem ver a sala</p>
                    <p>• <strong>Sub-salas:</strong> Participantes da sala pai são automaticamente adicionados</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="participants" className="space-y-4 mt-4">
              <ParticipantSelector
                availableUsers={availableUsers || []}
                selectedParticipants={participants}
                onParticipantsChange={setParticipants}
                isLoading={loadingUsers}
              />
            </TabsContent>
          </Tabs>

          <DialogFooter className="mt-6">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={createRoom.isPending}
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={createRoom.isPending || !name.trim()}
              className="flex items-center gap-2"
            >
              {createRoom.isPending ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <Users className="h-4 w-4" />
              )}
              {createRoom.isPending ? 'Criando...' : 'Criar Sala'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateRoomModal;
