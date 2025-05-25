import React, { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Note, NoteChecklist, updateChecklist } from '@/integrations/supabase/notes';
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
import { Checkbox } from '@/components/ui/checkbox';
import { Edit3, Trash2, Calendar, ChevronDown, ChevronRight, CheckCircle, FileText, Link as LinkIcon } from 'lucide-react';
import NoteForm from './NoteForm';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface NotesExpandedTableProps {
  notes: Note[];
  onUpdateNote: (note: Note) => Promise<void>;
  onDeleteNote: (id: string) => Promise<void>;
}

const STATUS_COLORS = {
  'iniciar_projeto': 'bg-blue-100 text-blue-800',
  'em_producao': 'bg-yellow-100 text-yellow-800',
  'aguardando_assinatura': 'bg-orange-100 text-orange-800',
  'aguardando_aprovacao': 'bg-purple-100 text-purple-800',
  'aguardando_nota_fiscal': 'bg-indigo-100 text-indigo-800',
  'aguardando_pagamento': 'bg-pink-100 text-pink-800',
  'aguardando_repasse': 'bg-cyan-100 text-cyan-800',
  'finalizados': 'bg-green-100 text-green-800',
  'cancelados': 'bg-red-100 text-red-800',
};

const STATUS_LABELS = {
  'iniciar_projeto': 'Iniciar Projeto',
  'em_producao': 'Em produção',
  'aguardando_assinatura': 'Aguardando Assinatura',
  'aguardando_aprovacao': 'Aguardando Aprovação',
  'aguardando_nota_fiscal': 'Aguardando Nota Fiscal',
  'aguardando_pagamento': 'Aguardando Pagamento',
  'aguardando_repasse': 'Aguardando Repasse',
  'finalizados': 'Finalizados',
  'cancelados': 'Cancelados',
};

