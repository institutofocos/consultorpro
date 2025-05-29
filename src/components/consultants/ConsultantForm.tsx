
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  onConsultantSaved: (consultant: Consultant) => void;
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
          // Só buscar serviços se o consultor tem ID (já foi salvo)
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
      if (!formData.name?.trim() || !formData.email?.trim()) {
        toast.error('Nome e email são obrigatórios');
        return;
      }

      const consultantData = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone?.trim() || null,
        street: formData.street?.trim() || null,
        city: formData.city?.trim() || null,
        state: formData.state?.trim() || null,
        zip_code: formData.zip_code?.trim() || null,
        education: formData.education?.trim() || null,
        salary: Number(formData.salary) || 0,
        commission_percentage: Number(formData.commission_percentage) || 0,
        hours_per_month: Number(formData.hours_per_month) || 160,
        pix_key: formData.pix_key?.trim() || null,
        url: formData.url?.trim() || null,
      };

      let savedConsultant;
      if (consultant?.id) {
        const { data, error } = await supabase
          .from('consultants')
          .update(consultantData)
          .eq('id', consultant.id)
          .select()
          .single();

        if (error) throw error;
        savedConsultant = data;
        toast.success('Consultor atualizado com sucesso!');
      } else {
        const { data, error } = await supabase
          .from('consultants')
          .insert(consultantData)
          .select()
          .single();

        if (error) throw error;
        savedConsultant = data;
        toast.success('Consultor criado com sucesso!');
      }

      // Gerenciar serviços do consultor
      if (formData.services && formData.services.length > 0) {
        // Remover serviços existentes
        if (consultant?.id) {
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

        const { error: servicesError } = await supabase
          .from('consultant_services')
          .insert(serviceRelations);

        if (servicesError) {
          console.error('Error saving consultant services:', servicesError);
          toast.warning('Consultor salvo, mas houve erro ao associar serviços');
        }
      }

      onConsultantSaved({ ...savedConsultant, ...formData });
    } catch (error) {
      console.error('Error saving consultant:', error);
      toast.error('Erro ao salvar consultor: ' + (error instanceof Error ? error.message : 'Erro desconhecido'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="phone">Telefone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="(11) 99999-9999"
              />
            </div>

            <div>
              <Label htmlFor="profile_photo">URL da Foto de Perfil</Label>
              <Input
                id="profile_photo"
                value={formData.profile_photo}
                onChange={(e) => setFormData(prev => ({ ...prev, profile_photo: e.target.value }))}
                placeholder="https://exemplo.com/foto.jpg"
              />
            </div>

            <div>
              <Label htmlFor="url">URL</Label>
              <Input
                id="url"
                type="url"
                value={formData.url}
                onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
                placeholder="https://exemplo.com"
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
                  value={formData.salary}
                  onChange={(e) => setFormData(prev => ({ ...prev, salary: Number(e.target.value) }))}
                  placeholder="0.00"
                />
              </div>

              <div>
                <Label htmlFor="commission_percentage">Comissão (%)</Label>
                <Input
                  id="commission_percentage"
                  type="number"
                  step="0.01"
                  value={formData.commission_percentage}
                  onChange={(e) => setFormData(prev => ({ ...prev, commission_percentage: Number(e.target.value) }))}
                  placeholder="0.00"
                />
              </div>

              <div>
                <Label htmlFor="hours_per_month">Horas/Mês</Label>
                <Input
                  id="hours_per_month"
                  type="number"
                  value={formData.hours_per_month}
                  onChange={(e) => setFormData(prev => ({ ...prev, hours_per_month: Number(e.target.value) }))}
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
