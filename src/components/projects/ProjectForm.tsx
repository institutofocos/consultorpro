
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarIcon, PlusIcon, TrashIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { createProject, updateProject } from "@/integrations/supabase/projects";
import { Project, Stage } from "./types";

interface ProjectFormProps {
  project?: Project;
  onProjectSaved: (project: Project) => void;
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
    status: 'planned',
    tags: [],
    stages: []
  });

  const [clients, setClients] = useState([]);
  const [services, setServices] = useState([]);
  const [consultants, setConsultants] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchSelectOptions();
    if (project) {
      setFormData({
        ...project,
        serviceId: project.serviceId || '',
        clientId: project.clientId || '',
        mainConsultantId: project.mainConsultantId || '',
        supportConsultantId: project.supportConsultantId || '',
        stages: project.stages || []
      });
    }
  }, [project]);

  const fetchSelectOptions = async () => {
    try {
      const [clientsRes, servicesRes, consultantsRes] = await Promise.all([
        supabase.from('clients').select('id, name').order('name'),
        supabase.from('services').select('id, name, stages').order('name'),
        supabase.from('consultants').select('id, name').order('name')
      ]);

      if (clientsRes.data) setClients(clientsRes.data);
      if (servicesRes.data) setServices(servicesRes.data);
      if (consultantsRes.data) setConsultants(consultantsRes.data);
    } catch (error) {
      console.error('Error fetching select options:', error);
      toast.error('Erro ao carregar opções do formulário');
    }
  };

  const handleServiceChange = (serviceId: string) => {
    setFormData(prev => ({ ...prev, serviceId }));
    
    const selectedService = services.find(s => s.id === serviceId);
    if (selectedService && selectedService.stages) {
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
          stageOrder: index + 1
        }));
        
        setFormData(prev => ({ ...prev, stages: newStages }));
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
      stageOrder: (formData.stages?.length || 0) + 1
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
    // Reorder stages
    const reorderedStages = updatedStages.map((stage, i) => ({
      ...stage,
      stageOrder: i + 1
    }));
    setFormData(prev => ({ ...prev, stages: reorderedStages }));
  };

  const calculateTotals = () => {
    const stagesTotal = (formData.stages || []).reduce((sum, stage) => sum + Number(stage.value || 0), 0);
    const thirdPartyExpenses = Number(formData.thirdPartyExpenses || 0);
    const totalValue = stagesTotal + thirdPartyExpenses;
    
    setFormData(prev => ({ ...prev, totalValue }));
  };

  useEffect(() => {
    calculateTotals();
  }, [formData.stages, formData.thirdPartyExpenses]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (!formData.name || !formData.startDate || !formData.endDate) {
        toast.error('Preencha todos os campos obrigatórios');
        return;
      }

      // Validate and clean stage dates
      const cleanedStages = (formData.stages || []).map(stage => ({
        ...stage,
        startDate: stage.startDate?.trim() || '',
        endDate: stage.endDate?.trim() || ''
      }));

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
        status: formData.status as 'planned' | 'active' | 'completed' | 'cancelled',
        tags: formData.tags || [],
        stages: cleanedStages
      };

      let savedProject: Project;
      if (project?.id) {
        savedProject = await updateProject(projectData);
        toast.success('Projeto atualizado com sucesso!');
      } else {
        savedProject = await createProject(projectData);
        toast.success('Projeto criado com sucesso!');
      }

      onProjectSaved(savedProject);
    } catch (error) {
      console.error('Error saving project:', error);
      toast.error('Erro ao salvar projeto');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{project ? 'Editar Projeto' : 'Novo Projeto'}</CardTitle>
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
            />
          </div>

          {/* Cliente e Serviço */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="client">Cliente</Label>
              <Select value={formData.clientId} onValueChange={(value) => setFormData(prev => ({ ...prev, clientId: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um cliente" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map(client => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="service">Serviço</Label>
              <Select value={formData.serviceId} onValueChange={handleServiceChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um serviço" />
                </SelectTrigger>
                <SelectContent>
                  {services.map(service => (
                    <SelectItem key={service.id} value={service.id}>
                      {service.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Consultores */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="mainConsultant">Consultor Principal</Label>
              <Select value={formData.mainConsultantId} onValueChange={(value) => setFormData(prev => ({ ...prev, mainConsultantId: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o consultor principal" />
                </SelectTrigger>
                <SelectContent>
                  {consultants.map(consultant => (
                    <SelectItem key={consultant.id} value={consultant.id}>
                      {consultant.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="supportConsultant">Consultor de Apoio</Label>
              <Select value={formData.supportConsultantId} onValueChange={(value) => setFormData(prev => ({ ...prev, supportConsultantId: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o consultor de apoio" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Nenhum</SelectItem>
                  {consultants.map(consultant => (
                    <SelectItem key={consultant.id} value={consultant.id}>
                      {consultant.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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

          {/* Status */}
          <div>
            <Label htmlFor="status">Status</Label>
            <Select value={formData.status} onValueChange={(value) => setFormData(prev => ({ ...prev, status: value as any }))}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="planned">Planejado</SelectItem>
                <SelectItem value="active">Ativo</SelectItem>
                <SelectItem value="completed">Concluído</SelectItem>
                <SelectItem value="cancelled">Cancelado</SelectItem>
              </SelectContent>
            </Select>
          </div>
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
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">
              Nenhuma etapa adicionada. Clique em "Adicionar Etapa" para começar.
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

          <div className="border-t pt-4">
            <div className="flex justify-between items-center font-medium">
              <span>Valor Total do Projeto:</span>
              <span className="text-lg">
                {new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL'
                }).format(formData.totalValue || 0)}
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
