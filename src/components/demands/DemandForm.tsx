
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
  title: string;
  description: string;
  client_id?: string;
  service_id?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  deadline?: string;
  estimated_hours?: number;
  budget?: number;
  requester_name: string;
  requester_email: string;
  requester_phone?: string;
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
    title: '',
    description: '',
    client_id: '',
    service_id: '',
    priority: 'medium',
    status: 'pending',
    deadline: '',
    estimated_hours: 0,
    budget: 0,
    requester_name: '',
    requester_email: '',
    requester_phone: ''
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
      setFormData(demand);
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
          requester_name: user.email?.split('@')[0] || '',
          requester_email: user.email || ''
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
      if (!formData.title?.trim() || !formData.description?.trim()) {
        toast.error('Título e descrição são obrigatórios');
        return;
      }

      // Preparar dados da demanda
      const demandData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        client_id: formData.client_id || null,
        service_id: formData.service_id || null,
        priority: formData.priority,
        status: formData.status,
        deadline: formData.deadline || null,
        estimated_hours: formData.estimated_hours ? Number(formData.estimated_hours) : null,
        budget: formData.budget ? Number(formData.budget) : null,
        requester_name: formData.requester_name.trim(),
        requester_email: formData.requester_email.trim(),
        requester_phone: formData.requester_phone?.trim() || null
      };

      let savedDemand;
      
      if (demand?.id) {
        // Atualizar demanda existente
        const { data, error } = await supabase
          .from('demands')
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
          .from('demands')
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
            <Label htmlFor="title">Título *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Digite o título da demanda"
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

          {/* Prioridade e Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="priority">Prioridade</Label>
              <Select value={formData.priority} onValueChange={(value: any) => setFormData(prev => ({ ...prev, priority: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Baixa</SelectItem>
                  <SelectItem value="medium">Média</SelectItem>
                  <SelectItem value="high">Alta</SelectItem>
                  <SelectItem value="urgent">Urgente</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={formData.status} onValueChange={(value: any) => setFormData(prev => ({ ...prev, status: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="in_progress">Em Andamento</SelectItem>
                  <SelectItem value="completed">Concluída</SelectItem>
                  <SelectItem value="cancelled">Cancelada</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Prazo e Estimativas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="deadline">Prazo</Label>
              <Input
                id="deadline"
                type="date"
                value={formData.deadline}
                onChange={(e) => setFormData(prev => ({ ...prev, deadline: e.target.value }))}
              />
            </div>

            <div>
              <Label htmlFor="estimated_hours">Horas Estimadas</Label>
              <Input
                id="estimated_hours"
                type="number"
                value={formData.estimated_hours || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, estimated_hours: e.target.value ? Number(e.target.value) : 0 }))}
                placeholder="0"
              />
            </div>

            <div>
              <Label htmlFor="budget">Orçamento (R$)</Label>
              <Input
                id="budget"
                type="number"
                step="0.01"
                value={formData.budget || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, budget: e.target.value ? Number(e.target.value) : 0 }))}
                placeholder="0.00"
              />
            </div>
          </div>

          {/* Informações do Solicitante */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Informações do Solicitante</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="requester_name">Nome do Solicitante *</Label>
                <Input
                  id="requester_name"
                  value={formData.requester_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, requester_name: e.target.value }))}
                  placeholder="Nome do solicitante"
                  required
                />
              </div>

              <div>
                <Label htmlFor="requester_email">E-mail do Solicitante *</Label>
                <Input
                  id="requester_email"
                  type="email"
                  value={formData.requester_email}
                  onChange={(e) => setFormData(prev => ({ ...prev, requester_email: e.target.value }))}
                  placeholder="email@exemplo.com"
                  required
                />
              </div>

              <div>
                <Label htmlFor="requester_phone">Telefone do Solicitante</Label>
                <Input
                  id="requester_phone"
                  value={formData.requester_phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, requester_phone: e.target.value }))}
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
