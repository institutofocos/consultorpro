
import React, { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar, Tag, UserCircle, Building, Layers, MessageCircle, Clock, CheckSquare, Edit3, Trash2, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

import { Note, updateNoteStatus, updateChecklist } from '@/integrations/supabase/notes';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import NoteForm from './NoteForm';
import { toast } from 'sonner';

interface NoteCardProps {
  note: Note;
  onUpdate: (note: Note) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  isDraggable?: boolean;
  viewMode?: string;
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

const NoteCard: React.FC<NoteCardProps> = ({ 
  note, 
  onUpdate, 
  onDelete,
  isDraggable = false,
  viewMode = 'cards'
}) => {
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const handleStatusChange = async (newStatus: Note['status']) => {
    setIsUpdatingStatus(true);
    try {
      const updatedNote = await updateNoteStatus(note.id, newStatus);
      if (updatedNote) {
        await onUpdate(updatedNote);
        toast.success('Status atualizado com sucesso');
      }
    } catch (error) {
      toast.error('Erro ao atualizar status');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleMarkAsCompleted = async () => {
    setIsUpdatingStatus(true);
    try {
      const updatedNote = await updateNoteStatus(note.id, 'finalizado');
      if (updatedNote) {
        await onUpdate(updatedNote);
        toast.success('Tarefa marcada como finalizada');
      }
    } catch (error: any) {
      if (error.message && error.message.includes('checklists')) {
        toast.error('Não é possível finalizar. Complete todas as checklists primeiro.');
      } else {
        toast.error('Erro ao marcar como finalizada');
      }
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleChecklistToggle = async (checklistId: string, completed: boolean) => {
    try {
      const success = await updateChecklist(checklistId, { 
        completed, 
        completed_at: completed ? new Date().toISOString() : undefined 
      });
      
      if (success) {
        // Auto-update status to "em_producao" when any checklist is marked as done
        if (completed && note.status === 'a_fazer') {
          await handleStatusChange('em_producao');
        }
        
        // Check if all checklists are completed to auto-finalize
        const updatedNote = { ...note };
        if (updatedNote.checklists) {
          const updatedChecklists = updatedNote.checklists.map(c => 
            c.id === checklistId ? { ...c, completed } : c
          );
          const allCompleted = updatedChecklists.every(c => c.completed);
          
          if (allCompleted && completed) {
            await handleStatusChange('finalizado');
          }
        }
        
        window.location.reload(); // Temporary solution - ideally would refetch properly
        toast.success('Checklist atualizada');
      }
    } catch (error) {
      toast.error('Erro ao atualizar checklist');
    }
  };

  const getProgress = () => {
    if (!note.checklists || note.checklists.length === 0) return 0;
    const completed = note.checklists.filter(c => c.completed).length;
    return Math.round((completed / note.checklists.length) * 100);
  };

  const showChecklists = viewMode !== 'cards';

  return (
    <Card 
      className={cn("w-full transition-all hover:shadow-md", {
        "cursor-grab active:cursor-grabbing": isDraggable
      })}
      style={{ 
        borderLeft: note.color ? `4px solid ${note.color}` : undefined 
      }}
      data-note-id={note.id}
    >
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <h3 className="font-medium text-lg leading-tight">{note.title}</h3>
          <div className="flex gap-2 ml-2">
            {note.has_internal_chat && (
              <Badge variant="outline" className="bg-purple-50 text-purple-700">
                <MessageCircle className="h-3 w-3 mr-1" />
                Chat
              </Badge>
            )}
            <Badge 
              variant="outline"
              className={cn("", STATUS_COLORS[note.status])}
            >
              {STATUS_LABELS[note.status]}
            </Badge>
          </div>
        </div>

        {/* Quick status change */}
        <div className="mt-2">
          <Select 
            value={note.status} 
            onValueChange={handleStatusChange}
            disabled={isUpdatingStatus}
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="a_fazer">A fazer</SelectItem>
              <SelectItem value="em_producao">Em produção</SelectItem>
              <SelectItem value="finalizado">Finalizado</SelectItem>
              <SelectItem value="cancelado">Cancelado</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>

      <CardContent className="pb-3 space-y-3">
        {note.content && (
          <p className="text-sm text-gray-600 whitespace-pre-wrap">{note.content}</p>
        )}

        {/* Datas */}
        <div className="grid grid-cols-1 gap-1 text-xs text-gray-500">
          {note.start_date && (
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>Início: {format(new Date(note.start_date), "dd/MM/yyyy", { locale: ptBR })}</span>
            </div>
          )}
          {note.due_date && (
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              <span>Vencimento: {format(new Date(note.due_date), "dd/MM/yyyy", { locale: ptBR })}</span>
            </div>
          )}
          {note.end_date && (
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              <span>Conclusão: {format(new Date(note.end_date), "dd/MM/yyyy", { locale: ptBR })}</span>
            </div>
          )}
        </div>

        {/* Consultores */}
        {note.consultant_names && note.consultant_names.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {note.consultant_names.map((name, index) => (
              <Badge key={index} variant="outline" className="text-xs flex items-center gap-1">
                <UserCircle className="h-3 w-3" />
                {name}
              </Badge>
            ))}
          </div>
        )}

        {/* Cliente e Serviço */}
        <div className="flex flex-wrap gap-1 text-xs text-gray-500">
          {note.client_name && (
            <div className="flex items-center gap-1">
              <Building className="h-3 w-3" />
              <span>{note.client_name}</span>
            </div>
          )}
          {note.service_name && (
            <div className="flex items-center gap-1">
              <Layers className="h-3 w-3" />
              <span>{note.service_name}</span>
            </div>
          )}
        </div>

        {/* Tags */}
        {note.tag_names && note.tag_names.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {note.tag_names.map((tagName, index) => (
              <Badge key={index} variant="secondary" className="text-xs flex items-center gap-1">
                <Tag className="h-3 w-3" />
                {tagName}
              </Badge>
            ))}
          </div>
        )}

        {/* Show checklist progress only for cards view */}
        {viewMode === 'cards' && note.checklists && note.checklists.length > 0 && (
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <CheckSquare className="h-4 w-4" />
              <span>Progresso</span>
            </div>
            <Badge variant="outline" className="text-xs">
              {getProgress()}% concluído
            </Badge>
          </div>
        )}

        {/* Checklists - only show in non-cards views */}
        {showChecklists && note.checklists && note.checklists.length > 0 && (
          <div className="space-y-2">
            <Separator />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckSquare className="h-4 w-4" />
                <span className="text-sm font-medium">Checklists</span>
              </div>
              <Badge variant="outline" className="text-xs">
                {getProgress()}% concluído
              </Badge>
            </div>
            <div className="space-y-1">
              {note.checklists.slice(0, 3).map((checklist) => (
                <div key={checklist.id} className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={checklist.completed}
                    onCheckedChange={(checked) => handleChecklistToggle(checklist.id, checked as boolean)}
                  />
                  <span className={cn("flex-1", checklist.completed && "line-through text-muted-foreground")}>
                    {checklist.title}
                  </span>
                  {checklist.due_date && (
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(checklist.due_date), "dd/MM")}
                    </span>
                  )}
                </div>
              ))}
              {note.checklists.length > 3 && (
                <div className="text-xs text-muted-foreground">
                  +{note.checklists.length - 3} mais
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="pt-0 flex justify-between">
        <div className="flex gap-2">
          <NoteForm
            initialData={note}
            onSave={onUpdate}
          >
            <Button variant="outline" size="sm">
              <Edit3 className="h-3 w-3 mr-1" />
              Editar
            </Button>
          </NoteForm>
          
          {note.status !== 'finalizado' && (
            <Button 
              variant="outline" 
              size="sm"
              className="border-green-200 hover:border-green-500 hover:text-green-600"
              onClick={handleMarkAsCompleted}
              disabled={isUpdatingStatus}
            >
              <Check className="h-3 w-3 mr-1" />
              Finalizar
            </Button>
          )}
        </div>
        
        <Button 
          variant="outline" 
          size="sm"
          className="border-red-200 hover:border-red-500 hover:text-red-600"
          onClick={() => onDelete(note.id)}
        >
          <Trash2 className="h-3 w-3 mr-1" />
          Excluir
        </Button>
      </CardFooter>
    </Card>
  );
};

export default NoteCard;
