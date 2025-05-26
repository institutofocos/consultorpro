
import React, { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Note } from '@/integrations/supabase/notes';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  Edit3, 
  Trash2, 
  Calendar, 
  ChevronRight, 
  ChevronDown,
  CheckSquare,
  Square
} from 'lucide-react';
import NoteForm from './NoteForm';
import ChecklistItem from './ChecklistItem';
import { cn } from '@/lib/utils';
import { syncTaskStageToProject } from '@/integrations/supabase/kanban-sync';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface NotesExpandedTableProps {
  notes: Note[];
  onUpdateNote: (note: Note) => Promise<void>;
  onDeleteNote: (id: string) => Promise<void>;
}

const STATUS_COLORS = {
  'a_fazer': 'bg-blue-100 text-blue-800',
  'em_producao': 'bg-yellow-100 text-yellow-800',
  'finalizado': 'bg-green-100 text-green-800',
  'cancelado': 'bg-red-100 text-red-800',
};

const STATUS_LABELS = {
  'a_fazer': 'A fazer',
  'em_producao': 'Em produção',
  'finalizado': 'Finalizado',
  'cancelado': 'Cancelado',
};

const NotesExpandedTable: React.FC<NotesExpandedTableProps> = ({
  notes,
  onUpdateNote,
  onDeleteNote,
}) => {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const toggleRow = (noteId: string) => {
    setExpandedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(noteId)) {
        newSet.delete(noteId);
      } else {
        newSet.add(noteId);
      }
      return newSet;
    });
  };

  const handleChecklistItemToggle = async (noteId: string, checklistId: string, completed: boolean, checklistTitle: string) => {
    try {
      // Atualizar o item do checklist no banco de dados
      const { error } = await supabase
        .from('note_checklists')
        .update({
          completed: completed,
          completed_at: completed ? new Date().toISOString() : null
        })
        .eq('id', checklistId);

      if (error) throw error;

      // Sincronizar com o projeto se for uma tarefa de projeto
      await syncTaskStageToProject(noteId, checklistTitle, completed);

      toast.success(completed ? 'Etapa marcada como concluída!' : 'Etapa desmarcada como concluída!');
      
      // Atualizar a lista de notas
      window.location.reload(); // Força atualização para garantir sincronização
    } catch (error) {
      console.error('Erro ao atualizar checklist:', error);
      toast.error('Erro ao atualizar etapa');
    }
  };

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-8"></TableHead>
            <TableHead>Título</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Cliente</TableHead>
            <TableHead>Serviço</TableHead>
            <TableHead>Consultor</TableHead>
            <TableHead>Data Vencimento</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {notes.length > 0 ? (
            notes.map((note) => (
              <React.Fragment key={note.id}>
                <TableRow className="hover:bg-muted/50">
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleRow(note.id)}
                      className="p-1 h-6 w-6"
                    >
                      {expandedRows.has(note.id) ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </Button>
                  </TableCell>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      {note.color && (
                        <div 
                          className="w-3 h-3 rounded-full flex-shrink-0" 
                          style={{ backgroundColor: note.color }}
                        />
                      )}
                      {note.title}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant="outline"
                      className={cn("", STATUS_COLORS[note.status])}
                    >
                      {STATUS_LABELS[note.status]}
                    </Badge>
                  </TableCell>
                  <TableCell>{note.client_name || '-'}</TableCell>
                  <TableCell>{note.service_name || '-'}</TableCell>
                  <TableCell>
                    {note.consultant_names && note.consultant_names.length > 0
                      ? note.consultant_names.join(', ')
                      : '-'}
                  </TableCell>
                  <TableCell>
                    {note.due_date ? (
                      <div className="flex items-center gap-1 text-xs">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(note.due_date), "dd/MM/yyyy", { locale: ptBR })}
                      </div>
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <NoteForm
                        initialData={note}
                        onSave={onUpdateNote}
                      >
                        <Button variant="ghost" size="sm">
                          <Edit3 className="h-4 w-4" />
                        </Button>
                      </NoteForm>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDeleteNote(note.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
                
                {/* Linha expandida com detalhes */}
                <TableRow className={cn(
                  "border-none",
                  !expandedRows.has(note.id) && "hidden"
                )}>
                  <TableCell colSpan={8} className="p-0">
                    <Collapsible open={expandedRows.has(note.id)}>
                      <CollapsibleContent>
                        <div className="px-4 py-3 bg-muted/20 border-t">
                          <div className="space-y-3">
                            {/* Conteúdo da nota */}
                            {note.content && (
                              <div>
                                <h4 className="font-medium text-sm mb-1">Descrição:</h4>
                                <p className="text-sm text-muted-foreground">{note.content}</p>
                              </div>
                            )}
                            
                            {/* Checklists */}
                            {note.checklists && note.checklists.length > 0 && (
                              <div>
                                <h4 className="font-medium text-sm mb-2">Etapas:</h4>
                                <div className="space-y-1">
                                  {note.checklists.map((checklist) => (
                                    <div key={checklist.id} className="flex items-center gap-2 text-sm">
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="p-1 h-6 w-6"
                                        onClick={() => handleChecklistItemToggle(
                                          note.id, 
                                          checklist.id, 
                                          !checklist.completed,
                                          checklist.title
                                        )}
                                      >
                                        {checklist.completed ? (
                                          <CheckSquare className="h-4 w-4 text-green-600" />
                                        ) : (
                                          <Square className="h-4 w-4 text-muted-foreground" />
                                        )}
                                      </Button>
                                      <span className={cn(
                                        checklist.completed && "line-through text-muted-foreground"
                                      )}>
                                        {checklist.title}
                                      </span>
                                      {checklist.due_date && (
                                        <span className="text-xs text-muted-foreground ml-auto">
                                          {format(new Date(checklist.due_date), "dd/MM/yyyy", { locale: ptBR })}
                                        </span>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            
                            {/* Campos customizados */}
                            {note.custom_fields && note.custom_fields.length > 0 && (
                              <div>
                                <h4 className="font-medium text-sm mb-2">Campos Customizados:</h4>
                                <div className="grid grid-cols-2 gap-2">
                                  {note.custom_fields.map((field) => (
                                    <div key={field.id} className="text-sm">
                                      <span className="font-medium">{field.field_name}:</span>
                                      <span className="ml-1 text-muted-foreground">{field.field_value}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  </TableCell>
                </TableRow>
              </React.Fragment>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={8} className="text-center py-4 text-muted-foreground">
                Nenhuma tarefa encontrada.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default NotesExpandedTable;
