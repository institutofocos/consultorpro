
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface Demand {
  id?: string;
  name: string;
  description: string;
  client_id?: string;
  service_id?: string;
  start_date: string;
  end_date: string;
  total_value: number;
  status: 'planned' | 'active' | 'completed' | 'cancelled';
  manager_name: string;
  manager_email: string;
  manager_phone?: string;
  created_at?: string;
  updated_at?: string;
}

interface DemandFormProps {
  demand?: Demand;
  onDemandSaved: (demand: Demand) => void;
  onCancel: () => void;
}

export default function DemandForm({ demand, onDemandSaved, onCancel }: DemandFormProps) {
  const [formData, setFormData] = useState<Demand>({
    name: '',
    description: '',
    client_id: '',
    service_id: '',
    start_date: '',
    end_date: '',
    total_value: 0,
    status: 'planned',
    manager_name: '',
    manager_email: '',
    manager_phone: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [clients, setClients] = useState([]);
  const [services, setServices] = useState([]);

  useEffect(() => {
    fetchSelectOptions();
    loadCurrentUserData();
  }, []);

  useEffect(() => {
    if (demand) {
      setFormData({
        ...demand,
        start_date: demand.start_date || '',
        end_date: demand.end_date || '',
        total_value: demand.total_value || 0
      });
    }
  }, [demand]);

  const fetchSelectOptions = async () => {
    try {
      const [clientsRes, servicesRes] = await Promise.all([
        supabase.from('clients').select('id, name').order('name'),
        supabase.from('services').select('id, name').order('name')
      ]);

      if (clientsRes.data) setClients(clientsRes.data);
      if (servicesRes.data) setServices(servicesRes.data);
    } catch (error) {
      console.error('Error fetching select options:', error);
      toast.error('Erro ao carregar opções do formulário');
    }
  };

  const loadCurrentUserData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Since user management was removed, just use the email from auth
      // and generate a simple name from the email
      if (!demand) {
        setFormData(prev => ({
          ...prev,
          manager_name: user.email?.split('@')[0] || '',
          manager_email: user.email || ''
        }));
      }
    } catch (error) {
      console.error('Erro ao carregar dados do usuário:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (!formData.name?.trim() || !formData.description?.trim()) {
        toast.error('Nome e descrição são obrigatórios');
        return;
      }

      if (!formData.start_date || !formData.end_date) {
        toast.error('Datas de início e fim são obrigatórias');
        return;
      }

      // Preparar dados da demanda para a tabela projects
      const demandData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        client_id: formData.client_id || null,
        service_id: formData.service_id || null,
        start_date: formData.start_date,
        end_date: formData.end_date,
        total_value: formData.total_value ? Number(formData.total_value) : 0,
        status: formData.status,
        manager_name: formData.manager_name.trim(),
        manager_email: formData.manager_email.trim(),
        manager_phone: formData.manager_phone?.trim() || null,
        hourly_rate: 0,
        tax_percent: 16,
        total_hours: 0
      };

      let savedDemand;
      
      if (demand?.id) {
        // Atualizar demanda existente
        const { data, error } = await supabase
          .from('projects')
          .update(demandData)
          .eq('id', demand.id)
          .select()
          .single();

        if (error) throw error;
        savedDemand = data;
        toast.success('Demanda atualizada com sucesso!');
      } else {
        // Criar nova demanda
        const { data, error } = await supabase
          .from('projects')
          .insert(demandData)
          .select()
          .single();

        if (error) throw error;
        savedDemand = data;
        toast.success('Demanda criada com sucesso!');
      }

      onDemandSaved(savedDemand);
    } catch (error: any) {
      console.error('Erro ao salvar demanda:', error);
      toast.error(error?.message || 'Erro ao salvar demanda');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{demand ? 'Editar Demanda' : 'Nova Demanda'}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Informações Básicas */}
          <div>
            <Label htmlFor="name">Nome *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Digite o nome da demanda"
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Descrição *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Descreva a demanda detalhadamente"
              rows={4}
              required
            />
          </div>

          {/* Cliente e Serviço */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="client">Cliente</Label>
              <Select value={formData.client_id || ''} onValueChange={(value) => setFormData(prev => ({ ...prev, client_id: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um cliente" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Nenhum</SelectItem>
                  {clients.map((client: any) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="service">Serviço</Label>
              <Select value={formData.service_id || ''} onValueChange={(value) => setFormData(prev => ({ ...prev, service_id: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um serviço" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Nenhum</SelectItem>
                  {services.map((service: any) => (
                    <SelectItem key={service.id} value={service.id}>
                      {service.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Status e Valor */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={formData.status} onValueChange={(value: any) => setFormData(prev => ({ ...prev, status: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="planned">Planejado</SelectItem>
                  <SelectItem value="active">Ativo</SelectItem>
                  <SelectItem value="completed">Concluído</SelectItem>
                  <SelectItem value="cancelled">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="total_value">Valor Total (R$)</Label>
              <Input
                id="total_value"
                type="number"
                step="0.01"
                value={formData.total_value || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, total_value: e.target.value ? Number(e.target.value) : 0 }))}
                placeholder="0.00"
              />
            </div>
          </div>

          {/* Datas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="start_date">Data de Início *</Label>
              <Input
                id="start_date"
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                required
              />
            </div>

            <div>
              <Label htmlFor="end_date">Data de Fim *</Label>
              <Input
                id="end_date"
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
                required
              />
            </div>
          </div>

          {/* Informações do Responsável */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Informações do Responsável</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="manager_name">Nome do Responsável *</Label>
                <Input
                  id="manager_name"
                  value={formData.manager_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, manager_name: e.target.value }))}
                  placeholder="Nome do responsável"
                  required
                />
              </div>

              <div>
                <Label htmlFor="manager_email">E-mail do Responsável *</Label>
                <Input
                  id="manager_email"
                  type="email"
                  value={formData.manager_email}
                  onChange={(e) => setFormData(prev => ({ ...prev, manager_email: e.target.value }))}
                  placeholder="email@exemplo.com"
                  required
                />
              </div>

              <div>
                <Label htmlFor="manager_phone">Telefone do Responsável</Label>
                <Input
                  id="manager_phone"
                  value={formData.manager_phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, manager_phone: e.target.value }))}
                  placeholder="(11) 99999-9999"
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Os dados são preenchidos automaticamente com as informações do usuário logado
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Botões */}
      <div className="flex justify-end space-x-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Salvando...' : demand ? 'Atualizar' : 'Criar'} Demanda
        </Button>
      </div>
    </form>
  );
}
