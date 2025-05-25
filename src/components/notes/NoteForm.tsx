
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarIcon, Plus, Trash2, MessageCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { fetchConsultants } from '@/integrations/supabase/consultants';
import { fetchClients } from '@/integrations/supabase/clients';
import { fetchServices } from '@/integrations/supabase/services';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import NoteFormSelect from './NoteFormSelect';
import ChecklistItem from './ChecklistItem';
import { createChecklist, NoteChecklist } from '@/integrations/supabase/notes';
import { toast } from 'sonner';

export interface NoteFormProps {
  onSave: (data: any) => void;
  initialData?: any;
  children?: React.ReactNode;
  onClose?: () => void;
}

const formSchema = z.object({
  title: z.string().optional(),
  content: z.string().optional(),
  status: z.string().default("a_fazer"),
  color: z.string().optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  due_date: z.string().optional(),
  client_id: z.string().optional(),
  service_id: z.string().optional(),
  consultant_ids: z.array(z.string()).optional(),
  tag_ids: z.array(z.string()).optional(),
  has_internal_chat: z.boolean().default(false),
  checklists: z.array(z.object({
    title: z.string(),
    description: z.string().optional(),
    due_date: z.string().optional(),
    responsible_consultant_id: z.string().optional(),
    completed: z.boolean().default(false)
  })).optional()
});

