
import React, { useState, useEffect, useCallback } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { Note, updateNoteStatus } from '@/integrations/supabase/notes';
import CompactNoteCard from './CompactNoteCard';
import KanbanColumn from './KanbanColumn';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface NotesKanbanProps {
  notes: Note[];
  onUpdateNote: (note: Note) => Promise<void>;
  onDeleteNote: (id: string) => Promise<void>;
  onStatusChanged: (noteId: string, newStatus: Note['status']) => void;
}

interface KanbanColumnType {
  id: string;
  title: string;
  bgColor: string;
  order: number;
}

const DEFAULT_COLUMNS: KanbanColumnType[] = [
  {
    id: 'a_fazer',
    title: 'A Fazer',
    bgColor: 'bg-blue-50',
    order: 0,
  },
  {
    id: 'em_producao',
    title: 'Em Produção',
    bgColor: 'bg-yellow-50',
    order: 1,
  },
  {
    id: 'finalizado',
    title: 'Finalizado',
    bgColor: 'bg-green-50',
    order: 2,
  },
  {
    id: 'cancelado',
    title: 'Cancelado',
    bgColor: 'bg-red-50',
    order: 3,
  },
];

const NotesKanban: React.FC<NotesKanbanProps> = ({
  notes,
  onUpdateNote,
  onDeleteNote,
  onStatusChanged,
}) => {
  const [columns, setColumns] = useState<KanbanColumnType[]>(DEFAULT_COLUMNS);
  const [notesByColumn, setNotesByColumn] = useState<Record<string, Note[]>>({});
  const [showAddColumn, setShowAddColumn] = useState(false);
  const [newColumnTitle, setNewColumnTitle] = useState('');

  // Organiza as notas em colunas de acordo com o status
  useEffect(() => {
    const newNotesByColumn: Record<string, Note[]> = {};
    
    columns.forEach(column => {
      newNotesByColumn[column.id] = [];
    });

    notes.forEach(note => {
      if (note.status in newNotesByColumn) {
        newNotesByColumn[note.status].push(note);
      }
    });

    setNotesByColumn(newNotesByColumn);
  }, [notes, columns]);

  // Adicionar nova coluna
  const handleAddColumn = () => {
    if (newColumnTitle.trim()) {
      const newColumn: KanbanColumnType = {
        id: `custom_${Date.now()}`,
        title: newColumnTitle.trim(),
        bgColor: 'bg-gray-50',
        order: columns.length,
      };
      setColumns([...columns, newColumn]);
      setNewColumnTitle('');
      setShowAddColumn(false);
      toast.success('Coluna adicionada com sucesso!');
    }
  };

  // Atualizar coluna
  const handleUpdateColumn = (id: string, title: string) => {
    setColumns(columns.map(col => 
      col.id === id ? { ...col, title } : col
    ));
    toast.success('Coluna atualizada com sucesso!');
  };

  // Excluir coluna
  const handleDeleteColumn = (id: string) => {
    // Não permitir excluir colunas padrão
    if (['a_fazer', 'em_producao', 'finalizado', 'cancelado'].includes(id)) {
      toast.error('Não é possível excluir colunas padrão do sistema');
      return;
    }

    if (notesByColumn[id] && notesByColumn[id].length > 0) {
      toast.error('Não é possível excluir uma coluna que contém tarefas');
      return;
    }

    setColumns(columns.filter(col => col.id !== id));
    toast.success('Coluna excluída com sucesso!');
  };

  // Manipula o evento de arrastar e soltar
  const handleDragEnd = useCallback(async (result: DropResult) => {
    const { source, destination, draggableId, type } = result;
    
    // Se não houver destino
    if (!destination) return;

    // Se for arrastar colunas
    if (type === 'COLUMN') {
      const newColumns = Array.from(columns);
      const [removed] = newColumns.splice(source.index, 1);
      newColumns.splice(destination.index, 0, removed);
      
      // Atualizar ordem
      const updatedColumns = newColumns.map((col, index) => ({
        ...col,
        order: index
      }));
      
      setColumns(updatedColumns);
      return;
    }

    // Se não houver mudança de posição
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
      const newColumnNotes = Array.from(notesByColumn[sourceColumn]);
      const [removed] = newColumnNotes.splice(source.index, 1);
      newColumnNotes.splice(destination.index, 0, removed);
      
      setNotesByColumn({
        ...notesByColumn,
        [sourceColumn]: newColumnNotes,
      });
      return;
    }
    
    // Movendo entre colunas (alterando status)
    const sourceNotes = Array.from(notesByColumn[sourceColumn]);
    const destNotes = Array.from(notesByColumn[destColumn]);
    const [removed] = sourceNotes.splice(source.index, 1);
    
    // Criar uma nova nota com o status atualizado
    const updatedNote = { ...removed, status: destColumn };
    
    // Atualizar o estado local imediatamente para UX mais responsiva
    destNotes.splice(destination.index, 0, updatedNote);
    
    setNotesByColumn({
      ...notesByColumn,
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
      setNotesByColumn({
        ...notesByColumn,
        [sourceColumn]: [...notesByColumn[sourceColumn], removed],
        [destColumn]: notesByColumn[destColumn].filter(note => note.id !== draggableId),
      });
    }
  }, [notesByColumn, onStatusChanged, notes, columns]);

  const sortedColumns = [...columns].sort((a, b) => a.order - b.order);

  return (
    <div className="h-full">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-medium">Kanban de Tarefas</h3>
        
        <Dialog open={showAddColumn} onOpenChange={setShowAddColumn}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Coluna
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Adicionar Nova Coluna</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Input
                placeholder="Nome da coluna"
                value={newColumnTitle}
                onChange={(e) => setNewColumnTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddColumn();
                }}
                autoFocus
              />
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowAddColumn(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleAddColumn} disabled={!newColumnTitle.trim()}>
                  Adicionar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="board" type="COLUMN" direction="horizontal">
          {(provided) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className="flex gap-4 h-full overflow-x-auto pb-4"
            >
              {sortedColumns.map((column, index) => (
                <Draggable key={column.id} draggableId={column.id} index={index}>
                  {(provided) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                    >
                      <KanbanColumn
                        id={column.id}
                        title={column.title}
                        bgColor={column.bgColor}
                        notes={notesByColumn[column.id] || []}
                        onUpdateColumn={handleUpdateColumn}
                        onDeleteColumn={handleDeleteColumn}
                      >
                        {(notesByColumn[column.id] || []).map((note, noteIndex) => (
                          <Draggable key={note.id} draggableId={note.id} index={noteIndex}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className={`transition-shadow ${
                                  snapshot.isDragging ? 'shadow-lg' : ''
                                }`}
                              >
                                <CompactNoteCard
                                  note={note}
                                  onUpdate={onUpdateNote}
                                  onDelete={onDeleteNote}
                                  isDraggable={true}
                                />
                              </div>
                            )}
                          </Draggable>
                        ))}
                      </KanbanColumn>
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  );
};

export default NotesKanban;
