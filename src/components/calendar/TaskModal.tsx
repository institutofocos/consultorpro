
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, DollarSign, User, FileText, Hash } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ScrollArea } from "@/components/ui/scroll-area";
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
  service_name?: string;
  time_spent_minutes?: number;
  timer_status?: string;
  timer_started_at?: string;
}

interface TaskModalProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
}

const TaskModal: React.FC<TaskModalProps> = ({ task, isOpen, onClose }) => {
  if (!task) return null;

  const getStatusDisplay = (status: string) => {
    const statusMap: { [key: string]: string } = {
      'iniciar_projeto': 'Inicial',
      'em_producao': 'Em andamento',
      'aguardando_aprovacao': 'Aguardando aprovação',
      'aguardando_assinatura': 'Aguardando assinatura',
      'concluido': 'Concluído',
      'cancelado': 'Cancelado'
    };
    return statusMap[status] || status;
  };

  const getStatusColor = (status: string) => {
    const colorMap: { [key: string]: string } = {
      'iniciar_projeto': 'secondary',
      'em_producao': 'default',
      'aguardando_aprovacao': 'secondary',
      'aguardando_assinatura': 'secondary',
      'concluido': 'default',
      'cancelado': 'destructive'
    };
    return colorMap[status] || 'secondary';
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'dd/MM/yyyy', { locale: ptBR });
  };

  const handleTimeUpdate = (newTimeSpent: number) => {
    console.log('Time updated:', newTimeSpent);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="p-6 pb-0 flex-shrink-0">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <FileText className="h-5 w-5" />
            Detalhes da Tarefa
          </DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="flex-1 px-6 pb-6">
          <div className="space-y-6">
            {/* Nome e Status */}
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">{task.name}</h3>
              <div className="flex items-center gap-2">
                <Badge variant={getStatusColor(task.status) as any}>
                  {getStatusDisplay(task.status)}
                </Badge>
              </div>
            </div>

            {/* Timer Controls - Posicionado logo após o cabeçalho */}
            <div className="border-t border-b py-4">
              <TimerControls
                taskId={task.id}
                initialTimeSpent={task.time_spent_minutes || 0}
                initialTimerStatus={task.timer_status || 'stopped'}
                initialTimerStartedAt={task.timer_started_at}
                onTimeUpdate={handleTimeUpdate}
              />
            </div>

            {/* Descrição */}
            {task.description && (
              <div className="space-y-2">
                <h4 className="font-medium text-gray-700">Descrição</h4>
                <div className="max-h-64 overflow-y-auto">
                  <p className="text-gray-600 whitespace-pre-wrap">{task.description}</p>
                </div>
              </div>
            )}

            {/* Informações do Projeto e Consultor */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="font-medium text-gray-700 flex items-center gap-2">
                  <Hash className="h-4 w-4" />
                  Projeto
                </h4>
                <p className="text-gray-600">{task.project_name}</p>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium text-gray-700 flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Consultor Responsável
                </h4>
                <p className="text-gray-600">{task.consultant_name}</p>
              </div>
            </div>

            {/* Serviço */}
            {task.service_name && (
              <div className="space-y-2">
                <h4 className="font-medium text-gray-700">Serviço</h4>
                <p className="text-gray-600">{task.service_name}</p>
              </div>
            )}

            {/* Datas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="font-medium text-gray-700 flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Data de Início
                </h4>
                <p className="text-gray-600">{formatDate(task.start_date)}</p>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium text-gray-700 flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Data de Fim
                </h4>
                <p className="text-gray-600">{formatDate(task.end_date)}</p>
              </div>
            </div>

            {/* Duração e Horas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="font-medium text-gray-700">Duração em Dias</h4>
                <p className="text-gray-600">{task.days} {task.days === 1 ? 'dia' : 'dias'}</p>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium text-gray-700 flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Carga Horária Estimada
                </h4>
                <p className="text-gray-600">{task.hours} {task.hours === 1 ? 'hora' : 'horas'}</p>
              </div>
            </div>

            {/* Valores */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="font-medium text-gray-700 flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Valor Total da Tarefa
                </h4>
                <p className="text-gray-600 font-semibold">{formatCurrency(task.value)}</p>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium text-gray-700 flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Valor de Repasse ao Consultor
                </h4>
                <p className="text-gray-600 font-semibold">{formatCurrency(task.valor_de_repasse)}</p>
              </div>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default TaskModal;
