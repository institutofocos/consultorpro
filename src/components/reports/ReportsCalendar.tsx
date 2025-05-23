
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Calendar as CalendarIcon } from 'lucide-react';
import { Calendar } from "@/components/ui/calendar";
import { addDays } from "date-fns";

export default function ReportsCalendar() {
  // Data de exemplo para o calendário
  const today = new Date();
  const [date, setDate] = React.useState<Date | undefined>(today);
  const [events] = React.useState([
    { 
      title: 'Reunião com Cliente ABC', 
      date: today,
      type: 'meeting'
    },
    { 
      title: 'Entrega Projeto XYZ', 
      date: addDays(today, 3),
      type: 'deadline'
    },
    { 
      title: 'Revisão de Documentação', 
      date: addDays(today, 5),
      type: 'task'
    }
  ]);

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
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                className="rounded-md border"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Eventos do Dia</CardTitle>
          </CardHeader>
          <CardContent>
            {date && events.filter(event => 
              event.date.toDateString() === date.toDateString()
            ).length > 0 ? (
              <div className="space-y-4">
                {events
                  .filter(event => event.date.toDateString() === date.toDateString())
                  .map((event, index) => (
                    <div key={index} className="flex items-center p-3 border rounded-lg">
                      <div className={`w-3 h-3 rounded-full mr-3 ${
                        event.type === 'meeting' ? 'bg-blue-500' :
                        event.type === 'deadline' ? 'bg-red-500' : 'bg-green-500'
                      }`} />
                      <div>
                        <p className="font-medium">{event.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {event.date.toLocaleDateString()}
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
