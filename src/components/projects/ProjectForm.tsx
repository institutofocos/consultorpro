import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Plus, Trash2, Calendar } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Project, Stage } from "./types";
import { supabase } from '@/integrations/supabase/client';
import { SearchableSelect } from "@/components/ui/searchable-select";
import ProjectStageForm from './ProjectStageForm';

interface ProjectFormProps {
  project?: Project | null;
  onProjectSaved: (project: Project) => void;
  onCancel: () => void;
}

export const ProjectForm: React.FC<ProjectFormProps> = ({ 
  project, 
  onProjectSaved, 
  onCancel 
}) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [consultants, setConsultants] = useState<any[]>([]);
  const [formData, setFormData] = useState({
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
    hourlyRate: 0,
    status: 'planned' as const,
    tags: [] as string[]
  });
  const [stages, setStages] = useState<Stage[]>([]);

  useEffect(() => {
    loadFormData();
  }, []);

  useEffect(() => {
    if (project) {
      setFormData({
        name: project.name,
        description: project.description || '',
        serviceId: project.serviceId || '',
        clientId: project.clientId || '',
        mainConsultantId: project.mainConsultantId || '',
        mainConsultantCommission: project.mainConsultantCommission,
        supportConsultantId: project.supportConsultantId || '',
        supportConsultantCommission: project.supportConsultantCommission,
        startDate: project.startDate,
        endDate: project.endDate,
        totalValue: project.totalValue,
        taxPercent: project.taxPercent,
        thirdPartyExpenses: project.thirdPartyExpenses || 0,
        consultantValue: project.consultantValue || 0,
        supportConsultantValue: project.supportConsultantValue || 0,
        managerName: project.managerName || '',
        managerEmail: project.managerEmail || '',
        managerPhone: project.managerPhone || '',
        hourlyRate: project.hourlyRate || 0,
        status: project.status,
        tags: project.tags || []
      });
      setStages(project.stages || []);
    }
  }, [project]);

  const loadFormData = async () => {
    try {
      // Carregar clientes
      const { data: clientsData } = await supabase
        .from('clients')
        .select('id, name')
        .order('name');
      setClients(clientsData || []);

      // Carregar serviços
      const { data: servicesData } = await supabase
        .from('services')
        .select('*')
        .order('name');
      setServices(servicesData || []);

      // Carregar consultores
      const { data: consultantsData } = await supabase
        .from('consultants')
        .select('id, name, commission_percentage')
        .order('name');
      setConsultants(consultantsData || []);
    } catch (error) {
      console.error('Error loading form data:', error);
    }
  };

  // Função para carregar etapas do serviço selecionado
  const loadServiceStages = async (serviceId: string) => {
    try {
      const { data: serviceData } = await supabase
        .from('services')
        .select('*')
        .eq('id', serviceId)
        .single();

      if (serviceData && serviceData.stages) {
        const serviceStages = serviceData.stages.map((stage: any, index: number) => ({
          id: `temp-${Date.now()}-${index}`,
          projectId: '',
          name: stage.name || '',
          description: stage.description || '', // Incluir descrição
          days: stage.days || 1,
          hours: stage.hours || 8,
          value: stage.value || 0,
          startDate: '',
          endDate: '',
          consultantId: '',
          completed: false,
          clientApproved: false,
          managerApproved: false,
          invoiceIssued: false,
          paymentReceived: false,
          consultantsSettled: false,
          attachment: '',
          stageOrder: stage.order || index + 1
        }));

        setStages(serviceStages);
        
        // Atualizar valores baseados no serviço
        setFormData(prev => ({
          ...prev,
          totalValue: serviceData.total_value || 0,
          taxPercent: serviceData.tax_rate || 16,
          hourlyRate: serviceData.hourly_rate || 0
        }));

        toast({
          title: "Etapas carregadas",
          description: `${serviceStages.length} etapas foram carregadas do serviço selecionado.`
        });
      }
    } catch (error) {
      console.error('Error loading service stages:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível carregar as etapas do serviço."
      });
    }
  };

  const handleServiceChange = (serviceId: string) => {
    setFormData(prev => ({ ...prev, serviceId }));
    
    // Se não estamos editando um projeto existente, carregar etapas do serviço
    if (!project?.id && serviceId) {
      loadServiceStages(serviceId);
    }
  };

  const addStage = () => {
    const newStage: Stage = {
      id: `temp-${Date.now()}`,
      projectId: '',
      name: '',
      description: '',
      days: 1,
      hours: 8,
      value: 0,
      startDate: '',
      endDate: '',
      consultantId: '',
      completed: false,
      clientApproved: false,
      managerApproved: false,
      invoiceIssued: false,
      paymentReceived: false,
      consultantsSettled: false,
      attachment: '',
      stageOrder: stages.length + 1
    };
    setStages([...stages, newStage]);
  };

  const updateStage = (index: number, field: keyof Stage, value: any) => {
    const updatedStages = [...stages];
    updatedStages[index] = { ...updatedStages[index], [field]: value };
    setStages(updatedStages);
  };

  const removeStage = (index: number) => {
    const updatedStages = stages.filter((_, i) => i !== index);
    const reorderedStages = updatedStages.map((stage, i) => ({
      ...stage,
      stageOrder: i + 1
    }));
    setStages(reorderedStages);
  };

  const calculateDates = () => {
    if (!formData.startDate || stages.length === 0) return;

    let currentDate = new Date(formData.startDate);
    const updatedStages = stages.map(stage => {
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

    setStages(updatedStages);
    
    const lastStage = updatedStages[updatedStages.length - 1];
    if (lastStage) {
      setFormData(prev => ({ ...prev, endDate: lastStage.endDate || '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const projectData: Project = {
        id: project?.id || '',
        name: formData.name,
        description: formData.description,
        serviceId: formData.serviceId || undefined,
        clientId: formData.clientId || undefined,
        mainConsultantId: formData.mainConsultantId || undefined,
        mainConsultantCommission: formData.mainConsultantCommission,
        supportConsultantId: formData.supportConsultantId || undefined,
        supportConsultantCommission: formData.supportConsultantCommission,
        startDate: formData.startDate,
        endDate: formData.endDate,
        totalValue: formData.totalValue,
        taxPercent: formData.taxPercent,
        thirdPartyExpenses: formData.thirdPartyExpenses,
        consultantValue: formData.consultantValue,
        supportConsultantValue: formData.supportConsultantValue,
        managerName: formData.managerName,
        managerEmail: formData.managerEmail,
        managerPhone: formData.managerPhone,
        hourlyRate: formData.hourlyRate,
        status: formData.status,
        tags: formData.tags,
        stages: stages
      };

      // Usar a função do arquivo projects.ts
      const { createProject, updateProject } = await import('@/integrations/supabase/projects');
      
      let savedProject: Project;
      if (project?.id) {
        savedProject = await updateProject(projectData);
      } else {
        savedProject = await createProject(projectData);
      }

      toast({
        title: "Sucesso",
        description: `Projeto ${project?.id ? 'atualizado' : 'criado'} com sucesso!`
      });

      onProjectSaved(savedProject);
    } catch (error: any) {
      console.error('Error saving project:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: error.message || `Erro ao ${project?.id ? 'atualizar' : 'criar'} projeto`
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onCancel}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h2 className="text-2xl font-bold">
            {project?.id ? 'Editar Projeto' : 'Novo Projeto'}
          </h2>
          <p className="text-muted-foreground">
            Configure os detalhes do projeto e suas etapas
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Informações Básicas */}
        <Card>
          <CardHeader>
            <CardTitle>Informações Básicas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Nome do Projeto *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="serviceId">Serviço</Label>
                <SearchableSelect
                  options={services.map(service => ({
                    value: service.id,
                    label: service.name
                  }))}
                  value={formData.serviceId}
                  onValueChange={handleServiceChange}
                  placeholder="Selecionar serviço..."
                />
              </div>
            </div>

            <div>
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="clientId">Cliente</Label>
                <SearchableSelect
                  options={clients.map(client => ({
                    value: client.id,
                    label: client.name
                  }))}
                  value={formData.clientId}
                  onValueChange={(value) => setFormData({ ...formData, clientId: value })}
                  placeholder="Selecionar cliente..."
                />
              </div>

              <div>
                <Label htmlFor="startDate">Data de Início *</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="endDate">Data de Término</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Etapas do Projeto */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Etapas do Projeto</CardTitle>
              <div className="flex gap-2">
                <Button type="button" onClick={calculateDates} variant="outline" size="sm">
                  <Calendar className="mr-2 h-4 w-4" />
                  Calcular Datas
                </Button>
                <Button type="button" onClick={addStage} size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  Adicionar Etapa
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {stages.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">
                  Nenhuma etapa adicionada. {!project?.id && formData.serviceId ? 
                    'Selecione um serviço para carregar etapas automaticamente ou' : 
                    'Clique em "Adicionar Etapa" para começar.'
                  }
                </p>
              </div>
            ) : (
              <ProjectStageForm
                stages={stages}
                onStagesChange={setStages}
                consultants={consultants}
              />
            )}
          </CardContent>
        </Card>

        {/* Consultores */}
        <Card>
          <CardHeader>
            <CardTitle>Consultores</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="mainConsultantId">Consultor Principal</Label>
                <SearchableSelect
                  options={consultants.map(consultant => ({
                    value: consultant.id,
                    label: consultant.name
                  }))}
                  value={formData.mainConsultantId}
                  onValueChange={(value) => {
                    const consultant = consultants.find(c => c.id === value);
                    setFormData({ 
                      ...formData, 
                      mainConsultantId: value,
                      mainConsultantCommission: consultant?.commission_percentage || 0
                    });
                  }}
                  placeholder="Selecionar consultor..."
                />
              </div>

              <div>
                <Label htmlFor="mainConsultantCommission">Comissão (%)</Label>
                <Input
                  id="mainConsultantCommission"
                  type="number"
                  step="0.01"
                  value={formData.mainConsultantCommission}
                  onChange={(e) => setFormData({ ...formData, mainConsultantCommission: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="supportConsultantId">Consultor de Apoio</Label>
                <SearchableSelect
                  options={consultants.map(consultant => ({
                    value: consultant.id,
                    label: consultant.name
                  }))}
                  value={formData.supportConsultantId}
                  onValueChange={(value) => {
                    const consultant = consultants.find(c => c.id === value);
                    setFormData({ 
                      ...formData, 
                      supportConsultantId: value,
                      supportConsultantCommission: consultant?.commission_percentage || 0
                    });
                  }}
                  placeholder="Selecionar consultor de apoio..."
                />
              </div>

              <div>
                <Label htmlFor="supportConsultantCommission">Comissão (%)</Label>
                <Input
                  id="supportConsultantCommission"
                  type="number"
                  step="0.01"
                  value={formData.supportConsultantCommission}
                  onChange={(e) => setFormData({ ...formData, supportConsultantCommission: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Valores */}
        <Card>
          <CardHeader>
            <CardTitle>Valores e Configurações</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="totalValue">Valor Total (R$) *</Label>
                <Input
                  id="totalValue"
                  type="number"
                  step="0.01"
                  value={formData.totalValue}
                  onChange={(e) => setFormData({ ...formData, totalValue: parseFloat(e.target.value) || 0 })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="taxPercent">Taxa de Imposto (%)</Label>
                <Input
                  id="taxPercent"
                  type="number"
                  step="0.01"
                  value={formData.taxPercent}
                  onChange={(e) => setFormData({ ...formData, taxPercent: parseFloat(e.target.value) || 0 })}
                />
              </div>

              <div>
                <Label htmlFor="hourlyRate">Valor por Hora (R$)</Label>
                <Input
                  id="hourlyRate"
                  type="number"
                  step="0.01"
                  value={formData.hourlyRate}
                  onChange={(e) => setFormData({ ...formData, hourlyRate: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="consultantValue">Valor Consultor Principal (R$)</Label>
                <Input
                  id="consultantValue"
                  type="number"
                  step="0.01"
                  value={formData.consultantValue}
                  onChange={(e) => setFormData({ ...formData, consultantValue: parseFloat(e.target.value) || 0 })}
                />
              </div>

              <div>
                <Label htmlFor="supportConsultantValue">Valor Consultor Apoio (R$)</Label>
                <Input
                  id="supportConsultantValue"
                  type="number"
                  step="0.01"
                  value={formData.supportConsultantValue}
                  onChange={(e) => setFormData({ ...formData, supportConsultantValue: parseFloat(e.target.value) || 0 })}
                />
              </div>

              <div>
                <Label htmlFor="thirdPartyExpenses">Gastos Terceiros (R$)</Label>
                <Input
                  id="thirdPartyExpenses"
                  type="number"
                  step="0.01"
                  value={formData.thirdPartyExpenses}
                  onChange={(e) => setFormData({ ...formData, thirdPartyExpenses: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Botões de Ação */}
        <div className="flex gap-4 justify-end">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button type="submit" disabled={loading || !formData.name.trim()}>
            {loading ? 'Salvando...' : (project?.id ? 'Atualizar' : 'Criar')} Projeto
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ProjectForm;
