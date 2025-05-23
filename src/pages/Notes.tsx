import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { LayoutGrid, List, Kanban, Plus, Filter, Calendar as CalendarIcon, BarChart3 } from 'lucide-react';
import { toast } from 'sonner';
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import { 
  fetchNotes, 
  createNote, 
  updateNote, 
  deleteNote, 
  Note 
} from '@/integrations/supabase/notes';

import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';

import NotesGrid from '@/components/notes/NotesGrid';
import NotesExpandedTable from '@/components/notes/NotesExpandedTable';
import NotesKanban from '@/components/notes/NotesKanban';
import NotesGantt from '@/components/notes/NotesGantt';
import NoteForm from '@/components/notes/NoteForm';
import NoteFormSelect from '@/components/notes/NoteFormSelect';

const NotesPage: React.FC = () => {
  const [viewMode, setViewMode] = useState<string>('lista');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [consultantFilter, setConsultantFilter] = useState<string>('');
  const [serviceFilter, setServiceFilter] = useState<string>('');
  const [clientFilter, setClientFilter] = useState<string>('');
  const [dateFilter, setDateFilter] = useState<string>('');
  const [customDateFrom, setCustomDateFrom] = useState<Date>();
  const [customDateTo, setCustomDateTo] = useState<Date>();
  const [consultants, setConsultants] = useState<Array<{id: string, name: string}>>([]);
  const [services, setServices] = useState<Array<{id: string, name: string}>>([]);
  const [clients, setClients] = useState<Array<{id: string, name: string}>>([]);

  // Fetch consultants, services, and clients for filters
  useEffect(() => {
    const fetchFilterOptions = async () => {
      const [consultantsRes, servicesRes, clientsRes] = await Promise.all([
        supabase.from('consultants').select('id, name').order('name'),
        supabase.from('services').select('id, name').order('name'),
        supabase.from('clients').select('id, name').order('name')
      ]);

      if (consultantsRes.data) setConsultants(consultantsRes.data);
      if (servicesRes.data) setServices(servicesRes.data);
      if (clientsRes.data) setClients(clientsRes.data);
    };

    fetchFilterOptions();
  }, []);

  // Buscar tarefas
  const { 
    data: notes = [], 
    isLoading, 
    isError, 
    refetch 
  } = useQuery({
    queryKey: ['notes'],
    queryFn: fetchNotes,
  });

  // Filtrar tarefas
  const filteredNotes = notes.filter(note => {
    const matchesSearch = searchTerm === '' || 
      note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (note.content && note.content.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (note.checklists && note.checklists.some(checklist => 
        checklist.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (checklist.description && checklist.description.toLowerCase().includes(searchTerm.toLowerCase()))
      ));
    
    const matchesStatus = statusFilter === '' || note.status === statusFilter;
    const matchesConsultant = consultantFilter === '' || 
      (note.consultant_names && note.consultant_names.some(name => 
        consultants.find(c => c.name === name)?.id === consultantFilter
      ));
    const matchesService = serviceFilter === '' || note.service_id === serviceFilter;
    const matchesClient = clientFilter === '' || note.client_id === clientFilter;
    
    // Date filtering
    let matchesDate = true;
    if (dateFilter) {
      const today = new Date();
      const noteDate = note.due_date ? new Date(note.due_date) : null;
      
      switch (dateFilter) {
        case 'hoje':
          matchesDate = noteDate ? isWithinInterval(noteDate, {
            start: startOfDay(today),
            end: endOfDay(today)
          }) : false;
          break;
        case 'esta_semana':
          matchesDate = noteDate ? isWithinInterval(noteDate, {
            start: startOfWeek(today, { locale: ptBR }),
            end: endOfWeek(today, { locale: ptBR })
          }) : false;
          break;
        case 'este_mes':
          matchesDate = noteDate ? isWithinInterval(noteDate, {
            start: startOfMonth(today),
            end: endOfMonth(today)
          }) : false;
          break;
        case 'customizado':
          if (customDateFrom && customDateTo && noteDate) {
            matchesDate = isWithinInterval(noteDate, {
              start: startOfDay(customDateFrom),
              end: endOfDay(customDateTo)
            });
          } else {
            matchesDate = true;
          }
          break;
        default:
          matchesDate = true;
      }
    }
    
    return matchesSearch && matchesStatus && matchesConsultant && matchesService && matchesClient && matchesDate;
  });

  // Handlers
  const handleCreateNote = async (noteData: any) => {
    try {
      await createNote(noteData);
      refetch();
      toast.success("Tarefa criada com sucesso!");
    } catch (error) {
      console.error("Erro ao criar tarefa:", error);
      toast.error("Erro ao criar tarefa.");
    }
  };

  const handleUpdateNote = async (noteData: any) => {
    try {
      await updateNote(noteData.id, noteData);
      refetch();
      toast.success("Tarefa atualizada com sucesso!");
    } catch (error) {
      console.error("Erro ao atualizar tarefa:", error);
      toast.error("Erro ao atualizar tarefa.");
    }
  };

  const handleDeleteNote = async (id: string) => {
    if (window.confirm("Tem certeza que deseja excluir esta tarefa?")) {
      try {
        await deleteNote(id);
        refetch();
        toast.success("Tarefa excluída com sucesso!");
      } catch (error) {
        console.error("Erro ao excluir tarefa:", error);
        toast.error("Erro ao excluir tarefa.");
      }
    }
  };

  const handleNoteStatusChanged = (noteId: string, newStatus: Note['status']) => {
    refetch();
  };

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('');
    setConsultantFilter('');
    setServiceFilter('');
    setClientFilter('');
    setDateFilter('');
    setCustomDateFrom(undefined);
    setCustomDateTo(undefined);
  };

  const handleConsultantFilterChange = (value: string | string[]) => {
    setConsultantFilter(Array.isArray(value) ? value[0] || '' : value);
  };

  const handleServiceFilterChange = (value: string | string[]) => {
    setServiceFilter(Array.isArray(value) ? value[0] || '' : value);
  };

  const handleClientFilterChange = (value: string | string[]) => {
    setClientFilter(Array.isArray(value) ? value[0] || '' : value);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Tarefas</h1>
        <div className="flex items-center">
          <NoteForm onSave={handleCreateNote}>
            <Button size="sm" variant="outline" className="ml-auto gap-1">
              <Plus className="h-4 w-4" />
              <span>Nova</span>
            </Button>
          </NoteForm>
        </div>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            <Input
              placeholder="Buscar tarefas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos os status</SelectItem>
                <SelectItem value="a_fazer">A fazer</SelectItem>
                <SelectItem value="em_producao">Em produção</SelectItem>
                <SelectItem value="finalizado">Finalizado</SelectItem>
                <SelectItem value="cancelado">Cancelado</SelectItem>
              </SelectContent>
            </Select>

            <NoteFormSelect
              options={consultants}
              value={consultantFilter}
              onValueChange={handleConsultantFilterChange}
              placeholder="Consultor"
              searchPlaceholder="Buscar consultor..."
              emptyText="Nenhum consultor encontrado."
            />

            <NoteFormSelect
              options={services}
              value={serviceFilter}
              onValueChange={handleServiceFilterChange}
              placeholder="Serviço"
              searchPlaceholder="Buscar serviço..."
              emptyText="Nenhum serviço encontrado."
            />

            <NoteFormSelect
              options={clients}
              value={clientFilter}
              onValueChange={handleClientFilterChange}
              placeholder="Cliente"
              searchPlaceholder="Buscar cliente..."
              emptyText="Nenhum cliente encontrado."
            />

            <div className="flex gap-2">
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Data" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todas as datas</SelectItem>
                  <SelectItem value="hoje">Hoje</SelectItem>
                  <SelectItem value="esta_semana">Esta semana</SelectItem>
                  <SelectItem value="este_mes">Este mês</SelectItem>
                  <SelectItem value="customizado">Período customizado</SelectItem>
                </SelectContent>
              </Select>

              {dateFilter === 'customizado' && (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm">
                      <CalendarIcon className="h-4 w-4" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <div className="p-3 space-y-3">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">De:</label>
                        <Calendar
                          mode="single"
                          selected={customDateFrom}
                          onSelect={setCustomDateFrom}
                          locale={ptBR}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Até:</label>
                        <Calendar
                          mode="single"
                          selected={customDateTo}
                          onSelect={setCustomDateTo}
                          locale={ptBR}
                        />
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              )}
            </div>
          </div>

          <div className="flex justify-between items-center mt-4">
            <div className="text-sm text-muted-foreground">
              {filteredNotes.length} tarefa(s) encontrada(s)
            </div>
            <Button variant="outline" size="sm" onClick={clearFilters}>
              <Filter className="h-4 w-4 mr-2" />
              Limpar filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Tabs defaultValue={viewMode} onValueChange={setViewMode} className="w-auto">
          <TabsList>
            <TabsTrigger value="cards">
              <LayoutGrid className="h-4 w-4 mr-2" />
              Cards
            </TabsTrigger>
            <TabsTrigger value="lista">
              <List className="h-4 w-4 mr-2" />
              Lista
            </TabsTrigger>
            <TabsTrigger value="kanban">
              <Kanban className="h-4 w-4 mr-2" />
              Kanban
            </TabsTrigger>
            <TabsTrigger value="gantt">
              <BarChart3 className="h-4 w-4 mr-2" />
              Gantt
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <Card className="overflow-hidden">
        <CardContent className={viewMode === 'kanban' ? 'p-4 pt-4' : 'p-6 pt-6'}>
          {isLoading ? (
            <div className="text-center py-8">Carregando tarefas...</div>
          ) : isError ? (
            <div className="text-center py-8 text-red-500">
              Erro ao carregar tarefas. Por favor, tente novamente.
            </div>
          ) : (
            <>
              {viewMode === 'cards' && (
                <NotesGrid
                  notes={filteredNotes}
                  onUpdateNote={handleUpdateNote}
                  onDeleteNote={handleDeleteNote}
                />
              )}
              {viewMode === 'lista' && (
                <NotesExpandedTable
                  notes={filteredNotes}
                  onUpdateNote={handleUpdateNote}
                  onDeleteNote={handleDeleteNote}
                />
              )}
              {viewMode === 'kanban' && (
                <div className="h-[calc(100vh-350px)]">
                  <NotesKanban
                    notes={notes}
                    onUpdateNote={handleUpdateNote}
                    onDeleteNote={handleDeleteNote}
                    onStatusChanged={handleNoteStatusChanged}
                  />
                </div>
              )}
              {viewMode === 'gantt' && (
                <NotesGantt
                  notes={filteredNotes}
                  onUpdateNote={handleUpdateNote}
                  onDeleteNote={handleDeleteNote}
                />
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default NotesPage;
