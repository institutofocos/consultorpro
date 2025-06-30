
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner";
import { Building2, Search, Plus, Edit, Trash2, Mail, Phone, MapPin } from 'lucide-react';
import ClientForm from './ClientForm';
import PermissionGuard from '@/components/auth/PermissionGuard';
import DataFilter from '@/components/auth/DataFilter';
import { useUserPermissions } from '@/hooks/useUserPermissions';

interface Client {
  id: string;
  name: string;
  contact_name: string;
  email?: string;
  phone?: string;
  city?: string;
  state?: string;
  created_at: string;
}

const ClientList = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const { hasModulePermission, hasClientAccess } = useUserPermissions();

  const { data: clients = [], isLoading, refetch } = useQuery({
    queryKey: ['clients'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data as Client[];
    },
  });

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.contact_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (client.email && client.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleEdit = (client: Client) => {
    setSelectedClient(client);
    setIsFormOpen(true);
  };

  const handleDelete = async (client: Client) => {
    if (!hasModulePermission('clients', 'delete')) {
      toast.error('Você não tem permissão para excluir clientes');
      return;
    }

    if (!confirm(`Tem certeza que deseja excluir ${client.name}?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', client.id);

      if (error) throw error;

      toast.success('Cliente excluído com sucesso!');
      refetch();
    } catch (error: any) {
      toast.error('Erro ao excluir cliente: ' + error.message);
    }
  };

  const handleClientSaved = (client: Client) => {
    setSelectedClient(null);
    setIsFormOpen(false);
    refetch();
  };

  const handleCancel = () => {
    setSelectedClient(null);
    setIsFormOpen(false);
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Carregando clientes...</p>
        </div>
      </div>
    );
  }

  return (
    <PermissionGuard module="clients" action="view">
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Clientes</h1>
            <p className="text-muted-foreground">Gerencie os clientes da empresa</p>
          </div>
          <PermissionGuard 
            module="clients" 
            action="edit" 
            showAlert={false}
            fallback={null}
          >
            <Button onClick={() => setIsFormOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Cliente
            </Button>
          </PermissionGuard>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Lista de Clientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar clientes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <DataFilter
              data={filteredClients}
              filterFn={(client, permissions) => {
                if (permissions.isSuperAdmin) return true;
                if (!permissions.isRestrictedToLinked('clients')) return true;
                return permissions.hasClientAccess(client.id);
              }}
            >
              {(filteredData) => (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {filteredData.length === 0 ? (
                    <div className="col-span-full text-center py-8">
                      <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">
                        {searchTerm ? 'Nenhum cliente encontrado' : 'Nenhum cliente cadastrado'}
                      </p>
                    </div>
                  ) : (
                    filteredData.map((client) => (
                      <Card key={client.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center space-x-3">
                              <Avatar>
                                <AvatarFallback>{getInitials(client.name)}</AvatarFallback>
                              </Avatar>
                              <div>
                                <h3 className="font-semibold">{client.name}</h3>
                                <Badge variant="outline" className="text-xs">
                                  {client.contact_name}
                                </Badge>
                              </div>
                            </div>
                            <div className="flex space-x-1">
                              <PermissionGuard 
                                module="clients" 
                                action="edit" 
                                showAlert={false}
                                fallback={null}
                              >
                                {(hasModulePermission('clients', 'edit') || hasClientAccess(client.id)) && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleEdit(client)}
                                  >
                                    <Edit className="h-3 w-3" />
                                  </Button>
                                )}
                              </PermissionGuard>
                              <PermissionGuard 
                                module="clients" 
                                action="delete" 
                                showAlert={false}
                                fallback={null}
                              >
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleDelete(client)}
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </PermissionGuard>
                            </div>
                          </div>

                          <div className="space-y-2 text-sm text-gray-600">
                            {client.email && (
                              <div className="flex items-center">
                                <Mail className="h-4 w-4 mr-2" />
                                {client.email}
                              </div>
                            )}
                            {client.phone && (
                              <div className="flex items-center">
                                <Phone className="h-4 w-4 mr-2" />
                                {client.phone}
                              </div>
                            )}
                            {(client.city || client.state) && (
                              <div className="flex items-center">
                                <MapPin className="h-4 w-4 mr-2" />
                                {[client.city, client.state].filter(Boolean).join(', ')}
                              </div>
                            )}
                          </div>

                          <div className="mt-4 pt-4 border-t">
                            <div className="flex justify-end text-xs text-gray-500">
                              <span>Cadastrado em {new Date(client.created_at).toLocaleDateString('pt-BR')}</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              )}
            </DataFilter>
          </CardContent>
        </Card>

        {isFormOpen && (
          <ClientForm
            client={selectedClient}
            onClientSaved={handleClientSaved}
            onCancel={handleCancel}
          />
        )}
      </div>
    </PermissionGuard>
  );
};

export default ClientList;
