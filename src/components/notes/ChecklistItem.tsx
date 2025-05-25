
import React, { useState } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Edit2, Save, X, Trash2, User, MoreVertical } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { NoteChecklist } from '@/integrations/supabase/notes';
import { updateChecklistStatus } from '@/integrations/supabase/notes';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface ChecklistItemProps {
  item: NoteChecklist;
  noteId: string;
  onUpdate: (item: NoteChecklist) => void;
  onDelete: (id: string) => void;
}

const ChecklistItem: React.FC<ChecklistItemProps> = ({ item, noteId, onUpdate, onDelete }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(item.title);
  const [editDescription, setEditDescription] = useState(item.description || '');
  const [editDueDate, setEditDueDate] = useState<Date | undefined>(
    item.due_date ? new Date(item.due_date) : undefined
  );

  const handleToggleComplete = async (checked: boolean) => {
    try {
      await updateChecklistStatus(item.id, checked, noteId);
      
      const updatedItem = {
        ...item,
        completed: checked,
        completed_at: checked ? new Date().toISOString() : null
      };
      
      onUpdate(updatedItem);
      toast.success(checked ? 'Item marcado como concluído!' : 'Item marcado como pendente!');
    } catch (error) {
      console.error('Error updating checklist item:', error);
      toast.error('Erro ao atualizar item da lista');
    }
  };

  const handleSave = async () => {
    try {
      const updatedItem = {
        ...item,
        title: editTitle,
        description: editDescription,
        due_date: editDueDate ? editDueDate.toISOString() : null,
      };

      const response = await fetch(`/api/checklists/${item.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedItem),
      });

      if (!response.ok) {
        throw new Error('Failed to update checklist item');
      }

      onUpdate(updatedItem);
      setIsEditing(false);
      toast.success('Item atualizado com sucesso!');
    } catch (error) {
      console.error('Error updating checklist item:', error);
      toast.error('Erro ao atualizar item da lista');
    }
  };

  const handleDelete = async () => {
    try {
      const response = await fetch(`/api/checklists/${item.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete checklist item');
      }

      onDelete(item.id);
      toast.success('Item excluído com sucesso!');
    } catch (error) {
      console.error('Error deleting checklist item:', error);
      toast.error('Erro ao excluir item da lista');
    }
  };

  const formatDate = (date: Date | undefined): string => {
    return date ? format(date, 'dd/MM/yyyy', { locale: ptBR }) : '';
  };

  return (
    <div className="flex items-start space-x-3 py-2 border-b last:border-b-0">
      <Checkbox
        id={`item-${item.id}`}
        defaultChecked={item.completed || false}
        onCheckedChange={handleToggleComplete}
        disabled={isEditing}
      />
      <div className="flex-1 space-y-1">
        <div className="flex items-center justify-between">
          {isEditing ? (
            <Input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="text-sm font-medium"
            />
          ) : (
            <label
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed"
              htmlFor={`item-${item.id}`}
            >
              {item.title}
            </label>
          )}
          <div>
            {isEditing ? (
              <div className="flex space-x-2">
                <Button size="sm" onClick={handleSave}>
                  <Save className="h-3 w-3 mr-2" />
                  Salvar
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setIsEditing(false)}>
                  <X className="h-3 w-3 mr-2" />
                  Cancelar
                </Button>
              </div>
            ) : (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setIsEditing(true)}>
                    <Edit2 className="h-3 w-3 mr-2" />
                    Editar
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleDelete} className="text-red-500">
                    <Trash2 className="h-3 w-3 mr-2" />
                    Excluir
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
        {isEditing ? (
          <Textarea
            placeholder="Descrição"
            value={editDescription}
            onChange={(e) => setEditDescription(e.target.value)}
            className="text-sm"
          />
        ) : (
          item.description && (
            <p className="text-sm text-muted-foreground">
              {item.description}
            </p>
          )
        )}
        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
          {isEditing ? (
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "justify-start text-left font-normal",
                    !editDueDate && "text-muted-foreground",
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {editDueDate ? formatDate(editDueDate) : <span>Escolher data</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={editDueDate}
                  onSelect={setEditDueDate}
                  disabled={(date) =>
                    date < new Date()
                  }
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          ) : (
            item.due_date && (
              <div className="flex items-center">
                <CalendarIcon className="mr-2 h-4 w-4" />
                <span>{formatDate(new Date(item.due_date))}</span>
              </div>
            )
          )}
          {item.responsible_consultant_id && (
            <div className="flex items-center">
              <User className="mr-2 h-4 w-4" />
              <span>{item.responsible_consultant_id}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChecklistItem;
