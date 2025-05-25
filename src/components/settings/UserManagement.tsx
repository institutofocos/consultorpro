
import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Users, Plus, Edit2, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface User {
  id: string;
  full_name: string;
  role: string;
  email?: string;
  created_at: string;
  last_login?: string;
}

interface NewUser {
  full_name: string;
  email: string;
  password: string;
  role: string;
}

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [newUser, setNewUser] = useState<NewUser>({
    full_name: '',
    email: '',
    password: '',
    role: 'client'
  });

  const userRoles = [
    { value: 'admin', label: 'Administrador' },
    { value: 'manager', label: 'Gestor' },
    { value: 'financial', label: 'Financeiro' },
    { value: 'marketing', label: 'Marketing' },
    { value: 'intern', label: 'Estagiário' },
    { value: 'consultant', label: 'Consultor' },
    { value: 'client', label: 'Cliente' }
  ];

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setIsLoading(true);
      console.log('Loading users...');

      // Carregar perfis de usuário
      const { data: profiles, error: profilesError } = await supabase
        .from('user_profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesError) {
        console.error('Error loading user profiles:', profilesError);
        throw profilesError;
      }

      // Carregar consultores
      const { data: consultants, error: consultantsError } = await supabase
        .from('consultants')
        .select('id, name, email, created_at')
        .order('created_at', { ascending: false });

      if (consultantsError) {
        console.error('Error loading consultants:', consultantsError);
      }

      // Carregar clientes
      const { data: clients, error: clientsError } = await supabase
        .from('clients')
        .select('id, name, contact_name, email, created_at')
        .order('created_at', { ascending: false });

      if (clientsError) {
        console.error('Error loading clients:', clientsError);
      }

      // Combinar todos os usuários
      const allUsers: User[] = [];

      // Adicionar perfis de usuário
      if (profiles) {
        allUsers.push(...profiles.map(profile => ({
          id: profile.id,
          full_name: profile.full_name,
          role: profile.role,
          created_at: profile.created_at,
          last_login: profile.last_login || undefined
        })));
      }

      // Adicionar consultores que não estão nos perfis
      if (consultants) {
        consultants.forEach(consultant => {
          const existingProfile = profiles?.find(p => p.full_name === consultant.name);
          if (!existingProfile) {
            allUsers.push({
              id: consultant.id,
              full_name: consultant.name,
              role: 'consultant',
              email: consultant.email,
              created_at: consultant.created_at || new Date().toISOString()
            });
          }
        });
      }

      // Adicionar clientes que não estão nos perfis
      if (clients) {
        clients.forEach(client => {
          const existingProfile = profiles?.find(p => p.full_name === client.contact_name);
          if (!existingProfile) {
            allUsers.push({
              id: client.id,
              full_name: client.contact_name || client.name,
              role: 'client',
              email: client.email || undefined,
              created_at: client.created_at || new Date().toISOString()
            });
          }
        });
      }

      console.log('Users loaded:', allUsers.length);
      setUsers(allUsers);
    } catch (error) {
      console.error('Error loading users:', error);
      toast.error('Erro ao carregar usuários');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateUser = async () => {
    try {
      if (!newUser.full_name || !newUser.email || !newUser.password) {
        toast.error('Preencha todos os campos obrigatórios');
        return;
      }

      setIsLoading(true);

      // Criar usuário no Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: newUser.email,
        password: newUser.password,
        options: {
          data: {
            full_name: newUser.full_name,
            role: newUser.role
          }
        }
      });

      if (authError) {
        console.error('Error creating user:', authError);
        throw authError;
      }

      toast.success('Usuário criado com sucesso!');
      setIsDialogOpen(false);
      setNewUser({ full_name: '', email: '', password: '', role: 'client' });
      loadUsers();
    } catch (error) {
      console.error('Error creating user:', error);
      toast.error('Erro ao criar usuário');
    } finally {
      setIsLoading(false);
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin':
        return 'destructive';
      case 'manager':
        return 'default';
      case 'consultant':
        return 'secondary';
      case 'client':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const getRoleLabel = (role: string) => {
    const roleConfig = userRoles.find(r => r.value === role);
    return roleConfig?.label || role;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Gerenciamento de Usuários</h1>
          <p className="text-muted-foreground">Gerencie usuários, consultores e clientes do sistema</p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Novo Usuário
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar Novo Usuário</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="new_full_name">Nome Completo *</Label>
                <Input
                  id="new_full_name"
                  value={newUser.full_name}
                  onChange={(e) => setNewUser(prev => ({ ...prev, full_name: e.target.value }))}
                  placeholder="Nome completo do usuário"
                />
              </div>

              <div>
                <Label htmlFor="new_email">Email *</Label>
                <Input
                  id="new_email"
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="email@exemplo.com"
                />
              </div>

              <div>
                <Label htmlFor="new_password">Senha *</Label>
                <Input
                  id="new_password"
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser(prev => ({ ...prev, password: e.target.value }))}
                  placeholder="Senha de acesso"
                />
              </div>

              <div>
                <Label htmlFor="new_role">Tipo de Usuário *</Label>
                <Select value={newUser.role} onValueChange={(value) => setNewUser(prev => ({ ...prev, role: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo de usuário" />
                  </SelectTrigger>
                  <SelectContent>
                    {userRoles.map(role => (
                      <SelectItem key={role.value} value={role.value}>
                        {role.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleCreateUser} disabled={isLoading}>
                  {isLoading ? 'Criando...' : 'Criar Usuário'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Usuários do Sistema
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <p>Carregando usuários...</p>
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>Nenhum usuário encontrado</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Criado em</TableHead>
                  <TableHead>Último Acesso</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.full_name}</TableCell>
                    <TableCell>{user.email || '-'}</TableCell>
                    <TableCell>
                      <Badge variant={getRoleBadgeVariant(user.role) as any}>
                        {getRoleLabel(user.role)}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDate(user.created_at)}</TableCell>
                    <TableCell>{user.last_login ? formatDate(user.last_login) : '-'}</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm">
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default UserManagement;
