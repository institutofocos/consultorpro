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

interface ProjectFormProps {
  project?: Project;
  onProjectSaved: (project?: Project) => void;
  onCancel: () => void;
}

export default function ProjectForm({ project, onProjectSaved, onCancel }: ProjectFormProps) {
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
    status: 'planned',
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
      console.log('Loading project data for editing:', project);
      
      // Carregar dados do projeto no formulário
      setFormData({
        ...project,
        serviceId: project.serviceId || '',
        clientId: project.clientId || '',
        mainConsultantId: project.mainConsultantId || '',
        supportConsultantId: project.supportConsultantId || '',
        stages: project.stages || [],
        url: project.url || '',
        tags: project.tags || [],
        tagIds: project.tagIds || [],
        consultantValue: project.consultantValue || 0,
        supportConsultantValue: project.supportConsultantValue || 0
      });

      // Se há um serviceId, carregar os consultores autorizados
      if (project.serviceId) {
        fetchAuthorizedConsultants(project.serviceId);
      }
    }
  }, [project]);

  // Filtrar consultores quando o serviço é selecionado
  useEffect(() => {
    if (formData.serviceId) {
      fetchAuthorizedConsultants(formData.serviceId);
    } else {
      setFilteredConsultants([]);
      // Limpar seleções de consultores quando não há serviço selecionado
      setFormData(prev => ({
        ...prev,
        mainConsultantId: '',
        supportConsultantId: ''
      }));
    }
  }, [formData.serviceId]);

  const fetchAuthorizedConsultants = async (serviceId: string) => {
    try {
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

      setFilteredConsultants(authorizedConsultants);

      // Ao editar um projeto, manter os consultores selecionados se ainda forem válidos
      if (project) {
        const validMainConsultant = authorizedConsultants.find(c => c.id === project.mainConsultantId);
        const validSupportConsultant = authorizedConsultants.find(c => c.id === project.supportConsultantId);

        if (!validMainConsultant && project.mainConsultantId) {
          console.log('Main consultant not authorized for this service, keeping selection but showing warning');
        }
        if (!validSupportConsultant && project.supportConsultantId) {
          console.log('Support consultant not authorized for this service, keeping selection but showing warning');
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

      const { data: profile } = await supabase
        .from('user_profiles')
        .select('full_name')
        .eq('id', user.id)
        .single();

      setFormData(prev => ({
        ...prev,
        managerName: profile?.full_name || user.email?.split('@')[0] || '',
        managerEmail: user.email || '',
        managerPhone: user.phone || ''
      }));
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
      if (consultantsRes.data) setConsultants(consultantsRes.data);

      // Carregar tags do projeto
      const tagsData = await fetchProjectTags();
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
      // Só limpar consultores se não estiver editando um projeto existente
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
    // Fix: Subtract third party expenses instead of adding them
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
      console.log('Dados do formulário:', formData);

      const projectData: Project = {
        id: project?.id || '',
        name: formData.name,
        description: formData.description || '',
        serviceId: formData.serviceId || undefined,
        clientId: formData.clientId || undefined,
        mainConsultantId: formData.mainConsultantId || undefined,
        mainConsultantCommission: Number(formData.mainConsultantCommission || 0),
        supportConsultantId: formData.supportConsultantId || undefined,
        supportConsultantCommission: Number(formData.supportConsultantCommission || 0),
        startDate: formData.startDate,
        endDate: formData.endDate,
        totalValue: Number(formData.totalValue || 0),
        taxPercent: Number(formData.taxPercent || 16),
        thirdPartyExpenses: Number(formData.thirdPartyExpenses || 0),
        consultantValue: Number(formData.consultantValue || 0),
        supportConsultantValue: Number(formData.supportConsultantValue || 0),
        managerName: formData.managerName,
        managerEmail: formData.managerEmail,
        managerPhone: formData.managerPhone,
        totalHours: Number(formData.totalHours || 0),
        hourlyRate: Number(formData.hourlyRate || 0),
        status: formData.status as 'planned' | 'active' | 'completed' | 'cancelled',
        tags: formData.tags || [],
        tagIds: formData.tagIds || [],
        stages: formData.stages || [],
        url: formData.url || ''
      };

      console.log('Dados do projeto preparados:', projectData);

      let savedProject: any;
      if (project?.id) {
        console.log('Atualizando projeto existente com ID:', project.id);
        savedProject = await updateProject(projectData);
        toast.success('Projeto atualizado com sucesso!');
      } else {
        console.log('Criando novo projeto');
        savedProject = await createProject(projectData);
        toast.success('Projeto criado com sucesso!');
      }

      console.log('Projeto salvo no banco:', savedProject);

      // Transform the saved project to match the Project interface
      const transformedProject: Project = {
        id: savedProject.id,
        name: savedProject.name,
        description: savedProject.description,
        serviceId: savedProject.service_id,
        clientId: savedProject.client_id,
        mainConsultantId: savedProject.main_consultant_id,
        mainConsultantCommission: savedProject.main_consultant_commission,
        supportConsultantId: savedProject.support_consultant_id,
        supportConsultantCommission: savedProject.support_consultant_commission,
        startDate: savedProject.start_date,
        endDate: savedProject.end_date,
        totalValue: savedProject.total_value,
        taxPercent: savedProject.tax_percent,
        thirdPartyExpenses: savedProject.third_party_expenses,
        consultantValue: savedProject.main_consultant_value,
        supportConsultantValue: savedProject.support_consultant_value,
        managerName: savedProject.manager_name,
        managerEmail: savedProject.manager_email,
        managerPhone: savedProject.manager_phone,
        totalHours: savedProject.total_hours,
        hourlyRate: savedProject.hourly_rate,
        status: savedProject.status,
        tags: savedProject.tags || [],
        tagIds: formData.tagIds || [],
        stages: formData.stages || [],
        url: savedProject.url || ''
      };

      console.log('Projeto transformado:', transformedProject);
      console.log('Chamando onProjectSaved...');
      
      // Call the callback with the saved project
      onProjectSaved(transformedProject);
      
      console.log('=== SUBMISSÃO CONCLUÍDA COM SUCESSO ===');
    } catch (error) {
      console.error('=== ERRO NA SUBMISSÃO ===');
      console.error('Error saving project:', error);
      toast.error('Erro ao salvar projeto: ' + (error.message || 'Erro desconhecido'));
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

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {project ? 'Editar Projeto' : 'Novo Projeto'}
            {project?.projectId && (
              <Badge variant="outline" className="ml-2">
                ID: {project.projectId}
              </Badge>
            )}
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
              <p className="text-xs text-muted-foreground mt-1">
                Selecione um serviço primeiro para visualizar os consultores habilitados
              </p>
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
                options={filteredConsultants.length > 0 ? filteredConsultants : consultants}
                value={formData.mainConsultantId || ''}
                onValueChange={(value) => setFormData(prev => ({ ...prev, mainConsultantId: value as string }))}
                placeholder={formData.serviceId ? "Selecione o consultor principal" : "Selecione um serviço primeiro"}
                searchPlaceholder="Pesquisar consultores..."
                emptyText={formData.serviceId ? "Nenhum consultor habilitado para este serviço" : "Selecione um serviço primeiro"}
              />
              {!formData.serviceId && !project && (
                <p className="text-xs text-muted-foreground mt-1">
                  Apenas consultores habilitados para o serviço selecionado aparecerão aqui
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="supportConsultant">Consultor de Apoio</Label>
              <SearchableSelect
                options={[{ id: '', name: 'Nenhum' }, ...(filteredConsultants.length > 0 ? filteredConsultants : consultants)]}
                value={formData.supportConsultantId || ''}
                onValueChange={(value) => setFormData(prev => ({ ...prev, supportConsultantId: value as string }))}
                placeholder={formData.serviceId ? "Selecione o consultor de apoio" : "Selecione um serviço primeiro"}
                searchPlaceholder="Pesquisar consultores..."
                emptyText={formData.serviceId ? "Nenhum consultor habilitado para este serviço" : "Selecione um serviço primeiro"}
              />
              {!formData.serviceId && !project && (
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

                  <div>
                    <Label>Consultor Responsável</Label>
                    <SearchableSelect
                      options={[{ id: '', name: 'Nenhum' }, ...(filteredConsultants.length > 0 ? filteredConsultants : consultants)]}
                      value={stage.consultantId || ''}
                      onValueChange={(value) => updateStage(index, 'consultantId', value as string)}
                      placeholder={formData.serviceId ? "Selecione um consultor" : "Selecione um serviço primeiro"}
                      searchPlaceholder="Pesquisar consultores..."
                      emptyText={formData.serviceId ? "Nenhum consultor habilitado para este serviço" : "Selecione um serviço primeiro"}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">
              Nenhuma etapa adicionada. Clique em "Adicionar Etapa" para começar.
            </p>
          )}
          {formData.startDate && (
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
                onChange={(e) => setFormData(prev => ({ ...prev, consultantValue: Number(e.target.value) }))}
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
