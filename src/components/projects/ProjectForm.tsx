import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CheckCircle2, AlertCircle, Calendar, Zap } from "lucide-react";
import { useWebhookProcessorContext } from "@/contexts/WebhookProcessorContext";
import ProjectFormStageSection from "./ProjectFormStageSection";

interface ProjectFormData {
  name: string;
  description: string;
  client_id: string;
  service_id: string;
  main_consultant_id: string;
  support_consultant_id: string | null;
  start_date: string;
  end_date: string;
  total_value: number;
  total_hours: number;
  hourly_rate: number;
  tax_percent: number;
  third_party_expenses: number;
  main_consultant_value: number;
  support_consultant_value: number;
  manager_name: string;
  manager_email: string;
  manager_phone: string;
  url: string;
  status: string;
}

interface Project {
  id: string;
  name: string;
  description: string;
  client_id: string;
  service_id: string;
  main_consultant_id: string;
  support_consultant_id: string | null;
  start_date: string;
  end_date: string;
  total_value: number;
  total_hours: number;
  hourly_rate: number;
  tax_percent: number;
  third_party_expenses: number;
  main_consultant_value: number;
  support_consultant_value: number;
  manager_name: string;
  manager_email: string;
  manager_phone: string;
  url: string;
  status: string;
}

interface ProjectFormProps {
  projectId?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const ProjectForm: React.FC<ProjectFormProps> = ({ projectId, onSuccess, onCancel }) => {
  // Usar o contexto global do processador
  const { processForProjectCreation } = useWebhookProcessorContext();

  const [formData, setFormData] = useState<ProjectFormData>({
    name: "",
    description: "",
    client_id: "",
    service_id: "",
    main_consultant_id: "",
    support_consultant_id: null,
    start_date: "",
    end_date: "",
    total_value: 0,
    total_hours: 0,
    hourly_rate: 0,
    tax_percent: 0,
    third_party_expenses: 0,
    main_consultant_value: 0,
    support_consultant_value: 0,
    manager_name: "",
    manager_email: "",
    manager_phone: "",
    url: "",
    status: "planned",
  });

  const queryClient = useQueryClient();

  const { data: projectData, isLoading: isProjectLoading } = useQuery(
    ["project", projectId],
    async () => {
      if (!projectId) return null;
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .eq("id", projectId)
        .single();
      if (error) throw error;
      return data as ProjectFormData;
    },
    {
      enabled: !!projectId,
      onSuccess: (data) => {
        if (data) {
          setFormData(data);
        }
      },
    }
  );

  useEffect(() => {
    if (projectData) {
      setFormData(projectData);
    }
  }, [projectData]);

  const updateProjectMutation = useMutation({
    mutationFn: async (data: ProjectFormData) => {
      console.log("🔄 Atualizando projeto:", data);
      const { data: project, error } = await supabase
        .from("projects")
        .update({
          name: data.name,
          description: data.description,
          client_id: data.client_id,
          service_id: data.service_id,
          main_consultant_id: data.main_consultant_id,
          support_consultant_id: data.support_consultant_id || null,
          start_date: data.start_date,
          end_date: data.end_date,
          total_value: data.total_value,
          total_hours: data.total_hours || 0,
          hourly_rate: data.hourly_rate || 0,
          tax_percent: data.tax_percent,
          third_party_expenses: data.third_party_expenses || 0,
          main_consultant_value: data.main_consultant_value || 0,
          support_consultant_value: data.support_consultant_value || 0,
          manager_name: data.manager_name,
          manager_email: data.manager_email,
          manager_phone: data.manager_phone,
          url: data.url,
          status: data.status,
        })
        .eq("id", projectId)
        .select()
        .single();

      if (error) throw error;
      return project;
    },
    onSuccess: async (project) => {
      console.log("✅ Projeto atualizado com sucesso:", project);
      toast.success("Projeto atualizado com sucesso!", {
        description: `Projeto "${project.name}" foi atualizado e será processado automaticamente`,
        icon: <CheckCircle2 className="h-5 w-5 text-green-600" />,
      });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      if (onSuccess) onSuccess();
    },
    onError: (error) => {
      console.error("❌ Erro ao atualizar projeto:", error);
      toast.error("Erro ao atualizar projeto", {
        description:
          error instanceof Error ? error.message : "Falha ao atualizar projeto",
        icon: <AlertCircle className="h-5 w-5 text-red-600" />,
      });
    },
  });

  const createProjectMutation = useMutation({
    mutationFn: async (data: ProjectFormData) => {
      console.log('🚀 Criando projeto:', data);
      
      const { data: project, error } = await supabase
        .from('projects')
        .insert([{
          name: data.name,
          description: data.description,
          client_id: data.client_id,
          service_id: data.service_id,
          main_consultant_id: data.main_consultant_id,
          support_consultant_id: data.support_consultant_id || null,
          start_date: data.start_date,
          end_date: data.end_date,
          total_value: data.total_value,
          total_hours: data.total_hours || 0,
          hourly_rate: data.hourly_rate || 0,
          tax_percent: data.tax_percent,
          third_party_expenses: data.third_party_expenses || 0,
          main_consultant_value: data.main_consultant_value || 0,
          support_consultant_value: data.support_consultant_value || 0,
          manager_name: data.manager_name,
          manager_email: data.manager_email,
          manager_phone: data.manager_phone,
          url: data.url,
          status: 'planned'
        }])
        .select()
        .single();

      if (error) throw error;
      return project;
    },
    onSuccess: async (project) => {
      console.log('✅ Projeto criado com sucesso:', project);
      
      toast.success("Projeto criado com sucesso!", {
        description: `Projeto "${project.name}" foi criado e será processado automaticamente`,
        icon: <CheckCircle2 className="h-5 w-5 text-green-600" />
      });
      
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      
      // Processar webhooks automaticamente após criação
      console.log('🎯 Processando webhooks para projeto criado...');
      setTimeout(async () => {
        try {
          await processForProjectCreation();
          console.log('✅ Webhooks processados para projeto criado');
        } catch (error) {
          console.error('❌ Erro ao processar webhooks:', error);
        }
      }, 1000);
      
      if (onSuccess) onSuccess();
    },
    onError: (error) => {
      console.error('❌ Erro ao criar projeto:', error);
      toast.error("Erro ao criar projeto", {
        description: error instanceof Error ? error.message : "Falha ao criar projeto",
        icon: <AlertCircle className="h-5 w-5 text-red-600" />
      });
    }
  });

  const { data: clients, isLoading: isClientsLoading } = useQuery(
    ["clients"],
    async () => {
      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .order("name");
      if (error) throw error;
      return data;
    }
  );

  const { data: services, isLoading: isServicesLoading } = useQuery(
    ["services"],
    async () => {
      const { data, error } = await supabase
        .from("services")
        .select("*")
        .order("name");
      if (error) throw error;
      return data;
    }
  );

  const { data: consultants, isLoading: isConsultantsLoading } = useQuery(
    ["consultants"],
    async () => {
      const { data, error } = await supabase
        .from("consultants")
        .select("*")
        .order("name");
      if (error) throw error;
      return data;
    }
  );

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name?.trim()) {
      toast.error("Nome é obrigatório");
      return;
    }

