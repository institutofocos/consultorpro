
import React, { useState } from 'react';
import { Droppable } from 'react-beautiful-dnd';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MoreVertical, Edit2, Trash2, Check, X, ChevronLeft, ChevronRight, Palette } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Note } from '@/integrations/supabase/notes';
import ColumnColorPicker from './ColumnColorPicker';

interface KanbanColumnProps {
  id: string;
  title: string;
  bgColor: string;
  notes: Note[];
  onUpdateColumn: (id: string, title: string) => void;
  onDeleteColumn: (id: string) => void;
  onUpdateColumnColor: (id: string, color: string) => void;
  onMoveColumn: (id: string, direction: 'left' | 'right') => void;
  children: React.ReactNode;
}

const KanbanColumn: React.FC<KanbanColumnProps> = ({
  id,
  title,
  bgColor,
  notes,
  onUpdateColumn,
  onDeleteColumn,
  onUpdateColumnColor,
  onMoveColumn,
  children,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(title);
  const [showColorPicker, setShowColorPicker] = useState(false);

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

  const handleColorChange = (color: string) => {
    onUpdateColumnColor(id, color);
    setShowColorPicker(false);
  };

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
              
              <DropdownMenuItem onClick={() => setShowColorPicker(true)}>
                <Palette className="h-3 w-3 mr-2" />
                Escolher cor da coluna
              </DropdownMenuItem>
              
              <DropdownMenuSeparator />
              
              <DropdownMenuItem onClick={() => onMoveColumn(id, 'left')}>
                <ChevronLeft className="h-3 w-3 mr-2" />
                Mover para esquerda
              </DropdownMenuItem>
              
              <DropdownMenuItem onClick={() => onMoveColumn(id, 'right')}>
                <ChevronRight className="h-3 w-3 mr-2" />
                Mover para direita
              </DropdownMenuItem>
              
              <DropdownMenuSeparator />
              
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
      
      {showColorPicker && (
        <div className="absolute z-50 mt-8">
          <ColumnColorPicker
            currentColor={bgColor}
            onColorChange={handleColorChange}
          />
        </div>
      )}
      
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
