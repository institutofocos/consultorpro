
import React, { useState } from 'react';
import { Droppable } from 'react-beautiful-dnd';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MoreVertical, Edit2, Trash2, Check, X } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Note } from '@/integrations/supabase/notes';

interface KanbanColumnProps {
  id: string;
  title: string;
  bgColor: string;
  notes: Note[];
  onUpdateColumn: (id: string, title: string) => void;
  onDeleteColumn: (id: string) => void;
  children: React.ReactNode;
}

const KanbanColumn: React.FC<KanbanColumnProps> = ({
  id,
  title,
  bgColor,
  notes,
  onUpdateColumn,
  onDeleteColumn,
  children,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(title);

  const handleSaveTitle = () => {
    if (editTitle.trim()) {
      onUpdateColumn(id, editTitle.trim());
      setIsEditing(false);
    }
  };

  const handleCancelEdit = () => {
    setEditTitle(title);
    setIsEditing(false);
  };

  // Calcular total dos projetos na coluna
  const totalValue = notes.reduce((sum, note) => {
    return sum + (note.estimated_value || 0);
  }, 0);

  return (
    <div className="flex flex-col min-w-[300px] w-1/4 max-h-[calc(100vh-200px)]">
      <div className={`p-3 rounded-t-md font-medium ${bgColor} flex items-center justify-between`}>
        <div className="flex items-center flex-1">
          {isEditing ? (
            <div className="flex items-center gap-2 flex-1">
              <Input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="h-6 text-sm bg-white/80"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveTitle();
                  if (e.key === 'Escape') handleCancelEdit();
                }}
                autoFocus
              />
              <Button size="sm" variant="ghost" onClick={handleSaveTitle} className="h-6 w-6 p-0">
                <Check className="h-3 w-3" />
              </Button>
              <Button size="sm" variant="ghost" onClick={handleCancelEdit} className="h-6 w-6 p-0">
                <X className="h-3 w-3" />
              </Button>
            </div>
          ) : (
            <span className="flex-1">{title} ({notes.length})</span>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold">
            {new Intl.NumberFormat('pt-BR', {
              style: 'currency',
              currency: 'BRL',
              minimumFractionDigits: 0,
              maximumFractionDigits: 0
            }).format(totalValue)}
          </span>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                <MoreVertical className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setIsEditing(true)}>
                <Edit2 className="h-3 w-3 mr-2" />
                Editar nome
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => onDeleteColumn(id)}
                className="text-red-600"
              >
                <Trash2 className="h-3 w-3 mr-2" />
                Excluir coluna
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      <Droppable droppableId={id}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`flex-1 p-2 rounded-b-md ${bgColor} transition-colors overflow-y-auto ${
              snapshot.isDraggingOver ? 'bg-opacity-80' : ''
            }`}
            style={{ maxHeight: 'calc(100vh - 250px)' }}
          >
            <div className="space-y-3">
              {children}
              {provided.placeholder}
            </div>
          </div>
        )}
      </Droppable>
    </div>
  );
};

export default KanbanColumn;