    if (!formData.client_id) {
      toast.error("Cliente é obrigatório");
      return;
    }

    if (!formData.start_date || !formData.end_date) {
      toast.error("Datas de início e fim são obrigatórias");
      return;
    }

    if (projectId) {
      updateProjectMutation.mutate(formData);
    } else {
      createProjectMutation.mutate(formData);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Sistema de webhook global notification */}
      <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
        <div className="flex items-center gap-2 text-blue-800 text-sm">
          <Zap className="h-4 w-4" />
          <span>Sistema de webhooks global ativo - mudanças serão enviadas automaticamente</span>
        </div>
      </div>

      <div>
        <Label htmlFor="name">Nome do Projeto</Label>
        <Input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
        />
      </div>

      <div>
        <Label htmlFor="description">Descrição</Label>
        <Textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleChange}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="client_id">Cliente</Label>
          <select
            id="client_id"
            name="client_id"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            value={formData.client_id}
            onChange={handleChange}
          >
            <option value="">Selecione um cliente</option>
            {clients?.map((client: any) => (
              <option key={client.id} value={client.id}>
                {client.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <Label htmlFor="service_id">Serviço</Label>
          <select
            id="service_id"
            name="service_id"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            value={formData.service_id}
            onChange={handleChange}
          >
            <option value="">Selecione um serviço</option>
            {services?.map((service: any) => (
              <option key={service.id} value={service.id}>
                {service.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="main_consultant_id">Consultor Principal</Label>
          <select
            id="main_consultant_id"
            name="main_consultant_id"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            value={formData.main_consultant_id}
            onChange={handleChange}
          >
            <option value="">Selecione um consultor</option>
            {consultants?.map((consultant: any) => (
              <option key={consultant.id} value={consultant.id}>
                {consultant.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <Label htmlFor="support_consultant_id">Consultor de Apoio</Label>
          <select
            id="support_consultant_id"
            name="support_consultant_id"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            value={formData.support_consultant_id || ""}
            onChange={handleChange}
          >
            <option value="">Selecione um consultor (opcional)</option>
            {consultants?.map((consultant: any) => (
              <option key={consultant.id} value={consultant.id}>
                {consultant.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="start_date">Data de Início</Label>
          <Input
            type="date"
            id="start_date"
            name="start_date"
            value={formData.start_date}
            onChange={handleChange}
          />
        </div>

        <div>
          <Label htmlFor="end_date">Data de Término</Label>
          <Input
            type="date"
            id="end_date"
            name="end_date"
            value={formData.end_date}
            onChange={handleChange}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="total_value">Valor Total</Label>
          <Input
            type="number"
            id="total_value"
            name="total_value"
            value={String(formData.total_value)}
            onChange={handleChange}
          />
        </div>

        <div>
          <Label htmlFor="total_hours">Total de Horas</Label>
          <Input
            type="number"
            id="total_hours"
            name="total_hours"
            value={String(formData.total_hours)}
            onChange={handleChange}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="hourly_rate">Valor por Hora</Label>
          <Input
            type="number"
            id="hourly_rate"
            name="hourly_rate"
            value={String(formData.hourly_rate)}
            onChange={handleChange}
          />
        </div>

        <div>
          <Label htmlFor="tax_percent">Taxa de Imposto (%)</Label>
          <Input
            type="number"
            id="tax_percent"
            name="tax_percent"
            value={String(formData.tax_percent)}
            onChange={handleChange}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="third_party_expenses">Despesas de Terceiros</Label>
          <Input
            type="number"
            id="third_party_expenses"
            name="third_party_expenses"
            value={String(formData.third_party_expenses)}
            onChange={handleChange}
          />
        </div>

        <div>
          <Label htmlFor="main_consultant_value">Valor do Consultor Principal</Label>
          <Input
            type="number"
            id="main_consultant_value"
            name="main_consultant_value"
            value={String(formData.main_consultant_value)}
            onChange={handleChange}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="support_consultant_value">
            Valor do Consultor de Apoio
          </Label>
          <Input
            type="number"
            id="support_consultant_value"
            name="support_consultant_value"
            value={String(formData.support_consultant_value)}
            onChange={handleChange}
          />
        </div>

        <div>
          <Label htmlFor="manager_name">Nome do Gerente</Label>
          <Input
            type="text"
            id="manager_name"
            name="manager_name"
            value={formData.manager_name}
            onChange={handleChange}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="manager_email">Email do Gerente</Label>
          <Input
            type="email"
            id="manager_email"
            name="manager_email"
            value={formData.manager_email}
            onChange={handleChange}
          />
        </div>

        <div>
          <Label htmlFor="manager_phone">Telefone do Gerente</Label>
          <Input
            type="tel"
            id="manager_phone"
            name="manager_phone"
            value={formData.manager_phone}
            onChange={handleChange}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="url">URL do Projeto</Label>
        <Input
          type="url"
          id="url"
          name="url"
          value={formData.url}
          onChange={handleChange}
        />
      </div>

      <Button type="submit" disabled={createProjectMutation.isLoading || updateProjectMutation.isLoading}>
        {createProjectMutation.isLoading || updateProjectMutation.isLoading ? (
          <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M12 4V2m0 16v2M4 12H2m16 0h2M6.34 6.34l-1.42 1.42M17.66 17.66l1.42 1.42M6.34 17.66l-1.42-1.42M17.66 6.34l1.42-1.42"
            />
          </svg>
        ) : (
          "Salvar Projeto"
        )}
      </Button>
      {onCancel && (
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancelar
        </Button>
      )}
    </form>
  );
};

export default ProjectForm;
