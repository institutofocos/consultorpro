
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ChevronLeft, ChevronRight, Calendar, User, Clock, AlertTriangle } from 'lucide-react';
import { format, addDays, startOfWeek, differenceInDays, parseISO, addWeeks, subWeeks, isAfter, isBefore } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { formatDateBR } from '@/utils/dateUtils';
import { useProjectStatuses } from '@/hooks/useProjectStatuses';

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
}

interface GanttViewProps {
  tasks: Task[];
  selectedConsultantId: string;
  overdueProjects?: number;
  overdueStages?: number;
}

const GanttView: React.FC<GanttViewProps> = ({ 
  tasks, 
  selectedConsultantId, 
  overdueProjects = 0, 
  overdueStages = 0 
}) => {
  const [viewStartDate, setViewStartDate] = useState<Date>(() => startOfWeek(new Date()));
  const [timelineWeeks, setTimelineWeeks] = useState(8); // 8 weeks view
  const [draggedTask, setDraggedTask] = useState<string | null>(null);
  const [resizingTask, setResizingTask] = useState<string | null>(null);

  // Use the project statuses hook
  const { statuses, getStatusDisplay, getStatusBadgeStyle } = useProjectStatuses();

  // Generate timeline based on view start date and weeks
  const generateTimeline = () => {
    const timeline = [];
    for (let i = 0; i < timelineWeeks; i++) {
      timeline.push(addDays(viewStartDate, i * 7));
    }
    return timeline;
  };

  const timeline = generateTimeline();

  // Function to check if an item is overdue - for visual styling only
  const isOverdue = (endDate: string, status: string, completed?: boolean) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const itemEndDate = new Date(endDate);
    itemEndDate.setHours(0, 0, 0, 0);
    
    // Determine completion statuses from configured statuses
    const completionStatuses = statuses
      .filter(s => s.is_completion_status)
      .map(s => s.name);
    
    // If no completion statuses configured, use fallback
    const finalCompletionStatuses = completionStatuses.length > 0 
      ? completionStatuses 
      : ['concluido', 'completed', 'finalizados'];
    
    // Check if end date is before today and status is not completed/concluded
    // For stages, also check the completed flag
    const isNotCompleted = !finalCompletionStatuses.includes(status) && 
                          status !== 'cancelado' && 
                          status !== 'cancelled';
    
    // For stages (tasks), also consider the completed flag
    const stageNotCompleted = completed !== undefined ? !completed : true;
    
    return isBefore(itemEndDate, today) && isNotCompleted && stageNotCompleted;
  };

  // Calculate current date position
  const calculateCurrentDatePosition = () => {
    const today = new Date();
    const totalDays = timelineWeeks * 7;
    const daysSinceViewStart = differenceInDays(today, viewStartDate);
    
    // Check if today is within the visible timeline
    const isVisible = daysSinceViewStart >= 0 && daysSinceViewStart < totalDays;
    const leftPercent = (daysSinceViewStart / totalDays) * 100;
    
    return {
      visible: isVisible,
      left: `${leftPercent}%`
    };
  };

  const currentDatePosition = calculateCurrentDatePosition();

  // Group tasks by project
  const groupedTasks = tasks.reduce((acc, task) => {
    if (!acc[task.project_id]) {
      acc[task.project_id] = {
        project_name: task.project_name,
        service_name: task.service_name,
        tasks: []
      };
    }
    acc[task.project_id].tasks.push(task);
    return acc;
  }, {} as Record<string, { project_name: string; service_name: string; tasks: Task[] }>);

  // Get status color from configured statuses or fallback
  const getStatusColor = (status: string) => {
    const statusSetting = statuses.find(s => s.name === status);
    if (statusSetting) {
      return statusSetting.color;
    }
    
    // Fallback para status antigos não configurados - CORRIGIDO: iniciar_projeto agora usa azul
    const fallbackColors: { [key: string]: string } = {
      'iniciar_projeto': '#3b82f6', // Mudado de #6b7280 (cinza) para #3b82f6 (azul)
      'em_producao': '#3b82f6',
      'aguardando_aprovacao': '#f59e0b',
      'aguardando_assinatura': '#8b5cf6',
      'concluido': '#10b981',
      'cancelado': '#ef4444'
    };
    
    return fallbackColors[status] || '#6b7280';
  };

  // Get status display text from configured statuses
  const getStatusDisplayText = (status: string) => {
    const statusData = getStatusDisplay(status);
    return statusData.label;
  };

  // Calculate task position
  const calculateTaskPosition = (startDate: string, endDate: string) => {
    const start = parseISO(startDate);
    const end = parseISO(endDate);
    const totalDays = timelineWeeks * 7;
    
    const daysSinceViewStart = differenceInDays(start, viewStartDate);
    const taskDuration = differenceInDays(end, start) + 1;
    
    const leftPercent = Math.max(0, (daysSinceViewStart / totalDays) * 100);
    const widthPercent = Math.min(100 - leftPercent, (taskDuration / totalDays) * 100);
    
    return {
      left: `${leftPercent}%`,
      width: `${Math.max(1, widthPercent)}%`,
      visible: daysSinceViewStart < totalDays && daysSinceViewStart + taskDuration > 0
    };
  };

  // Navigate to previous week
  const navigatePrevious = () => {
    setViewStartDate(subWeeks(viewStartDate, 2));
  };

  // Navigate to next week
  const navigateNext = () => {
    setViewStartDate(addWeeks(viewStartDate, 2));
  };

  // Navigate to today
  const navigateToday = () => {
    setViewStartDate(startOfWeek(new Date()));
  };

  // Handle drag start
  const handleDragStart = (taskId: string) => {
    setDraggedTask(taskId);
  };

  // Handle drag end
  const handleDragEnd = () => {
    setDraggedTask(null);
  };

  // Filter grouped tasks based on selected consultant
  const filteredGroupedTasks = selectedConsultantId
    ? Object.entries(groupedTasks).reduce((acc, [projectId, projectData]) => {
        const filteredTasks = projectData.tasks.filter(task => task.consultant_id === selectedConsultantId);
        if (filteredTasks.length > 0) {
          acc[projectId] = {
            ...projectData,
            tasks: filteredTasks
          };
        }
        return acc;
      }, {} as typeof groupedTasks)
    : groupedTasks;

  return (
    <div className="space-y-4">
      {/* Navigation Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={navigatePrevious}>
            <ChevronLeft className="h-4 w-4 mr-2" />
            Anterior
          </Button>
          <Button variant="outline" size="sm" onClick={navigateToday}>
            <Calendar className="h-4 w-4 mr-2" />
            Hoje
          </Button>
          <Button variant="outline" size="sm" onClick={navigateNext}>
            Próximo
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span className="text-sm font-medium">
                {format(viewStartDate, 'dd/MM/yyyy', { locale: ptBR })} - {format(addDays(viewStartDate, timelineWeeks * 7 - 1), 'dd/MM/yyyy', { locale: ptBR })}
              </span>
            </div>
            
            {/* Overdue Projects and Stages Display */}
            {(overdueProjects > 0 || overdueStages > 0) && (
              <div className="flex items-center gap-4">
                {overdueProjects > 0 && (
                  <div className="flex items-center gap-2 px-3 py-1 bg-orange-50 border border-orange-200 rounded-lg">
                    <AlertTriangle className="h-4 w-4 text-orange-500" />
                    <span className="text-sm font-medium text-orange-700">
                      {overdueProjects} projeto{overdueProjects > 1 ? 's' : ''} atrasado{overdueProjects > 1 ? 's' : ''}
                    </span>
                  </div>
                )}
                
                {overdueStages > 0 && (
                  <div className="flex items-center gap-2 px-3 py-1 bg-red-50 border border-red-200 rounded-lg">
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                    <span className="text-sm font-medium text-red-700">
                      {overdueStages} etapa{overdueStages > 1 ? 's' : ''} atrasada{overdueStages > 1 ? 's' : ''}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <Select value={timelineWeeks.toString()} onValueChange={(value) => setTimelineWeeks(parseInt(value))}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="4">4 semanas</SelectItem>
            <SelectItem value="8">8 semanas</SelectItem>
            <SelectItem value="12">12 semanas</SelectItem>
            <SelectItem value="16">16 semanas</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Gantt Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Visualização Gantt
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {Object.keys(filteredGroupedTasks).length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhuma tarefa encontrada para o período selecionado</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              {/* Timeline Header */}
              <div className="flex border-b bg-muted/30 relative">
                <div className="w-80 flex-shrink-0 p-4 border-r font-semibold">
                  Projeto / Etapa
                </div>
                <div className="flex-1 grid grid-cols-8 min-w-[800px] relative">
                  {timeline.map((week, index) => (
                    <div key={index} className="p-2 text-center text-sm font-medium border-r border-muted">
                      <div>{format(week, 'MMM', { locale: ptBR })}</div>
                      <div className="text-xs text-muted-foreground">
                        {format(week, 'dd', { locale: ptBR })}
                      </div>
                    </div>
                  ))}
                  
                  {/* Current Date Line */}
                  {currentDatePosition.visible && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div
                            className="absolute top-0 bottom-0 w-0.5 bg-green-500 z-10 cursor-pointer"
                            style={{ left: currentDatePosition.left }}
                          >
                            <div className="absolute -top-1 -left-1 w-2 h-2 bg-green-500 rounded-full"></div>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <div className="text-sm font-medium">
                            Hoje: {formatDateBR(new Date())}
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </div>
              </div>

              {/* Project Groups */}
              {Object.entries(filteredGroupedTasks).map(([projectId, projectData]) => (
                <div key={projectId} className="border-b">
                  {/* Project Header */}
                  <div className="flex bg-muted/10 relative">
                    <div className="w-80 flex-shrink-0 p-3 border-r">
                      <div className="font-semibold">{projectData.project_name}</div>
                      <div className="text-xs text-muted-foreground">{projectData.service_name}</div>
                    </div>
                    <div className="flex-1 min-w-[800px] relative">
                      {/* Project timeline background */}
                      <div className="h-full grid grid-cols-8">
                        {timeline.map((_, index) => (
                          <div key={index} className="border-r border-muted/30 h-full"></div>
                        ))}
                      </div>
                      
                      {/* Current Date Line for Project Header */}
                      {currentDatePosition.visible && (
                        <div
                          className="absolute top-0 bottom-0 w-0.5 bg-green-500 z-10"
                          style={{ left: currentDatePosition.left }}
                        ></div>
                      )}
                    </div>
                  </div>

                  {/* Project Tasks */}
                  {projectData.tasks.map((task) => {
                    const position = calculateTaskPosition(task.start_date, task.end_date);
                    const statusColor = getStatusColor(task.status);
                    const statusBadgeStyle = getStatusBadgeStyle(task.status);
                    const taskIsOverdue = isOverdue(task.end_date, task.status, task.completed);
                    
                    if (!position.visible) return null;

                    return (
                      <TooltipProvider key={task.id}>
                        <div className="flex hover:bg-muted/20 transition-colors relative">
                          <div className="w-80 flex-shrink-0 p-3 border-r">
                            <div className="flex items-center gap-2">
                              <div className="flex-1">
                                <div className={`font-medium text-sm flex items-center gap-2 ${taskIsOverdue ? 'text-red-700' : ''}`}>
                                  {taskIsOverdue && <AlertTriangle className="h-3 w-3 text-red-500" />}
                                  {task.name}
                                </div>
                                <div className="text-xs text-muted-foreground flex items-center gap-2">
                                  <User className="h-3 w-3" />
                                  {task.consultant_name}
                                </div>
                              </div>
                              <Badge 
                                className="text-white text-xs"
                                style={statusBadgeStyle.backgroundColor ? statusBadgeStyle : { backgroundColor: statusColor, color: '#ffffff' }}
                              >
                                {getStatusDisplayText(task.status)}
                              </Badge>
                            </div>
                          </div>
                          
                          <div className="flex-1 min-w-[800px] relative p-2">
                            {/* Timeline grid background */}
                            <div className="absolute inset-0 grid grid-cols-8">
                              {timeline.map((_, index) => (
                                <div key={index} className="border-r border-muted/20"></div>
                              ))}
                            </div>
                            
                            {/* Current Date Line for Task Row */}
                            {currentDatePosition.visible && (
                              <div
                                className="absolute top-0 bottom-0 w-0.5 bg-green-500 z-20"
                                style={{ left: currentDatePosition.left }}
                              ></div>
                            )}
                            
                            {/* Task bar */}
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div
                                  className={`absolute top-2 bottom-2 rounded cursor-move hover:opacity-80 transition-opacity flex items-center px-2 text-white text-xs font-medium shadow-sm ${
                                    draggedTask === task.id ? 'opacity-50' : ''
                                  } ${
                                    taskIsOverdue 
                                      ? 'border-2 border-red-500 shadow-red-200 ring-1 ring-red-300' 
                                      : ''
                                  }`}
                                  style={{
                                    left: position.left,
                                    width: position.width,
                                    backgroundColor: taskIsOverdue 
                                      ? `${statusColor}CC` // Make color slightly transparent for overdue items
                                      : statusColor
                                  }}
                                  draggable
                                  onDragStart={() => handleDragStart(task.id)}
                                  onDragEnd={handleDragEnd}
                                >
                                  <div className="flex items-center gap-1 truncate">
                                    <Clock className="h-3 w-3" />
                                    <span>{task.days}d</span>
                                    {taskIsOverdue && <AlertTriangle className="h-3 w-3 text-red-200" />}
                                    {parseFloat(position.width) > 10 && (
                                      <span className="truncate ml-1">{task.name}</span>
                                    )}
                                  </div>
                                  
                                  {/* Resize handles */}
                                  <div className="absolute left-0 top-0 bottom-0 w-1 cursor-ew-resize hover:bg-white/30"></div>
                                  <div className="absolute right-0 top-0 bottom-0 w-1 cursor-ew-resize hover:bg-white/30"></div>
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <div className="space-y-1">
                                  <div className="font-semibold">{task.name}</div>
                                  <div className="text-xs">
                                    <div>Início: {format(parseISO(task.start_date), 'dd/MM/yyyy', { locale: ptBR })}</div>
                                    <div>Fim: {format(parseISO(task.end_date), 'dd/MM/yyyy', { locale: ptBR })}</div>
                                    <div>Duração: {task.days} dias</div>
                                    <div>Horas: {task.hours}h</div>
                                    <div>Valor: R$ {task.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                                    <div>Consultor: {task.consultant_name}</div>
                                    <div>Status: {getStatusDisplayText(task.status)}</div>
                                    {taskIsOverdue && (
                                      <div className="text-red-400 font-medium">⚠️ Em atraso</div>
                                    )}
                                  </div>
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                        </div>
                      </TooltipProvider>
                    );
                  })}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Legend */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4">
            {statuses.length > 0 ? (
              // Show configured statuses from database
              statuses.map((status) => (
                <div key={status.id} className="flex items-center gap-2 text-sm">
                  <div 
                    className="w-4 h-4 rounded"
                    style={{ backgroundColor: status.color }}
                  ></div>
                  <span>{status.display_name}</span>
                </div>
              ))
            ) : (
              // Fallback legend for old statuses - CORRIGIDO: iniciar_projeto agora usa azul
              <>
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-4 h-4 bg-blue-500 rounded"></div>
                  <span>Inicial</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-4 h-4 bg-blue-500 rounded"></div>
                  <span>Em andamento</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-4 h-4 bg-yellow-500 rounded"></div>
                  <span>Aguardando</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-4 h-4 bg-purple-500 rounded"></div>
                  <span>Assinatura</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-4 h-4 bg-green-500 rounded"></div>
                  <span>Concluído</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-4 h-4 bg-red-500 rounded"></div>
                  <span>Cancelado</span>
                </div>
              </>
            )}
            <div className="flex items-center gap-2 text-sm">
              <div className="w-1 h-4 bg-green-500"></div>
              <span>Hoje</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <div className="w-4 h-4 bg-red-500 rounded border-2 border-red-700"></div>
              <AlertTriangle className="h-4 w-4 text-red-500" />
              <span>Em atraso</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default GanttView;
