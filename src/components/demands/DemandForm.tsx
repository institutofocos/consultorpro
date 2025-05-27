import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { PlusIcon, TrashIcon, InfoIcon } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import SearchableSelect from '@/components/ui/searchable-select';
import { Badge } from '@/components/ui/badge';

const demandFormSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  description: z.string().optional(),
  clientId: z.string().min(1, 'Cliente é obrigatório'),
  serviceId: z.string().min(1, 'Serviço é obrigatório'),
  startDate: z.string().min(1, 'Data de início é obrigatória'),
  endDate: z.string().min(1, 'Data de término é obrigatória'),
  totalValue: z.number().min(0, 'Valor total deve ser positivo'),
  totalHours: z.number().min(0, 'Total de horas deve ser positivo').optional(),
  hourlyRate: z.number().min(0, 'Valor da hora deve ser positivo').optional(),
  thirdPartyExpenses: z.number().min(0, 'Gastos com terceiros devem ser positivos').optional(),
  taxPercent: z.number().min(0, 'Taxa de impostos deve ser positiva').optional(),
  managerName: z.string().optional(),
  managerEmail: z.string().optional(),
  managerPhone: z.string().optional(),
  tags: z.array(z.string()).optional(),
  stages: z.array(z.any()).optional(),
});

type DemandFormValues = z.infer<typeof demandFormSchema>;

interface Stage {
  id: string;
  projectId: string;
  name: string;
  description: string;
  days: number;
  hours: number;
  value: number;
  startDate?: string;
  endDate?: string;
  completed: boolean;
  clientApproved: boolean;
  managerApproved: boolean;
  invoiceIssued: boolean;
  paymentReceived: boolean;
  consultantsSettled: boolean;
  attachment?: string;
  stageOrder: number;
  status: string;
}

interface DemandFormProps {
  onDemandSaved?: () => void;
  onCancel?: () => void;
}

