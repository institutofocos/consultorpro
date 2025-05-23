
import React, { useState, useEffect, useCallback } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { Note, updateNoteStatus } from '@/integrations/supabase/notes';
import NoteCard from './NoteCard';
import { toast } from 'sonner';
import { FileText, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface NotesKanbanProps {
  notes: Note[];
  onUpdateNote: (note: Note) => Promise<void>;
  onDeleteNote: (id: string) => Promise<void>;
  onStatusChanged: (noteId: string, newStatus: Note['status']) => void;
}

const COLUMNS = {
  'a_fazer': {
    id: 'a_fazer',
    title: 'A Fazer',
    bgColor: 'bg-blue-50',
  },
  'em_producao': {
    id: 'em_producao',
    title: 'Em Produção',
    bgColor: 'bg-yellow-50',
  },
  'finalizado': {
    id: 'finalizado',
    title: 'Finalizado',
    bgColor: 'bg-green-50',
  },
  'cancelado': {
    id: 'cancelado',
    title: 'Cancelado',
    bgColor: 'bg-red-50',
  },
};

const NotesKanban: React.FC<NotesKanbanProps> = ({
  notes,
  onUpdateNote,
  onDeleteNote,
  onStatusChanged,
}) => {
  const [columns, setColumns] = useState<Record<string, Note[]>>({
    'a_fazer': [],
    'em_producao': [],
    'finalizado': [],
    'cancelado': [],
  });
  const [openDescriptions, setOpenDescriptions] = useState<{[id: string]: boolean}>({});

  // Organiza as notas em colunas de acordo com o status
  useEffect(() => {
    const newColumns: Record<string, Note[]> = {
      'a_fazer': [],
      'em_producao': [],
      'finalizado': [],
      'cancelado': [],
    };

    notes.forEach(note => {
      if (note.status in newColumns) {
        newColumns[note.status].push(note);
      }
    });

    setColumns(newColumns);
  }, [notes]);

  const toggleDescription = (id: string, state?: boolean) => {
    setOpenDescriptions(prev => ({
      ...prev,
      [id]: state !== undefined ? state : !prev[id]
    }));
  };

  // Manipula o evento de arrastar e soltar
  const handleDragEnd = useCallback(async (result: DropResult) => {
    const { source, destination, draggableId } = result;
    
    // Se não houver destino ou se o destino for o mesmo que a origem na mesma posição
    if (!destination) return;
    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) return;

    const sourceColumn = source.droppableId as Note['status'];
    const destColumn = destination.droppableId as Note['status'];
    
    // Check for linked tasks before dropping into "finalizado"
    if (destColumn === "finalizado") {
      const draggedNote = notes.find(note => note.id === draggableId);
      if (draggedNote && draggedNote.linked_task_id) {
        const linkedTask = draggedNote.linked_task;
        if (linkedTask && linkedTask.status !== 'finalizado') {
          toast.error(`Não é possível finalizar "${draggedNote.title}" antes que "${linkedTask.title}" seja concluída`);
          return;
        }
      }
    }
    
    // Se a coluna de origem e destino for a mesma, apenas reordenação
    if (sourceColumn === destColumn) {
      const newColumnNotes = Array.from(columns[sourceColumn]);
      const [removed] = newColumnNotes.splice(source.index, 1);
      newColumnNotes.splice(destination.index, 0, removed);
      
      setColumns({
        ...columns,
        [sourceColumn]: newColumnNotes,
      });
      return;
    }
    
    // Movendo entre colunas (alterando status)
    const sourceNotes = Array.from(columns[sourceColumn]);
    const destNotes = Array.from(columns[destColumn]);
    const [removed] = sourceNotes.splice(source.index, 1);
    
    // Criar uma nova nota com o status atualizado
    const updatedNote = { ...removed, status: destColumn };
    
    // Atualizar o estado local imediatamente para UX mais responsiva
    destNotes.splice(destination.index, 0, updatedNote);
    
    setColumns({
      ...columns,
      [sourceColumn]: sourceNotes,
      [destColumn]: destNotes,
    });
    
    try {
      // Atualizar no banco de dados
      await updateNoteStatus(draggableId, destColumn);
      
      // Notificar componente pai da alteração
      onStatusChanged(draggableId, destColumn);
      
      toast.success("Status atualizado com sucesso!");
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
      toast.error("Erro ao atualizar status da nota.");
      
      // Reverter alterações em caso de erro
      setColumns({
        ...columns,
        [sourceColumn]: [...columns[sourceColumn], removed],
        [destColumn]: columns[destColumn].filter(note => note.id !== draggableId),
      });
    }
  }, [columns, onStatusChanged, notes]);

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="flex gap-4 h-full overflow-x-auto pb-4">
        {Object.values(COLUMNS).map((column) => (
          <div 
            key={column.id}
            className="flex flex-col min-w-[300px] w-1/4"
          >
            <h3 className={`p-3 rounded-t-md font-medium ${column.bgColor}`}>
              {column.title} ({columns[column.id]?.length || 0})
            </h3>
            
            <Droppable droppableId={column.id}>
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={`flex-grow p-2 rounded-b-md ${column.bgColor} min-h-[300px] transition-colors ${
                    snapshot.isDraggingOver ? 'bg-opacity-80' : ''
                  }`}
                >
                  <div className="space-y-3">
                    {columns[column.id]?.map((note, index) => (
                      <Draggable key={note.id} draggableId={note.id} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={`transition-shadow ${
                              snapshot.isDragging ? 'shadow-lg' : ''
                            }`}
                          >
                            <div className="relative">
                              {note.content && (
                                <Dialog 
                                  open={openDescriptions[note.id]} 
                                  onOpenChange={(state) => toggleDescription(note.id, state)}
                                >
                                  <Button 
                                    variant="outline"
                                    size="sm"
                                    className="absolute -top-1 -right-1 h-6 w-6 p-0 rounded-full bg-primary/20 hover:bg-primary/30 text-primary z-10"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleDescription(note.id);
                                    }}
                                  >
                                    <Info className="h-3 w-3" />
                                  </Button>
                                  <DialogContent>
                                    <DialogHeader>
                                      <DialogTitle>{note.title}</DialogTitle>
                                    </DialogHeader>
                                    <div className="whitespace-pre-wrap">{note.content}</div>
                                  </DialogContent>
                                </Dialog>
                              )}
                              <NoteCard
                                note={note}
                                onUpdate={onUpdateNote}
                                onDelete={onDeleteNote}
                                isDraggable={true}
                              />
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                </div>
              )}
            </Droppable>
          </div>
        ))}
      </div>
    </DragDropContext>
  );
};

export default NotesKanban;
