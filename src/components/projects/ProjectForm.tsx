import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarIcon, PlusIcon, TrashIcon, InfoIcon, LinkIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { createProject, updateProject, fetchProjectTags } from "@/integrations/supabase/projects";
import { Project, Stage } from "./types";
import SearchableSelect from "@/components/ui/searchable-select";
import { Badge } from "@/components/ui/badge";
import ProjectFormStageSection from "./ProjectFormStageSection";
import { useWebhookProcessor } from "@/hooks/useWebhookProcessor";

interface ProjectFormProps {
  project?: Project;
  onProjectSaved: (project?: Project) => void;
  onCancel: () => void;
}

export default function ProjectForm({ project, onProjectSaved, onCancel }: ProjectFormProps) {
  // Adicionar o hook do webhook processor
  const { processForProjectCreation } = useWebhookProcessor();

  const [formData, setFormData] = useState<Partial<Project>>({
    name: '',
    description: '',
    serviceId: '',
    clientId: '',
    mainConsultantId: '',
    mainConsultantCommission: 0,
    supportConsultantId: '',
    supportConsultantCommission: 0,
    startDate: '',
    endDate: '',
    totalValue: 0,
    taxPercent: 16,
    thirdPartyExpenses: 0,
    consultantValue: 0,
    supportConsultantValue: 0,
    managerName: '',
    managerEmail: '',
    managerPhone: '',
    totalHours: 0,
    hourlyRate: 0,
    status: 'iniciar_projeto', // SEMPRE INICIAR COM STATUS "iniciar_projeto"
    tags: [],
    tagIds: [],
    stages: [],
    url: ''
  });

  const [clients, setClients] = useState([]);
  const [services, setServices] = useState([]);
  const [consultants, setConsultants] = useState([]);
  const [filteredConsultants, setFilteredConsultants] = useState([]);
  const [availableTags, setAvailableTags] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchSelectOptions();
    loadCurrentUserData();
  }, []);

  useEffect(() => {
    if (project) {
      console.log('=== CARREGANDO DADOS DO PROJETO PARA EDIÇÃO ===');
      console.log('Projeto completo:', project);
      
      const projectFormData = {
        name: project.name || '',
        description: project.description || '',
        serviceId: project.serviceId || '',
        clientId: project.clientId || '',
        mainConsultantId: project.mainConsultantId || '',
        mainConsultantCommission: project.mainConsultantCommission || 0,
        supportConsultantId: project.supportConsultantId || '',
        supportConsultantCommission: project.supportConsultantCommission || 0,
        startDate: project.startDate || '',
        endDate: project.endDate || '',
        totalValue: project.totalValue || 0,
        taxPercent: project.taxPercent || 16,
        thirdPartyExpenses: project.thirdPartyExpenses || 0,
        consultantValue: project.consultantValue || 0,
        supportConsultantValue: project.supportConsultantValue || 0,
        managerName: project.managerName || '',
        managerEmail: project.managerEmail || '',
        managerPhone: project.managerPhone || '',
        totalHours: project.totalHours || 0,
        hourlyRate: project.hourlyRate || 0,
        status: project.status || 'iniciar_projeto',
        tags: project.tags || [],
        tagIds: project.tagIds || [],
        stages: project.stages || [],
        url: project.url || ''
      };

      console.log('Dados do formulário sendo definidos:', projectFormData);
      setFormData(projectFormData);

      if (project.serviceId) {
        console.log('Carregando consultores autorizados para o serviço:', project.serviceId);
        fetchAuthorizedConsultants(project.serviceId);
      }
    }
  }, [project]);

  // Filtrar consultores quando o serviço é selecionado (mas não em edição)
  useEffect(() => {
    if (formData.serviceId && !project) {
      fetchAuthorizedConsultants(formData.serviceId);
    } else if (!formData.serviceId && !project) {
      setFilteredConsultants([]);
      // Limpar seleções de consultores apenas quando não há serviço e não é edição
      setFormData(prev => ({
        ...prev,
        mainConsultantId: '',
        supportConsultantId: ''
      }));
    }
  }, [formData.serviceId, project]);

  const fetchAuthorizedConsultants = async (serviceId: string) => {
    try {
      console.log('Buscando consultores autorizados para o serviço:', serviceId);
      
      const { data, error } = await supabase
        .from('consultant_services')
        .select(`
          consultant_id,
          consultants(id, name)
        `)
        .eq('service_id', serviceId);

      if (error) throw error;

      const authorizedConsultants = data?.map(item => ({
        id: item.consultants.id,
        name: item.consultants.name
      })) || [];

      console.log('Consultores autorizados encontrados:', authorizedConsultants);
      setFilteredConsultants(authorizedConsultants);

      // Verificar se os consultores selecionados ainda são válidos
      if (project) {
        const validMainConsultant = authorizedConsultants.find(c => c.id === project.mainConsultantId);
        const validSupportConsultant = authorizedConsultants.find(c => c.id === project.supportConsultantId);

        if (!validMainConsultant && project.mainConsultantId) {
          console.log('Consultor principal não está autorizado para este serviço, mas mantendo seleção');
        }
        if (!validSupportConsultant && project.supportConsultantId) {
          console.log('Consultor de apoio não está autorizado para este serviço, mas mantendo seleção');
        }
      }
    } catch (error) {
      console.error('Erro ao buscar consultores autorizados:', error);
      setFilteredConsultants([]);
    }
  };

  const loadCurrentUserData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Since user management was removed, just use the email from auth
      // and generate a simple name from the email
      if (!project) {
        setFormData(prev => ({
          ...prev,
          managerName: user.email?.split('@')[0] || '',
          managerEmail: user.email || '',
          managerPhone: user.phone || ''
        }));
      }
    } catch (error) {
      console.error('Erro ao carregar dados do usuário:', error);
    }
  };

  const fetchSelectOptions = async () => {
    try {
      const [clientsRes, servicesRes, consultantsRes] = await Promise.all([
        supabase.from('clients').select('id, name').order('name'),
        supabase.from('services').select('id, name, description, stages, total_hours, hourly_rate').order('name'),
        supabase.from('consultants').select('id, name').order('name')
      ]);

      if (clientsRes.data) setClients(clientsRes.data);
      if (servicesRes.data) setServices(servicesRes.data);
      if (consultantsRes.data) {
        console.log('Todos os consultores carregados:', consultantsRes.data);
        setConsultants(consultantsRes.data);
      }

      // Carregar tags do projeto
      const tagsData = await fetchProjectTags();
      console.log('Tags carregadas:', tagsData);
      setAvailableTags(tagsData);
    } catch (error) {
      console.error('Error fetching select options:', error);
      toast.error('Erro ao carregar opções do formulário');
    }
  };

  const handleServiceChange = (serviceId: string) => {
    setFormData(prev => ({ 
      ...prev, 
      serviceId,
      // Limpar consultores apenas se não estiver editando um projeto existente
      mainConsultantId: project ? prev.mainConsultantId : '',
      supportConsultantId: project ? prev.supportConsultantId : ''
    }));
    
    const selectedService = services.find(s => s.id === serviceId);
    if (selectedService) {
      setFormData(prev => ({
        ...prev,
        description: selectedService.description || prev.description,
        totalHours: Number(selectedService.total_hours) || prev.totalHours,
        hourlyRate: Number(selectedService.hourly_rate) || prev.hourlyRate
      }));

      if (selectedService.stages && !project) { // Só auto-adicionar etapas se não estiver editando
        const serviceStages = Array.isArray(selectedService.stages) 
          ? selectedService.stages 
          : JSON.parse(selectedService.stages || '[]');
        
        if (Array.isArray(serviceStages)) {
          const newStages: Stage[] = serviceStages.map((stage: any, index: number) => ({
            id: `temp-${Date.now()}-${index}`,
            projectId: project?.id || '',
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
            consultantId: '',
            status: 'iniciar_projeto'
          }));
          
          setFormData(prev => ({ ...prev, stages: newStages }));
        }
      }
    }
  };

  const addStage = () => {
    const newStage: Stage = {
      id: `temp-${Date.now()}`,
      projectId: project?.id || '',
      name: `Etapa ${(formData.stages?.length || 0) + 1}`,
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
      stageOrder: (formData.stages?.length || 0) + 1,
      consultantId: '',
      status: 'iniciar_projeto'
    };
    
    setFormData(prev => ({
      ...prev,
      stages: [...(prev.stages || []), newStage]
    }));
  };

  const updateStage = (index: number, field: keyof Stage, value: any) => {
    const updatedStages = [...(formData.stages || [])];
    updatedStages[index] = { ...updatedStages[index], [field]: value };
    setFormData(prev => ({ ...prev, stages: updatedStages }));
  };

  const removeStage = (index: number) => {
    const updatedStages = (formData.stages || []).filter((_, i) => i !== index);
    const reorderedStages = updatedStages.map((stage, i) => ({
      ...stage,
      stageOrder: i + 1
    }));
    setFormData(prev => ({ ...prev, stages: reorderedStages }));
  };

  const calculateStageDates = () => {
    if (!formData.startDate || !formData.stages || formData.stages.length === 0) return;
    
    let currentDate = new Date(formData.startDate);
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
  };

  const calculateTotals = () => {
    const stagesTotal = (formData.stages || []).reduce((sum, stage) => sum + Number(stage.value || 0), 0);
    const thirdPartyExpenses = Number(formData.thirdPartyExpenses || 0);
    const totalValue = stagesTotal - thirdPartyExpenses;
    const totalHours = (formData.stages || []).reduce((sum, stage) => sum + Number(stage.hours || 0), 0);
    
    setFormData(prev => ({ ...prev, totalValue, totalHours }));
  };

  useEffect(() => {
    calculateTotals();
  }, [formData.stages, formData.thirdPartyExpenses]);

  useEffect(() => {
    calculateStageDates();
  }, [formData.startDate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isLoading) return;
    setIsLoading(true);

    try {
      if (!formData.name || !formData.startDate || !formData.endDate) {
        toast.error('Preencha todos os campos obrigatórios');
        return;
      }

      console.log('=== INICIANDO SUBMISSÃO DO FORMULÁRIO ===');
      console.log('Tipo de operação:', project ? 'UPDATE' : 'CREATE');

      // CRIAR OBJETO COMPLETAMENTE LIMPO - SEM QUALQUER REFERÊNCIA A project_id ou campos problemáticos
      const safeProjectData = {
        // ID apenas se for atualização
        ...(project?.id && { id: project.id }),
        // Campos básicos - APENAS OS QUE EXISTEM NA TABELA PROJECTS
        name: formData.name,
        description: formData.description || '',
        serviceId: formData.serviceId || null,
        clientId: formData.clientId || null,
        mainConsultantId: formData.mainConsultantId || null,
        mainConsultantCommission: Number(formData.mainConsultantCommission || 0),
        supportConsultantId: formData.supportConsultantId || null,
        supportConsultantCommission: Number(formData.supportConsultantCommission || 0),
        startDate: formData.startDate,
        endDate: formData.endDate,
        totalValue: Number(formData.totalValue || 0),
        taxPercent: Number(formData.taxPercent || 16),
        thirdPartyExpenses: Number(formData.thirdPartyExpenses || 0),
        consultantValue: Number(formData.consultantValue || 0),
        supportConsultantValue: Number(formData.supportConsultantValue || 0),
        managerName: formData.managerName || '',
        managerEmail: formData.managerEmail || '',
        managerPhone: formData.managerPhone || '',
        totalHours: Number(formData.totalHours || 0),
        hourlyRate: Number(formData.hourlyRate || 0),
        status: project ? formData.status : 'iniciar_projeto',
        tags: formData.tags || [],
        tagIds: formData.tagIds || [],
        stages: formData.stages || [],
        url: formData.url || ''
      };

      console.log('✅ Dados limpos e seguros preparados para submissão');
      
      let savedProject: any;
      if (project?.id) {
        console.log('Atualizando projeto existente com ID:', project.id);
        savedProject = await updateProject(safeProjectData);
        toast.success('Projeto atualizado com sucesso!');
      } else {
        console.log('Criando novo projeto com status "iniciar_projeto"');
        savedProject = await createProject(safeProjectData);
        toast.success('Projeto criado com sucesso!');
        
        // *** WEBHOOK: Disparar processamento para criação ***
        console.log('🔄 Iniciando processamento de webhook para criação de projeto');
        try {
          await processForProjectCreation();
        } catch (webhookError) {
          console.warn('Aviso: Erro no processamento de webhook (não crítico):', webhookError);
          // Não impedir o fluxo principal mesmo se o webhook falhar
        }
      }

      console.log('Projeto salvo no banco:', savedProject);

      const transformedProject: Project = {
        id: savedProject.id,
        name: savedProject.name,
        description: savedProject.description || '',
        serviceId: savedProject.service_id,
        clientId: savedProject.client_id,
        mainConsultantId: savedProject.main_consultant_id,
        mainConsultantCommission: savedProject.main_consultant_commission || 0,
        supportConsultantId: savedProject.support_consultant_id,
        supportConsultantCommission: savedProject.support_consultant_commission || 0,
        startDate: savedProject.start_date,
        endDate: savedProject.end_date,
        totalValue: savedProject.total_value || 0,
        taxPercent: savedProject.tax_percent || 16,
        thirdPartyExpenses: savedProject.third_party_expenses || 0,
        consultantValue: savedProject.main_consultant_value || 0,
        supportConsultantValue: savedProject.support_consultant_value || 0,
        managerName: savedProject.manager_name || '',
        managerEmail: savedProject.manager_email || '',
        managerPhone: savedProject.manager_phone || '',
        totalHours: savedProject.total_hours || 0,
        hourlyRate: savedProject.hourly_rate || 0,
        status: savedProject.status,
        tags: savedProject.tags || [],
        tagIds: formData.tagIds || [],
        stages: formData.stages || [],
        url: savedProject.url || ''
      };

      console.log('Projeto transformado:', transformedProject);
      console.log('Chamando onProjectSaved...');
      
      onProjectSaved(transformedProject);
      
      console.log('=== SUBMISSÃO CONCLUÍDA COM SUCESSO ===');
    } catch (error) {
      console.error('=== ERRO NA SUBMISSÃO ===');
      console.error('Error saving project:', error);
      toast.error('Erro ao salvar projeto: ' + (error?.message || 'Erro desconhecido'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleTagSelection = (value: string | string[]) => {
    if (typeof value === 'string') {
      const tag = availableTags.find(t => t.id === value);
      if (tag && !formData.tags?.includes(tag.name)) {
        setFormData(prev => ({
          ...prev,
          tags: [...(prev.tags || []), tag.name],
          tagIds: [...(prev.tagIds || []), tag.id]
        }));
      }
    }
  };

  const removeTag = (index: number) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags?.filter((_, i) => i !== index),
      tagIds: prev.tagIds?.filter((_, i) => i !== index)
    }));
  };

  // Calculate net value with correct sequence: gross - taxes - third party - main consultant - support consultant
  const calculateNetValue = () => {
    const totalValue = Number(formData.totalValue || 0);
    const taxPercent = Number(formData.taxPercent || 16);
    const thirdPartyExpenses = Number(formData.thirdPartyExpenses || 0);
    const consultantValue = Number(formData.consultantValue || 0);
    const supportConsultantValue = Number(formData.supportConsultantValue || 0);
    
    // Step 1: Calculate tax amount and subtract from total
    const taxAmount = (totalValue * taxPercent) / 100;
    const afterTax = totalValue - taxAmount;
    
    // Step 2: Subtract third party expenses
    const afterThirdParty = afterTax - thirdPartyExpenses;
    
    // Step 3: Subtract main consultant value
    const afterMainConsultant = afterThirdParty - consultantValue;
    
    // Step 4: Subtract support consultant value
    const netValue = afterMainConsultant - supportConsultantValue;
    
    return netValue;
  };

  // Preparar opções de consultores - sempre mostrar todos quando editando
  const getConsultantOptions = () => {
    // Se estiver editando um projeto, sempre mostrar todos os consultores
    if (project) {
      console.log('Projeto em edição, mostrando todos os consultores:', consultants);
      return consultants;
    }
    
    // Se há consultores filtrados, usar eles
    if (filteredConsultants.length > 0) {
      console.log('Usando consultores filtrados:', filteredConsultants);
      return filteredConsultants;
    }
    
    // Senão, usar todos os consultores
    console.log('Usando todos os consultores como fallback:', consultants);
    return consultants;
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {project ? 'Editar Projeto' : 'Novo Projeto'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Nome do Projeto */}
          <div>
            <Label htmlFor="name">Nome do Projeto *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Digite o nome do projeto"
              required
            />
          </div>

          {/* Descrição */}
          <div>
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Descreva o projeto"
              rows={3}
            />
            <p className="text-xs text-muted-foreground mt-1">
              A descrição será preenchida automaticamente ao selecionar um serviço
            </p>
          </div>

          {/* URL do Projeto */}
          <div>
            <Label htmlFor="url" className="flex items-center gap-2">
              <LinkIcon className="h-4 w-4" />
              URL do Projeto
            </Label>
            <Input
              id="url"
              type="url"
              value={formData.url}
              onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
              placeholder="https://exemplo.com"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Link relacionado ao projeto (opcional)
            </p>
          </div>

          {/* Cliente e Serviço */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="client">Cliente</Label>
              <SearchableSelect
                options={clients}
                value={formData.clientId || ''}
                onValueChange={(value) => setFormData(prev => ({ ...prev, clientId: value as string }))}
                placeholder="Selecione um cliente"
                searchPlaceholder="Pesquisar clientes..."
                emptyText="Nenhum cliente encontrado"
              />
            </div>

            <div>
              <Label htmlFor="service">Serviço *</Label>
              <SearchableSelect
                options={services}
                value={formData.serviceId || ''}
                onValueChange={handleServiceChange}
                placeholder="Selecione um serviço"
                searchPlaceholder="Pesquisar serviços..."
                emptyText="Nenhum serviço encontrado"
              />
              {!project && (
                <p className="text-xs text-muted-foreground mt-1">
                  Selecione um serviço primeiro para visualizar os consultores habilitados
                </p>
              )}
            </div>
          </div>

          {/* Horas e Valor */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="totalHours">Total de Horas</Label>
              <Input
                id="totalHours"
                type="number"
                value={formData.totalHours}
                onChange={(e) => setFormData(prev => ({ ...prev, totalHours: Number(e.target.value) }))}
                placeholder="0"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Será calculado automaticamente com base nas etapas
              </p>
            </div>

            <div>
              <Label htmlFor="hourlyRate">Valor da Hora (R$)</Label>
              <Input
                id="hourlyRate"
                type="number"
                step="0.01"
                value={formData.hourlyRate}
                onChange={(e) => setFormData(prev => ({ ...prev, hourlyRate: Number(e.target.value) }))}
                placeholder="0.00"
              />
            </div>
          </div>

          {/* Consultores */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="mainConsultant">Consultor Principal</Label>
              <SearchableSelect
                options={getConsultantOptions()}
                value={formData.mainConsultantId || ''}
                onValueChange={(value) => {
                  console.log('Mudando consultor principal para:', value);
                  setFormData(prev => ({ ...prev, mainConsultantId: value as string }));
                }}
                placeholder="Selecione o consultor principal"
                searchPlaceholder="Pesquisar consultores..."
                emptyText="Nenhum consultor encontrado"
              />
              {!project && !formData.serviceId && (
                <p className="text-xs text-muted-foreground mt-1">
                  Apenas consultores habilitados para o serviço selecionado aparecerão aqui
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="supportConsultant">Consultor de Apoio</Label>
              <SearchableSelect
                options={[{ id: '', name: 'Nenhum' }, ...getConsultantOptions()]}
                value={formData.supportConsultantId || ''}
                onValueChange={(value) => {
                  console.log('Mudando consultor de apoio para:', value);
                  setFormData(prev => ({ ...prev, supportConsultantId: value as string }));
                }}
                placeholder="Selecione o consultor de apoio"
                searchPlaceholder="Pesquisar consultores..."
                emptyText="Nenhum consultor encontrado"
              />
              {!project && !formData.serviceId && (
                <p className="text-xs text-muted-foreground mt-1">
                  Apenas consultores habilitados para o serviço selecionado aparecerão aqui
                </p>
              )}
            </div>
          </div>

          {/* Datas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Data de Início *</Label>
              <Input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                required
              />
            </div>

            <div>
              <Label>Data de Término *</Label>
              <Input
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                required
              />
            </div>
          </div>

          {/* Tags */}
          <div>
            <Label htmlFor="tags">Tags</Label>
            <SearchableSelect
              options={availableTags}
              value=""
              onValueChange={handleTagSelection}
              placeholder="Adicionar tag"
              searchPlaceholder="Pesquisar tags..."
              emptyText="Nenhuma tag encontrada"
            />
            {formData.tags && formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.tags.map((tagName, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {tagName}
                    <button
                      type="button"
                      onClick={() => removeTag(index)}
                      className="ml-1 text-muted-foreground hover:text-destructive"
                    >
                      ×
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>
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
            <div>
              <Label htmlFor="managerName">Nome do Gestor</Label>
              <Input
                id="managerName"
                value={formData.managerName}
                onChange={(e) => setFormData(prev => ({ ...prev, managerName: e.target.value }))}
                placeholder="Nome do gestor"
              />
            </div>

            <div>
              <Label htmlFor="managerEmail">E-mail do Gestor</Label>
              <Input
                id="managerEmail"
                type="email"
                value={formData.managerEmail}
                onChange={(e) => setFormData(prev => ({ ...prev, managerEmail: e.target.value }))}
                placeholder="email@exemplo.com"
              />
            </div>

            <div>
              <Label htmlFor="managerPhone">Telefone do Gestor</Label>
              <Input
                id="managerPhone"
                value={formData.managerPhone}
                onChange={(e) => setFormData(prev => ({ ...prev, managerPhone: e.target.value }))}
                placeholder="(11) 99999-9999"
              />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Os dados são preenchidos automaticamente com as informações do usuário logado
          </p>
        </CardContent>
      </Card>

      {/* Etapas do Projeto - Usando o novo componente */}
      <ProjectFormStageSection
        stages={formData.stages || []}
        onStagesChange={(stages) => setFormData(prev => ({ ...prev, stages }))}
        consultantOptions={getConsultantOptions()}
        startDate={formData.startDate}
      />

      {/* Valores Financeiros */}
      <Card>
        <CardHeader>
          <CardTitle>Valores Financeiros</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="thirdPartyExpenses">Gastos com Terceiros (R$)</Label>
              <Input
                id="thirdPartyExpenses"
                type="number"
                step="0.01"
                value={formData.thirdPartyExpenses}
                onChange={(e) => setFormData(prev => ({ ...prev, thirdPartyExpenses: Number(e.target.value) }))}
                placeholder="0.00"
              />
            </div>

            <div>
              <Label htmlFor="taxPercent">Taxa de Impostos (%)</Label>
              <Input
                id="taxPercent"
                type="number"
                step="0.01"
                value={formData.taxPercent}
                onChange={(e) => setFormData(prev => ({ ...prev, taxPercent: Number(e.target.value) }))}
                placeholder="16"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="consultantValue">Valor Consultor Principal (R$)</Label>
              <Input
                id="consultantValue"
                type="number"
                step="0.01"
                value={formData.consultantValue}
                onChange={(e) => {
                  console.log('Mudando valor do consultor principal para:', e.target.value);
                  setFormData(prev => ({ ...prev, consultantValue: Number(e.target.value) }));
                }}
                placeholder="0.00"
              />
            </div>

            <div>
              <Label htmlFor="supportConsultantValue">Valor Consultor Apoio (R$)</Label>
              <Input
                id="supportConsultantValue"
                type="number"
                step="0.01"
                value={formData.supportConsultantValue}
                onChange={(e) => setFormData(prev => ({ ...prev, supportConsultantValue: Number(e.target.value) }))}
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="border-t pt-4 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Total de Horas:</span>
              <span className="text-sm">{formData.totalHours || 0}h</span>
            </div>
            <div className="flex justify-between items-center font-medium">
              <span>Valor Bruto:</span>
              <span className="text-lg">
                {new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL'
                }).format(formData.totalValue || 0)}
              </span>
            </div>
            <div className="flex justify-between items-center text-sm text-muted-foreground">
              <span>(-) Impostos ({formData.taxPercent}%):</span>
              <span>
                {new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL'
                }).format((Number(formData.totalValue || 0) * Number(formData.taxPercent || 16)) / 100)}
              </span>
            </div>
            <div className="flex justify-between items-center text-sm text-muted-foreground">
              <span>(-) Gastos com Terceiros:</span>
              <span>
                {new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL'
                }).format(formData.thirdPartyExpenses || 0)}
              </span>
            </div>
            <div className="flex justify-between items-center text-sm text-muted-foreground">
              <span>(-) Consultor Principal:</span>
              <span>
                {new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL'
                }).format(formData.consultantValue || 0)}
              </span>
            </div>
            <div className="flex justify-between items-center text-sm text-muted-foreground">
              <span>(-) Consultor de Apoio:</span>
              <span>
                {new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL'
                }).format(formData.supportConsultantValue || 0)}
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
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Salvando...' : project ? 'Atualizar' : 'Criar'} Projeto
        </Button>
      </div>
    </form>
  );
}
