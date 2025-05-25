
import React, { useState, useEffect, useCallback } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { Note, updateNoteStatus } from '@/integrations/supabase/notes';
import { 
  KanbanColumn as KanbanColumnType,
  fetchKanbanColumns,
  createKanbanColumn,
  updateKanbanColumn,
  deleteKanbanColumn,
  updateColumnOrder,
  getRandomColumnColor
} from '@/integrations/supabase/kanban-columns';
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
import { useQuery, useQueryClient } from '@tanstack/react-query';

interface NotesKanbanProps {
  notes: Note[];
  onUpdateNote: (note: Note) => Promise<void>;
  onDeleteNote: (id: string) => Promise<void>;
  onStatusChanged: (noteId: string, newStatus: Note['status']) => void;
}

const NotesKanban: React.FC<NotesKanbanProps> = ({
  notes,
  onUpdateNote,
  onDeleteNote,
  onStatusChanged,
}) => {
  const queryClient = useQueryClient();
  const [notesByColumn, setNotesByColumn] = useState<Record<string, Note[]>>({});
  const [showAddColumn, setShowAddColumn] = useState(false);
  const [newColumnTitle, setNewColumnTitle] = useState('');

  // Buscar colunas do banco de dados
  const { 
    data: columns = [], 
    isLoading: columnsLoading,
    refetch: refetchColumns 
  } = useQuery({
    queryKey: ['kanban-columns'],
    queryFn: fetchKanbanColumns,
  });

  // Organiza as notas em colunas de acordo com o status
  useEffect(() => {
    const newNotesByColumn: Record<string, Note[]> = {};
    
    columns.forEach(column => {
      newNotesByColumn[column.column_id] = [];
    });

    notes.forEach(note => {
      if (note.status in newNotesByColumn) {
        newNotesByColumn[note.status].push(note);
      }
    });

    setNotesByColumn(newNotesByColumn);
  }, [notes, columns]);

  // Adicionar nova coluna
  const handleAddColumn = async () => {
    if (newColumnTitle.trim()) {
      try {
        const newColumn: Omit<KanbanColumnType, 'id' | 'created_at' | 'updated_at'> = {
          column_id: `custom_${Date.now()}`,
          title: newColumnTitle.trim(),
          bg_color: getRandomColumnColor(),
          order_index: columns.length,
          is_default: false,
        };
        
        await createKanbanColumn(newColumn);
        await refetchColumns();
        setNewColumnTitle('');
        setShowAddColumn(false);
        toast.success('Coluna adicionada com sucesso!');
      } catch (error) {
        console.error('Erro ao criar coluna:', error);
        toast.error('Erro ao criar coluna.');
      }
    }
  };

  // Atualizar coluna
  const handleUpdateColumn = async (columnId: string, title: string) => {
    try {
      const column = columns.find(col => col.column_id === columnId);
      if (!column) {
        console.error('Coluna não encontrada:', columnId);
        return;
      }

      await updateKanbanColumn(column.id, { title });
      await refetchColumns();
      toast.success('Coluna atualizada com sucesso!');
    } catch (error) {
      console.error('Erro ao atualizar coluna:', error);
      toast.error('Erro ao atualizar coluna.');
    }
  };

  // Atualizar cor da coluna
  const handleUpdateColumnColor = async (columnId: string, color: string) => {
    try {
      console.log('Atualizando cor da coluna:', columnId, 'para:', color);
      const column = columns.find(col => col.column_id === columnId);
      if (!column) {
        console.error('Coluna não encontrada para atualizar cor:', columnId);
        toast.error('Coluna não encontrada.');
        return;
      }

      await updateKanbanColumn(column.id, { bg_color: color });
      await refetchColumns();
      toast.success('Cor da coluna atualizada!');
    } catch (error) {
      console.error('Erro ao atualizar cor da coluna:', error);
      toast.error('Erro ao atualizar cor da coluna.');
    }
  };

  // Excluir coluna
  const handleDeleteColumn = async (columnId: string) => {
    try {
      const column = columns.find(col => col.column_id === columnId);
      if (!column) {
        console.error('Coluna não encontrada para deletar:', columnId);
        return;
      }

      // Não permitir excluir colunas padrão
      if (column.is_default) {
        toast.error('Não é possível excluir colunas padrão do sistema');
        return;
      }

      if (notesByColumn[columnId] && notesByColumn[columnId].length > 0) {
        toast.error('Não é possível excluir uma coluna que contém tarefas');
        return;
      }

      await deleteKanbanColumn(column.id);
      await refetchColumns();
      toast.success('Coluna excluída com sucesso!');
    } catch (error) {
      console.error('Erro ao excluir coluna:', error);
      toast.error('Erro ao excluir coluna.');
    }
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
      
      // Atualizar ordem no banco
      try {
        const updates = newColumns.map((col, index) => ({
          id: col.id,
          order_index: index
        }));
        
        await updateColumnOrder(updates);
        await refetchColumns();
      } catch (error) {
        console.error('Erro ao atualizar ordem das colunas:', error);
        toast.error('Erro ao atualizar ordem das colunas.');
      }
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
  }, [notesByColumn, onStatusChanged, notes, columns, refetchColumns]);

  if (columnsLoading) {
    return <div className="text-center py-8">Carregando colunas...</div>;
  }

  const sortedColumns = [...columns].sort((a, b) => a.order_index - b.order_index);

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
                        id={column.column_id}
                        title={column.title}
                        bgColor={column.bg_color}
                        notes={notesByColumn[column.column_id] || []}
                        onUpdateColumn={handleUpdateColumn}
                        onDeleteColumn={handleDeleteColumn}
                        onUpdateColumnColor={handleUpdateColumnColor}
                      >
                        {(notesByColumn[column.column_id] || []).map((note, noteIndex) => (
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
