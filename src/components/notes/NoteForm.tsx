
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
import { CalendarIcon, Plus, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { fetchConsultants } from '@/integrations/supabase/consultants';
import { fetchClients } from '@/integrations/supabase/clients';
import { fetchServices } from '@/integrations/supabase/services';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';

export interface NoteFormProps {
  onSave: (data: any) => void;
  initialData?: any;
  children?: React.ReactNode;
  onClose?: () => void;
}

const formSchema = z.object({
  title: z.string().min(1, { message: "Título é obrigatório" }),
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
    }
  }, [initialData, open, form]);

  const handleSubmit = (data: any) => {
    // Converter datas se fornecidas
    const formattedData = {
      ...data,
      start_date: data.start_date ? format(new Date(data.start_date), 'yyyy-MM-dd') : undefined,
      end_date: data.end_date ? format(new Date(data.end_date), 'yyyy-MM-dd') : undefined,
      due_date: data.due_date ? format(new Date(data.due_date), 'yyyy-MM-dd') : undefined,
      checklists: data.checklists?.map((checklist: any) => ({
        ...checklist,
        due_date: checklist.due_date ? format(new Date(checklist.due_date), 'yyyy-MM-dd') : undefined
      })) || []
    };
    
    onSave(formattedData);
    setOpen(false);
    form.reset();
    if (onClose) onClose();
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen && onClose) onClose();
  };

  const addChecklist = () => {
    if (newChecklist.title.trim()) {
      const currentChecklists = form.getValues('checklists') || [];
      form.setValue('checklists', [...currentChecklists, { ...newChecklist, completed: false }]);
      setNewChecklist({ title: '', description: '', due_date: '', responsible_consultant_id: '' });
    }
  };

  const removeChecklist = (index: number) => {
    const currentChecklists = form.getValues('checklists') || [];
    form.setValue('checklists', currentChecklists.filter((_, i) => i !== index));
  };

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
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="a_fazer">A fazer</SelectItem>
                        <SelectItem value="em_producao">Em produção</SelectItem>
                        <SelectItem value="finalizado">Finalizado</SelectItem>
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

            {/* Vínculos */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="client_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cliente</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um cliente" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="">Nenhum cliente</SelectItem>
                        {clients.map((client) => (
                          <SelectItem key={client.id} value={client.id}>
                            {client.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um serviço" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="">Nenhum serviço</SelectItem>
                        {services.map((service) => (
                          <SelectItem key={service.id} value={service.id}>
                            {service.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Consultores */}
            <FormField
              control={form.control}
              name="consultant_ids"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Consultores</FormLabel>
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      {consultants.map((consultant) => (
                        <div key={consultant.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={consultant.id}
                            checked={(field.value || []).includes(consultant.id)}
                            onCheckedChange={(checked) => {
                              const currentValues = field.value || [];
                              if (checked) {
                                field.onChange([...currentValues, consultant.id]);
                              } else {
                                field.onChange(currentValues.filter((id: string) => id !== consultant.id));
                              }
                            }}
                          />
                          <label htmlFor={consultant.id} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                            {consultant.name}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Tags */}
            <FormField
              control={form.control}
              name="tag_ids"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tags</FormLabel>
                  <div className="space-y-2">
                    <div className="grid grid-cols-3 gap-2">
                      {tags.map((tag) => (
                        <div key={tag.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={tag.id}
                            checked={(field.value || []).includes(tag.id)}
                            onCheckedChange={(checked) => {
                              const currentValues = field.value || [];
                              if (checked) {
                                field.onChange([...currentValues, tag.id]);
                              } else {
                                field.onChange(currentValues.filter((id: string) => id !== tag.id));
                              }
                            }}
                          />
                          <label htmlFor={tag.id} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                            {tag.name}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Chat interno */}
            <FormField
              control={form.control}
              name="has_internal_chat"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>
                      Criar chat interno
                    </FormLabel>
                    <p className="text-sm text-muted-foreground">
                      Cria um chat interno vinculado a esta anotação para discussões da equipe.
                    </p>
                  </div>
                </FormItem>
              )}
            />

            {/* Checklists */}
            <div className="space-y-4">
              <FormLabel>Checklists</FormLabel>
              
              {/* Lista de checklists existentes */}
              <div className="space-y-2">
                {(form.watch('checklists') || []).map((checklist: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <div className="font-medium">{checklist.title}</div>
                      {checklist.description && (
                        <div className="text-sm text-muted-foreground">{checklist.description}</div>
                      )}
                      <div className="flex gap-2 mt-1">
                        {checklist.due_date && (
                          <Badge variant="outline" className="text-xs">
                            {format(new Date(checklist.due_date), "dd/MM/yyyy", { locale: ptBR })}
                          </Badge>
                        )}
                        {checklist.responsible_consultant_id && (
                          <Badge variant="outline" className="text-xs">
                            {consultants.find(c => c.id === checklist.responsible_consultant_id)?.name}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeChecklist(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
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
