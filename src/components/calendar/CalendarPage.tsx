import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ChevronLeft, ChevronRight, Search, Calendar as CalendarIcon, Pin, Hourglass, Filter, BarChart3, Kanban } from 'lucide-react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, isSameDay, addMonths, subMonths, addWeeks, subWeeks, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from "@/integrations/supabase/client";
import TaskModal from './TaskModal';
import GanttView from './GanttView';
import SearchableSelect from "@/components/ui/searchable-select";
import { useConsultants } from "@/hooks/useConsultants";
import { useNavigate } from 'react-router-dom';

type ViewMode = 'day' | 'week' | 'month' | 'gantt' | 'kanban';

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
  time_spent_minutes?: number;
  timer_status?: string;
  timer_started_at?: string;
}

interface TaskEvent {
  task: Task;
  type: 'start' | 'end';
  date: Date;
}

const CalendarPage: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedConsultantId, setSelectedConsultantId] = useState<string>('');

  const { data: consultants = [] } = useConsultants();
  const navigate = useNavigate();

  useEffect(() => {
    fetchTasks();
  }, []);

  useEffect(() => {
    let filtered = tasks;

    // Filter by search term (project name)
    if (searchTerm.trim() !== '') {
      filtered = filtered.filter(task => 
        task.project_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by consultant
    if (selectedConsultantId) {
      filtered = filtered.filter(task => task.consultant_id === selectedConsultantId);
    }

    setFilteredTasks(filtered);
  }, [searchTerm, selectedConsultantId, tasks]);

  const fetchTasks = async () => {
    setIsLoading(true);
    try {
      // Buscar etapas através da tabela projects para aplicar as RLS policies
      const { data: projectsData, error: projectsError } = await supabase
        .from('projects')
        .select(`
          id,
          name,
          service_id,
          project_stages!project_stages_project_id_fkey(
            id,
            name,
            description,
            start_date,
            end_date,
            status,
            value,
            valor_de_repasse,
            hours,
            days,
            project_id,
            consultant_id,
            time_spent_minutes,
            timer_status,
            timer_started_at
          )
        `);
      
      if (projectsError) throw projectsError;

      // Extrair todas as etapas dos projetos autorizados
      const allStages = projectsData?.flatMap(project => 
        (project.project_stages || []).map(stage => ({
          ...stage,
          project_name: project.name,
          service_id: project.service_id
        }))
      ).filter(stage => stage.start_date && stage.end_date) || [];

      // Buscar dados dos consultores e serviços
      const consultantIds = [...new Set(allStages.map(stage => stage.consultant_id).filter(Boolean))];
      const serviceIds = [...new Set(allStages.map(stage => stage.service_id).filter(Boolean))];

      const [consultantsData, servicesData] = await Promise.all([
        consultantIds.length > 0 ? supabase
          .from('consultants')
          .select('id, name')
          .in('id', consultantIds) : Promise.resolve({ data: [] }),
        serviceIds.length > 0 ? supabase
          .from('services')
          .select('id, name')
          .in('id', serviceIds) : Promise.resolve({ data: [] })
      ]);

      const consultantsMap = new Map<string, string>(
        (consultantsData.data || []).map(c => [c.id, c.name] as [string, string])
      );
      const servicesMap = new Map<string, string>(
        (servicesData.data || []).map(s => [s.id, s.name] as [string, string])
      );

      const formattedTasks: Task[] = allStages.map(stage => {
        const serviceName = stage.service_id ? servicesMap.get(stage.service_id) || 'Serviço não definido' : 'Serviço não definido';
        
        return {
          id: stage.id,
          name: stage.name,
          description: stage.description || '',
          start_date: stage.start_date,
          end_date: stage.end_date,
          status: stage.status || 'iniciar_projeto',
          value: stage.value || 0,
          valor_de_repasse: stage.valor_de_repasse || 0,
          hours: stage.hours || 0,
          days: stage.days || 1,
          project_id: stage.project_id,
          consultant_id: stage.consultant_id || '',
          consultant_name: consultantsMap.get(stage.consultant_id) || 'Não atribuído',
          project_name: stage.project_name,
          service_name: serviceName,
          time_spent_minutes: stage.time_spent_minutes || 0,
          timer_status: stage.timer_status || 'stopped',
          timer_started_at: stage.timer_started_at
        };
      });

      setTasks(formattedTasks);
    } catch (error) {
      console.error('Erro ao buscar tarefas:', error);
    } finally {
      setIsLoading(false);
    }
  };

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
      'iniciar_projeto': 'bg-gray-100 text-gray-700',
      'em_producao': 'bg-blue-100 text-blue-700',
      'aguardando_aprovacao': 'bg-yellow-100 text-yellow-700',
      'aguardando_assinatura': 'bg-purple-100 text-purple-700',
      'concluido': 'bg-green-100 text-green-700',
      'cancelado': 'bg-red-100 text-red-700'
    };
    return colorMap[status] || 'bg-gray-100 text-gray-700';
  };

  const getEventTypeColor = (eventType: 'start' | 'end') => {
    return eventType === 'start' 
      ? 'border-l-4 border-blue-500 bg-blue-50' 
      : 'border-l-4 border-orange-500 bg-orange-50';
  };

  const formatTaskEventDisplay = (taskEvent: TaskEvent) => {
    const taskWords = taskEvent.task.name.split(' ').slice(0, 2).join(' ');
    const consultantFirstName = taskEvent.task.consultant_name.split(' ')[0];
    const status = getStatusDisplay(taskEvent.task.status);
    
    const icon = taskEvent.type === 'start' ? '📌' : '⏳';
    const actionText = taskEvent.type === 'start' ? 'Iniciar' : 'Finalizar';
    
    return `${icon} ${actionText}: [${status}] ${taskWords} - ${consultantFirstName}`;
  };

  const navigatePrevious = () => {
    switch (viewMode) {
      case 'day':
        setCurrentDate(addDays(currentDate, -1));
        break;
      case 'week':
        setCurrentDate(subWeeks(currentDate, 1));
        break;
      case 'month':
        setCurrentDate(subMonths(currentDate, 1));
        break;
      case 'gantt':
        setCurrentDate(addWeeks(currentDate, -1));
        break;
    }
  };

  const navigateNext = () => {
    switch (viewMode) {
      case 'day':
        setCurrentDate(addDays(currentDate, 1));
        break;
      case 'week':
        setCurrentDate(addWeeks(currentDate, 1));
        break;
      case 'month':
        setCurrentDate(addMonths(currentDate, 1));
        break;
      case 'gantt':
        setCurrentDate(addWeeks(currentDate, 1));
        break;
    }
  };

  const getTaskEventsForDate = (date: Date): TaskEvent[] => {
    const events: TaskEvent[] = [];
    
    filteredTasks.forEach(task => {
      const startDate = new Date(task.start_date);
      const endDate = new Date(task.end_date);
      
      // Adicionar evento de início
      if (isSameDay(date, startDate)) {
        events.push({
          task,
          type: 'start',
          date: startDate
        });
      }
      
      // Adicionar evento de fim (apenas se não for no mesmo dia do início)
      if (isSameDay(date, endDate) && !isSameDay(startDate, endDate)) {
        events.push({
          task,
          type: 'end',
          date: endDate
        });
      }
    });
    
    return events;
  };

  const handleTaskEventClick = (taskEvent: TaskEvent) => {
    setSelectedTask(taskEvent.task);
    setIsModalOpen(true);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedConsultantId('');
  };

  const handleViewModeChange = (newViewMode: ViewMode) => {
    // SEMPRE usar a data atual, independente da navegação anterior
    const today = new Date();
    
    setViewMode(newViewMode);
    
    if (newViewMode === 'month') {
      // Sempre definir para o mês atual
      setCurrentDate(new Date(today.getFullYear(), today.getMonth(), 1));
    } else if (newViewMode === 'week') {
      // SEMPRE definir para a semana atual começando na segunda-feira
      setCurrentDate(startOfWeek(today, { weekStartsOn: 1 }));
    } else if (newViewMode === 'day') {
      // Sempre definir para o dia atual
      setCurrentDate(today);
    }
  };

  const renderGanttView = () => {
    return <GanttView tasks={filteredTasks} selectedConsultantId={selectedConsultantId} />;
  };

  const renderMonthView = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 0 });
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 0 });

    const dateFormat = "d";
    const rows = [];
    let days = [];
    let day = startDate;

    // Header dos dias da semana
    const daysOfWeek = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    
    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        const formattedDate = format(day, dateFormat);
        const cloneDay = day;
        const dayTaskEvents = getTaskEventsForDate(day);
        
        days.push(
          <div
            key={day.toString()}
            className={`min-h-[120px] border border-gray-200 p-2 ${
              !isSameMonth(day, monthStart) ? 'bg-gray-50 text-gray-400' : 'bg-white'
            } ${isSameDay(day, new Date()) ? 'bg-blue-50' : ''}`}
          >
            <span className="text-sm font-medium">{formattedDate}</span>
            <div className="mt-1 space-y-1">
              {dayTaskEvents.map((taskEvent, index) => (
                <TooltipProvider key={`${taskEvent.task.id}-${taskEvent.type}-${index}`}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div
                        onClick={() => handleTaskEventClick(taskEvent)}
                        className={`text-xs p-1 rounded cursor-pointer hover:opacity-80 ${getEventTypeColor(taskEvent.type)} ${getStatusColor(taskEvent.task.status)}`}
                        title={formatTaskEventDisplay(taskEvent)}
                      >
                        <div className="flex items-center gap-1">
                          {taskEvent.type === 'start' ? (
                            <Pin className="h-3 w-3 text-blue-600" />
                          ) : (
                            <Hourglass className="h-3 w-3 text-orange-600" />
                          )}
                          <span className="truncate">
                            {formatTaskEventDisplay(taskEvent)}
                          </span>
                        </div>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <div className="space-y-1">
                        <div className="font-semibold">{taskEvent.task.name}</div>
                        <div className="text-xs">
                          <div>Início: {format(parseISO(taskEvent.task.start_date), 'dd/MM/yyyy', { locale: ptBR })}</div>
                          <div>Fim: {format(parseISO(taskEvent.task.end_date), 'dd/MM/yyyy', { locale: ptBR })}</div>
                          <div>Duração: {taskEvent.task.days} dias</div>
                          <div>Horas: {taskEvent.task.hours}h</div>
                          <div>Valor: R$ {taskEvent.task.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                          <div>Consultor: {taskEvent.task.consultant_name}</div>
                          <div>Status: {getStatusDisplay(taskEvent.task.status)}</div>
                          <div>Projeto: {taskEvent.task.project_name}</div>
                          <div>Serviço: {taskEvent.task.service_name}</div>
                        </div>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ))}
            </div>
          </div>
        );
        day = addDays(day, 1);
      }
      rows.push(
        <div key={day.toString()} className="grid grid-cols-7">
          {days}
        </div>
      );
      days = [];
    }

    return (
      <div className="w-full">
        <div className="grid grid-cols-7 bg-gray-100">
          {daysOfWeek.map(dayName => (
            <div key={dayName} className="p-3 text-center font-semibold text-gray-700 border border-gray-200">
              {dayName}
            </div>
          ))}
        </div>
        {rows}
      </div>
    );
  };

  const renderWeekView = () => {
    // SEMPRE usar segunda-feira como início da semana
    const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
    const days = [];
    
    for (let i = 0; i < 7; i++) {
      const day = addDays(weekStart, i);
      const dayTaskEvents = getTaskEventsForDate(day);
      
      days.push(
        <div key={day.toString()} className="flex-1 border border-gray-200 p-4 min-h-[400px]">
          <div className="font-semibold text-center mb-3">
            <div>{format(day, 'EEE', { locale: ptBR })}</div>
            <div className={`text-lg ${isSameDay(day, new Date()) ? 'text-blue-600 font-bold' : ''}`}>
              {format(day, 'd')}
            </div>
          </div>
          <div className="space-y-2">
            {dayTaskEvents.map((taskEvent, index) => (
              <TooltipProvider key={`${taskEvent.task.id}-${taskEvent.type}-${index}`}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div
                      onClick={() => handleTaskEventClick(taskEvent)}
                      className={`text-sm p-2 rounded cursor-pointer hover:opacity-80 ${getEventTypeColor(taskEvent.type)}`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        {taskEvent.type === 'start' ? (
                          <Pin className="h-4 w-4 text-blue-600" />
                        ) : (
                          <Hourglass className="h-4 w-4 text-orange-600" />
                        )}
                        <Badge 
                          variant="outline" 
                          className={getStatusColor(taskEvent.task.status)}
                        >
                          {getStatusDisplay(taskEvent.task.status)}
                        </Badge>
                      </div>
                      <div className="font-medium">
                        {taskEvent.type === 'start' ? '📌 Iniciar' : '⏳ Finalizar'}: {taskEvent.task.name}
                      </div>
                      <div className="text-xs text-gray-600">
                        {taskEvent.task.project_name} - {taskEvent.task.consultant_name}
                      </div>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="space-y-1">
                      <div className="font-semibold">{taskEvent.task.name}</div>
                      <div className="text-xs">
                        <div>Início: {format(parseISO(taskEvent.task.start_date), 'dd/MM/yyyy', { locale: ptBR })}</div>
                        <div>Fim: {format(parseISO(taskEvent.task.end_date), 'dd/MM/yyyy', { locale: ptBR })}</div>
                        <div>Duração: {taskEvent.task.days} dias</div>
                        <div>Horas: {taskEvent.task.hours}h</div>
                        <div>Valor: R$ {taskEvent.task.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                        <div>Consultor: {taskEvent.task.consultant_name}</div>
                        <div>Status: {getStatusDisplay(taskEvent.task.status)}</div>
                        <div>Projeto: {taskEvent.task.project_name}</div>
                        <div>Serviço: {taskEvent.task.service_name}</div>
                      </div>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ))}
          </div>
        </div>
      );
    }
    
    return <div className="flex">{days}</div>;
  };

  const renderDayView = () => {
    const dayTaskEvents = getTaskEventsForDate(currentDate);
    
    return (
      <div className="p-6">
        <div className="text-center mb-6">
          <h3 className="text-2xl font-bold">
            {format(currentDate, 'EEEE, d MMMM yyyy', { locale: ptBR })}
          </h3>
        </div>
        <div className="space-y-3">
          {dayTaskEvents.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              Nenhuma tarefa para este dia
            </div>
          ) : (
            dayTaskEvents.map((taskEvent, index) => (
              <TooltipProvider key={`${taskEvent.task.id}-${taskEvent.type}-${index}`}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div
                      onClick={() => handleTaskEventClick(taskEvent)}
                      className={`p-4 rounded-lg cursor-pointer hover:opacity-80 ${getEventTypeColor(taskEvent.type)}`}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        {taskEvent.type === 'start' ? (
                          <Pin className="h-5 w-5 text-blue-600" />
                        ) : (
                          <Hourglass className="h-5 w-5 text-orange-600" />
                        )}
                        <Badge 
                          variant="outline" 
                          className={getStatusColor(taskEvent.task.status)}
                        >
                          {getStatusDisplay(taskEvent.task.status)}
                        </Badge>
                      </div>
                      <div className="font-semibold text-lg">
                        {taskEvent.type === 'start' ? '📌 Iniciar' : '⏳ Finalizar'}: {taskEvent.task.name}
                      </div>
                      <div className="text-sm opacity-75 mt-1">
                        {taskEvent.task.project_name} - {taskEvent.task.consultant_name}
                      </div>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="space-y-1">
                      <div className="font-semibold">{taskEvent.task.name}</div>
                      <div className="text-xs">
                        <div>Início: {format(parseISO(taskEvent.task.start_date), 'dd/MM/yyyy', { locale: ptBR })}</div>
                        <div>Fim: {format(parseISO(taskEvent.task.end_date), 'dd/MM/yyyy', { locale: ptBR })}</div>
                        <div>Duração: {taskEvent.task.days} dias</div>
                        <div>Horas: {taskEvent.task.hours}h</div>
                        <div>Valor: R$ {taskEvent.task.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                        <div>Consultor: {taskEvent.task.consultant_name}</div>
                        <div>Status: {getStatusDisplay(taskEvent.task.status)}</div>
                        <div>Projeto: {taskEvent.task.project_name}</div>
                        <div>Serviço: {taskEvent.task.service_name}</div>
                      </div>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ))
          )}
        </div>
      </div>
    );
  };

  const handleKanbanClick = () => {
    navigate('/kanban');
  };

  const getViewTitle = () => {
    switch (viewMode) {
      case 'day':
        return format(currentDate, 'd MMMM yyyy', { locale: ptBR });
      case 'week':
        // SEMPRE usar segunda-feira como início da semana no título
        const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
        const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
        return `${format(weekStart, 'd MMM', { locale: ptBR })} - ${format(weekEnd, 'd MMM yyyy', { locale: ptBR })}`;
      case 'month':
        return format(currentDate, 'MMMM yyyy', { locale: ptBR });
      case 'gantt':
        return 'Visualização Gantt';
      case 'kanban':
        return 'Visualização Kanban';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-lg">Carregando calendário...</div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <Card className="flex-1 flex flex-col">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="h-6 w-6" />
              Calendário de Tarefas
            </CardTitle>
          </div>
          
          {/* Filters Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Pesquisar por projeto..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <div className="min-w-[200px]">
                <SearchableSelect
                  options={consultants.map(consultant => ({ id: consultant.id, name: consultant.name }))}
                  value={selectedConsultantId}
                  onValueChange={(value) => setSelectedConsultantId(value as string)}
                  placeholder="Filtrar por consultor..."
                  searchPlaceholder="Pesquisar consultor..."
                  emptyText="Nenhum consultor encontrado"
                />
              </div>
              
              {(searchTerm || selectedConsultantId) && (
                <Button variant="outline" size="sm" onClick={clearFilters}>
                  <Filter className="h-4 w-4 mr-2" />
                  Limpar Filtros
                </Button>
              )}
            </div>
          </div>
          
          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === 'day' ? 'default' : 'outline'}
                onClick={() => handleViewModeChange('day')}
                size="sm"
              >
                Hoje
              </Button>
              <Button
                variant={viewMode === 'week' ? 'default' : 'outline'}
                onClick={() => handleViewModeChange('week')}
                size="sm"
              >
                Semana
              </Button>
              <Button
                variant={viewMode === 'month' ? 'default' : 'outline'}
                onClick={() => handleViewModeChange('month')}
                size="sm"
              >
                Mês
              </Button>
              <Button
                variant={viewMode === 'gantt' ? 'default' : 'outline'}
                onClick={() => setViewMode('gantt')}
                size="sm"
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                Gantt
              </Button>
              <Button
                variant="outline"
                onClick={handleKanbanClick}
                size="sm"
              >
                <Kanban className="h-4 w-4 mr-2" />
                Kanban
              </Button>
            </div>
            
            {viewMode !== 'gantt' && viewMode !== 'kanban' && (
              <div className="flex items-center gap-4">
                <Button variant="outline" size="sm" onClick={navigatePrevious}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <h2 className="text-lg font-semibold min-w-[200px] text-center">
                  {getViewTitle()}
                </h2>
                <Button variant="outline" size="sm" onClick={navigateNext}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}

            {(viewMode === 'gantt' || viewMode === 'kanban') && (
              <h2 className="text-lg font-semibold">
                {getViewTitle()}
              </h2>
            )}
          </div>

          {/* Legenda para ajudar o usuário - só mostra se não for Gantt ou Kanban */}
          {viewMode !== 'gantt' && viewMode !== 'kanban' && (
            <div className="flex items-center gap-4 mt-4 p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2 text-sm">
                <Pin className="h-4 w-4 text-blue-600" />
                <span>📌 Iniciar tarefa</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Hourglass className="h-4 w-4 text-orange-600" />
                <span>⏳ Finalizar tarefa</span>
              </div>
            </div>
          )}
        </CardHeader>
        
        <CardContent className="flex-1 p-0">
          {viewMode === 'month' && renderMonthView()}
          {viewMode === 'week' && renderWeekView()}
          {viewMode === 'day' && renderDayView()}
          {viewMode === 'gantt' && (
            <div className="p-6">
              {renderGanttView()}
            </div>
          )}
        </CardContent>
      </Card>

      <TaskModal
        task={selectedTask}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
};

export default CalendarPage;
