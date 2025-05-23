
import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Users, Filter } from 'lucide-react';
import { Calendar } from "@/components/ui/calendar";
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
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfDay, endOfDay } from 'date-fns';
import { pt } from 'date-fns/locale';

export default function ReportsCalendar() {
  const [projects, setProjects] = useState<any[]>([]);
  const [consultants, setConsultants] = useState<any[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter states
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedConsultant, setSelectedConsultant] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [timePeriod, setTimePeriod] = useState<string>("all");

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
  }, [selectedDate, selectedConsultant, selectedStatus, timePeriod]);

  const applyFilters = () => {
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
    
    // Filter by date
    if (selectedDate) {
      const date = new Date(selectedDate);
      
      let startDate, endDate;
      
      switch (timePeriod) {
        case 'today':
          startDate = startOfDay(date);
          endDate = endOfDay(date);
          break;
        case 'week':
          startDate = startOfWeek(date, { weekStartsOn: 1 });
          endDate = endOfWeek(date, { weekStartsOn: 1 });
          break;
        case 'month':
          startDate = startOfMonth(date);
          endDate = endOfMonth(date);
          break;
        default:
          // All time - no date filtering
          startDate = null;
          endDate = null;
      }
      
      if (startDate && endDate) {
        filtered = filtered.filter(project => {
          const projectStart = new Date(project.start_date);
          const projectEnd = new Date(project.end_date);
          
          return (
            (projectStart <= endDate && projectEnd >= startDate) // Project overlaps with filter period
          );
        });
      }
    }
    
    setFilteredProjects(filtered);
  };
  
  const resetFilters = () => {
    setSelectedDate(new Date());
    setSelectedConsultant(null);
    setSelectedStatus(null);
    setTimePeriod("all");
  };
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'planned': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'completed': return 'bg-green-100 text-green-800 border-green-300';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
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

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Relatórios - Agenda</h1>
          <p className="text-muted-foreground">Visualize os projetos em formato de agenda</p>
        </div>
        
        <div className="flex flex-wrap gap-2 items-center">
          {/* Date selection */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                <CalendarIcon className="h-4 w-4" />
                {selectedDate ? format(selectedDate, 'dd/MM/yyyy', { locale: pt }) : 'Selecionar data'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          
          {/* Time period filter */}
          <Select value={timePeriod} onValueChange={setTimePeriod}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="today">Hoje</SelectItem>
              <SelectItem value="week">Esta Semana</SelectItem>
              <SelectItem value="month">Este Mês</SelectItem>
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

      <div className="grid gap-6">
        {loading ? (
          <Card className="shadow-sm">
            <CardContent className="pt-6">
              <div className="flex items-center justify-center h-40">
                <p>Carregando projetos...</p>
              </div>
            </CardContent>
          </Card>
        ) : filteredProjects.length === 0 ? (
          <Card className="shadow-sm">
            <CardContent className="pt-6">
              <div className="flex items-center justify-center h-40">
                <p>Nenhum projeto encontrado com os filtros aplicados.</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          filteredProjects.map(project => (
            <Card key={project.id} className="shadow-sm overflow-hidden">
              <CardHeader className="flex flex-row items-start justify-between pb-2">
                <div>
                  <CardTitle className="text-xl">{project.name}</CardTitle>
                  <div className="text-sm text-muted-foreground mt-1">
                    {project.clients?.name}
                  </div>
                </div>
                <div className={`px-2.5 py-0.5 rounded-md text-xs font-medium border ${getStatusColor(project.status)}`}>
                  {formatStatus(project.status)}
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-sm font-medium mb-1">Período do Projeto</h4>
                      <p className="text-sm">
                        {format(new Date(project.start_date), 'dd/MM/yyyy', { locale: pt })} - {format(new Date(project.end_date), 'dd/MM/yyyy', { locale: pt })}
                      </p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium mb-1">Consultores</h4>
                      <p className="text-sm flex items-center gap-1">
                        <Users className="h-3.5 w-3.5 text-muted-foreground" />
                        <span>Principal: {project.main_consultant?.name}</span>
                      </p>
                      {project.support_consultant && (
                        <p className="text-sm flex items-center gap-1 mt-0.5">
                          <Users className="h-3.5 w-3.5 text-muted-foreground" />
                          <span>Apoio: {project.support_consultant?.name}</span>
                        </p>
                      )}
                    </div>
                  </div>
                  
                  {project.stages && project.stages.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium mb-2">Etapas</h4>
                      <div className="space-y-2">
                        {project.stages.map((stage: any, index: number) => (
                          <div key={index} className="bg-muted rounded-md p-3 text-sm">
                            <div className="font-medium">{stage.name}</div>
                            <div className="text-muted-foreground mt-1 text-xs">
                              {format(new Date(stage.startDate), 'dd/MM/yyyy', { locale: pt })} - {format(new Date(stage.endDate), 'dd/MM/yyyy', { locale: pt })}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
