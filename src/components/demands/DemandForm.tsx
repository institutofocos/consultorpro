import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Plus, X } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import SearchableSelect from '@/components/ui/searchable-select';

const demandFormSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  description: z.string().optional(),
  clientId: z.string().min(1, 'Cliente é obrigatório'),
  serviceId: z.string().min(1, 'Serviço é obrigatório'),
  startDate: z.date({ required_error: 'Data de início é obrigatória' }),
  endDate: z.date({ required_error: 'Data de fim é obrigatória' }),
  totalValue: z.number().min(0, 'Valor total deve ser positivo'),
  totalHours: z.number().min(0, 'Total de horas deve ser positivo').optional(),
  totalDays: z.number().min(0, 'Total de dias deve ser positivo').optional(),
  tags: z.array(z.string()).optional(),
});

type DemandFormValues = z.infer<typeof demandFormSchema>;

interface DemandFormProps {
  onDemandSaved?: () => void;
  onCancel?: () => void;
}

const DemandForm: React.FC<DemandFormProps> = ({ onDemandSaved, onCancel }) => {
  const [clients, setClients] = useState<Array<{id: string, name: string}>>([]);
  const [services, setServices] = useState<Array<{id: string, name: string}>>([]);
  const [availableTags, setAvailableTags] = useState<Array<{id: string, name: string}>>([]);
  const [newTag, setNewTag] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<DemandFormValues>({
    resolver: zodResolver(demandFormSchema),
    defaultValues: {
      name: '',
      description: '',
      clientId: '',
      serviceId: '',
      totalValue: 0,
      totalHours: 0,
      totalDays: 0,
      tags: [],
    },
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch clients
        const { data: clientsData, error: clientsError } = await supabase
          .from('clients')
          .select('id, name')
          .order('name');
        
        if (clientsError) throw clientsError;
        setClients(clientsData || []);

        // Fetch services
        const { data: servicesData, error: servicesError } = await supabase
          .from('services')
          .select('id, name')
          .order('name');
        
        if (servicesError) throw servicesError;
        setServices(servicesData || []);

        // Fetch tags
        const { data: tagsData, error: tagsError } = await supabase
          .from('tags')
          .select('id, name')
          .order('name');
        
        if (tagsError) throw tagsError;
        setAvailableTags(tagsData || []);
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Erro ao carregar dados do formulário');
      }
    };

    fetchData();
  }, []);

  const onSubmit = async (values: DemandFormValues) => {
    try {
      setIsSubmitting(true);
      
      // Create the demand
      const { data: demandData, error: demandError } = await supabase
        .from('projects')
        .insert({
          name: values.name,
          description: values.description,
          client_id: values.clientId,
          service_id: values.serviceId,
          start_date: values.startDate.toISOString().split('T')[0],
          end_date: values.endDate.toISOString().split('T')[0],
          total_value: values.totalValue,
          total_hours: values.totalHours || 0,
          total_days: values.totalDays || 0,
          status: 'planned',
          main_consultant_id: null,
          support_consultant_id: null,
          main_consultant_commission: 0,
          support_consultant_commission: 0,
        })
        .select()
        .single();

      if (demandError) throw demandError;

      // Handle tags if any
      if (values.tags && values.tags.length > 0) {
        const { error: tagsError } = await supabase
          .from('project_tag_relations')
          .insert(
            values.tags.map(tagId => ({
              project_id: demandData.id,
              tag_id: tagId,
            }))
          );

        if (tagsError) throw tagsError;
      }

      toast.success('Demanda criada com sucesso!');
      form.reset();
      onDemandSaved?.();
    } catch (error) {
      console.error('Error creating demand:', error);
      toast.error('Erro ao criar demanda');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddTag = async () => {
    if (!newTag.trim()) return;

    try {
      const { data, error } = await supabase
        .from('tags')
        .insert({ name: newTag.trim() })
        .select()
        .single();

      if (error) throw error;

      setAvailableTags(prev => [...prev, data]);
      const currentTags = form.getValues('tags') || [];
      form.setValue('tags', [...currentTags, data.id]);
      setNewTag('');
      toast.success('Tag criada e adicionada!');
    } catch (error) {
      console.error('Error creating tag:', error);
      toast.error('Erro ao criar tag');
    }
  };

  const handleRemoveTag = (tagId: string) => {
    const currentTags = form.getValues('tags') || [];
    form.setValue('tags', currentTags.filter(id => id !== tagId));
  };

  const getSelectedTagNames = () => {
    const selectedTags = form.watch('tags') || [];
    return availableTags.filter(tag => selectedTags.includes(tag.id));
  };

  return (
    <div className="space-y-6 p-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome da Demanda</FormLabel>
                  <FormControl>
                    <Input placeholder="Digite o nome da demanda" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="clientId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cliente</FormLabel>
                  <FormControl>
                    <SearchableSelect
                      options={clients}
                      value={field.value}
                      onValueChange={field.onChange}
                      placeholder="Selecione um cliente"
                      searchPlaceholder="Buscar cliente..."
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Descrição</FormLabel>
                <FormControl>
                  <Textarea placeholder="Descreva a demanda" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="serviceId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Serviço</FormLabel>
                  <FormControl>
                    <SearchableSelect
                      options={services}
                      value={field.value}
                      onValueChange={field.onChange}
                      placeholder="Selecione um serviço"
                      searchPlaceholder="Buscar serviço..."
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="totalValue"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Valor Total (R$)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <FormField
              control={form.control}
              name="startDate"
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
                            format(field.value, "dd/MM/yyyy", { locale: ptBR })
                          ) : (
                            <span>Selecione a data</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
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
              name="endDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Data de Fim</FormLabel>
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
                            format(field.value, "dd/MM/yyyy", { locale: ptBR })
                          ) : (
                            <span>Selecione a data</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) => date < new Date("1900-01-01")}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-4">
              <FormField
                control={form.control}
                name="totalHours"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Total de Horas</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="0"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="totalDays"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Total de Dias</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="0"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          {/* Tags Section */}
          <div className="space-y-4">
            <FormLabel>Tags</FormLabel>
            
            {/* Selected Tags Display */}
            <div className="flex flex-wrap gap-2">
              {getSelectedTagNames().map((tag) => (
                <div key={tag.id} className="flex items-center gap-1 bg-blue-100 text-blue-800 px-2 py-1 rounded-md text-sm">
                  <span>{tag.name}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag.id)}
                    className="ml-1 hover:bg-blue-200 rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>

            {/* Tag Selection */}
            <FormField
              control={form.control}
              name="tags"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <SearchableSelect
                      options={availableTags.filter(tag => !(field.value || []).includes(tag.id))}
                      value=""
                      onValueChange={(tagId) => {
                        if (tagId) {
                          const currentTags = field.value || [];
                          field.onChange([...currentTags, tagId]);
                        }
                      }}
                      placeholder="Adicionar tag existente"
                      searchPlaceholder="Buscar tags..."
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Create New Tag */}
            <div className="flex gap-2">
              <Input
                placeholder="Nome da nova tag"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
              />
              <Button type="button" onClick={handleAddTag} variant="outline" size="sm">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="flex justify-end space-x-4 pt-6">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Criando...' : 'Criar Demanda'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default DemandForm;
