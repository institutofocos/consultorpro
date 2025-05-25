
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
            <span className="flex-1 text-sm font-medium">
              {title} ({notes.length})
            </span>
          )}
        </div>
        
        <div className="flex items-center">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-7 w-7 p-0 hover:bg-white/20"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => setIsEditing(true)}>
                <Edit2 className="h-4 w-4 mr-2" />
                Editar nome
              </DropdownMenuItem>
              
              <DropdownMenuItem onClick={() => setShowColorPicker(true)}>
                <Palette className="h-4 w-4 mr-2" />
                Escolher cor
              </DropdownMenuItem>
              
              <DropdownMenuSeparator />
              
              <DropdownMenuItem onClick={() => onMoveColumn(id, 'left')}>
                <ChevronLeft className="h-4 w-4 mr-2" />
                Mover para esquerda
              </DropdownMenuItem>
              
              <DropdownMenuItem onClick={() => onMoveColumn(id, 'right')}>
                <ChevronRight className="h-4 w-4 mr-2" />
                Mover para direita
              </DropdownMenuItem>
              
              <DropdownMenuSeparator />
              
              <DropdownMenuItem 
                onClick={() => onDeleteColumn(id)}
                className="text-red-600 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Excluir coluna
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      {showColorPicker && (
        <div className="absolute top-14 right-0 z-50">
          <div className="relative">
            <ColumnColorPicker
              currentColor={bgColor}
              onColorChange={handleColorChange}
            />
            <div 
              className="fixed inset-0 z-40" 
              onClick={() => setShowColorPicker(false)}
            />
          </div>
        </div>
      )}
      
      <Droppable droppableId={id}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`flex-1 p-3 rounded-b-md ${bgColor} transition-all duration-200 overflow-y-auto ${
              snapshot.isDraggingOver 
                ? 'bg-opacity-70 ring-2 ring-blue-300 ring-opacity-50' 
                : 'bg-opacity-50'
            }`}
            style={{ 
              maxHeight: 'calc(100vh - 280px)',
              minHeight: '200px'
            }}
          >
            <div className="space-y-3">
              {children}
              {provided.placeholder}
              {notes.length === 0 && (
                <div className="text-center py-8 text-gray-500 text-sm">
                  Arraste tarefas aqui
                </div>
              )}
            </div>
          </div>
        )}
      </Droppable>
    </div>
  );
};

export default KanbanColumn;
