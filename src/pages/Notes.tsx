
import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { LayoutGrid, ListIcon, Kanban, Plus } from 'lucide-react';
import { toast } from 'sonner';

import { 
  fetchNotes, 
  createNote, 
  updateNote, 
  deleteNote, 
  Note 
} from '@/integrations/supabase/notes';

import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import NotesGrid from '@/components/notes/NotesGrid';
import NotesTable from '@/components/notes/NotesTable';
import NotesKanban from '@/components/notes/NotesKanban';
import NoteForm from '@/components/notes/NoteForm';

const NotesPage: React.FC = () => {
  const [viewMode, setViewMode] = useState<string>('grid');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  // Buscar anotações
  const { 
    data: notes = [], 
    isLoading, 
    isError, 
    refetch 
  } = useQuery({
    queryKey: ['notes'],
    queryFn: fetchNotes,
  });

  // Filtrar anotações
  const filteredNotes = notes.filter(note => {
    const matchesSearch = searchTerm === '' || 
      note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (note.content && note.content.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === '' || note.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Handlers
  const handleCreateNote = async (noteData: any) => {
    try {
      await createNote(noteData);
      refetch();
      toast.success("Anotação criada com sucesso!");
    } catch (error) {
      console.error("Erro ao criar anotação:", error);
      toast.error("Erro ao criar anotação.");
    }
  };

  const handleUpdateNote = async (noteData: any) => {
    try {
      await updateNote(noteData.id, noteData);
      refetch();
      toast.success("Anotação atualizada com sucesso!");
    } catch (error) {
      console.error("Erro ao atualizar anotação:", error);
      toast.error("Erro ao atualizar anotação.");
    }
  };

  const handleDeleteNote = async (id: string) => {
    if (window.confirm("Tem certeza que deseja excluir esta anotação?")) {
      try {
        await deleteNote(id);
        refetch();
        toast.success("Anotação excluída com sucesso!");
      } catch (error) {
        console.error("Erro ao excluir anotação:", error);
        toast.error("Erro ao excluir anotação.");
      }
    }
  };

  const handleNoteStatusChanged = (noteId: string, newStatus: Note['status']) => {
    // Como já estamos atualizando no NotesKanban, apenas refetchamos para manter tudo sincronizado
    refetch();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Anotações</h1>
        <div className="flex items-center">
          <NoteForm onSave={handleCreateNote}>
            <Button size="sm" variant="outline" className="ml-auto gap-1">
              <Plus className="h-4 w-4" />
              <span>Nova</span>
            </Button>
          </NoteForm>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 md:items-center justify-between">
        <div className="flex gap-2">
          <Input
            placeholder="Buscar anotações..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full md:w-auto max-w-sm"
          />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filtrar por status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todos os status</SelectItem>
              <SelectItem value="a_fazer">A fazer</SelectItem>
              <SelectItem value="em_producao">Em produção</SelectItem>
              <SelectItem value="finalizado">Finalizado</SelectItem>
              <SelectItem value="cancelado">Cancelado</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Tabs defaultValue={viewMode} onValueChange={setViewMode} className="w-full md:w-auto">
          <TabsList>
            <TabsTrigger value="grid">
              <LayoutGrid className="h-4 w-4 mr-2" />
              Notas
            </TabsTrigger>
            <TabsTrigger value="table">
              <ListIcon className="h-4 w-4 mr-2" />
              Tabela
            </TabsTrigger>
            <TabsTrigger value="kanban">
              <Kanban className="h-4 w-4 mr-2" />
              Kanban
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <Card className="overflow-hidden">
        <CardContent className={viewMode === 'kanban' ? 'p-4 pt-4' : 'p-6 pt-6'}>
          {isLoading ? (
            <div className="text-center py-8">Carregando anotações...</div>
          ) : isError ? (
            <div className="text-center py-8 text-red-500">
              Erro ao carregar anotações. Por favor, tente novamente.
            </div>
          ) : (
            <>
              {viewMode === 'grid' && (
                <NotesGrid
                  notes={filteredNotes}
                  onUpdateNote={handleUpdateNote}
                  onDeleteNote={handleDeleteNote}
                />
              )}
              {viewMode === 'table' && (
                <NotesTable
                  notes={filteredNotes}
                  onUpdateNote={handleUpdateNote}
                  onDeleteNote={handleDeleteNote}
                />
              )}
              {viewMode === 'kanban' && (
                <div className="h-[calc(100vh-350px)]">
                  <NotesKanban
                    notes={notes} // Aqui usamos todas as notas para o kanban, não as filtradas
                    onUpdateNote={handleUpdateNote}
                    onDeleteNote={handleDeleteNote}
                    onStatusChanged={handleNoteStatusChanged}
                  />
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default NotesPage;