const DemandForm: React.FC<DemandFormProps> = ({ onDemandSaved, onCancel }) => {
  const [clients, setClients] = useState<Array<{id: string, name: string}>>([]);
  const [services, setServices] = useState<Array<{id: string, name: string, description?: string, stages?: any, total_hours?: number, hourly_rate?: number}>>([]);
  const [availableTags, setAvailableTags] = useState<Array<{id: string, name: string}>>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<DemandFormValues>({
    resolver: zodResolver(demandFormSchema),
    defaultValues: {
      name: '',
      description: '',
      clientId: '',
      serviceId: '',
      startDate: '',
      endDate: '',
      totalValue: 0,
      totalHours: 0,
      hourlyRate: 0,
      thirdPartyExpenses: 0,
      taxPercent: 16,
      managerName: '',
      managerEmail: '',
      managerPhone: '',
      tags: [],
      stages: [],
    },
  });

  const [formData, setFormData] = useState({
    stages: [] as Stage[],
    totalValue: 0,
    totalHours: 0,
    thirdPartyExpenses: 0,
    taxPercent: 16,
  });

  useEffect(() => {
    fetchSelectOptions();
    loadCurrentUserData();
  }, []);

  const loadCurrentUserData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('user_profiles')
        .select('full_name')
        .eq('id', user.id)
        .single();

      form.setValue('managerName', profile?.full_name || user.email?.split('@')[0] || '');
      form.setValue('managerEmail', user.email || '');
      form.setValue('managerPhone', user.phone || '');
    } catch (error) {
      console.error('Erro ao carregar dados do usuário:', error);
    }
  };

  const fetchSelectOptions = async () => {
    try {
      console.log('Carregando opções do formulário...');
      
      // Buscar clientes
      const { data: clientsData, error: clientsError } = await supabase
        .from('clients')
        .select('id, name')
        .order('name');

      if (clientsError) {
        console.error('Erro ao carregar clientes:', clientsError);
        throw clientsError;
      }

      // Buscar serviços
      const { data: servicesData, error: servicesError } = await supabase
        .from('services')
        .select('id, name, description, stages, total_hours, hourly_rate')
        .order('name');

      if (servicesError) {
        console.error('Erro ao carregar serviços:', servicesError);
        throw servicesError;
      }

      // Primeiro, tentar buscar das tags principais (tabela 'tags')
      let tagsData = [];
      const { data: mainTagsData, error: mainTagsError } = await supabase
        .from('tags')
        .select('id, name')
        .order('name');

      if (mainTagsError) {
        console.error('Erro ao carregar tags principais:', mainTagsError);
        // Se falhar, tentar buscar da tabela project_tags
        const { data: projectTagsData, error: projectTagsError } = await supabase
          .from('project_tags')
          .select('id, name')
          .order('name');

        if (projectTagsError) {
          console.error('Erro ao carregar project tags:', projectTagsError);
          tagsData = [];
        } else {
          tagsData = projectTagsData || [];
          console.log('Tags carregadas da tabela project_tags:', tagsData);
        }
      } else {
        tagsData = mainTagsData || [];
        console.log('Tags carregadas da tabela tags:', tagsData);
      }

      // Atualizar estados
      if (clientsData) setClients(clientsData);
      if (servicesData) setServices(servicesData);
      setAvailableTags(tagsData);
      
      console.log('Opções carregadas com sucesso');
      console.log('Total de tags disponíveis:', tagsData.length);
    } catch (error) {
      console.error('Error fetching select options:', error);
      toast.error('Erro ao carregar opções do formulário');
    }
  };

  const handleServiceChange = (serviceId: string) => {
    form.setValue('serviceId', serviceId);
    
    const selectedService = services.find(s => s.id === serviceId);
    if (selectedService) {
      form.setValue('description', selectedService.description || '');
      form.setValue('totalHours', Number(selectedService.total_hours) || 0);
      form.setValue('hourlyRate', Number(selectedService.hourly_rate) || 0);

      if (selectedService.stages) {
        const serviceStages = Array.isArray(selectedService.stages) 
          ? selectedService.stages 
          : JSON.parse(selectedService.stages || '[]');
        
        if (Array.isArray(serviceStages)) {
          const newStages: Stage[] = serviceStages.map((stage: any, index: number) => ({
            id: `temp-${Date.now()}-${index}`,
            projectId: '',
            name: stage.name || `Etapa ${index + 1}`,
            description: stage.description || '',
            days: Number(stage.days) || 1,
            hours: Number(stage.hours) || 8,
            value: Number(stage.value) || 0,
            startDate: '',
            endDate: '',
            completed: false,
            clientApproved: false,
            managerApproved: false,
            invoiceIssued: false,
            paymentReceived: false,
            consultantsSettled: false,
            attachment: '',
            stageOrder: index + 1,
            status: 'iniciar_projeto'
          }));
          
          setFormData(prev => ({ ...prev, stages: newStages }));
          form.setValue('stages', newStages);
        }
      }
    }
  };

  const addStage = () => {
    const newStage: Stage = {
      id: `temp-${Date.now()}`,
      projectId: '',
      name: `Etapa ${formData.stages.length + 1}`,
      description: '',
      days: 1,
      hours: 8,
      value: 0,
      startDate: '',
      endDate: '',
      completed: false,
      clientApproved: false,
      managerApproved: false,
      invoiceIssued: false,
      paymentReceived: false,
      consultantsSettled: false,
      attachment: '',
      stageOrder: formData.stages.length + 1,
      status: 'iniciar_projeto'
    };
    
    const updatedStages = [...formData.stages, newStage];
    setFormData(prev => ({ ...prev, stages: updatedStages }));
    form.setValue('stages', updatedStages);
  };

  const updateStage = (index: number, field: keyof Stage, value: any) => {
    const updatedStages = [...formData.stages];
    updatedStages[index] = { ...updatedStages[index], [field]: value };
    setFormData(prev => ({ ...prev, stages: updatedStages }));
    form.setValue('stages', updatedStages);
  };

  const removeStage = (index: number) => {
    const updatedStages = formData.stages.filter((_, i) => i !== index);
    const reorderedStages = updatedStages.map((stage, i) => ({
      ...stage,
      stageOrder: i + 1
    }));
    setFormData(prev => ({ ...prev, stages: reorderedStages }));
    form.setValue('stages', reorderedStages);
  };

  const calculateStageDates = () => {
    const startDate = form.watch('startDate');
    if (!startDate || formData.stages.length === 0) return;
    
    let currentDate = new Date(startDate);
    const updatedStages = formData.stages.map((stage, index) => {
      const stageStartDate = new Date(currentDate);
      const stageEndDate = new Date(currentDate);
      stageEndDate.setDate(stageEndDate.getDate() + (stage.days || 1) - 1);
      
      currentDate = new Date(stageEndDate);
      currentDate.setDate(currentDate.getDate() + 1);
      
      return {
        ...stage,
        startDate: stageStartDate.toISOString().split('T')[0],
        endDate: stageEndDate.toISOString().split('T')[0]
      };
    });
    
    setFormData(prev => ({ ...prev, stages: updatedStages }));
    form.setValue('stages', updatedStages);
  };

  const calculateTotals = () => {
    const stagesTotal = formData.stages.reduce((sum, stage) => sum + Number(stage.value || 0), 0);
    const thirdPartyExpenses = Number(form.watch('thirdPartyExpenses') || 0);
    const totalValue = stagesTotal - thirdPartyExpenses;
    const totalHours = formData.stages.reduce((sum, stage) => sum + Number(stage.hours || 0), 0);
    
    setFormData(prev => ({ ...prev, totalValue, totalHours }));
    form.setValue('totalValue', totalValue);
    form.setValue('totalHours', totalHours);
  };

  useEffect(() => {
    calculateTotals();
  }, [formData.stages, form.watch('thirdPartyExpenses')]);

  useEffect(() => {
    calculateStageDates();
  }, [form.watch('startDate')]);

  const handleTagSelection = (value: string) => {
    console.log('Tag selecionada:', value);
    console.log('Tags disponíveis para matching:', availableTags);
    
    if (value) {
      const tag = availableTags.find(t => t.id === value);
      console.log('Tag encontrada:', tag);
      
      const currentTags = form.getValues('tags') || [];
      if (tag && !currentTags.includes(tag.name)) {
        const newTags = [...currentTags, tag.name];
        form.setValue('tags', newTags);
        console.log('Tags atualizadas:', newTags);
      }
    }
  };

  const calculateNetValue = () => {
    const totalValue = Number(form.watch('totalValue') || 0);
    const taxPercent = Number(form.watch('taxPercent') || 16);
    const thirdPartyExpenses = Number(form.watch('thirdPartyExpenses') || 0);
    
    const taxAmount = (totalValue * taxPercent) / 100;
    const afterTax = totalValue - taxAmount;
    const netValue = afterTax - thirdPartyExpenses;
    
    return netValue;
  };

  const onSubmit = async (values: DemandFormValues) => {
    try {
      setIsSubmitting(true);
      console.log('Iniciando criação de demanda com valores:', values);
      
      // Criar a demanda (usando a tabela projects, mas com status 'planned' e sem consultores)
      const demandData = {
        name: values.name,
        description: values.description || '',
        client_id: values.clientId,
        service_id: values.serviceId,
        start_date: values.startDate,
        end_date: values.endDate,
        total_value: values.totalValue || 0,
        total_hours: values.totalHours || 0,
        hourly_rate: values.hourlyRate || 0,
        third_party_expenses: values.thirdPartyExpenses || 0,
        tax_percent: values.taxPercent || 16,
        manager_name: values.managerName || '',
        manager_email: values.managerEmail || '',
        manager_phone: values.managerPhone || '',
        status: 'planned', // Status inicial para demandas
        main_consultant_id: null, // Sem consultor inicial
        support_consultant_id: null, // Sem consultor inicial
        main_consultant_commission: 0,
        support_consultant_commission: 0,
        main_consultant_value: 0,
        support_consultant_value: 0,
        tags: values.tags || []
      };

      console.log('Dados da demanda para inserção:', demandData);

      const { data: createdDemand, error: demandError } = await supabase
        .from('projects')
        .insert(demandData)
        .select()
        .single();

      if (demandError) {
        console.error('Erro ao criar demanda:', demandError);
        throw demandError;
      }

      console.log('Demanda criada com sucesso:', createdDemand);

      // Criar etapas se houver
      if (formData.stages && formData.stages.length > 0) {
        console.log('Criando etapas:', formData.stages);
        
        const stagesToInsert = formData.stages.map(stage => ({
          project_id: createdDemand.id,
          name: stage.name,
          description: stage.description || '',
          days: stage.days,
          hours: stage.hours,
          value: stage.value,
          start_date: stage.startDate || null,
          end_date: stage.endDate || null,
          stage_order: stage.stageOrder,
          status: stage.status,
          completed: false,
          client_approved: false,
          manager_approved: false,
          invoice_issued: false,
          payment_received: false,
          consultants_settled: false,
        }));

        const { error: stagesError } = await supabase
          .from('project_stages')
          .insert(stagesToInsert);

        if (stagesError) {
          console.error('Erro ao criar etapas:', stagesError);
          throw stagesError;
        }
        
        console.log('Etapas criadas com sucesso');
      }

      // Criar relações de tags se houver
      if (values.tags && values.tags.length > 0) {
        console.log('Criando relações de tags:', values.tags);
        console.log('Tags disponíveis para matching:', availableTags);
        
        // Filtrar apenas os IDs de tags que existem
        const validTagIds = values.tags.map(tagName => {
          const tag = availableTags.find(t => t.name === tagName);
          if (!tag) {
            console.warn(`Tag não encontrada: ${tagName}`);
            return null;
          }
          return tag.id;
        }).filter(Boolean);

        console.log('IDs de tags válidos:', validTagIds);

        if (validTagIds.length > 0) {
          const { error: tagsError } = await supabase
            .from('project_tag_relations')
            .insert(
              validTagIds.map(tagId => ({
                project_id: createdDemand.id,
                tag_id: tagId,
              }))
            );

          if (tagsError) {
            console.error('Erro ao criar relações de tags:', tagsError);
            throw tagsError;
          }
          
          console.log('Relações de tags criadas com sucesso');
        } else {
          console.log('Nenhuma tag válida encontrada para criar relações');
        }
      }

      toast.success('Demanda criada com sucesso!');
      form.reset();
      onDemandSaved?.();
    } catch (error) {
      console.error('Error creating demand:', error);
      toast.error('Erro ao criar demanda: ' + (error as any).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Nova Demanda</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Nome da Demanda */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do Projeto *</FormLabel>
                  <FormControl>
                    <Input placeholder="Digite o nome do projeto" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Descrição */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Descreva o projeto" rows={3} {...field} />
                  </FormControl>
                  <p className="text-xs text-muted-foreground mt-1">
                    A descrição será preenchida automaticamente ao selecionar um serviço
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Cliente e Serviço */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                name="serviceId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Serviço *</FormLabel>
                    <FormControl>
                      <SearchableSelect
                        options={services}
                        value={field.value}
                        onValueChange={handleServiceChange}
                        placeholder="Selecione um serviço"
                        searchPlaceholder="Pesquisar serviços..."
                        emptyText="Nenhum serviço encontrado"
                      />
                    </FormControl>
                    <p className="text-xs text-muted-foreground mt-1">
                      Selecione um serviço primeiro para visualizar os consultores habilitados
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Horas e Valor */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                        onChange={(e) => field.onChange(Number(e.target.value) || 0)}
                      />
                    </FormControl>
                    <p className="text-xs text-muted-foreground mt-1">
                      Será calculado automaticamente com base nas etapas
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="hourlyRate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor da Hora (R$)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Datas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data de Início *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="endDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data de Término *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Tags */}
            <FormField
              control={form.control}
              name="tags"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tags</FormLabel>
                  <FormControl>
                    <SearchableSelect
                      options={availableTags}
                      value=""
                      onValueChange={handleTagSelection}
                      placeholder={availableTags.length > 0 ? "Selecionar tag" : "Nenhuma tag disponível"}
                      searchPlaceholder="Pesquisar tags..."
                      emptyText="Nenhuma tag encontrada"
                    />
                  </FormControl>
                  {availableTags.length === 0 && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Nenhuma tag cadastrada. Acesse Configurações → Tags para criar novas tags.
                    </p>
                  )}
                  {field.value && field.value.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {field.value.map((tagName, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {tagName}
                          <button
                            type="button"
                            onClick={() => {
                              const newTags = field.value?.filter((_, i) => i !== index);
                              field.onChange(newTags);
                            }}
                            className="ml-1 text-muted-foreground hover:text-destructive"
                          >
                            ×
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Informações do Gestor */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <InfoIcon className="h-5 w-5" />
              Informações do Gestor
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="managerName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome do Gestor</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome do gestor" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="managerEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>E-mail do Gestor</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="email@exemplo.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="managerPhone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefone do Gestor</FormLabel>
                    <FormControl>
                      <Input placeholder="(11) 99999-9999" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Os dados são preenchidos automaticamente com as informações do usuário logado
            </p>
          </CardContent>
        </Card>

        {/* Etapas do Projeto */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle>Etapas do Projeto</CardTitle>
            <Button type="button" variant="outline" size="sm" onClick={addStage}>
              <PlusIcon className="h-4 w-4 mr-2" />
              Adicionar Etapa
            </Button>
          </CardHeader>
          <CardContent>
            {formData.stages && formData.stages.length > 0 ? (
              <div className="space-y-4">
                {formData.stages.map((stage, index) => (
                  <div key={stage.id} className="border rounded-lg p-4 space-y-4">
                    <div className="flex justify-between items-start">
                      <h4 className="font-medium">Etapa {index + 1}</h4>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeStage(index)}
                      >
                        <TrashIcon className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>Nome da Etapa</Label>
                        <Input
                          value={stage.name}
                          onChange={(e) => updateStage(index, 'name', e.target.value)}
                          placeholder="Nome da etapa"
                        />
                      </div>

                      <div>
                        <Label>Valor (R$)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={stage.value}
                          onChange={(e) => updateStage(index, 'value', Number(e.target.value))}
                          placeholder="0.00"
                        />
                      </div>
                    </div>

                    <div>
                      <Label>Descrição</Label>
                      <Textarea
                        value={stage.description}
                        onChange={(e) => updateStage(index, 'description', e.target.value)}
                        placeholder="Descrição da etapa"
                        rows={2}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div>
                        <Label>Dias</Label>
                        <Input
                          type="number"
                          value={stage.days}
                          onChange={(e) => updateStage(index, 'days', Number(e.target.value))}
                          min="1"
                        />
                      </div>

                      <div>
                        <Label>Horas</Label>
                        <Input
                          type="number"
                          value={stage.hours}
                          onChange={(e) => updateStage(index, 'hours', Number(e.target.value))}
                          min="1"
                        />
                      </div>

                      <div>
                        <Label>Data de Início</Label>
                        <Input
                          type="date"
                          value={stage.startDate}
                          onChange={(e) => updateStage(index, 'startDate', e.target.value)}
                        />
                      </div>

                      <div>
                        <Label>Data de Término</Label>
                        <Input
                          type="date"
                          value={stage.endDate}
                          onChange={(e) => updateStage(index, 'endDate', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">
                Nenhuma etapa adicionada. Clique em "Adicionar Etapa" para começar.
              </p>
            )}
            {form.watch('startDate') && (
              <p className="text-xs text-muted-foreground mt-4">
                As datas das etapas são calculadas automaticamente com base na data de início do projeto
              </p>
            )}
          </CardContent>
        </Card>

        {/* Valores Financeiros */}
        <Card>
          <CardHeader>
            <CardTitle>Valores Financeiros</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="thirdPartyExpenses"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Gastos com Terceiros (R$)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="taxPercent"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Taxa de Impostos (%)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="16"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="border-t pt-4 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Total de Horas:</span>
                <span className="text-sm">{form.watch('totalHours') || 0}h</span>
              </div>
              <div className="flex justify-between items-center font-medium">
                <span>Valor Bruto:</span>
                <span className="text-lg">
                  {new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL'
                  }).format(form.watch('totalValue') || 0)}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm text-muted-foreground">
                <span>(-) Impostos ({form.watch('taxPercent')}%):</span>
                <span>
                  {new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL'
                  }).format((Number(form.watch('totalValue') || 0) * Number(form.watch('taxPercent') || 16)) / 100)}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm text-muted-foreground">
                <span>(-) Gastos com Terceiros:</span>
                <span>
                  {new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL'
                  }).format(form.watch('thirdPartyExpenses') || 0)}
                </span>
              </div>
              <div className="flex justify-between items-center font-medium text-green-600 border-t pt-2">
                <span>Valor Líquido:</span>
                <span className="text-lg">
                  {new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL'
                  }).format(calculateNetValue())}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Botões */}
        <div className="flex justify-end space-x-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Criando...' : 'Criar Demanda'}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default DemandForm;
