import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { fetchServices } from "@/integrations/supabase/services";
import SearchableSelect from "@/components/ui/searchable-select";

interface Consultant {
  id?: string;
  name: string;
  email: string;
  phone?: string;
  street?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  education?: string;
  salary?: number;
  commission_percentage?: number;
  hours_per_month?: number;
  pix_key?: string;
  username?: string;
  password?: string;
  profile_photo?: string;
  url?: string;
  services?: string[];
}

interface ConsultantFormProps {
  consultant?: Consultant;
  onConsultantSaved: (consultant: Consultant & { userCreated?: boolean; defaultPassword?: string }) => void;
  onCancel: () => void;
}

export default function ConsultantForm({ consultant, onConsultantSaved, onCancel }: ConsultantFormProps) {
  const [formData, setFormData] = useState<Consultant>({
    name: '',
    email: '',
    phone: '',
    street: '',
    city: '',
    state: '',
    zip_code: '',
    education: '',
    salary: 0,
    commission_percentage: 0,
    hours_per_month: 160,
    pix_key: '',
    username: '',
    password: '',
    profile_photo: '',
    url: '',
    services: []
  });
  const [isLoading, setIsLoading] = useState(false);
  const [availableServices, setAvailableServices] = useState<Array<{ id: string; name: string }>>([]);
  const [showUserCreationInfo, setShowUserCreationInfo] = useState(false);

  useEffect(() => {
    const loadServices = async () => {
      try {
        const services = await fetchServices();
        setAvailableServices(services.map(service => ({
          id: service.id,
          name: service.name
        })));
      } catch (error) {
        console.error('Error loading services:', error);
        toast.error('Erro ao carregar serviços');
      }
    };

    loadServices();
  }, []);

  useEffect(() => {
    if (consultant) {
      const loadConsultantServices = async () => {
        try {
          if (consultant.id) {
            const { data: consultantServices, error } = await supabase
              .from('consultant_services')
              .select('service_id')
              .eq('consultant_id', consultant.id);

            if (error) {
              console.error('Error loading consultant services:', error);
            }

            const serviceIds = consultantServices?.map(cs => cs.service_id) || [];
            setFormData({ ...consultant, services: serviceIds });
          } else {
            setFormData({ ...consultant, services: [] });
          }
        } catch (error) {
          console.error('Error loading consultant services:', error);
          setFormData({ ...consultant, services: [] });
        }
      };

      loadConsultantServices();
    }
  }, [consultant]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      console.log('=== INICIANDO SALVAMENTO DE CONSULTOR ===');
      console.log('Dados do formulário:', formData);

      if (!formData.name?.trim() || !formData.email?.trim()) {
        toast.error('Nome e email são obrigatórios');
        setIsLoading(false);
        return;
      }

      // Preparar dados do consultor sem campos que não existem na tabela
      const consultantData = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone?.trim() || null,
        street: formData.street?.trim() || null,
        city: formData.city?.trim() || null,
        state: formData.state?.trim() || null,
        zip_code: formData.zip_code?.trim() || null,
        education: formData.education?.trim() || null,
        salary: formData.salary ? Number(formData.salary) : null,
        commission_percentage: formData.commission_percentage ? Number(formData.commission_percentage) : null,
        hours_per_month: formData.hours_per_month ? Number(formData.hours_per_month) : 160,
        pix_key: formData.pix_key?.trim() || null,
        url: formData.url?.trim() || null,
      };

      console.log('Dados preparados para salvar:', consultantData);

      let savedConsultant;
      
      if (consultant?.id) {
        console.log('Atualizando consultor existente com ID:', consultant.id);
        
        // Usar uma abordagem mais simples para atualização
        const { data, error } = await supabase
          .from('consultants')
          .update(consultantData)
          .eq('id', consultant.id)
          .select()
          .single();

        if (error) {
          console.error('Erro na atualização:', error);
          throw new Error(`Erro ao atualizar consultor: ${error.message}`);
        }
        
        console.log('Consultor atualizado com sucesso:', data);
        savedConsultant = data;
        toast.success('Consultor atualizado com sucesso!');
      } else {
        console.log('Criando novo consultor');
        
        // Importar a função createConsultant
        const { createConsultant } = await import('@/integrations/supabase/consultants');
        
        const result = await createConsultant(consultantData);
        savedConsultant = result;
        
        if (result.userCreated) {
          toast.success(
            `Consultor criado com sucesso! Usuário criado com senha padrão: ${result.defaultPassword}`,
            { duration: 8000 }
          );
          setShowUserCreationInfo(true);
        } else {
          toast.success('Consultor criado com sucesso!');
        }
      }

      // Gerenciar serviços do consultor
      if (formData.services && formData.services.length > 0) {
        console.log('Gerenciando serviços do consultor:', formData.services);
        
        // Remover serviços existentes se for uma atualização
        if (consultant?.id) {
          console.log('Removendo serviços existentes');
          await supabase
            .from('consultant_services')
            .delete()
            .eq('consultant_id', savedConsultant.id);
        }

        // Adicionar novos serviços
        const serviceRelations = formData.services.map(serviceId => ({
          consultant_id: savedConsultant.id,
          service_id: serviceId
        }));

        console.log('Inserindo relações de serviços:', serviceRelations);

        const { error: servicesError } = await supabase
          .from('consultant_services')
          .insert(serviceRelations);

        if (servicesError) {
          console.error('Erro ao salvar serviços do consultor:', servicesError);
          toast.warning('Consultor salvo, mas houve erro ao associar serviços');
        } else {
          console.log('Serviços associados com sucesso');
        }
      }

      console.log('=== SALVAMENTO CONCLUÍDO COM SUCESSO ===');
      onConsultantSaved({ ...savedConsultant, services: formData.services });
    } catch (error: any) {
      console.error('=== ERRO NO SALVAMENTO ===', error);
      const errorMessage = error?.message || 'Erro desconhecido ao salvar consultor';
      console.error('Mensagem de erro final:', errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {!consultant && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Ao criar um novo consultor, um usuário será automaticamente criado no sistema com:
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Email: mesmo email do consultor</li>
              <li>Senha padrão: "consultor123"</li>
              <li>Papel: Consultor</li>
              <li>Acesso aos módulos: Dashboard, Projetos, Demandas e Calendário</li>
            </ul>
            <span className="text-sm text-muted-foreground mt-2 block">
              O consultor deverá alterar a senha no primeiro acesso.
            </span>
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>{consultant ? 'Editar Consultor' : 'Novo Consultor'}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Informações Básicas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Nome *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Nome completo"
                required
              />
            </div>

            <div>
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="email@exemplo.com"
                required
              />
            </div>
          </div>

          {/* Serviços Autorizados */}
          <div>
            <Label htmlFor="services">Serviços Autorizados</Label>
            <SearchableSelect
              options={availableServices}
              value={formData.services || []}
              onValueChange={(value) => setFormData(prev => ({ ...prev, services: value as string[] }))}
              placeholder="Selecione os serviços que o consultor pode executar..."
              multiple={true}
              searchPlaceholder="Pesquisar serviços..."
              emptyText="Nenhum serviço encontrado."
              className="mt-1"
            />
          </div>

          {/* Endereço */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Endereço</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Label htmlFor="street">Rua</Label>
                <Input
                  id="street"
                  value={formData.street}
                  onChange={(e) => setFormData(prev => ({ ...prev, street: e.target.value }))}
                  placeholder="Rua, número, complemento"
                />
              </div>

              <div>
                <Label htmlFor="city">Cidade</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                  placeholder="Cidade"
                />
              </div>

              <div>
                <Label htmlFor="state">Estado</Label>
                <Input
                  id="state"
                  value={formData.state}
                  onChange={(e) => setFormData(prev => ({ ...prev, state: e.target.value }))}
                  placeholder="Estado"
                />
              </div>

              <div>
                <Label htmlFor="zip_code">CEP</Label>
                <Input
                  id="zip_code"
                  value={formData.zip_code}
                  onChange={(e) => setFormData(prev => ({ ...prev, zip_code: e.target.value }))}
                  placeholder="00000-000"
                />
              </div>
            </div>
          </div>

          {/* Informações Profissionais */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Informações Profissionais</h3>
            <div>
              <Label htmlFor="education">Formação</Label>
              <Textarea
                id="education"
                value={formData.education}
                onChange={(e) => setFormData(prev => ({ ...prev, education: e.target.value }))}
                placeholder="Formação acadêmica e certificações"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="salary">Salário (R$)</Label>
                <Input
                  id="salary"
                  type="number"
                  step="0.01"
                  value={formData.salary || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, salary: e.target.value ? Number(e.target.value) : 0 }))}
                  placeholder="0.00"
                />
              </div>

              <div>
                <Label htmlFor="commission_percentage">Comissão (%)</Label>
                <Input
                  id="commission_percentage"
                  type="number"
                  step="0.01"
                  value={formData.commission_percentage || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, commission_percentage: e.target.value ? Number(e.target.value) : 0 }))}
                  placeholder="0.00"
                />
              </div>

              <div>
                <Label htmlFor="hours_per_month">Horas/Mês</Label>
                <Input
                  id="hours_per_month"
                  type="number"
                  value={formData.hours_per_month || 160}
                  onChange={(e) => setFormData(prev => ({ ...prev, hours_per_month: e.target.value ? Number(e.target.value) : 160 }))}
                  placeholder="160"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="pix_key">Chave PIX</Label>
              <Input
                id="pix_key"
                value={formData.pix_key}
                onChange={(e) => setFormData(prev => ({ ...prev, pix_key: e.target.value }))}
                placeholder="CPF, email ou chave aleatória"
              />
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
          {isLoading ? 'Salvando...' : consultant ? 'Atualizar' : 'Criar'} Consultor
        </Button>
      </div>
    </form>
  );
}
