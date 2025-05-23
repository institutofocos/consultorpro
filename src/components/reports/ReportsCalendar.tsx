
import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Calendar as CalendarIcon } from 'lucide-react';
import { Calendar } from "@/components/ui/calendar";
import { addDays, format, parseISO, isWithinInterval } from "date-fns";
import { ptBR } from 'date-fns/locale';
import { supabase } from "@/integrations/supabase/client";

interface Event {
  title: string;
  date: Date;
  type: 'meeting' | 'deadline' | 'task';
  projectId?: string;
  stageId?: number;
}

export default function ReportsCalendar() {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    setIsLoading(true);
    try {
      // Buscar projetos e suas etapas
      const { data: projects, error } = await supabase
        .from('projects')
        .select(`
          id, name, start_date, end_date, stages,
          main_consultant:consultants!main_consultant_id(name)
        `);

      if (error) throw error;

      const allEvents: Event[] = [];
      
      // Processar projetos para extrair datas importantes
      if (projects) {
        projects.forEach(project => {
          // Adicionar evento para a data de início do projeto
          allEvents.push({
            title: `Início: ${project.name}`,
            date: new Date(project.start_date),
            type: 'meeting',
            projectId: project.id
          });
          
          // Adicionar evento para a data de término do projeto
          allEvents.push({
            title: `Entrega: ${project.name}`,
            date: new Date(project.end_date),
            type: 'deadline',
            projectId: project.id
          });
          
          // Adicionar eventos para o início e fim de cada etapa
          if (project.stages && Array.isArray(project.stages)) {
            project.stages.forEach((stage: any) => {
              if (stage.startDate) {
                allEvents.push({
                  title: `Início ${stage.name} - ${project.name}`,
                  date: new Date(stage.startDate),
                  type: 'task',
                  projectId: project.id,
                  stageId: stage.id
                });
              }
              
              if (stage.endDate) {
                allEvents.push({
                  title: `Fim ${stage.name} - ${project.name}`,
                  date: new Date(stage.endDate),
                  type: 'deadline',
                  projectId: project.id,
                  stageId: stage.id
                });
              }
            });
          }
        });
      }
      
      setEvents(allEvents);
    } catch (error) {
      console.error("Error fetching events:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Função para destacar dias com eventos no calendário
  const getDayClassNames = (day: Date) => {
    const hasEvents = events.some(event => 
      format(event.date, 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd')
    );
    
    return hasEvents ? 
      "bg-blue-100 text-blue-700 font-bold hover:bg-blue-200" : 
      undefined;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold">Relatórios - Agenda</h1>
        <p className="text-muted-foreground">Visualize os projetos em formato de agenda</p>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="shadow-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xl">
              <div className="flex items-center">
                <CalendarIcon className="h-5 w-5 mr-2" />
                <span>Agenda de Projetos</span>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center">
              {isLoading ? (
                <p>Carregando eventos...</p>
              ) : (
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  className="rounded-md border"
                  locale={ptBR}
                  modifiersClassNames={{
                    selected: "bg-blue-500 text-white hover:bg-blue-600",
                  }}
                  modifiers={{
                    highlighted: (day) => events.some(event => 
                      format(event.date, 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd')
                    ),
                  }}
                  modifiersStyles={{
                    highlighted: {
                      fontWeight: "bold",
                      backgroundColor: "#E0F2FE",
                      color: "#0369A1"
                    }
                  }}
                />
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Eventos do Dia</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center h-40">
                <p>Carregando eventos...</p>
              </div>
            ) : date && events.filter(event => 
              event.date.toDateString() === date.toDateString()
            ).length > 0 ? (
              <div className="space-y-4">
                {events
                  .filter(event => event.date.toDateString() === date.toDateString())
                  .sort((a, b) => a.date.getTime() - b.date.getTime())
                  .map((event, index) => (
                    <div key={index} className="flex items-center p-3 border rounded-lg">
                      <div className={`w-3 h-3 rounded-full mr-3 ${
                        event.type === 'meeting' ? 'bg-blue-500' :
                        event.type === 'deadline' ? 'bg-red-500' : 'bg-green-500'
                      }`} />
                      <div>
                        <p className="font-medium">{event.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {format(event.date, 'PPp', { locale: ptBR })}
                        </p>
                      </div>
                    </div>
                  ))
                }
              </div>
            ) : (
              <div className="flex items-center justify-center h-40 text-muted-foreground">
                {date ? "Não há eventos para esta data" : "Selecione uma data para ver os eventos"}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
