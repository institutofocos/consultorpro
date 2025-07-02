
import React, { useState } from 'react';
import { ChatRoom, ChatParticipant } from '@/types/chat';
import { useChatRooms } from '@/hooks/useChatRooms';
import { useUserPermissions } from '@/hooks/useUserPermissions';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { X, UserPlus, UserMinus, Search } from 'lucide-react';
import { toast } from 'sonner';

interface ParticipantManagementProps {
  room: ChatRoom;
  participants: ChatParticipant[];
  onClose: () => void;
}

export const ParticipantManagement: React.FC<ParticipantManagementProps> = ({
  room,
  participants,
  onClose,
}) => {
  const [searchEmail, setSearchEmail] = useState('');
  const { addParticipant, removeParticipant } = useChatRooms();
  const { isSuperAdmin } = useUserPermissions();

  // Buscar usuários disponíveis para adicionar
  const { data: availableUsers } = useQuery({
    queryKey: ['available-users', searchEmail],
    queryFn: async () => {
      if (!searchEmail.trim()) return [];
      
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name')
        .ilike('full_name', `%${searchEmail}%`)
        .limit(10);

      if (error) throw error;
      
      // Filtrar usuários que já estão na sala
      const participantIds = participants.map(p => p.user_id);
      return data.filter(user => !participantIds.includes(user.id));
    },
    enabled: searchEmail.trim().length > 2,
  });

  const handleAddParticipant = async (userId: string) => {
    try {
      await addParticipant.mutateAsync({
        roomId: room.id,
        userId,
      });
      setSearchEmail('');
    } catch (error) {
      console.error('Error adding participant:', error);
    }
  };

  const handleRemoveParticipant = async (userId: string) => {
    try {
      await removeParticipant.mutateAsync({
        roomId: room.id,
        userId,
      });
    } catch (error) {
      console.error('Error removing participant:', error);
    }
  };

  const canManageParticipants = isSuperAdmin; // Apenas Super Admins podem gerenciar

  return (
    <div className="w-80 border-l bg-gray-50">
      {/* Header */}
      <div className="p-4 border-b bg-white flex items-center justify-between">
        <h3 className="font-semibold">Participantes ({participants.length})</h3>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="p-4 space-y-4">
        {/* Add Participant (Only for Super Admins) */}
        {canManageParticipants && (
          <div className="space-y-2">
            <label className="text-sm font-medium">Adicionar Participante</label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Buscar por nome..."
                  value={searchEmail}
                  onChange={(e) => setSearchEmail(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            {/* Search Results */}
            {availableUsers && availableUsers.length > 0 && (
              <div className="border rounded-md bg-white max-h-32 overflow-y-auto">
                {availableUsers.map((user) => (
                  <div
                    key={user.id}
                    className="p-2 hover:bg-gray-50 flex items-center justify-between border-b last:border-b-0"
                  >
                    <span className="text-sm">{user.full_name}</span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleAddParticipant(user.id)}
                      disabled={addParticipant.isPending}
                    >
                      <UserPlus className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Current Participants */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Participantes Atuais</label>
          <ScrollArea className="h-64">
            <div className="space-y-2">
              {participants.map((participant) => (
                <div
                  key={participant.id}
                  className="flex items-center justify-between p-2 bg-white rounded border"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-medium">
                      {((participant.user as any)?.full_name || 'U')[0].toUpperCase()}
                    </div>
                    <div>
                      <div className="text-sm font-medium">
                        {(participant.user as any)?.full_name || 'Usuário'}
                      </div>
                      <div className="text-xs text-gray-500">
                        Adicionado em {new Date(participant.added_at).toLocaleDateString('pt-BR')}
                      </div>
                    </div>
                  </div>

                  {canManageParticipants && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleRemoveParticipant(participant.user_id)}
                      disabled={removeParticipant.isPending}
                    >
                      <UserMinus className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              ))}

              {participants.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <p className="text-sm">Nenhum participante ainda</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>

        {!canManageParticipants && (
          <div className="text-xs text-gray-500 bg-yellow-50 p-2 rounded border">
            <p>Apenas Super Admins podem gerenciar participantes das salas de chat.</p>
          </div>
        )}
      </div>
    </div>
  );
};
