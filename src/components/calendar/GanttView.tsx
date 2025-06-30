import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ChevronLeft, ChevronRight, Calendar, User, Clock, AlertTriangle } from 'lucide-react';
import { format, addDays, startOfWeek, differenceInDays, parseISO, addWeeks, subWeeks, isAfter, isBefore, startOfDay, endOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { formatDateBR } from '@/utils/dateUtils';
import { useProjectStatuses } from '@/hooks/useProjectStatuses';
import StageStatusModal from './StageStatusModal';

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
  // Set default values to "Esta Semana" (this week)
  const [viewStartDate, setViewStartDate] = useState<Date>(() => startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [timelineWeeks, setTimelineWeeks] = useState(1);
  const [isThisWeek, setIsThisWeek] = useState(true); // Default to true for "Esta Semana"
  const [draggedTask, setDraggedTask] = useState<string | null>(null);
  const [resizingTask, setResizingTask] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [localTasks, setLocalTasks] = useState<Task[]>(tasks);

  // Use the project statuses hook
  const { statuses, getStatusDisplay, getStatusBadgeStyle } = useProjectStatuses();

  // Update local tasks when props change
  useEffect(() => {
    setLocalTasks(tasks);
  }, [tasks]);

  // Generate timeline based on view start date and weeks
  const generateTimeline = () => {
    const timeline = [];
    
    if (isThisWeek) {
      // For "Esta Semana", show each day of the week
      for (let i = 0; i < 7; i++) {
        timeline.push(addDays(viewStartDate, i));
      }
    } else {
      // For other views, show weeks
      for (let i = 0; i < timelineWeeks; i++) {
        timeline.push(addDays(viewStartDate, i * 7));
      }
    }
    
    return timeline;
  };

  const timeline = generateTimeline();

  // Function to check if an item is overdue - for visual styling only
  const isOverdue = (endDate: string, status: string, completed?: boolean) => {
    const today = startOfDay(new Date());
    const itemEndDate = startOfDay(new Date(endDate));
    
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
    const today = startOfDay(new Date());
    const viewStart = startOfDay(viewStartDate);
    
    let totalDays;
    if (isThisWeek) {
      totalDays = 7; // 7 days for this week view
    } else {
      totalDays = timelineWeeks * 7;
    }
    
    const daysSinceViewStart = differenceInDays(today, viewStart);
    
    // Check if today is within the visible timeline
    const isVisible = daysSinceViewStart >= 0 && daysSinceViewStart < totalDays;
    const leftPercent = (daysSinceViewStart / totalDays) * 100;
    
    return {
      visible: isVisible,
      left: `${Math.max(0, leftPercent)}%`
    };
  };

  const currentDatePosition = calculateCurrentDatePosition();

  // Group tasks by project
  const groupedTasks = localTasks.reduce((acc, task) => {
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
    
    // Fallback para status antigos não configurados
    const fallbackColors: { [key: string]: string } = {
      'iniciar_projeto': '#3b82f6',
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

  // Calculate task position - COMPLETELY FIXED VERSION
  const calculateTaskPosition = (startDate: string, endDate: string) => {
    const taskStart = startOfDay(parseISO(startDate));
    const taskEnd = startOfDay(parseISO(endDate));
    const viewStart = startOfDay(viewStartDate);
    
    let totalDays;
    if (isThisWeek) {
      totalDays = 7; // 7 days for this week view
    } else {
      totalDays = timelineWeeks * 7;
    }
    
    // Calculate position: days from view start to task start
    const daysSinceViewStart = differenceInDays(taskStart, viewStart);
    
    // Calculate task duration in days (inclusive of both start and end dates)
    const taskDurationInDays = differenceInDays(taskEnd, taskStart) + 1;
    
    // Calculate position and width as percentages
    const leftPercent = (daysSinceViewStart / totalDays) * 100;
    
    // FIXED: Width calculation - each day should be exactly 1/totalDays of the total width
    const widthPercent = (taskDurationInDays / totalDays) * 100;
    
    // Ensure task doesn't start before view or extend beyond view
    const visibleLeftPercent = Math.max(0, leftPercent);
    const maxWidthFromPosition = 100 - visibleLeftPercent;
    const visibleWidthPercent = Math.min(widthPercent, maxWidthFromPosition);
    
    // Check if task is visible in current view
    const taskEndDaysSinceViewStart = daysSinceViewStart + taskDurationInDays - 1;
    const visible = daysSinceViewStart < totalDays && taskEndDaysSinceViewStart >= 0;
    
    // Debug logging for troubleshooting
    console.log(`Task: ${startDate} to ${endDate}`, {
      taskStart: format(taskStart, 'dd/MM/yyyy'),
      taskEnd: format(taskEnd, 'dd/MM/yyyy'),
      viewStart: format(viewStart, 'dd/MM/yyyy'),
      daysSinceViewStart,
      taskDurationInDays,
      totalDays,
      leftPercent: `${leftPercent.toFixed(2)}%`,
      widthPercent: `${widthPercent.toFixed(2)}%`,
      visibleLeftPercent: `${visibleLeftPercent.toFixed(2)}%`,
      visibleWidthPercent: `${visibleWidthPercent.toFixed(2)}%`
    });
    
    return {
      left: `${visibleLeftPercent}%`,
      width: `${Math.max(0.5, visibleWidthPercent)}%`, // Minimum 0.5% width for visibility
      visible
    };
  };

  // Handle task click
  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setIsStatusModalOpen(true);
  };

  // Handle status update
  const handleStatusUpdate = (taskId: string, newStatus: string) => {
    setLocalTasks(prevTasks => 
      prevTasks.map(task => 
        task.id === taskId ? { ...task, status: newStatus } : task
      )
    );
  };

  // Navigate to previous week
  const navigatePrevious = () => {
    if (isThisWeek) {
      setViewStartDate(subWeeks(viewStartDate, 1));
    } else {
      setViewStartDate(subWeeks(viewStartDate, 2));
    }
  };

  // Navigate to next week
  const navigateNext = () => {
    if (isThisWeek) {
      setViewStartDate(addWeeks(viewStartDate, 1));
    } else {
      setViewStartDate(addWeeks(viewStartDate, 2));
    }
  };

  // Navigate to today
  const navigateToday = () => {
    setViewStartDate(startOfWeek(new Date(), { weekStartsOn: 1 }));
  };

  // Handle drag start
  const handleDragStart = (taskId: string) => {
    setDraggedTask(taskId);
  };

  // Handle drag end
  const handleDragEnd = () => {
    setDraggedTask(null);
  };

  // Handle timeline weeks change
  const handleTimelineWeeksChange = (value: string) => {
    if (value === 'thisweek') {
      // Set to this week starting from Monday
      setTimelineWeeks(1);
      setIsThisWeek(true);
      // Use startOfWeek with Monday as first day of week
      setViewStartDate(startOfWeek(new Date(), { weekStartsOn: 1 }));
    } else {
      setTimelineWeeks(parseInt(value));
      setIsThisWeek(false);
    }
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
        
        <div className="flex items-center gap-6">
          {/* Date Range */}
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span className="text-sm font-medium">
              {isThisWeek 
                ? `${format(viewStartDate, 'dd/MM/yyyy', { locale: ptBR })} - ${format(addDays(viewStartDate, 6), 'dd/MM/yyyy', { locale: ptBR })}`
                : `${format(viewStartDate, 'dd/MM/yyyy', { locale: ptBR })} - ${format(addDays(viewStartDate, timelineWeeks * 7 - 1), 'dd/MM/yyyy', { locale: ptBR })}`
              }
            </span>
          </div>
        </div>

        {/* Increased width from w-32 to w-40 to accommodate longer text */}
        <Select value={isThisWeek ? 'thisweek' : timelineWeeks.toString()} onValueChange={handleTimelineWeeksChange}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="thisweek">Esta Semana</SelectItem>
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
              <div className="flex border-b bg-muted/30 relative pt-8">
                <div className="w-80 flex-shrink-0 p-4 border-r font-semibold">
                  Projeto / Etapa
                </div>
                <div className={`flex-1 grid ${isThisWeek ? 'grid-cols-7' : 'grid-cols-8'} min-w-[800px] relative`}>
                  {timeline.map((date, index) => (
                    <div key={index} className="p-2 text-center text-sm font-medium border-r border-muted relative">
                      <div>{isThisWeek ? format(date, 'EEE', { locale: ptBR }) : format(date, 'MMM', { locale: ptBR })}</div>
                      <div className="text-xs text-muted-foreground">
                        {format(date, 'dd', { locale: ptBR })}
                      </div>
                    </div>
                  ))}
                  
                  {/* Current Date Line with Today Date Box */}
                  {currentDatePosition.visible && (
                    <>
                      <div 
                        className="absolute bg-green-500 text-white px-3 py-1 rounded-md text-xs font-bold whitespace-nowrap shadow-lg border border-green-600 z-50"
                        style={{ 
                          left: `calc(${currentDatePosition.left} - 50px)`,
                          transform: 'translateX(-50%)',
                          top: '-32px'
                        }}
                      >
                        Hoje: {format(new Date(), 'dd/MM/yyyy', { locale: ptBR })}
                      </div>
                      
                      <div 
                        className="absolute top-0 bottom-0 w-0.5 bg-green-500 z-40 pointer-events-none"
                        style={{ left: currentDatePosition.left }}
                      >
                        <div className="absolute -top-1 -left-1 w-2 h-2 bg-green-500 rounded-full shadow-sm"></div>
                      </div>
                    </>
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
                      <div className={`h-full grid ${isThisWeek ? 'grid-cols-7' : 'grid-cols-8'}`}>
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
                            <div className={`absolute inset-0 grid ${isThisWeek ? 'grid-cols-7' : 'grid-cols-8'}`}>
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
                                  className={`absolute top-2 bottom-2 rounded cursor-pointer hover:opacity-80 transition-opacity flex items-center px-2 text-white text-xs font-medium shadow-sm ${
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
                                      ? `${statusColor}CC`
                                      : statusColor
                                  }}
                                  draggable
                                  onDragStart={() => handleDragStart(task.id)}
                                  onDragEnd={handleDragEnd}
                                  onClick={() => handleTaskClick(task)}
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
              // Fallback legend for old statuses
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

      {/* Status Modal */}
      <StageStatusModal
        task={selectedTask}
        isOpen={isStatusModalOpen}
        onClose={() => {
          setIsStatusModalOpen(false);
          setSelectedTask(null);
        }}
        onStatusUpdate={handleStatusUpdate}
      />
    </div>
  );
};

export default GanttView;
