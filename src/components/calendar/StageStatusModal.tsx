
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Calendar, User, Clock, DollarSign, Save, X } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useProjectStatuses } from '@/hooks/useProjectStatuses';
import TimerControls from './TimerControls';

interface Task {
  id: string;
  name: string;
  description: string;
  start_date: string;
  end_date: string;
  status: string;
  value: number;
  valor_de_repasse: number;
  hours: number;
  days: number;
  project_id: string;
  consultant_id: string;
  consultant_name: string;
  project_name: string;
  service_name: string;
  completed?: boolean;
  time_spent_minutes?: number;
  timer_status?: string;
  timer_started_at?: string;
}

interface StageStatusModalProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  onStatusUpdate: (taskId: string, newStatus: string) => void;
}

const StageStatusModal: React.FC<StageStatusModalProps> = ({
  task,
  isOpen,
  onClose,
  onStatusUpdate
}) => {
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [isUpdating, setIsUpdating] = useState(false);
  const { statuses, getStatusDisplay, getStatusBadgeStyle } = useProjectStatuses();

  React.useEffect(() => {
    if (task) {
      setSelectedStatus(task.status);
    }
  }, [task]);

  const handleUpdateStatus = async () => {
    if (!task || !selectedStatus) return;

    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from('project_stages')
        .update({ status: selectedStatus })
        .eq('id', task.id);

      if (error) throw error;

      onStatusUpdate(task.id, selectedStatus);
      toast.success('Status da etapa atualizado com sucesso!');
      onClose();
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      toast.error('Erro ao atualizar status da etapa');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleTimeUpdate = (newTimeSpent: number) => {
    console.log('Time updated:', newTimeSpent);
  };

  if (!task) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Alterar Status da Etapa
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Task Info */}
          <div className="border rounded-lg p-4 space-y-3">
            <div>
              <h3 className="font-semibold text-lg">{task.name}</h3>
              <p className="text-sm text-muted-foreground">{task.project_name}</p>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span>{task.consultant_name}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>{task.days} dias</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>{format(parseISO(task.start_date), 'dd/MM/yyyy', { locale: ptBR })}</span>
              </div>
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                <span>R$ {task.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Status atual:</span>
              <Badge 
                className="text-white text-xs"
                style={getStatusBadgeStyle(task.status)}
              >
                {getStatusDisplay(task.status).label}
              </Badge>
            </div>
          </div>

          {/* Timer Controls - ANTES DO STATUS */}
          <div className="border-t border-b py-4">
            <TimerControls
              taskId={task.id}
              initialTimeSpent={task.time_spent_minutes || 0}
              initialTimerStatus={task.timer_status || 'stopped'}
              initialTimerStartedAt={task.timer_started_at || undefined}
              onTimeUpdate={handleTimeUpdate}
            />
          </div>

          {/* Status Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Novo status:</label>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um status" />
              </SelectTrigger>
              <SelectContent>
                {statuses.map((status) => (
                  <SelectItem key={status.id} value={status.name}>
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: status.color }}
                      />
                      {status.display_name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4">
            <Button 
              onClick={handleUpdateStatus}
              disabled={isUpdating || selectedStatus === task.status}
              className="flex-1"
            >
              <Save className="h-4 w-4 mr-2" />
              {isUpdating ? 'Atualizando...' : 'Atualizar Status'}
            </Button>
            <Button variant="outline" onClick={onClose}>
              <X className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default StageStatusModal;
