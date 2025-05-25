
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Note } from '@/integrations/supabase/notes';
import { ChevronDown, ChevronUp, Calendar, User, Info, Link as LinkIcon } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import NoteCard from './NoteCard';

interface CompactNoteCardProps {
  note: Note;
  onUpdate: (note: Note) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  isDraggable?: boolean;
}

const CompactNoteCard: React.FC<CompactNoteCardProps> = ({
  note,
  onUpdate,
  onDelete,
  isDraggable = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showDescription, setShowDescription] = useState(false);

  if (isExpanded) {
    return (
      <div className="relative">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(false)}
          className="absolute -top-2 -right-2 h-6 w-6 p-0 z-10 bg-white shadow-sm rounded-full"
        >
          <ChevronUp className="h-3 w-3" />
        </Button>
        <NoteCard
          note={note}
          onUpdate={onUpdate}
          onDelete={onDelete}
          isDraggable={isDraggable}
        />
      </div>
    );
  }

  return (
    <Card className="bg-card border shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="p-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 flex-1">
            {note.color && (
              <div 
                className="w-3 h-3 rounded-full flex-shrink-0" 
                style={{ backgroundColor: note.color }}
              />
            )}
            <h4 className="font-medium text-sm truncate flex-1">{note.title}</h4>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(true)}
            className="h-6 w-6 p-0 flex-shrink-0"
          >
            <ChevronDown className="h-3 w-3" />
          </Button>
        </div>

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            {/* Link badge */}
            {note.linked_task_id && (
              <Badge variant="outline" className="bg-indigo-50 text-indigo-700 px-1 py-0">
                <LinkIcon className="h-2 w-2 mr-1" />
                Link
              </Badge>
            )}
            
            {/* Client */}
            {note.client_name && (
              <span className="truncate max-w-[80px]">{note.client_name}</span>
            )}
          </div>

          <div className="flex items-center gap-1">
            {/* Description indicator */}
            {note.content && (
              <>
                <Dialog open={showDescription} onOpenChange={setShowDescription}>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setShowDescription(true)} 
                    className="h-4 w-4 p-0"
                  >
                    <Info className="h-2 w-2" />
                  </Button>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{note.title}</DialogTitle>
                    </DialogHeader>
                    <div className="whitespace-pre-wrap text-sm">{note.content}</div>
                  </DialogContent>
                </Dialog>
              </>
            )}
          </div>
        </div>

        {/* Due date */}
        {note.due_date && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
            <Calendar className="h-2 w-2" />
            <span>{format(new Date(note.due_date), "dd/MM", { locale: ptBR })}</span>
          </div>
        )}

        {/* Consultant */}
        {note.consultant_names && note.consultant_names.length > 0 && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
            <User className="h-2 w-2" />
            <span className="truncate">{note.consultant_names[0]}</span>
            {note.consultant_names.length > 1 && (
              <span>+{note.consultant_names.length - 1}</span>
            )}
          </div>
        )}

        {/* Progress indicator */}
        {note.checklists && note.checklists.length > 0 && (
          <div className="flex items-center justify-between mt-2">
            <div className="text-xs text-muted-foreground">
              {note.checklists.filter(c => c.completed).length}/{note.checklists.length} concluídos
            </div>
            <div className="w-16 h-1 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary transition-all duration-300"
                style={{ 
                  width: `${(note.checklists.filter(c => c.completed).length / note.checklists.length) * 100}%` 
                }}
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CompactNoteCard;
