
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/components/ui/use-toast";
import { Edit, Trash2, Pause, Play, Calendar } from 'lucide-react';
import { fetchScheduledMessages, deleteScheduledMessage, toggleScheduledMessage, type ScheduledMessage } from '@/integrations/supabase/scheduled-messages';
import ScheduleMessageModal from './ScheduleMessageModal';

interface ScheduledMessagesTabProps {
  roomId: string;
}

const ScheduledMessagesTab: React.FC<ScheduledMessagesTabProps> = ({ roomId }) => {
  const [editingMessage, setEditingMessage] = useState<ScheduledMessage | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Buscar mensagens agendadas
  const { data: scheduledMessages = [], isLoading } = useQuery({
    queryKey: ['scheduled-messages', roomId],
    queryFn: () => fetchScheduledMessages(roomId)
  });

  // Deletar mensagem
  const deleteMutation = useMutation({
    mutationFn: deleteScheduledMessage,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduled-messages', roomId] });
      toast({
        title: "Sucesso",
        description: "Mensagem agendada removida com sucesso!"
      });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível remover a mensagem agendada."
      });
    }
  });

  // Pausar/ativar mensagem
  const toggleMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'active' | 'paused' }) => 
      toggleScheduledMessage(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduled-messages', roomId] });
      toast({
        title: "Sucesso",
        description: "Status da mensagem atualizado!"
      });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível atualizar o status da mensagem."
      });
    }
  });

  const handleEdit = (message: ScheduledMessage) => {
    setEditingMessage(message);
    setShowEditModal(true);
  };

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id);
  };

  const handleToggleStatus = (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'paused' : 'active';
    toggleMutation.mutate({ id, status: newStatus as 'active' | 'paused' });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { label: 'Ativo', variant: 'default' as const },
      paused: { label: 'Pausado', variant: 'secondary' as const },
      sent: { label: 'Enviado', variant: 'outline' as const },
      cancelled: { label: 'Cancelado', variant: 'destructive' as const }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.active;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const formatDateTime = (date: string | null, time: string | null) => {
    if (!date || !time) return '-';
    const dateObj = new Date(`${date}T${time}`);
    return dateObj.toLocaleString('pt-BR');
  };

  const formatRecurrence = (message: ScheduledMessage) => {
    if (!message.is_recurring) return '-';
    
    if (message.recurrence_type === 'weekly_day') {
      const days = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
      return `${days[message.recurrence_day || 0]} às ${message.recurrence_time}`;
    }
    
    if (message.recurrence_type === 'monthly_day') {
      return `Dia ${message.recurrence_day} às ${message.recurrence_time}`;
    }
    
    return '-';
  };

  if (isLoading) {
    return <div className="flex justify-center py-8">Carregando mensagens agendadas...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Mensagens Agendadas
        </h3>
      </div>

      {scheduledMessages.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          Nenhuma mensagem agendada encontrada.
        </div>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Título</TableHead>
                <TableHead>Mensagem</TableHead>
                <TableHead>Agendamento</TableHead>
                <TableHead>Recorrência</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {scheduledMessages.map((message) => (
                <TableRow key={message.id}>
                  <TableCell className="font-medium">{message.title}</TableCell>
                  <TableCell className="max-w-xs truncate">{message.message}</TableCell>
                  <TableCell>
                    {formatDateTime(message.send_date, message.send_time)}
                  </TableCell>
                  <TableCell>{formatRecurrence(message)}</TableCell>
                  <TableCell>{getStatusBadge(message.status)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(message)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleStatus(message.id, message.status)}
                        disabled={message.status === 'sent' || message.status === 'cancelled'}
                      >
                        {message.status === 'active' ? (
                          <Pause className="h-4 w-4" />
                        ) : (
                          <Play className="h-4 w-4" />
                        )}
                      </Button>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                            <AlertDialogDescription>
                              Tem certeza que deseja excluir esta mensagem agendada? Esta ação não pode ser desfeita.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(message.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Excluir
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Modal de edição */}
      {editingMessage && (
        <ScheduleMessageModal
          open={showEditModal}
          onOpenChange={(open) => {
            setShowEditModal(open);
            if (!open) setEditingMessage(null);
          }}
          roomId={roomId}
          editingMessage={editingMessage}
        />
      )}
    </div>
  );
};

export default ScheduledMessagesTab;
