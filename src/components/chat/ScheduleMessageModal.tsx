
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { fetchWhatsAppConnections } from '@/integrations/supabase/whatsapp';
import { createScheduledMessage, updateScheduledMessage, type ScheduledMessage, type CreateScheduledMessageData } from '@/integrations/supabase/scheduled-messages';

interface ScheduleMessageModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  roomId: string;
  editingMessage?: ScheduledMessage | null;
}

const ScheduleMessageModal: React.FC<ScheduleMessageModalProps> = ({ 
  open, 
  onOpenChange, 
  roomId,
  editingMessage = null
}) => {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [connectionId, setConnectionId] = useState('');
  const [sendDate, setSendDate] = useState('');
  const [sendTime, setSendTime] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceType, setRecurrenceType] = useState('');
  const [recurrenceDay, setRecurrenceDay] = useState('');
  const [recurrenceTime, setRecurrenceTime] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Buscar conexões WhatsApp disponíveis
  const { data: connections = [] } = useQuery({
    queryKey: ['whatsapp-connections'],
    queryFn: fetchWhatsAppConnections
  });

  // Preencher formulário se estiver editando
  useEffect(() => {
    if (editingMessage) {
      setTitle(editingMessage.title);
      setMessage(editingMessage.message);
      setConnectionId(editingMessage.connection_id || '');
      setSendDate(editingMessage.send_date || '');
      setSendTime(editingMessage.send_time || '');
      setIsRecurring(editingMessage.is_recurring || false);
      setRecurrenceType(editingMessage.recurrence_type || '');
      setRecurrenceDay(editingMessage.recurrence_day?.toString() || '');
      setRecurrenceTime(editingMessage.recurrence_time || '');
    } else {
      // Resetar formulário para nova mensagem
      setTitle('');
      setMessage('');
      setConnectionId('');
      setSendDate('');
      setSendTime('');
      setIsRecurring(false);
      setRecurrenceType('');
      setRecurrenceDay('');
      setRecurrenceTime('');
    }
  }, [editingMessage, open]);

  // Criar mensagem agendada
  const createMutation = useMutation({
    mutationFn: createScheduledMessage,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduled-messages', roomId] });
      toast({
        title: "Sucesso",
        description: "Mensagem agendada com sucesso!"
      });
      onOpenChange(false);
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível agendar a mensagem."
      });
    }
  });

  // Atualizar mensagem agendada
  const updateMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<ScheduledMessage> }) => 
      updateScheduledMessage(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduled-messages', roomId] });
      toast({
        title: "Sucesso",
        description: "Mensagem atualizada com sucesso!"
      });
      onOpenChange(false);
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível atualizar a mensagem."
      });
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim() || !message.trim()) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Título e mensagem são obrigatórios."
      });
      return;
    }

    if (!isRecurring && (!sendDate || !sendTime)) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Data e hora de envio são obrigatórios para mensagens não recorrentes."
      });
      return;
    }

    if (isRecurring && (!recurrenceType || !recurrenceDay || !recurrenceTime)) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Todos os campos de recorrência são obrigatórios."
      });
      return;
    }

    const messageData = {
      title: title.trim(),
      message: message.trim(),
      room_id: roomId,
      sender_id: 'temp-user-id', // TODO: Usar ID do usuário atual
      sender_name: 'Usuário Atual', // TODO: Usar nome do usuário atual
      connection_id: connectionId || null,
      send_date: isRecurring ? null : sendDate,
      send_time: isRecurring ? null : sendTime,
      is_recurring: isRecurring,
      recurrence_type: isRecurring ? recurrenceType : null,
      recurrence_day: isRecurring ? parseInt(recurrenceDay) : null,
      recurrence_time: isRecurring ? recurrenceTime : null,
      status: 'active'
    };

    if (editingMessage) {
      updateMutation.mutate({ 
        id: editingMessage.id, 
        updates: messageData 
      });
    } else {
      createMutation.mutate(messageData as CreateScheduledMessageData);
    }
  };

  const getDaysOfWeek = () => [
    { value: '0', label: 'Domingo' },
    { value: '1', label: 'Segunda-feira' },
    { value: '2', label: 'Terça-feira' },
    { value: '3', label: 'Quarta-feira' },
    { value: '4', label: 'Quinta-feira' },
    { value: '5', label: 'Sexta-feira' },
    { value: '6', label: 'Sábado' }
  ];

  const getDaysOfMonth = () => {
    const days = [];
    for (let i = 1; i <= 31; i++) {
      days.push({ value: i.toString(), label: `Dia ${i}` });
    }
    return days;
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editingMessage ? 'Editar Mensagem Agendada' : 'Agendar Mensagem'}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Título</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Digite o título da mensagem"
              required
            />
          </div>

          <div>
            <Label htmlFor="message">Mensagem</Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Digite a mensagem que será enviada"
              rows={3}
              required
            />
          </div>

          <div>
            <Label htmlFor="connection">Conexão WhatsApp (Opcional)</Label>
            <Select value={connectionId} onValueChange={setConnectionId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma conexão" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Nenhuma conexão</SelectItem>
                {connections.map((connection) => (
                  <SelectItem key={connection.id} value={connection.id}>
                    {connection.instance_name} - {connection.phone_number || 'Sem número'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="recurring"
              checked={isRecurring}
              onCheckedChange={(checked) => setIsRecurring(checked as boolean)}
            />
            <Label htmlFor="recurring">Mensagem recorrente</Label>
          </div>

          {!isRecurring ? (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="sendDate">Data de Envio</Label>
                <Input
                  id="sendDate"
                  type="date"
                  value={sendDate}
                  onChange={(e) => setSendDate(e.target.value)}
                  required={!isRecurring}
                />
              </div>
              <div>
                <Label htmlFor="sendTime">Hora de Envio</Label>
                <Input
                  id="sendTime"
                  type="time"
                  value={sendTime}
                  onChange={(e) => setSendTime(e.target.value)}
                  required={!isRecurring}
                />
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <Label htmlFor="recurrenceType">Tipo de Recorrência</Label>
                <Select value={recurrenceType} onValueChange={setRecurrenceType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weekly_day">Dia fixo da semana</SelectItem>
                    <SelectItem value="monthly_day">Dia fixo do mês</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {recurrenceType && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="recurrenceDay">
                      {recurrenceType === 'weekly_day' ? 'Dia da Semana' : 'Dia do Mês'}
                    </Label>
                    <Select value={recurrenceDay} onValueChange={setRecurrenceDay}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {(recurrenceType === 'weekly_day' ? getDaysOfWeek() : getDaysOfMonth()).map((day) => (
                          <SelectItem key={day.value} value={day.value}>
                            {day.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="recurrenceTime">Horário</Label>
                    <Input
                      id="recurrenceTime"
                      type="time"
                      value={recurrenceTime}
                      onChange={(e) => setRecurrenceTime(e.target.value)}
                      required={isRecurring}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Salvando...' : editingMessage ? 'Atualizar' : 'Agendar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ScheduleMessageModal;
