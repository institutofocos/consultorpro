import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { X, Save, Plus, Calendar, DollarSign } from 'lucide-react';
import { fetchConsultants, fetchServices, fetchTags, createProject, updateProject } from '@/integrations/supabase/projects';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Project, Stage, ProjectTag } from './types';
import ProjectFormStageSection from './ProjectFormStageSection';

interface ProjectFormProps {
  project?: Project;
  onProjectSaved: (project: Project) => void;
  onCancel: () => void;
}

const ProjectForm: React.FC<ProjectFormProps> = ({ project, onProjectSaved, onCancel }) => {
  const [formData, setFormData] = useState<Partial<Project>>({
    name: '',
    description: '',
    clientId: '',
    serviceId: '',
    mainConsultantId: '',
    supportConsultantId: '',
    mainConsultantCommission: 0,
    supportConsultantCommission: 0,
    startDate: '',
    endDate: '',
    totalValue: 0,
    totalHours: 0,
    hourlyRate: 0,
    taxPercent: 16,
    thirdPartyExpenses: 0,
    mainConsultantValue: 0,
    supportConsultantValue: 0,
    managerName: '',
    managerEmail: '',
    managerPhone: '',
    status: 'planned',
    url: '',
    tagIds: [],
    stages: []
  });

  const [consultants, setConsultants] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [tags, setTags] = useState<ProjectTag[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (project) {
      setFormData({
        ...project,
        tagIds: project.tagIds || []
      });
    }
  }, [project]);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setIsLoading(true);
    try {
      const [consultantsData, servicesData, clientsData, tagsData] = await Promise.all([
        fetchConsultants(),
        fetchServices(),
        fetchClients(),
        fetchTags()
      ]);

      setConsultants(consultantsData);
      setServices(servicesData);
      setClients(clientsData);
      setTags(tagsData);
    } catch (error) {
      console.error('Erro ao buscar dados iniciais:', error);
      toast.error('Erro ao carregar dados');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchClients = async () => {
    const { data, error } = await supabase
      .from('clients')
      .select('id, name, contact_name, email, phone')
      .order('name');

    if (error) throw error;
    return data || [];
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name?.trim()) {
      toast.error('Nome do projeto é obrigatório');
      return;
    }

    if (!formData.startDate || !formData.endDate) {
      toast.error('Datas de início e fim são obrigatórias');
      return;
    }

    if (!formData.clientId) {
      toast.error('Cliente é obrigatório');
      return;
    }

    setIsSubmitting(true);
    try {
      const projectData = {
        ...formData,
        name: formData.name.trim(),
        description: formData.description?.trim() || '',
        totalValue: Number(formData.totalValue) || 0,
        totalHours: Number(formData.totalHours) || 0,
        hourlyRate: Number(formData.hourlyRate) || 0,
        taxPercent: Number(formData.taxPercent) || 16,
        thirdPartyExpenses: Number(formData.thirdPartyExpenses) || 0,
        mainConsultantValue: Number(formData.mainConsultantValue) || 0,
        supportConsultantValue: Number(formData.supportConsultantValue) || 0,
        mainConsultantCommission: Number(formData.mainConsultantCommission) || 0,
        supportConsultantCommission: Number(formData.supportConsultantCommission) || 0,
        stages: formData.stages || []
      } as Project;

      if (project?.id) {
        // Update existing project
        await updateProject(project.id, projectData);
        toast.success('Projeto atualizado com sucesso!');
        
        // Transform database response to Project format
        const { data: updatedProjectData, error } = await supabase
          .from('projects')
          .select('*')
          .eq('id', project.id)
          .single();

        if (error) throw error;
        
        // Map database fields to Project interface
        const transformedProject: Project = {
          id: updatedProjectData.id,
          projectId: updatedProjectData.project_id,
          name: updatedProjectData.name,
          description: updatedProjectData.description,
          clientId: updatedProjectData.client_id,
          serviceId: updatedProjectData.service_id,
          mainConsultantId: updatedProjectData.main_consultant_id,
          supportConsultantId: updatedProjectData.support_consultant_id,
          mainConsultantCommission: updatedProjectData.main_consultant_commission || 0,
          supportConsultantCommission: updatedProjectData.support_consultant_commission || 0,
          startDate: updatedProjectData.start_date,
          endDate: updatedProjectData.end_date,
          totalValue: updatedProjectData.total_value || 0,
          totalHours: updatedProjectData.total_hours || 0,
          hourlyRate: updatedProjectData.hourly_rate || 0,
          taxPercent: updatedProjectData.tax_percent || 16,
          thirdPartyExpenses: updatedProjectData.third_party_expenses || 0,
          mainConsultantValue: updatedProjectData.main_consultant_value || 0,
          supportConsultantValue: updatedProjectData.support_consultant_value || 0,
          managerName: updatedProjectData.manager_name,
          managerEmail: updatedProjectData.manager_email,
          managerPhone: updatedProjectData.manager_phone,
          status: updatedProjectData.status,
          url: updatedProjectData.url,
          tags: updatedProjectData.tags || [],
          createdAt: updatedProjectData.created_at,
          updatedAt: updatedProjectData.updated_at,
          stages: []
        };
        
        onProjectSaved(transformedProject);
      } else {
        // Create new project
        const newProject = await createProject(projectData);
        toast.success('Projeto criado com sucesso!');
        onProjectSaved(newProject);
      }

      onCancel();
    } catch (error) {
      console.error('Erro ao salvar projeto:', error);
      toast.error('Erro ao salvar projeto');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleTagToggle = (tagId: string) => {
    const currentTags = formData.tagIds || [];
    if (currentTags.includes(tagId)) {
      handleInputChange('tagIds', currentTags.filter(id => id !== tagId));
    } else {
      handleInputChange('tagIds', [...currentTags, tagId]);
    }
  };

  const handleStagesChange = (stages: Stage[]) => {
    handleInputChange('stages', stages);
  };

  if (isLoading) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-32">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <p className="text-sm text-muted-foreground">Carregando...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            {project ? 'Editar Projeto' : 'Novo Projeto'}
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome do Projeto *</Label>
              <Input
                id="name"
                value={formData.name || ''}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Digite o nome do projeto..."
                required
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="projectId">ID do Projeto</Label>
              <Input
                id="projectId"
                value={formData.projectId || ''}
                onChange={(e) => handleInputChange('projectId', e.target.value)}
                placeholder="Digite o ID do projeto..."
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={formData.description || ''}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Descreva o projeto..."
              rows={3}
              disabled={isSubmitting}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Data de Início *</Label>
              <Input
                type="date"
                id="startDate"
                value={formData.startDate || ''}
                onChange={(e) => handleInputChange('startDate', e.target.value)}
                required
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="endDate">Data de Término *</Label>
              <Input
                type="date"
                id="endDate"
                value={formData.endDate || ''}
                onChange={(e) => handleInputChange('endDate', e.target.value)}
                required
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="url">URL</Label>
              <Input
                type="url"
                id="url"
                value={formData.url || ''}
                onChange={(e) => handleInputChange('url', e.target.value)}
                placeholder="https://..."
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="totalValue">Valor Total</Label>
              <Input
                type="number"
                id="totalValue"
                value={formData.totalValue || 0}
                onChange={(e) => handleInputChange('totalValue', Number(e.target.value))}
                placeholder="0.00"
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="totalHours">Total de Horas</Label>
              <Input
                type="number"
                id="totalHours"
                value={formData.totalHours || 0}
                onChange={(e) => handleInputChange('totalHours', Number(e.target.value))}
                placeholder="0"
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="hourlyRate">Valor por Hora</Label>
              <Input
                type="number"
                id="hourlyRate"
                value={formData.hourlyRate || 0}
                onChange={(e) => handleInputChange('hourlyRate', Number(e.target.value))}
                placeholder="0.00"
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="taxPercent">Imposto (%)</Label>
              <Input
                type="number"
                id="taxPercent"
                value={formData.taxPercent || 16}
                onChange={(e) => handleInputChange('taxPercent', Number(e.target.value))}
                placeholder="16"
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="thirdPartyExpenses">Despesas de Terceiros</Label>
              <Input
                type="number"
                id="thirdPartyExpenses"
                value={formData.thirdPartyExpenses || 0}
                onChange={(e) => handleInputChange('thirdPartyExpenses', Number(e.target.value))}
                placeholder="0.00"
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status || 'planned'}
                onValueChange={(value) => handleInputChange('status', value)}
                disabled={isSubmitting}
              >
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
          </div>

          <div className="space-y-2">
            <Label htmlFor="clientId">Cliente *</Label>
            <Select
              value={formData.clientId || ''}
              onValueChange={(value) => handleInputChange('clientId', value)}
              required
              disabled={isSubmitting}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione um cliente" />
              </SelectTrigger>
              <SelectContent>
                {clients.map((client) => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="serviceId">Serviço</Label>
            <Select
              value={formData.serviceId || ''}
              onValueChange={(value) => handleInputChange('serviceId', value)}
              disabled={isSubmitting}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione um serviço" />
              </SelectTrigger>
              <SelectContent>
                {services.map((service) => (
                  <SelectItem key={service.id} value={service.id}>
                    {service.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="mainConsultantId">Consultor Principal</Label>
              <Select
                value={formData.mainConsultantId || ''}
                onValueChange={(value) => handleInputChange('mainConsultantId', value)}
                disabled={isSubmitting}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um consultor" />
                </SelectTrigger>
                <SelectContent>
                  {consultants.map((consultant) => (
                    <SelectItem key={consultant.id} value={consultant.id}>
                      {consultant.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="mainConsultantCommission">Comissão (%)</Label>
              <Input
                type="number"
                id="mainConsultantCommission"
                value={formData.mainConsultantCommission || 0}
                onChange={(e) => handleInputChange('mainConsultantCommission', Number(e.target.value))}
                placeholder="0"
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="supportConsultantId">Consultor de Apoio</Label>
              <Select
                value={formData.supportConsultantId || ''}
                onValueChange={(value) => handleInputChange('supportConsultantId', value)}
                disabled={isSubmitting}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um consultor" />
                </SelectTrigger>
                <SelectContent>
                  {consultants.map((consultant) => (
                    <SelectItem key={consultant.id} value={consultant.id}>
                      {consultant.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="supportConsultantCommission">Comissão (%)</Label>
              <Input
                type="number"
                id="supportConsultantCommission"
                value={formData.supportConsultantCommission || 0}
                onChange={(e) => handleInputChange('supportConsultantCommission', Number(e.target.value))}
                placeholder="0"
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="mainConsultantValue">Valor Consultor Principal</Label>
              <Input
                type="number"
                id="mainConsultantValue"
                value={formData.mainConsultantValue || 0}
                onChange={(e) => handleInputChange('mainConsultantValue', Number(e.target.value))}
                placeholder="0.00"
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="supportConsultantValue">Valor Consultor Apoio</Label>
              <Input
                type="number"
                id="supportConsultantValue"
                value={formData.supportConsultantValue || 0}
                onChange={(e) => handleInputChange('supportConsultantValue', Number(e.target.value))}
                placeholder="0.00"
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="taxPercent">Imposto (%)</Label>
              <Input
                type="number"
                id="taxPercent"
                value={formData.taxPercent || 16}
                onChange={(e) => handleInputChange('taxPercent', Number(e.target.value))}
                placeholder="16"
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="managerName">Nome do Gerente</Label>
              <Input
                type="text"
                id="managerName"
                value={formData.managerName || ''}
                onChange={(e) => handleInputChange('managerName', e.target.value)}
                placeholder="Nome do gerente..."
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="managerEmail">Email do Gerente</Label>
              <Input
                type="email"
                id="managerEmail"
                value={formData.managerEmail || ''}
                onChange={(e) => handleInputChange('managerEmail', e.target.value)}
                placeholder="Email do gerente..."
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="managerPhone">Telefone do Gerente</Label>
              <Input
                type="tel"
                id="managerPhone"
                value={formData.managerPhone || ''}
                onChange={(e) => handleInputChange('managerPhone', e.target.value)}
                placeholder="Telefone do gerente..."
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Tags</Label>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <Badge
                  key={tag.id}
                  variant={formData.tagIds?.includes(tag.id) ? 'default' : 'secondary'}
                  className="cursor-pointer"
                  onClick={() => handleTagToggle(tag.id)}
                >
                  {tag.name}
                </Badge>
              ))}
            </div>
          </div>

          <ProjectFormStageSection
            stages={formData.stages || []}
            onStagesChange={handleStagesChange}
            disabled={isSubmitting}
          />
          
          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2"
            >
              {isSubmitting ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <Save className="h-4 w-4" />
              )}
              {isSubmitting ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default ProjectForm;
