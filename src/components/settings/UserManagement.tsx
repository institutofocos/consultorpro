import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Users, Plus, Edit2, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import UserEditModal from './UserEditModal';
import ModulePermissionsSelector, { ModulePermission } from './ModulePermissionsSelector';

interface User {
  id: string;
  full_name: string;
  role: string;
  email?: string;
  created_at: string;
  last_login?: string;
  is_active?: boolean;
}

interface NewUser {
  full_name: string;
  email: string;
  password: string;
  role: string;
  permissions: ModulePermission[];
}

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [newUser, setNewUser] = useState<NewUser>({
    full_name: '',
    email: '',
    password: '',
    role: 'client',
    permissions: []
  });

  const userRoles = [
    { value: 'admin', label: 'Administrador' },
    { value: 'consultant', label: 'Consultor' },
    { value: 'manager', label: 'Gestor' },
    { value: 'financial', label: 'Financeiro' },
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
      }

      // Carregar consultores - Fixed SQL syntax
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

      // Adicionar perfis de usuário - Fixed property access
      if (profiles && profiles.length > 0) {
        allUsers.push(...profiles.map(profile => ({
          id: profile.id,
          full_name: profile.full_name,
          role: profile.role,
          email: profile.username || undefined, // Use username as email fallback
          created_at: profile.created_at,
          last_login: profile.last_login || undefined,
          is_active: profile.user_type !== 'inactive' // Derive from user_type if is_active doesn't exist
        })));
      }

      // Adicionar consultores que não estão nos perfis
      if (consultants && consultants.length > 0) {
        consultants.forEach(consultant => {
          const existingProfile = profiles?.find(p => p.full_name === consultant.name);
          if (!existingProfile) {
            allUsers.push({
              id: consultant.id,
              full_name: consultant.name,
              role: 'consultant',
              email: consultant.email,
              created_at: consultant.created_at || new Date().toISOString(),
              is_active: true
            });
          }
        });
      }

      // Adicionar clientes que não estão nos perfis
      if (clients && clients.length > 0) {
        clients.forEach(client => {
          const existingProfile = profiles?.find(p => p.full_name === client.contact_name);
          if (!existingProfile) {
            allUsers.push({
              id: client.id,
              full_name: client.contact_name || client.name,
              role: 'client',
              email: client.email || undefined,
              created_at: client.created_at || new Date().toISOString(),
              is_active: true
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

      // Se o usuário foi criado, criar as permissões de módulo
      if (authData.user && newUser.permissions.length > 0) {
        const permissionsToInsert = newUser.permissions.map(permission => ({
          user_id: authData.user!.id,
          module_name: permission.module_name,
          can_view: permission.can_view,
          can_edit: permission.can_edit
        }));

        const { error: permissionsError } = await supabase
          .from('module_permissions')
          .insert(permissionsToInsert);

        if (permissionsError) {
          console.error('Error creating permissions:', permissionsError);
          toast.error('Usuário criado, mas erro ao configurar permissões');
        }
      }

      toast.success('Usuário criado com sucesso!');
      setIsDialogOpen(false);
      setNewUser({ 
        full_name: '', 
        email: '', 
        password: '', 
        role: 'client',
        permissions: []
      });
      loadUsers();
    } catch (error) {
      console.error('Error creating user:', error);
      toast.error('Erro ao criar usuário');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setShowEditModal(true);
  };

  const handleUserUpdated = () => {
    loadUsers();
  };

  const getRoleLabel = (role: string) => {
    const roleConfig = userRoles.find(r => r.value === role);
    return roleConfig?.label || role;
  };

  const getStatusBadge = (isActive?: boolean) => {
    return isActive !== false ? (
      <Badge variant="default" className="text-xs">Ativo</Badge>
    ) : (
      <Badge variant="secondary" className="text-xs">Inativo</Badge>
    );
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
          <DialogContent size="xl">
            <DialogHeader>
              <DialogTitle>Criar Novo Usuário</DialogTitle>
            </DialogHeader>
            <div className="space-y-6 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
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
              </div>

              <ModulePermissionsSelector
                permissions={newUser.permissions}
                onChange={(permissions) => setNewUser(prev => ({ ...prev, permissions }))}
              />

              <div className="flex justify-end space-x-2 pt-4">
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
                  <TableHead>Status</TableHead>
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
                      <Badge variant="outline">
                        {getRoleLabel(user.role)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(user.is_active)}
                    </TableCell>
                    <TableCell>{new Date(user.created_at).toLocaleDateString('pt-BR')}</TableCell>
                    <TableCell>{user.last_login ? new Date(user.last_login).toLocaleDateString('pt-BR') : '-'}</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleEditUser(user)}
                        >
                          <Edit2 className="h-4 w-4" />
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

      {/* Modal de Edição */}
      <UserEditModal
        user={editingUser}
        open={showEditModal}
        onOpenChange={setShowEditModal}
        onUserUpdated={handleUserUpdated}
      />
    </div>
  );
};

export default UserManagement;