const NotesExpandedTable: React.FC<NotesExpandedTableProps> = ({
  notes,
  onUpdateNote,
  onDeleteNote,
}) => {
  const [expandedNotes, setExpandedNotes] = useState<Set<string>>(new Set());
  const [openDescriptions, setOpenDescriptions] = useState<{[id: string]: boolean}>({});

  const toggleExpanded = (noteId: string) => {
    const newExpanded = new Set(expandedNotes);
    if (newExpanded.has(noteId)) {
      newExpanded.delete(noteId);
    } else {
      newExpanded.add(noteId);
    }
    setExpandedNotes(newExpanded);
  };
  
  const toggleDescription = (id: string, state?: boolean) => {
    setOpenDescriptions(prev => ({
      ...prev,
      [id]: state !== undefined ? state : !prev[id]
    }));
  };

  const handleChecklistToggle = async (checklistId: string, completed: boolean) => {
    try {
      const success = await updateChecklist(checklistId, { 
        completed, 
        completed_at: completed ? new Date().toISOString() : undefined 
      });
      
      if (success) {
        // Refetch notes to update the display
        window.location.reload(); // Temporary solution
        toast.success('Checklist atualizada');
      }
    } catch (error) {
      toast.error('Erro ao atualizar checklist');
    }
  };

  const renderNoteRow = (note: Note) => (
    <TableRow key={note.id} className="border-b">
      <TableCell>
        <div className="flex items-center gap-2">
          {note.checklists && note.checklists.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => toggleExpanded(note.id)}
              className="h-6 w-6 p-0"
            >
              {expandedNotes.has(note.id) ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </Button>
          )}
          <div className="flex items-center gap-2">
            {note.color && (
              <div 
                className="w-3 h-3 rounded-full flex-shrink-0" 
                style={{ backgroundColor: note.color }}
              />
            )}
            <span className="font-medium">{note.title}</span>
            
            {/* Link badge */}
            {note.linked_task_id && (
              <Badge variant="outline" className="bg-indigo-50 text-indigo-700 ml-2">
                <LinkIcon className="h-3 w-3 mr-1" />
                Vinculada
              </Badge>
            )}
          </div>
        </div>
      </TableCell>
      <TableCell>
        <Badge variant="outline" className={cn("", STATUS_COLORS[note.status])}>
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
      <TableCell>
        <div className="flex items-center gap-2">
          {note.content && (
            <>
              <Dialog open={openDescriptions[note.id]} onOpenChange={(state) => toggleDescription(note.id, state)}>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => toggleDescription(note.id)} 
                  className="h-6 w-6 p-0"
                >
                  <FileText className="h-4 w-4" />
                </Button>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>{note.title}</DialogTitle>
                  </DialogHeader>
                  <div className="whitespace-pre-wrap">{note.content}</div>
                </DialogContent>
              </Dialog>
            </>
          )}
          
          {note.checklists && note.checklists.length > 0 && (
            <div className="text-xs text-muted-foreground">
              {note.checklists.filter(c => c.completed).length}/{note.checklists.length} concluídos
            </div>
          )}
        </div>
      </TableCell>
      <TableCell className="text-right">
        <div className="flex justify-end gap-2">
          <NoteForm initialData={note} onSave={onUpdateNote}>
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
  );

  const renderChecklistRow = (checklist: NoteChecklist, noteColor?: string) => (
    <TableRow key={`checklist-${checklist.id}`} className="bg-muted/20">
      <TableCell>
        <div className="flex items-center gap-2 pl-8">
          <Checkbox
            checked={checklist.completed}
            onCheckedChange={(checked) => handleChecklistToggle(checklist.id, checked as boolean)}
          />
          {noteColor && (
            <div 
              className="w-2 h-2 rounded-full flex-shrink-0" 
              style={{ backgroundColor: noteColor }}
            />
          )}
          <span className={cn("text-sm", checklist.completed && "line-through text-muted-foreground")}>
            {checklist.title}
          </span>
          
          {/* Description dialog for checklist item */}
          {checklist.description && (
            <>
              <Dialog open={openDescriptions[`cl-${checklist.id}`]} onOpenChange={(state) => toggleDescription(`cl-${checklist.id}`, state)}>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => toggleDescription(`cl-${checklist.id}`)} 
                  className="h-5 w-5 p-0 ml-1"
                >
                  <FileText className="h-3 w-3" />
                </Button>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{checklist.title}</DialogTitle>
                  </DialogHeader>
                  <div className="whitespace-pre-wrap">{checklist.description}</div>
                </DialogContent>
              </Dialog>
            </>
          )}
        </div>
      </TableCell>
      <TableCell>
        <Badge variant="outline" className={cn("text-xs", checklist.completed ? "bg-green-100 text-green-800" : "bg-blue-100 text-blue-800")}>
          {checklist.completed ? 'Concluído' : 'Pendente'}
        </Badge>
      </TableCell>
      <TableCell>-</TableCell>
      <TableCell>-</TableCell>
      <TableCell>
        {checklist.responsible_consultant_name || '-'}
      </TableCell>
      <TableCell>
        {checklist.due_date ? (
          <div className="flex items-center gap-1 text-xs">
            <Calendar className="h-3 w-3" />
            {format(new Date(checklist.due_date), "dd/MM/yyyy", { locale: ptBR })}
          </div>
        ) : (
          '-'
        )}
      </TableCell>
      <TableCell>
        {checklist.completed && checklist.completed_at && (
          <div className="text-xs text-muted-foreground">
            {format(new Date(checklist.completed_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
          </div>
        )}
      </TableCell>
      <TableCell className="text-right">
        <div className="flex justify-end gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleChecklistToggle(checklist.id, !checklist.completed)}
            className={cn(
              "text-xs",
              checklist.completed && "text-green-600 hover:text-green-700"
            )}
          >
            <CheckCircle className="h-3 w-3 mr-1" />
            {checklist.completed ? 'Desfazer' : 'Concluir'}
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );

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
              <React.Fragment key={note.id}>
                {renderNoteRow(note)}
                {expandedNotes.has(note.id) && 
                  note.checklists && 
                  note.checklists.map(checklist => 
                    renderChecklistRow(checklist, note.color)
                  )
                }
              </React.Fragment>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={8} className="text-center py-4 text-muted-foreground">
                Nenhuma anotação encontrada.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default NotesExpandedTable;
