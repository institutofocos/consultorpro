import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronLeft, ChevronRight, Search, Calendar as CalendarIcon } from 'lucide-react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, isSameDay, addMonths, subMonths, addWeeks, subWeeks } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from "@/integrations/supabase/client";
import TaskModal from './TaskModal';

type ViewMode = 'day' | 'week' | 'month';

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

  useEffect(() => {
    fetchTasks();
  }, []);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredTasks(tasks);
    } else {
      const filtered = tasks.filter(task => 
        task.project_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredTasks(filtered);
    }
  }, [searchTerm, tasks]);

  const fetchTasks = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('project_stages')
        .select(`
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
          consultant_id
        `)
        .not('start_date', 'is', null)
        .not('end_date', 'is', null);

      if (error) throw error;

      // Fetch project and consultant data separately to avoid relationship ambiguity
      const projectIds = [...new Set(data?.map(stage => stage.project_id).filter(Boolean))];
      const consultantIds = [...new Set(data?.map(stage => stage.consultant_id).filter(Boolean))];

      const [projectsData, consultantsData] = await Promise.all([
        projectIds.length > 0 ? supabase
          .from('projects')
          .select('id, name')
          .in('id', projectIds) : Promise.resolve({ data: [] }),
        consultantIds.length > 0 ? supabase
          .from('consultants')
          .select('id, name')
          .in('id', consultantIds) : Promise.resolve({ data: [] })
      ]);

      const projectsMap = new Map<string, string>(
        (projectsData.data || []).map(p => [p.id, p.name] as [string, string])
      );
      const consultantsMap = new Map<string, string>(
        (consultantsData.data || []).map(c => [c.id, c.name] as [string, string])
      );

      const formattedTasks: Task[] = data?.map(task => ({
        id: task.id,
        name: task.name,
        description: task.description || '',
        start_date: task.start_date,
        end_date: task.end_date,
        status: task.status || 'iniciar_projeto',
        value: task.value || 0,
        valor_de_repasse: task.valor_de_repasse || 0,
        hours: task.hours || 0,
        days: task.days || 1,
        project_id: task.project_id,
        consultant_id: task.consultant_id,
        consultant_name: consultantsMap.get(task.consultant_id) || 'Não atribuído',
        project_name: projectsMap.get(task.project_id) || 'Projeto sem nome'
      })) || [];

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

  const formatTaskDisplay = (task: Task) => {
    const taskWords = task.name.split(' ').slice(0, 2).join(' ');
    const consultantFirstName = task.consultant_name.split(' ')[0];
    const status = getStatusDisplay(task.status);
    return `[${status}] ${taskWords} - ${consultantFirstName}`;
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
    }
  };

  const getTasksForDate = (date: Date) => {
    return filteredTasks.filter(task => {
      const startDate = new Date(task.start_date);
      const endDate = new Date(task.end_date);
      return isSameDay(date, startDate) || isSameDay(date, endDate);
    });
  };

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setIsModalOpen(true);
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
        const dayTasks = getTasksForDate(day);
        
        days.push(
          <div
            key={day.toString()}
            className={`min-h-[120px] border border-gray-200 p-2 ${
              !isSameMonth(day, monthStart) ? 'bg-gray-50 text-gray-400' : 'bg-white'
            } ${isSameDay(day, new Date()) ? 'bg-blue-50' : ''}`}
          >
            <span className="text-sm font-medium">{formattedDate}</span>
            <div className="mt-1 space-y-1">
              {dayTasks.map(task => (
                <div
                  key={task.id}
                  onClick={() => handleTaskClick(task)}
                  className={`text-xs p-1 rounded cursor-pointer hover:opacity-80 ${getStatusColor(task.status)}`}
                  title={formatTaskDisplay(task)}
                >
                  {formatTaskDisplay(task)}
                </div>
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
    const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 });
    const days = [];
    
    for (let i = 0; i < 7; i++) {
      const day = addDays(weekStart, i);
      const dayTasks = getTasksForDate(day);
      
      days.push(
        <div key={day.toString()} className="flex-1 border border-gray-200 p-4 min-h-[400px]">
          <div className="font-semibold text-center mb-3">
            <div>{format(day, 'EEE', { locale: ptBR })}</div>
            <div className={`text-lg ${isSameDay(day, new Date()) ? 'text-blue-600 font-bold' : ''}`}>
              {format(day, 'd')}
            </div>
          </div>
          <div className="space-y-2">
            {dayTasks.map(task => (
              <div
                key={task.id}
                onClick={() => handleTaskClick(task)}
                className={`text-sm p-2 rounded cursor-pointer hover:opacity-80 ${getStatusColor(task.status)}`}
              >
                {formatTaskDisplay(task)}
              </div>
            ))}
          </div>
        </div>
      );
    }
    
    return <div className="flex">{days}</div>;
  };

  const renderDayView = () => {
    const dayTasks = getTasksForDate(currentDate);
    
    return (
      <div className="p-6">
        <div className="text-center mb-6">
          <h3 className="text-2xl font-bold">
            {format(currentDate, 'EEEE, d MMMM yyyy', { locale: ptBR })}
          </h3>
        </div>
        <div className="space-y-3">
          {dayTasks.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              Nenhuma tarefa para este dia
            </div>
          ) : (
            dayTasks.map(task => (
              <div
                key={task.id}
                onClick={() => handleTaskClick(task)}
                className={`p-4 rounded-lg cursor-pointer hover:opacity-80 ${getStatusColor(task.status)}`}
              >
                <div className="font-semibold">{task.name}</div>
                <div className="text-sm opacity-75 mt-1">
                  {task.project_name} - {task.consultant_name}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  };

  const getViewTitle = () => {
    switch (viewMode) {
      case 'day':
        return format(currentDate, 'd MMMM yyyy', { locale: ptBR });
      case 'week':
        const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 });
        const weekEnd = endOfWeek(currentDate, { weekStartsOn: 0 });
        return `${format(weekStart, 'd MMM', { locale: ptBR })} - ${format(weekEnd, 'd MMM yyyy', { locale: ptBR })}`;
      case 'month':
        return format(currentDate, 'MMMM yyyy', { locale: ptBR });
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
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Pesquisar por projeto..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
            </div>
          </div>
          
          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === 'day' ? 'default' : 'outline'}
                onClick={() => setViewMode('day')}
                size="sm"
              >
                Hoje
              </Button>
              <Button
                variant={viewMode === 'week' ? 'default' : 'outline'}
                onClick={() => setViewMode('week')}
                size="sm"
              >
                Semana
              </Button>
              <Button
                variant={viewMode === 'month' ? 'default' : 'outline'}
                onClick={() => setViewMode('month')}
                size="sm"
              >
                Mês
              </Button>
            </div>
            
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
          </div>
        </CardHeader>
        
        <CardContent className="flex-1 p-0">
          {viewMode === 'month' && renderMonthView()}
          {viewMode === 'week' && renderWeekView()}
          {viewMode === 'day' && renderDayView()}
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
