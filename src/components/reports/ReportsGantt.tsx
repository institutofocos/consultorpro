import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Users } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { format, addDays, differenceInDays, startOfMonth, endOfMonth, addMonths } from 'date-fns';
import { pt } from 'date-fns/locale';
import { Progress } from "@/components/ui/progress";

export default function ReportsGantt() {
  const [projects, setProjects] = useState<any[]>([]);
  const [consultants, setConsultants] = useState<any[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [projectsWithStages, setProjectsWithStages] = useState<any[]>([]);

  // Filter states
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedConsultant, setSelectedConsultant] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [timePeriod, setTimePeriod] = useState<string>("month");

  // Chart dimensions
  const [startDate, setStartDate] = useState<Date>(startOfMonth(new Date()));
  const [endDate, setEndDate] = useState<Date>(endOfMonth(new Date()));
  const [dateRange, setDateRange] = useState<Date[]>([]);
  const [chartWidth, setChartWidth] = useState<number>(0);

  // Day cell width in pixels - This is a crucial parameter for proper alignment
  const DAY_CELL_WIDTH = 30; // Increased from 25px to 30px for better spacing

  useEffect(() => {
    // Update the period based on selected time period and date
    if (timePeriod === 'month') {
      setStartDate(startOfMonth(selectedDate));
      setEndDate(endOfMonth(selectedDate));
    } else if (timePeriod === 'quarter') {
      const quarterStart = startOfMonth(selectedDate);
      setStartDate(quarterStart);
      setEndDate(endOfMonth(addMonths(quarterStart, 2)));
    }
  }, [selectedDate, timePeriod]);

  useEffect(() => {
    // Generate date range for the chart
    const range = [];
    let currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      range.push(new Date(currentDate));
      currentDate = addDays(currentDate, 1);
    }
    setDateRange(range);
    setChartWidth(range.length * DAY_CELL_WIDTH); // Each day has fixed width
  }, [startDate, endDate]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: projectsData, error: projectsError } = await supabase
          .from('projects')
          .select(`
            id, name, description, status, start_date, end_date,
            main_consultant_id, support_consultant_id, stages,
            clients:client_id (id, name),
            main_consultant:main_consultant_id (id, name),
            support_consultant:support_consultant_id (id, name)
          `);
        
        if (projectsError) throw projectsError;
        
        const { data: consultantsData, error: consultantsError } = await supabase
          .from('consultants')
          .select('id, name');
        
        if (consultantsError) throw consultantsError;
        
        setProjects(projectsData || []);
        setFilteredProjects(projectsData || []);
        setConsultants(consultantsData || []);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [selectedDate, selectedConsultant, selectedStatus, timePeriod, projects]);

  useEffect(() => {
    // Process projects for Gantt chart display
    const processed = filteredProjects.map(project => {
      const stages = Array.isArray(project.stages) ? project.stages : [];
      
      // Calculate project duration for Gantt chart
      const projectStart = new Date(project.start_date);
      const projectEnd = new Date(project.end_date);
      
      return {
        ...project,
        startPosition: getPositionPercentage(projectStart),
        endPosition: getPositionPercentage(projectEnd),
        width: getWidthPercentage(projectStart, projectEnd),
        stages: stages.map((stage: any) => ({
          ...stage,
          startPosition: getPositionPercentage(new Date(stage.startDate)),
          endPosition: getPositionPercentage(new Date(stage.endDate)),
          width: getWidthPercentage(new Date(stage.startDate), new Date(stage.endDate)),
        }))
      };
    });
    
    setProjectsWithStages(processed);
  }, [filteredProjects, dateRange]);

  const getPositionPercentage = (date: Date) => {
    if (!startDate || !endDate || dateRange.length === 0) return 0;
    
    const totalDays = differenceInDays(endDate, startDate) + 1;
    const daysPassed = differenceInDays(date, startDate);
    
    // Ensure the date is within range
    if (date < startDate) return 0;
    if (date > endDate) return 100;
    
    return (daysPassed / totalDays) * 100;
  };

  const getWidthPercentage = (start: Date, end: Date) => {
    if (!startDate || !endDate || dateRange.length === 0) return 0;
    
    const totalDays = differenceInDays(endDate, startDate) + 1;
    const duration = differenceInDays(end, start) + 1;
    
    return (duration / totalDays) * 100;
  };

  const applyFilters = () => {
    // ... keep existing code (filtering logic)
    let filtered = [...projects];
    
    // Filter by consultant
    if (selectedConsultant) {
      filtered = filtered.filter(project =>
        project.main_consultant_id === selectedConsultant ||
        project.support_consultant_id === selectedConsultant
      );
    }
    
    // Filter by status
    if (selectedStatus) {
      filtered = filtered.filter(project => project.status === selectedStatus);
    }
    
    // Apply date filters for the time period
    if (timePeriod !== 'all') {
      filtered = filtered.filter(project => {
        const projectStart = new Date(project.start_date);
        const projectEnd = new Date(project.end_date);
        
        // Project overlaps with the selected period if:
        // projectStart <= endDate AND projectEnd >= startDate
        return projectStart <= endDate && projectEnd >= startDate;
      });
    }
    
    setFilteredProjects(filtered);
  };
  
  const resetFilters = () => {
    setSelectedDate(new Date());
    setSelectedConsultant(null);
    setSelectedStatus(null);
    setTimePeriod("month");
  };
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'planned': return 'bg-blue-500';
      case 'in_progress': return 'bg-yellow-500';
      case 'completed': return 'bg-green-500';
      case 'cancelled': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const formatStatus = (status: string) => {
    const statusMap: Record<string, string> = {
      planned: 'Planejado',
      in_progress: 'Em Progresso',
      completed: 'Concluído',
      cancelled: 'Cancelado'
    };
    return statusMap[status] || status;
  };

  const handleMonthChange = (change: number) => {
    const newDate = new Date(selectedDate);
    newDate.setMonth(newDate.getMonth() + change);
    setSelectedDate(newDate);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Relatórios - Diagrama de Gantt</h1>
          <p className="text-muted-foreground">Visualize os projetos em formato de diagrama de Gantt</p>
        </div>
        
        <div className="flex flex-wrap gap-2 items-center">
          {/* Month navigation */}
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="icon"
              onClick={() => handleMonthChange(-1)}
            >
              &lt;
            </Button>
            <span className="w-32 text-center">
              {format(selectedDate, 'MMMM yyyy', { locale: pt })}
            </span>
            <Button 
              variant="outline" 
              size="icon"
              onClick={() => handleMonthChange(1)}
            >
              &gt;
            </Button>
          </div>
          
          {/* Time period filter */}
          <Select value={timePeriod} onValueChange={setTimePeriod}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="month">Mês</SelectItem>
              <SelectItem value="quarter">Trimestre</SelectItem>
            </SelectContent>
          </Select>
          
          {/* Consultant filter */}
          <Select value={selectedConsultant || ''} onValueChange={setSelectedConsultant}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Consultor" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todos os Consultores</SelectItem>
              {consultants.map(consultant => (
                <SelectItem key={consultant.id} value={consultant.id}>
                  {consultant.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {/* Status filter */}
          <Select value={selectedStatus || ''} onValueChange={setSelectedStatus}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todos os Status</SelectItem>
              <SelectItem value="planned">Planejado</SelectItem>
              <SelectItem value="in_progress">Em Progresso</SelectItem>
              <SelectItem value="completed">Concluído</SelectItem>
              <SelectItem value="cancelled">Cancelado</SelectItem>
            </SelectContent>
          </Select>
          
          {/* Reset filters */}
          <Button variant="ghost" onClick={resetFilters}>
            Limpar Filtros
          </Button>
        </div>
      </div>

      <Card className="shadow-sm">
        <CardContent className="p-6">
          {loading ? (
            <div className="flex items-center justify-center h-40">
              <p>Carregando projetos...</p>
            </div>
          ) : projectsWithStages.length === 0 ? (
            <div className="flex items-center justify-center h-40">
              <p>Nenhum projeto encontrado com os filtros aplicados.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              {/* Gantt chart container - Use fixed width grid layout */}
              <div className="min-w-full" style={{ minWidth: `max(100%, ${chartWidth + 250}px)` }}>
                {/* Gantt chart header - Fixed positioning */}
                <div className="flex mb-4 sticky top-0 bg-white z-10 border-b pb-2">
                  {/* Fixed width for project name column */}
                  <div className="w-[250px] pr-4 font-medium">Projeto</div>
                  
                  {/* Dates header with fixed width cells */}
                  <div className="flex-1 grid grid-cols-1">
                    <div className="flex">
                      {dateRange.map((date, i) => (
                        <div 
                          key={i} 
                          className={`
                            flex-shrink-0 text-center text-xs border-r border-gray-200
                            ${date.getDate() === 1 ? 'font-medium border-l border-gray-300' : ''}
                            ${date.getDay() === 0 || date.getDay() === 6 ? 'bg-gray-50' : ''}
                          `}
                          style={{ width: `${DAY_CELL_WIDTH}px` }}
                        >
                          {date.getDate() === 1 || i === 0 ? format(date, 'dd/MM', { locale: pt }) : date.getDate()}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                
                {/* Gantt chart rows */}
                <div className="space-y-6">
                  {projectsWithStages.map(project => (
                    <div key={project.id} className="space-y-1 pb-4 border-b border-dashed">
                      {/* Project row */}
                      <div className="flex items-center h-10">
                        <div className="w-[250px] pr-4">
                          <div className="font-medium truncate">{project.name}</div>
                          <div className="text-xs text-muted-foreground flex items-center gap-1">
                            <span className="inline-block w-2 h-2 rounded-full bg-gray-400"></span>
                            {project.clients?.name}
                          </div>
                        </div>
                        
                        {/* Project timeline container with fixed positioning */}
                        <div className="flex-1 relative h-8">
                          <div className="absolute inset-0 flex">
                            {/* Background vertical grid lines for dates */}
                            {dateRange.map((date, i) => (
                              <div
                                key={i}
                                className={`
                                  flex-shrink-0 border-r border-gray-100
                                  ${date.getDay() === 0 || date.getDay() === 6 ? 'bg-gray-50' : ''}
                                `}
                                style={{ width: `${DAY_CELL_WIDTH}px` }}
                              />
                            ))}
                          </div>
                          
                          {/* Project timeline bar with absolute positioning */}
                          <div 
                            className={`absolute top-1/2 -translate-y-1/2 h-6 rounded-md ${getStatusColor(project.status)}`}
                            style={{
                              left: `${project.startPosition}%`,
                              width: `${project.width}%`,
                              minWidth: '10px'
                            }}
                          >
                            <div className="px-2 text-xs text-white truncate h-full flex items-center">
                              {project.name}
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Stage rows */}
                      {project.stages && project.stages.map((stage: any, idx: number) => (
                        <div key={idx} className="flex items-center pl-8 h-6">
                          <div className="w-[242px] pr-4">
                            <div className="text-sm truncate">{stage.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {stage.days} dias {stage.completed && '(Concluída)'}
                            </div>
                          </div>
                          
                          {/* Stage timeline container with fixed positioning */}
                          <div className="flex-1 relative h-6">
                            <div className="absolute inset-0 flex">
                              {/* Background vertical grid lines for dates */}
                              {dateRange.map((date, i) => (
                                <div
                                  key={i}
                                  className={`
                                    flex-shrink-0 border-r border-gray-100
                                    ${date.getDay() === 0 || date.getDay() === 6 ? 'bg-gray-50' : ''}
                                  `}
                                  style={{ width: `${DAY_CELL_WIDTH}px` }}
                                />
                              ))}
                            </div>
                            
                            {/* Stage timeline bar with absolute positioning */}
                            <div 
                              className={`absolute top-1/2 -translate-y-1/2 h-4 rounded-sm ${stage.completed ? 'bg-green-600' : 'bg-gray-600'} bg-opacity-70`}
                              style={{
                                left: `${stage.startPosition}%`,
                                width: `${stage.width}%`,
                                minWidth: '8px'
                              }}
                            >
                              <div className="px-2 text-xs text-white truncate h-full flex items-center">
                                {stage.name}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                      
                      {/* Project info */}
                      <div className="pl-8 pt-2 mt-1 text-xs text-muted-foreground grid grid-cols-2 sm:grid-cols-4 gap-2">
                        <div>
                          <span className="font-medium">Consultor Principal:</span> {project.main_consultant?.name}
                        </div>
                        {project.support_consultant && (
                          <div>
                            <span className="font-medium">Consultor de Apoio:</span> {project.support_consultant?.name}
                          </div>
                        )}
                        <div>
                          <span className="font-medium">Status:</span> {formatStatus(project.status)}
                        </div>
                        <div>
                          <span className="font-medium">Período:</span> {format(new Date(project.start_date), 'dd/MM/yyyy', { locale: pt })} - {format(new Date(project.end_date), 'dd/MM/yyyy', { locale: pt })}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
