
import React from 'react';
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
import { Edit3, Trash2, Calendar } from 'lucide-react';
import NoteForm from './NoteForm';
import { cn } from '@/lib/utils';
import { formatDateBR } from '@/utils/dateUtils';

interface NotesTableProps {
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

const NotesTable: React.FC<NotesTableProps> = ({
  notes,
  onUpdateNote,
  onDeleteNote,
}) => {
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Título / Tarefa</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Cliente</TableHead>
            <TableHead>Serviço</TableHead>
            <TableHead>Consultor / Responsável</TableHead>
            <TableHead>Data Vencimento</TableHead>
            <TableHead>Descrição / Progresso</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {notes.length > 0 ? (
            notes.map((note) => (
              <TableRow key={note.id}>
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
                      {formatDateBR(note.due_date)}
                    </div>
                  ) : (
                    '-'
                  )}
                </TableCell>
                <TableCell>
                  <div className="text-sm text-muted-foreground">
                    {note.content ? note.content.substring(0, 50) + (note.content.length > 50 ? '...' : '') : '-'}
                    {note.checklists && note.checklists.length > 0 && (
                      <div className="text-xs mt-1">
                        {note.checklists.filter(c => c.completed).length}/{note.checklists.length} concluídos
                      </div>
                    )}
                  </div>
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

export default NotesTable;
