import React from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar, Tag, UserCircle, Building, Layers } from 'lucide-react';
import { cn } from '@/lib/utils';

import { Note } from '@/integrations/supabase/notes';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import NoteForm from './NoteForm';

interface NoteCardProps {
  note: Note;
  onUpdate: (note: Note) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  isDraggable?: boolean;
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
  isDraggable = false
}) => {
  return (
    <Card 
      className={cn("w-full transition-all", {
        "cursor-grab active:cursor-grabbing": isDraggable
      })}
      style={{ 
        borderLeft: note.color ? `4px solid ${note.color}` : undefined 
      }}
      data-note-id={note.id}
    >
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <h3 className="font-medium text-lg">{note.title}</h3>
          <Badge 
            variant="outline"
            className={cn("ml-2", STATUS_COLORS[note.status])}
          >
            {STATUS_LABELS[note.status]}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pb-3">
        {note.content && (
          <p className="text-gray-600 whitespace-pre-wrap mb-4">{note.content}</p>
        )}
        
        {/* Tags */}
        {note.tags && note.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 my-2">
            {note.tags.map((tag, index) => (
              <Badge 
                key={index} 
                style={{ backgroundColor: tag.color }}
                className="px-2 py-1 text-white flex items-center gap-1"
              >
                <Tag className="h-3 w-3" /> {tag.name}
              </Badge>
            ))}
          </div>
        )}
        
        {/* Campos personalizados */}
        {note.custom_fields && note.custom_fields.length > 0 && (
          <div className="mt-3 space-y-1 border-t pt-2">
            {note.custom_fields.map((field, index) => (
              <div key={index} className="grid grid-cols-2 gap-1 text-sm">
                <span className="font-medium text-gray-700">{field.field_name}:</span>
                <span>{field.field_value || "-"}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
      
      <CardFooter className="flex flex-col items-start pt-0 space-y-2">
        <div className="w-full flex flex-wrap items-center gap-y-1 gap-x-3 text-xs text-gray-500">
          {note.consultant_name && (
            <div className="flex items-center gap-1">
              <UserCircle className="h-3 w-3" />
              <span>{note.consultant_name}</span>
            </div>
          )}
          
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
          
          {note.due_date && (
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              <span>{format(new Date(note.due_date), "dd MMM yyyy", { locale: ptBR })}</span>
            </div>
          )}
        </div>
        
        <div className="pt-2 w-full flex justify-between">
          <NoteForm
            initialData={note}
            onSave={onUpdate}
          />
          <Button 
            variant="outline" 
            className="border-red-200 hover:border-red-500 hover:text-red-600"
            onClick={() => onDelete(note.id)}
          >
            Excluir
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};

export default NoteCard;
