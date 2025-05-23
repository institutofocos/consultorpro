
import React from 'react';
import { Note } from '@/integrations/supabase/notes';
import NoteCard from './NoteCard';

interface NotesGridProps {
  notes: Note[];
  onUpdateNote: (note: Note) => Promise<void>;
  onDeleteNote: (id: string) => Promise<void>;
}

const NotesGrid: React.FC<NotesGridProps> = ({
  notes,
  onUpdateNote,
  onDeleteNote,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {notes.length > 0 ? (
        notes.map((note) => (
          <NoteCard 
            key={note.id} 
            note={note} 
            onUpdate={onUpdateNote} 
            onDelete={onDeleteNote}
          />
        ))
      ) : (
        <div className="col-span-full text-center py-8 text-gray-500">
          Nenhuma anotação encontrada.
        </div>
      )}
    </div>
  );
};

export default NotesGrid;
