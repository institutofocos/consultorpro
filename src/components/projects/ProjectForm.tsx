import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useConsultants } from "@/hooks/useConsultants";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import SearchableSelect from "@/components/ui/searchable-select";
import ProjectFormStageSection from "./ProjectFormStageSection";
import { useProjectCreation } from "@/hooks/useProjectCreation";
import { Stage } from "./types";

interface ProjectFormProps {
  onClose: () => void;
  onSave: () => void;
}

interface Client {
  id: string;
  name: string;
}

interface Service {
  id: string;
  name: string;
}

const ProjectForm: React.FC<ProjectFormProps> = ({ onClose, onSave }) => {
  const { consultants } = useConsultants();
  const { createProjectWithStages, isCreating } = useProjectCreation();
  
  const [clients, setClients] = useState<Client[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [stages, setStages] = useState<Stage[]>([]);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    clientId: '',
    serviceId: '',
    mainConsultantId: '',
    supportConsultantId: '',
    startDate: '',
    endDate: '',
    totalValue: 0,
    totalHours: 0,
    hourlyRate: 0,
    taxPercent: 16,
    thirdPartyExpenses: 0,
    mainConsultantValue: 0,
    supportConsultantValue: 0,
    mainConsultantCommission: 0,
    supportConsultantCommission: 0,
    managerName: '',
    managerEmail: '',
    managerPhone: '',
    url: '',
    projectId: '',
    status: 'planned'
  });

  useEffect(() => {
    const fetchClients = async () => {
      const { data, error } = await supabase.from('clients').select('id, name');
      if (error) {
        console.error('Error fetching clients:', error);
        toast.error('Erro ao carregar clientes');
      } else {
        setClients(data || []);
      }
    };

    const fetchServices = async () => {
      const { data, error } = await supabase.from('services').select('id, name');
      if (error) {
        console.error('Error fetching services:', error);
        toast.error('Erro ao carregar serviços');
      } else {
        setServices(data || []);
      }
    };

    fetchClients();
    fetchServices();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error('Nome do projeto é obrigatório');
      return;
    }

    if (!formData.startDate || !formData.endDate) {
      toast.error('Datas de início e fim são obrigatórias');
      return;
    }

    try {
      console.log('Enviando dados do projeto:', formData);
      console.log('Etapas do projeto:', stages);

      // Preparar dados do projeto
      const projectData = {
        name: formData.name,
        description: formData.description,
        client_id: formData.clientId || null,
        service_id: formData.serviceId || null,
        main_consultant_id: formData.mainConsultantId || null,
        support_consultant_id: formData.supportConsultantId || null,
        start_date: formData.startDate,
        end_date: formData.endDate,
        total_value: formData.totalValue,
        total_hours: formData.totalHours || null,
        hourly_rate: formData.hourlyRate || null,
        tax_percent: formData.taxPercent,
        third_party_expenses: formData.thirdPartyExpenses || null,
        main_consultant_value: formData.mainConsultantValue || null,
        support_consultant_value: formData.supportConsultantValue || null,
        main_consultant_commission: formData.mainConsultantCommission || null,
        support_consultant_commission: formData.supportConsultantCommission || null,
        manager_name: formData.managerName || null,
        manager_email: formData.managerEmail || null,
        manager_phone: formData.managerPhone || null,
        url: formData.url || null,
        project_id: formData.projectId || null,
        status: formData.status
      };

      // Preparar dados das etapas
      const stageData = stages.map((stage, index) => ({
        name: stage.name,
        description: stage.description,
        days: stage.days,
        hours: stage.hours,
        value: stage.value,
        start_date: stage.startDate || null,
        end_date: stage.endDate || null,
        consultant_id: stage.consultantId || null,
        status: stage.status,
        valor_de_repasse: stage.valorDeRepasse || 0,
        stage_order: index + 1
      }));

      // Usar o hook de criação consolidada
      const result = await createProjectWithStages(projectData, stageData);

      if (result.success) {
        onSave();
        onClose();
      }
      
    } catch (error) {
      console.error('Erro ao salvar projeto:', error);
      toast.error('Erro ao salvar projeto');
    }
  };

  const consultantOptions = consultants.map(consultant => ({
    id: consultant.id,
    name: consultant.name
  }));

  const clientOptions = clients.map(client => ({
    id: client.id,
    name: client.name
  }));

  const serviceOptions = services.map(service => ({
    id: service.id,
    name: service.name
  }));

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-lg w-full max-w-6xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Novo Projeto</h2>
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            
            <Card>
              <CardHeader>
                <CardTitle>Informações Básicas</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Nome do Projeto *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Nome do projeto"
                    required
                  />
                </div>

                <div>
                  <Label>Cliente</Label>
                  <SearchableSelect
                    options={[{ id: '', name: 'Nenhum' }, ...clientOptions]}
                    value={formData.clientId}
                    onValueChange={(value) => setFormData({ ...formData, clientId: value as string })}
                    placeholder="Selecione um cliente"
                    searchPlaceholder="Pesquisar clientes..."
                    emptyText="Nenhum cliente encontrado"
                  />
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Descrição do projeto"
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Informações Adicionais</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Serviço</Label>
                  <SearchableSelect
                    options={[{ id: '', name: 'Nenhum' }, ...serviceOptions]}
                    value={formData.serviceId}
                    onValueChange={(value) => setFormData({ ...formData, serviceId: value as string })}
                    placeholder="Selecione um serviço"
                    searchPlaceholder="Pesquisar serviços..."
                    emptyText="Nenhum serviço encontrado"
                  />
                </div>

                <div>
                  <Label>Consultor Principal</Label>
                  <SearchableSelect
                    options={[{ id: '', name: 'Nenhum' }, ...consultantOptions]}
                    value={formData.mainConsultantId}
                    onValueChange={(value) => setFormData({ ...formData, mainConsultantId: value as string })}
                    placeholder="Selecione um consultor"
                    searchPlaceholder="Pesquisar consultores..."
                    emptyText="Nenhum consultor encontrado"
                  />
                </div>

                <div>
                  <Label>Consultor de Apoio</Label>
                  <SearchableSelect
                    options={[{ id: '', name: 'Nenhum' }, ...consultantOptions]}
                    value={formData.supportConsultantId}
                    onValueChange={(value) => setFormData({ ...formData, supportConsultantId: value as string })}
                    placeholder="Selecione um consultor"
                    searchPlaceholder="Pesquisar consultores..."
                    emptyText="Nenhum consultor encontrado"
                  />
                </div>

                <div>
                  <Label htmlFor="url">URL do Projeto</Label>
                  <Input
                    id="url"
                    type="url"
                    value={formData.url}
                    onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                    placeholder="URL do projeto"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Datas e Valores</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
                  <Label htmlFor="endDate">Data de Término *</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="totalValue">Valor Total (R$)</Label>
                  <Input
                    id="totalValue"
                    type="number"
                    step="0.01"
                    value={formData.totalValue}
                    onChange={(e) => setFormData({ ...formData, totalValue: Number(e.target.value) })}
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <Label htmlFor="totalHours">Total de Horas</Label>
                  <Input
                    id="totalHours"
                    type="number"
                    value={formData.totalHours}
                    onChange={(e) => setFormData({ ...formData, totalHours: Number(e.target.value) })}
                    placeholder="0"
                  />
                </div>

                <div>
                  <Label htmlFor="hourlyRate">Valor por Hora (R$)</Label>
                  <Input
                    id="hourlyRate"
                    type="number"
                    step="0.01"
                    value={formData.hourlyRate}
                    onChange={(e) => setFormData({ ...formData, hourlyRate: Number(e.target.value) })}
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <Label htmlFor="taxPercent">Taxa (%)</Label>
                  <Input
                    id="taxPercent"
                    type="number"
                    value={formData.taxPercent}
                    onChange={(e) => setFormData({ ...formData, taxPercent: Number(e.target.value) })}
                    placeholder="0"
                  />
                </div>

                <div>
                  <Label htmlFor="thirdPartyExpenses">Despesas de Terceiros (R$)</Label>
                  <Input
                    id="thirdPartyExpenses"
                    type="number"
                    step="0.01"
                    value={formData.thirdPartyExpenses}
                    onChange={(e) => setFormData({ ...formData, thirdPartyExpenses: Number(e.target.value) })}
                    placeholder="0.00"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Comissões</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="mainConsultantValue">Valor Consultor Principal (R$)</Label>
                  <Input
                    id="mainConsultantValue"
                    type="number"
                    step="0.01"
                    value={formData.mainConsultantValue}
                    onChange={(e) => setFormData({ ...formData, mainConsultantValue: Number(e.target.value) })}
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <Label htmlFor="supportConsultantValue">Valor Consultor de Apoio (R$)</Label>
                  <Input
                    id="supportConsultantValue"
                    type="number"
                    step="0.01"
                    value={formData.supportConsultantValue}
                    onChange={(e) => setFormData({ ...formData, supportConsultantValue: Number(e.target.value) })}
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <Label htmlFor="mainConsultantCommission">Comissão Consultor Principal (%)</Label>
                  <Input
                    id="mainConsultantCommission"
                    type="number"
                    value={formData.mainConsultantCommission}
                    onChange={(e) => setFormData({ ...formData, mainConsultantCommission: Number(e.target.value) })}
                    placeholder="0"
                  />
                </div>

                <div>
                  <Label htmlFor="supportConsultantCommission">Comissão Consultor de Apoio (%)</Label>
                  <Input
                    id="supportConsultantCommission"
                    type="number"
                    value={formData.supportConsultantCommission}
                    onChange={(e) => setFormData({ ...formData, supportConsultantCommission: Number(e.target.value) })}
                    placeholder="0"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Informações do Gerente</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="managerName">Nome do Gerente</Label>
                  <Input
                    id="managerName"
                    value={formData.managerName}
                    onChange={(e) => setFormData({ ...formData, managerName: e.target.value })}
                    placeholder="Nome do gerente"
                  />
                </div>

                <div>
                  <Label htmlFor="managerEmail">Email do Gerente</Label>
                  <Input
                    id="managerEmail"
                    type="email"
                    value={formData.managerEmail}
                    onChange={(e) => setFormData({ ...formData, managerEmail: e.target.value })}
                    placeholder="Email do gerente"
                  />
                </div>

                <div>
                  <Label htmlFor="managerPhone">Telefone do Gerente</Label>
                  <Input
                    id="managerPhone"
                    type="tel"
                    value={formData.managerPhone}
                    onChange={(e) => setFormData({ ...formData, managerPhone: e.target.value })}
                    placeholder="Telefone do gerente"
                  />
                </div>
              </CardContent>
            </Card>
            
            <ProjectFormStageSection
              stages={stages}
              onStagesChange={setStages}
              consultantOptions={consultantOptions}
              startDate={formData.startDate}
            />

            <div className="flex justify-end gap-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isCreating}>
                {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Salvar Projeto
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProjectForm;
