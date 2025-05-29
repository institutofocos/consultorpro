
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { createClient, updateClient } from "@/integrations/supabase/clients";
import { Client } from "@/integrations/supabase/clients";

interface ClientFormData extends Omit<Client, 'id' | 'created_at'> {
  username?: string;
  password?: string;
}

interface ClientFormProps {
  client?: Client;
  onClientSaved: (client: Client) => void;
  onCancel: () => void;
}

export default function ClientForm({ client, onClientSaved, onCancel }: ClientFormProps) {
  const [formData, setFormData] = useState<ClientFormData>({
    name: '',
    contact_name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zip_code: '',
    notes: '',
    username: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (client) {
      setFormData({
        name: client.name || '',
        contact_name: client.contact_name || '',
        email: client.email || '',
        phone: client.phone || '',
        address: client.address || '',
        city: client.city || '',
        state: client.state || '',
        zip_code: client.zip_code || '',
        notes: client.notes || '',
        username: '',
        password: ''
      });
    }
  }, [client]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (!formData.name?.trim() || !formData.contact_name?.trim()) {
        toast.error('Nome da empresa e nome do contato são obrigatórios');
        return;
      }

      const clientData = {
        name: formData.name.trim(),
        contact_name: formData.contact_name.trim(),
        email: formData.email?.trim() || null,
        phone: formData.phone?.trim() || null,
        address: formData.address?.trim() || null,
        city: formData.city?.trim() || null,
        state: formData.state?.trim() || null,
        zip_code: formData.zip_code?.trim() || null,
        notes: formData.notes?.trim() || null,
      };

      let savedClient: Client;
      
      if (client?.id) {
        // Atualizar cliente existente
        savedClient = await updateClient(client.id, clientData);
        toast.success('Cliente atualizado com sucesso!');
      } else {
        // Criar novo cliente
        savedClient = await createClient(clientData);
        toast.success('Cliente criado com sucesso!');
      }

      onClientSaved(savedClient);
    } catch (error) {
      console.error('Error saving client:', error);
      toast.error('Erro ao salvar cliente: ' + (error instanceof Error ? error.message : 'Erro desconhecido'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{client ? 'Editar Cliente' : 'Novo Cliente'}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Informações da Empresa */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Nome da Empresa *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Nome da empresa"
                required
              />
            </div>

            <div>
              <Label htmlFor="contact_name">Nome do Contato *</Label>
              <Input
                id="contact_name"
                value={formData.contact_name}
                onChange={(e) => setFormData(prev => ({ ...prev, contact_name: e.target.value }))}
                placeholder="Nome da pessoa de contato"
                required
              />
            </div>
          </div>

          {/* Informações de Contato */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="email@exemplo.com"
              />
            </div>

            <div>
              <Label htmlFor="phone">Telefone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="(11) 99999-9999"
              />
            </div>
          </div>

          {/* Endereço */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Endereço</h3>
            <div>
              <Label htmlFor="address">Endereço</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                placeholder="Rua, número, complemento"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

          {/* Observações */}
          <div>
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Observações sobre o cliente"
            />
          </div>
        </CardContent>
      </Card>

      {/* Botões */}
      <div className="flex justify-end space-x-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Salvando...' : client ? 'Atualizar' : 'Criar'} Cliente
        </Button>
      </div>
    </form>
  );
}
