
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Edit, Trash, Building, Search } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import ClientForm from "./ClientForm";
import { BasicClient } from '../services/types';

interface ClientWithProjectStats extends BasicClient {
  projectCount?: number;
  activeProjectCount?: number;
  totalSpent?: number;
}

const ClientList = () => {
  const [clients, setClients] = useState<ClientWithProjectStats[]>([]);
  const [filteredClients, setFilteredClients] = useState<ClientWithProjectStats[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isAddingClient, setIsAddingClient] = useState(false);
  const [editingClient, setEditingClient] = useState<BasicClient | null>(null);

  const fetchClientProjectStats = async (clientId: string) => {
    try {
      // Get all projects for this client
      const { data: projects, error } = await supabase
        .from('projects')
        .select('*')
        .eq('client_id', clientId);
        
      if (error) throw error;
      
      if (!projects || projects.length === 0) {
        return {
          projectCount: 0,
          activeProjectCount: 0,
          totalSpent: 0
        };
      }
      
      // Calculate stats
      const projectCount = projects.length;
      const activeProjectCount = projects.filter(p => p.status !== 'completed' && p.status !== 'cancelled').length;
      const totalSpent = projects.reduce((sum, project) => sum + (project.total_value || 0), 0);
      
      return {
        projectCount,
        activeProjectCount,
        totalSpent
      };
    } catch (error) {
      console.error('Error fetching project stats:', error);
      return {
        projectCount: 0,
        activeProjectCount: 0,
        totalSpent: 0
      };
    }
  };

  const fetchClients = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('name');
        
      if (error) throw error;
      
      // Fetch project stats for each client
      const clientsWithStats = await Promise.all((data || []).map(async (client) => {
        const stats = await fetchClientProjectStats(client.id);
        return {
          ...client,
          ...stats
        };
      }));
      
      setClients(clientsWithStats);
      setFilteredClients(clientsWithStats);
    } catch (error: any) {
      toast.error('Erro ao carregar clientes: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  // Filter clients based on search term
  useEffect(() => {
    if (!searchTerm) {
      setFilteredClients(clients);
    } else {
      const filtered = clients.filter(client =>
        client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.contact_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.phone?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredClients(filtered);
    }
  }, [searchTerm, clients]);

  const handleSaveClient = () => {
    setIsAddingClient(false);
    setEditingClient(null);
    fetchClients();
  };

  const handleDeleteClient = async (id: string) => {
    console.log('Tentando excluir cliente com ID:', id);
    
    if (!window.confirm('Tem certeza que deseja excluir este cliente?')) {
      console.log('Exclusão cancelada pelo usuário');
      return;
    }
    
    try {
      console.log('Iniciando exclusão do cliente...');
      
      // First check if client has any projects
      const { data: projects, error: projectsError } = await supabase
        .from('projects')
        .select('id')
        .eq('client_id', id);
        
      if (projectsError) {
        console.error('Erro ao verificar projetos:', projectsError);
        throw projectsError;
      }
      
      if (projects && projects.length > 0) {
        toast.error('Não é possível excluir este cliente pois ele possui projetos associados.');
        return;
      }
      
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', id);
        
      if (error) {
        console.error('Erro na exclusão:', error);
        throw error;
      }
      
      console.log('Cliente excluído com sucesso');
      toast.success('Cliente excluído com sucesso!');
      fetchClients(); // Refresh the list
    } catch (error: any) {
      console.error('Erro completo:', error);
      toast.error('Erro ao excluir cliente: ' + error.message);
    }
  };

  if (isAddingClient || editingClient) {
    return (
      <ClientForm 
        client={editingClient}
        onClientSaved={handleSaveClient}
        onCancel={() => {
          setIsAddingClient(false);
          setEditingClient(null);
        }}
      />
    );
  }

  const formatCurrency = (value?: number) => {
    return value ? new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value) : 'R$ 0,00';
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Clientes</h1>
          <p className="text-muted-foreground">Gerencie os clientes da sua empresa</p>
        </div>
        <Button onClick={() => setIsAddingClient(true)}>
          <Plus className="mr-2 h-4 w-4" /> Adicionar Cliente
        </Button>
      </div>

      <div className="flex items-center space-x-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Buscar clientes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Contato</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead className="text-center">Projetos</TableHead>
                <TableHead className="text-center">Projetos Ativos</TableHead>
                <TableHead className="text-center">Valor Consumido</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-10">
                    Carregando...
                  </TableCell>
                </TableRow>
              ) : filteredClients.length > 0 ? (
                filteredClients.map((client) => (
                  <TableRow key={client.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center">
                        <Building className="h-4 w-4 mr-2 text-blue-500" />
                        {client.name}
                      </div>
                    </TableCell>
                    <TableCell>{client.contact_name}</TableCell>
                    <TableCell>{client.email}</TableCell>
                    <TableCell>{client.phone}</TableCell>
                    <TableCell className="text-center">
                      <span className="font-medium">{client.projectCount || 0}</span>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="font-medium">{client.activeProjectCount || 0}</span>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="font-medium">{formatCurrency(client.totalSpent)}</span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setEditingClient(client)}
                        title="Editar cliente"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteClient(client.id)}
                        title="Excluir cliente"
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-10 text-muted-foreground">
                    {searchTerm ? 'Nenhum cliente encontrado para a busca' : 'Nenhum cliente encontrado'}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default ClientList;
