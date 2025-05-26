
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
  isDragging?: boolean;
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
  isDragging = false,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(title);
  const [showColorPicker, setShowColorPicker] = useState(false);

  const handleSaveTitle = () => {
    if (editTitle.trim() && editTitle.trim() !== title) {
      onUpdateColumn(id, editTitle.trim());
    }
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditTitle(title);
    setIsEditing(false);
  };

  const handleColorChange = (color: string) => {
    onUpdateColumnColor(id, color);
    setShowColorPicker(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveTitle();
    } else if (e.key === 'Escape') {
      handleCancelEdit();
    }
  };

  return (
    <div className={`flex flex-col min-w-[300px] w-1/4 max-h-[calc(100vh-200px)] relative transition-all duration-200 ${
      isDragging ? 'opacity-50 transform rotate-2 scale-105' : ''
    }`}>
      <div className={`p-3 rounded-t-md font-medium ${bgColor} flex items-center justify-between border-b border-gray-200 ${
        isDragging ? 'shadow-lg' : ''
      }`}>
        <div className="flex items-center flex-1">
          {isEditing ? (
            <div className="flex items-center gap-2 flex-1">
              <Input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                onKeyDown={handleKeyDown}
                className="h-7 text-sm bg-white/90 border-gray-300"
                autoFocus
                onBlur={handleSaveTitle}
              />
              <Button 
                size="sm" 
                variant="ghost" 
                onClick={handleSaveTitle} 
                className="h-7 w-7 p-0 hover:bg-white/20"
              >
                <Check className="h-3 w-3" />
              </Button>
              <Button 
                size="sm" 
                variant="ghost" 
                onClick={handleCancelEdit} 
                className="h-7 w-7 p-0 hover:bg-white/20"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ) : (
            <span className="text-sm font-medium text-gray-800 flex-1">{title}</span>
          )}
        </div>
        
        <div className="flex items-center gap-1">
          <span className="text-xs text-gray-600 bg-white/50 px-2 py-1 rounded">
            {notes.length}
          </span>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0 hover:bg-white/20">
                <MoreVertical className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setIsEditing(true)}>
                <Edit2 className="h-3 w-3 mr-2" />
                Editar título
              </DropdownMenuItem>
              
              <DropdownMenuItem onClick={() => setShowColorPicker(true)}>
                <Palette className="h-3 w-3 mr-2" />
                Alterar cor
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
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="h-3 w-3 mr-2" />
                Excluir coluna
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <Droppable droppableId={id} type="TASK">
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`flex-1 p-2 space-y-2 bg-gray-50/50 rounded-b-md overflow-y-auto transition-colors ${
              snapshot.isDraggingOver ? 'bg-blue-50' : ''
            }`}
            style={{ minHeight: '200px' }}
          >
            {children}
            {provided.placeholder}
          </div>
        )}
      </Droppable>

      {showColorPicker && (
        <ColumnColorPicker
          currentColor={bgColor}
          onColorChange={handleColorChange}
          onClose={() => setShowColorPicker(false)}
        />
      )}
    </div>
  );
};

export default KanbanColumn;
