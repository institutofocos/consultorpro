import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Calendar, Clock, TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';
import { format, parseISO, differenceInDays, startOfWeek, addDays, isSameDay, isAfter, isBefore } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import TaskDetailsModal from './TaskDetailsModal';

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
}

interface GanttViewProps {
  tasks: Task[];
  selectedConsultantId?: string;
  overdueProjects?: number;
  overdueStages?: number;
}

const GanttView: React.FC<GanttViewProps> = ({ 
  tasks, 
  selectedConsultantId, 
  overdueProjects = 0, 
  overdueStages = 0 
}) => {
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const filteredTasks = useMemo(() => {
    if (!selectedConsultantId || selectedConsultantId === 'all') {
      return tasks;
    }
    return tasks.filter(task => task.consultant_id === selectedConsultantId);
  }, [tasks, selectedConsultantId]);

  const getStatusDisplay = (status: string) => {
    const statusMap: { [key: string]: string } = {
      'iniciar_projeto': 'Inicial',
      'em_producao': 'Em andamento',
      'aguardando_aprovacao': 'Aguardando',
      'aguardando_assinatura': 'Assinatura',
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

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setIsModalOpen(true);
  };

  const handleTaskUpdate = (updatedTask: Task) => {
    // Update the task in the local state if needed
    setSelectedTask(updatedTask);
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total de Etapas</p>
                <p className="text-2xl font-bold">{filteredTasks.length}</p>
              </div>
              <Calendar className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Projetos em Atraso</p>
                <p className="text-2xl font-bold text-red-600">{overdueProjects}</p>
              </div>
              <TrendingDown className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Etapas em Atraso</p>
                <p className="text-2xl font-bold text-orange-600">{overdueStages}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Tempo Total Gasto</p>
                <p className="text-2xl font-bold text-green-600">
                  {Math.floor(filteredTasks.reduce((sum, task) => sum + (task.time_spent_minutes || 0), 0) / 60)}h
                </p>
              </div>
              <Clock className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gantt Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Gráfico de Gantt - Cronograma de Etapas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredTasks.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                {selectedConsultantId && selectedConsultantId !== 'all' 
                  ? 'Nenhuma etapa encontrada para o consultor selecionado.' 
                  : 'Nenhuma etapa encontrada.'
                }
              </div>
            ) : (
              filteredTasks.map((task) => {
                const startDate = parseISO(task.start_date);
                const endDate = parseISO(task.end_date);
                const duration = differenceInDays(endDate, startDate) + 1;
                const today = new Date();
                const isOverdue = isBefore(endDate, today) && !task.completed;
                const isInProgress = task.status === 'em_producao';
                const timeSpentHours = Math.floor((task.time_spent_minutes || 0) / 60);
                const timeSpentMinutes = (task.time_spent_minutes || 0) % 60;

                return (
                  <TooltipProvider key={task.id}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div
                          onClick={() => handleTaskClick(task)}
                          className={`p-4 rounded-lg border cursor-pointer hover:shadow-md transition-shadow ${
                            isOverdue 
                              ? 'border-red-300 bg-red-50' 
                              : isInProgress 
                                ? 'border-blue-300 bg-blue-50' 
                                : 'border-gray-300 bg-white'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex-1">
                              <h4 className="font-semibold text-gray-900 mb-1">{task.name}</h4>
                              <p className="text-sm text-gray-600">{task.project_name}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant={getStatusColor(task.status) as any}>
                                {getStatusDisplay(task.status)}
                              </Badge>
                              {task.timer_status === 'running' && (
                                <Badge variant="outline" className="text-green-600 border-green-300">
                                  ⏱️ Ativo
                                </Badge>
                              )}
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <span className="text-gray-500">Início:</span>
                              <p className="font-medium">{format(startDate, 'dd/MM/yyyy', { locale: ptBR })}</p>
                            </div>
                            <div>
                              <span className="text-gray-500">Fim:</span>
                              <p className="font-medium">{format(endDate, 'dd/MM/yyyy', { locale: ptBR })}</p>
                            </div>
                            <div>
                              <span className="text-gray-500">Duração:</span>
                              <p className="font-medium">{duration} {duration === 1 ? 'dia' : 'dias'}</p>
                            </div>
                            <div>
                              <span className="text-gray-500">Tempo Gasto:</span>
                              <p className="font-medium text-green-600">
                                {timeSpentHours > 0 && `${timeSpentHours}h `}
                                {timeSpentMinutes}min
                              </p>
                            </div>
                          </div>

                          <div className="mt-3 flex items-center justify-between">
                            <div className="text-sm text-gray-600">
                              <span className="font-medium">Consultor:</span> {task.consultant_name}
                            </div>
                            <div className="text-sm text-gray-600">
                              <span className="font-medium">Valor:</span> R$ {task.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </div>
                          </div>

                          {isOverdue && (
                            <div className="mt-2 flex items-center gap-2 text-red-600 text-sm">
                              <AlertTriangle className="h-4 w-4" />
                              <span className="font-medium">Etapa em atraso</span>
                            </div>
                          )}
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <div className="space-y-1">
                          <div className="font-semibold">{task.name}</div>
                          <div className="text-xs">
                            <div>Projeto: {task.project_name}</div>
                            <div>Serviço: {task.service_name}</div>
                            <div>Status: {getStatusDisplay(task.status)}</div>
                            <div>Consultor: {task.consultant_name}</div>
                            <div>Período: {format(startDate, 'dd/MM', { locale: ptBR })} até {format(endDate, 'dd/MM', { locale: ptBR })}</div>
                            <div>Tempo gasto: {timeSpentHours}h {timeSpentMinutes}min</div>
                            <div>Valor: R$ {task.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                          </div>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>

      <TaskDetailsModal
        task={selectedTask}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onTaskUpdate={handleTaskUpdate}
      />
    </div>
  );
};

export default GanttView;
