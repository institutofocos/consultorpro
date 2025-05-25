
import React from 'react';
import { format, addDays, differenceInDays, startOfWeek, endOfWeek, eachDayOfInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Note } from '@/integrations/supabase/notes';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, ChevronRight } from 'lucide-react';

interface NotesGanttProps {
  notes: Note[];
  onUpdateNote: (note: Note) => Promise<void>;
  onDeleteNote: (id: string) => Promise<void>;
}

const STATUS_COLORS = {
  'iniciar_projeto': 'bg-blue-500',
  'em_producao': 'bg-yellow-500',
  'aguardando_assinatura': 'bg-orange-500',
  'aguardando_aprovacao': 'bg-purple-500',
  'aguardando_nota_fiscal': 'bg-indigo-500',
  'aguardando_pagamento': 'bg-pink-500',
  'aguardando_repasse': 'bg-cyan-500',
  'finalizados': 'bg-green-500',
  'cancelados': 'bg-red-500',
};

interface GanttItem {
  id: string;
  name: string;
  type: 'main' | 'subtask';
  startDate: string;
  endDate: string;
  status: Note['status'];
  consultant: string;
  parentId: string | null;
}

const NotesGantt: React.FC<NotesGanttProps> = ({ notes }) => {
  // Filter notes that have dates
  const notesWithDates = notes.filter(note => note.start_date && note.due_date);
  
  if (notesWithDates.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        Nenhuma tarefa com datas de início e fim encontrada para exibir no Gantt.
      </div>
    );
  }

  // Calculate date range
  const allDates = notesWithDates.flatMap(note => [
    new Date(note.start_date!),
    new Date(note.due_date!)
  ]);
  
  const minDate = new Date(Math.min(...allDates.map(d => d.getTime())));
  const maxDate = new Date(Math.max(...allDates.map(d => d.getTime())));
  
  // Extend range by a week on each side for better visualization
  const startDate = startOfWeek(addDays(minDate, -7), { locale: ptBR });
  const endDate = endOfWeek(addDays(maxDate, 7), { locale: ptBR });
  
  const totalDays = differenceInDays(endDate, startDate) + 1;
  const dateRange = eachDayOfInterval({ start: startDate, end: endDate });

  // Calculate bar position and width for a task
  const calculateBarStyle = (taskStartDate: string, taskEndDate: string) => {
    const start = new Date(taskStartDate);
    const end = new Date(taskEndDate);
    
    const startOffset = differenceInDays(start, startDate);
    const duration = differenceInDays(end, start) + 1;
    
    return {
      left: `${(startOffset / totalDays) * 100}%`,
      width: `${(duration / totalDays) * 100}%`,
      minWidth: '2px'
    };
  };

  // Create gantt items (main tasks + subtasks)
  const ganttItems: GanttItem[] = notesWithDates.flatMap(note => {
    const items: GanttItem[] = [{
      id: note.id,
      name: note.title,
      type: 'main',
      startDate: note.start_date!,
      endDate: note.due_date!,
      status: note.status,
      consultant: note.consultant_names?.[0] || 'Não atribuído',
      parentId: null
    }];

    // Add checklists as subtasks if they have dates
    if (note.checklists) {
      const checklistsWithDates = note.checklists.filter(checklist => 
        checklist.due_date && note.start_date
      );
      
      checklistsWithDates.forEach(checklist => {
        items.push({
          id: checklist.id,
          name: checklist.title,
          type: 'subtask',
          startDate: note.start_date!,
          endDate: checklist.due_date!,
          status: checklist.completed ? 'finalizados' : 'iniciar_projeto',
          consultant: checklist.responsible_consultant_name || 'Não atribuído',
          parentId: note.id
        });
      });
    }

    return items;
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Gantt de Tarefas
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <div className="min-w-[800px]">
            {/* Header with dates */}
            <div className="grid grid-cols-[300px_1fr] mb-4 border-b pb-2">
              <div className="font-medium">Tarefa</div>
              <div className="grid grid-cols-7 gap-1 text-xs">
                {dateRange.filter((_, index) => index % Math.ceil(dateRange.length / 7) === 0).map(date => (
                  <div key={date.toISOString()} className="text-center font-medium">
                    {format(date, 'dd/MM', { locale: ptBR })}
                  </div>
                ))}
              </div>
            </div>

            {/* Gantt rows */}
            {ganttItems.map(item => (
              <div key={item.id} className="grid grid-cols-[300px_1fr] py-2 border-b border-gray-100">
                <div className={`${item.type === 'subtask' ? 'pl-6' : ''}`}>
                  <div className="flex items-center gap-2">
                    {item.type === 'subtask' && (
                      <ChevronRight className="h-3 w-3 text-gray-400" />
                    )}
                    <div>
                      <p className={`font-medium ${item.type === 'subtask' ? 'text-sm' : ''}`}>
                        {item.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {item.consultant}
                      </p>
                      <div className="flex gap-1 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {format(new Date(item.startDate), 'dd/MM', { locale: ptBR })} - 
                          {format(new Date(item.endDate), 'dd/MM', { locale: ptBR })}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="relative h-8">
                  {/* Background timeline */}
                  <div className="absolute inset-y-0 w-full bg-gray-100 rounded"></div>
                  
                  {/* Task bar */}
                  <div 
                    className={`absolute inset-y-1 ${STATUS_COLORS[item.status]} rounded shadow-sm flex items-center justify-center text-white text-xs font-medium`}
                    style={calculateBarStyle(item.startDate, item.endDate)}
                  >
                    <span className="truncate px-1">
                      {differenceInDays(new Date(item.endDate), new Date(item.startDate)) + 1}d
                    </span>
                  </div>
                </div>
              </div>
            ))}

            {/* Today line */}
            <div 
              className="absolute top-0 bottom-0 w-px bg-red-500 z-10 pointer-events-none" 
              style={{
                left: `calc(300px + ${(differenceInDays(new Date(), startDate) / totalDays) * 100}%)`
              }}
            >
              <div className="absolute -top-2 -left-8 bg-red-500 text-white text-xs px-1 rounded">
                Hoje
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default NotesGantt;