const NoteForm: React.FC<NoteFormProps> = ({ onSave, initialData, children, onClose }) => {
  const [open, setOpen] = useState(false);
  const [newChecklist, setNewChecklist] = useState({ title: '', description: '', due_date: '', responsible_consultant_id: '' });
  const [checklistsData, setChecklistsData] = useState<NoteChecklist[]>([]);
  
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      content: "",
      status: "a_fazer",
      color: "#ffffff",
      start_date: "",
      end_date: "",
      due_date: "",
      client_id: "",
      service_id: "",
      consultant_ids: [],
      tag_ids: [],
      has_internal_chat: false,
      checklists: [],
      ...initialData
    }
  });

  // Buscar dados auxiliares
  const { data: consultants = [] } = useQuery({
    queryKey: ['consultants'],
    queryFn: fetchConsultants,
  });

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: fetchClients,
  });

  const { data: services = [] } = useQuery({
    queryKey: ['services'],
    queryFn: fetchServices,
  });

  const { data: tags = [] } = useQuery({
    queryKey: ['tags'],
    queryFn: async () => {
      const { data } = await supabase.from('tags').select('*');
      return data || [];
    },
  });

  useEffect(() => {
    if (initialData && open) {
      form.reset({
        ...initialData,
        start_date: initialData.start_date || "",
        end_date: initialData.end_date || "",
        due_date: initialData.due_date || "",
        consultant_ids: initialData.consultant_ids || [],
        tag_ids: initialData.tag_ids || [],
        checklists: initialData.checklists || []
      });
      setChecklistsData(initialData.checklists || []);
    }
  }, [initialData, open, form]);

  const handleSubmit = async (data: any) => {
    try {
      // Converter datas se fornecidas
      const formattedData = {
        ...data,
        start_date: data.start_date ? format(new Date(data.start_date), 'yyyy-MM-dd') : undefined,
        end_date: data.end_date ? format(new Date(data.end_date), 'yyyy-MM-dd') : undefined,
        due_date: data.due_date ? format(new Date(data.due_date), 'yyyy-MM-dd') : undefined,
        checklists: checklistsData
      };
      
      await onSave(formattedData);
      setOpen(false);
      form.reset();
      setChecklistsData([]);
      if (onClose) onClose();
    } catch (error: any) {
      toast.error(error.message || 'Erro ao salvar anotação');
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen && onClose) onClose();
  };

  const addChecklist = async () => {
    if (newChecklist.title.trim()) {
      if (initialData?.id) {
        // Se estamos editando, criar checklist diretamente no banco
        const checklistData = {
          ...newChecklist,
          note_id: initialData.id,
          completed: false
        };
        
        const result = await createChecklist(checklistData);
        if (result) {
          setChecklistsData(prev => [...prev, result]);
          toast.success('Checklist adicionada com sucesso!');
        }
      } else {
        // Se estamos criando, adicionar à lista temporária
        const tempId = `temp-${Date.now()}`;
        const newChecklistItem: NoteChecklist = {
          id: tempId,
          note_id: '',
          title: newChecklist.title,
          description: newChecklist.description,
          due_date: newChecklist.due_date,
          responsible_consultant_id: newChecklist.responsible_consultant_id,
          completed: false
        };
        setChecklistsData(prev => [...prev, newChecklistItem]);
      }
      
      setNewChecklist({ title: '', description: '', due_date: '', responsible_consultant_id: '' });
    }
  };

  const removeChecklist = (index: number) => {
    setChecklistsData(prev => prev.filter((_, i) => i !== index));
  };

  const refreshChecklists = () => {
    // Recarregar os dados da anotação se necessário
    if (initialData?.id) {
      // Aqui você pode chamar uma função para recarregar os dados
      window.location.reload(); // Solução temporária
    }
  };

  const formatConsultantsForSelect = (consultants: any[]) => {
    return consultants.map(c => ({ id: c.id, name: c.name }));
  };

  const formatClientsForSelect = (clients: any[]) => {
    return clients.map(c => ({ id: c.id, name: c.name }));
  };

  const formatServicesForSelect = (services: any[]) => {
    return services.map(s => ({ id: s.id, name: s.name }));
  };

  const formatTagsForSelect = (tags: any[]) => {
    return tags.map(t => ({ id: t.id, name: t.name }));
  };

  const allChecklistsCompleted = checklistsData.length > 0 && checklistsData.every(checklist => checklist.completed);
  const canMarkAsFinalized = checklistsData.length === 0 || allChecklistsCompleted;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {children || <Button variant="outline" size="sm">Nova Anotação</Button>}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <DialogHeader>
              <DialogTitle>{initialData ? 'Editar Anotação' : 'Nova Anotação'}</DialogTitle>
              <DialogDescription>
                {initialData ? 'Edite os detalhes da anotação.' : 'Crie uma nova anotação para seu projeto.'}
              </DialogDescription>
            </DialogHeader>

            {/* Informações básicas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Título</FormLabel>
                    <FormControl>
                      <Input placeholder="Título da anotação" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                      disabled={field.value !== 'finalizado' && !canMarkAsFinalized && form.watch('status') === 'finalizado'}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="a_fazer">A fazer</SelectItem>
                        <SelectItem value="em_producao">Em produção</SelectItem>
                        <SelectItem 
                          value="finalizado"
                          disabled={!canMarkAsFinalized}
                        >
                          Finalizado
                          {!canMarkAsFinalized && (
                            <span className="text-xs text-muted-foreground ml-2">
                              (Complete todas as checklists primeiro)
                            </span>
                          )}
                        </SelectItem>
                        <SelectItem value="cancelado">Cancelado</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="color"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cor</FormLabel>
                    <FormControl>
                      <Input type="color" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Conteúdo</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Conteúdo da anotação" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Datas */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="start_date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Data de Início</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(new Date(field.value), "dd/MM/yyyy")
                            ) : (
                              <span>Selecione uma data</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value ? new Date(field.value) : undefined}
                          onSelect={(date) => field.onChange(date?.toISOString())}
                          disabled={(date) => date < new Date("1900-01-01")}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="due_date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Data de Vencimento</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(new Date(field.value), "dd/MM/yyyy")
                            ) : (
                              <span>Selecione uma data</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value ? new Date(field.value) : undefined}
                          onSelect={(date) => field.onChange(date?.toISOString())}
                          disabled={(date) => date < new Date("1900-01-01")}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="end_date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Data de Conclusão</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(new Date(field.value), "dd/MM/yyyy")
                            ) : (
                              <span>Selecione uma data</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value ? new Date(field.value) : undefined}
                          onSelect={(date) => field.onChange(date?.toISOString())}
                          disabled={(date) => date < new Date("1900-01-01")}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Vínculos com searchable selects */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="client_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cliente</FormLabel>
                    <FormControl>
                      <NoteFormSelect
                        options={formatClientsForSelect(clients)}
                        value={field.value || ''}
                        onValueChange={field.onChange}
                        placeholder="Selecione um cliente"
                        searchPlaceholder="Pesquisar clientes..."
                        emptyText="Nenhum cliente encontrado"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="service_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Serviço</FormLabel>
                    <FormControl>
                      <NoteFormSelect
                        options={formatServicesForSelect(services)}
                        value={field.value || ''}
                        onValueChange={field.onChange}
                        placeholder="Selecione um serviço"
                        searchPlaceholder="Pesquisar serviços..."
                        emptyText="Nenhum serviço encontrado"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Consultores com busca e múltipla seleção */}
            <FormField
              control={form.control}
              name="consultant_ids"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Consultores</FormLabel>
                  <FormControl>
                    <NoteFormSelect
                      options={formatConsultantsForSelect(consultants)}
                      value={field.value || []}
                      onValueChange={field.onChange}
                      placeholder="Selecione consultores"
                      searchPlaceholder="Pesquisar consultores..."
                      emptyText="Nenhum consultor encontrado"
                      multiple
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Tags com busca e múltipla seleção */}
            <FormField
              control={form.control}
              name="tag_ids"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tags</FormLabel>
                  <FormControl>
                    <NoteFormSelect
                      options={formatTagsForSelect(tags)}
                      value={field.value || []}
                      onValueChange={field.onChange}
                      placeholder="Selecione tags"
                      searchPlaceholder="Pesquisar tags..."
                      emptyText="Nenhuma tag encontrada"
                      multiple
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Chat interno */}
            <FormField
              control={form.control}
              name="has_internal_chat"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel className="flex items-center gap-2">
                      <MessageCircle className="h-4 w-4" />
                      Criar chat interno
                    </FormLabel>
                    <p className="text-sm text-muted-foreground">
                      Comunique-se com outros consultores em tempo real vinculado a esta anotação.
                      Os consultores selecionados serão automaticamente adicionados ao chat.
                    </p>
                  </div>
                </FormItem>
              )}
            />

            {/* Checklists */}
            <div className="space-y-4">
              <Separator />
              <FormLabel className="text-base font-semibold">Checklists</FormLabel>
              
              {/* Lista de checklists existentes */}
              <div className="space-y-2">
                {checklistsData.map((checklist, index) => (
                  <ChecklistItem
                    key={checklist.id}
                    item={checklist}
                    noteId={initialData?.id || ''}
                    onUpdate={refreshChecklists}
                    onDelete={(id) => {
                      setChecklistsData(prev => prev.filter(item => item.id !== id));
                    }}
                  />
                ))}
              </div>

              {/* Formulário para nova checklist */}
              <div className="space-y-3 p-4 border rounded-lg bg-muted/50">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <Input
                    placeholder="Título da checklist"
                    value={newChecklist.title}
                    onChange={(e) => setNewChecklist({ ...newChecklist, title: e.target.value })}
                  />
                  <Input
                    placeholder="Descrição (opcional)"
                    value={newChecklist.description}
                    onChange={(e) => setNewChecklist({ ...newChecklist, description: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <Input
                    type="date"
                    placeholder="Data de vencimento"
                    value={newChecklist.due_date}
                    onChange={(e) => setNewChecklist({ ...newChecklist, due_date: e.target.value })}
                  />
                  <Select
                    value={newChecklist.responsible_consultant_id}
                    onValueChange={(value) => setNewChecklist({ ...newChecklist, responsible_consultant_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Responsável (opcional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Nenhum responsável</SelectItem>
                      {consultants.map((consultant) => (
                        <SelectItem key={consultant.id} value={consultant.id}>
                          {consultant.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button type="button" onClick={addChecklist} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Checklist
                </Button>
              </div>
            </div>

            <DialogFooter>
              <Button type="submit">{initialData ? 'Atualizar' : 'Salvar'}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default NoteForm;
