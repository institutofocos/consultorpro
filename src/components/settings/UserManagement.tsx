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
import { Users, Plus, Edit2, RefreshCw, AlertTriangle, RotateCcw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { createUserWithProfile } from "@/services/auth";
import UserEditModal from './UserEditModal';
import ModulePermissionsSelector, { ModulePermissionInput } from './ModulePermissionsSelector';

interface User {
  id: string;
  full_name: string;
  email: string;
  phone?: string;
  role: string;
  is_active: boolean;
  email_confirmed: boolean;
  created_at: string;
  updated_at: string;
  last_login?: string;
}

interface NewUser {
  full_name: string;
  email: string;
  password: string;
  role: string;
  permissions: ModulePermissionInput[];
}

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [isSyncingUsers, setIsSyncingUsers] = useState(false);
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

  const syncUsersFromAuth = async () => {
    try {
      setIsSyncingUsers(true);
      console.log('🔄 Sincronizando usuários do Auth...');

      // Primeiro, obter o usuário atual para usar como service_role temporariamente
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      
      if (!currentUser) {
        throw new Error('Usuário não autenticado');
      }

      console.log('👤 Usuário atual:', currentUser.email);

      // Buscar todos os usuários do Auth usando a API admin
      const { data: authUsers, error: listError } = await supabase.auth.admin.listUsers();
      
      if (listError) {
        console.error('❌ Erro ao listar usuários:', listError);
        
        // Se falhar, tentar uma abordagem alternativa usando service role
        if (listError.message?.includes('not_admin') || listError.message?.includes('not allowed')) {
          console.log('⚠️ Acesso admin negado, tentando buscar usuários de forma alternativa...');
          
          // Buscar apenas perfis existentes e tentar criar o perfil do usuário atual se não existir
          const { data: currentProfile, error: profileError } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', currentUser.id)
            .maybeSingle();

          if (profileError && profileError.code !== 'PGRST116') {
            throw profileError;
          }

          if (!currentProfile) {
            // Criar perfil para o usuário atual
            const { error: insertError } = await supabase
              .from('user_profiles')
              .insert({
                id: currentUser.id,
                full_name: currentUser.user_metadata?.full_name || 
                          currentUser.email?.split('@')[0] || 
                          'Usuário',
                email: currentUser.email || '',
                role: 'admin', // Assumir que é admin se está tentando sincronizar
                is_active: true,
                email_confirmed: currentUser.email_confirmed_at !== null,
                created_at: currentUser.created_at,
                updated_at: new Date().toISOString()
              });

            if (insertError) {
              console.error('Erro ao criar perfil do usuário atual:', insertError);
              toast.error('Erro ao criar perfil do usuário atual: ' + insertError.message);
            } else {
              console.log('✅ Perfil criado para o usuário atual');
              toast.success('Perfil criado com sucesso!');
              await loadUsers();
            }
          } else {
            toast.info('Perfil do usuário atual já existe.');
            await loadUsers();
          }
          return;
        }
        
        throw listError;
      }

      console.log('📋 Usuários encontrados no Auth:', authUsers.users?.length || 0);

      if (!authUsers.users || authUsers.users.length === 0) {
        toast.info('Nenhum usuário encontrado no Supabase Auth.');
        return;
      }

      let syncedCount = 0;
      let skippedCount = 0;
      let errorCount = 0;

      for (const authUser of authUsers.users) {
        try {
          // Verificar se já existe perfil para este usuário
          const { data: existingProfile, error: profileError } = await supabase
            .from('user_profiles')
            .select('id')
            .eq('id', authUser.id)
            .maybeSingle();

          if (profileError && profileError.code !== 'PGRST116') {
            console.error('Erro ao verificar perfil existente:', profileError);
            errorCount++;
            continue;
          }

          if (!existingProfile) {
            // Criar perfil para usuário que não tem
            const fullName = authUser.user_metadata?.full_name || 
                             authUser.email?.split('@')[0] || 
                             'Usuário';
            
            const role = authUser.user_metadata?.role || 'client';

            const { error: insertError } = await supabase
              .from('user_profiles')
              .insert({
                id: authUser.id,
                full_name: fullName,
                email: authUser.email || '',
                role: role,
                is_active: true,
                email_confirmed: authUser.email_confirmed_at !== null,
                created_at: authUser.created_at,
                updated_at: new Date().toISOString()
              });

            if (insertError) {
              console.error('Erro ao criar perfil para usuário:', authUser.id, insertError);
              errorCount++;
            } else {
              console.log('✅ Perfil criado para usuário:', authUser.email);
              syncedCount++;
            }
          } else {
            skippedCount++;
          }
        } catch (error) {
          console.error('Erro ao processar usuário:', authUser.id, error);
          errorCount++;
        }
      }

      console.log(`✅ Sincronização concluída: ${syncedCount} novos perfis, ${skippedCount} já existiam, ${errorCount} erros`);
      
      if (syncedCount > 0) {
        toast.success(`${syncedCount} usuário(s) sincronizado(s) com sucesso!`);
      } else if (errorCount > 0) {
        toast.warning(`Sincronização concluída com ${errorCount} erro(s). ${skippedCount} usuários já existiam.`);
      } else {
        toast.info('Todos os usuários já estavam sincronizados.');
      }
      
      // Sempre recarregar a lista no final
      await loadUsers();

    } catch (error: any) {
      console.error('💥 Erro na sincronização:', error);
      let errorMessage = 'Erro desconhecido';
      
      if (error?.message) {
        if (error.message.includes('not_admin') || error.message.includes('not allowed')) {
          errorMessage = 'Permissões insuficientes para acessar dados do Auth. Verifique se você tem permissões de administrador.';
        } else {
          errorMessage = error.message;
        }
      }
      
      toast.error(`Erro ao sincronizar usuários: ${errorMessage}`);
    } finally {
      setIsSyncingUsers(false);
    }
  };

  const loadUsers = async () => {
    try {
      setIsLoading(true);
      console.log('🔄 Carregando usuários...');

      // Buscar usuários da tabela user_profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('user_profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesError) {
        console.error('❌ Erro ao buscar perfis:', profilesError);
        throw profilesError;
      }

      console.log('✅ Perfis encontrados:', profiles?.length || 0);
      console.log('📋 Lista de perfis:', profiles);

      setUsers(profiles || []);
      
      if (profiles && profiles.length > 0) {
        toast.success(`${profiles.length} usuário(s) carregado(s) com sucesso!`);
      } else {
        toast.info('Nenhum usuário encontrado. Tente sincronizar os usuários do Auth.');
      }
      
    } catch (error: any) {
      console.error('💥 Erro ao carregar usuários:', error);
      setUsers([]);
      toast.error(`Erro ao carregar usuários: ${error.message || 'Erro desconhecido'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateUser = async () => {
    try {
      if (!newUser.full_name?.trim() || !newUser.email?.trim() || !newUser.password?.trim()) {
        toast.error('Preencha todos os campos obrigatórios');
        return;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(newUser.email.trim())) {
        toast.error('Digite um email válido');
        return;
      }

      if (newUser.password.length < 6) {
        toast.error('A senha deve ter pelo menos 6 caracteres');
        return;
      }

      console.log('🔄 Criando usuário:', newUser);
      setIsCreatingUser(true);

      const result = await createUserWithProfile({
        email: newUser.email.trim(),
        password: newUser.password.trim(),
        full_name: newUser.full_name.trim(),
        role: newUser.role as 'admin' | 'consultant' | 'manager' | 'financial' | 'client',
        permissions: newUser.permissions
      });

      console.log('✅ Usuário criado com sucesso:', result);
      toast.success(`Usuário "${newUser.full_name}" criado com sucesso!`);
      
      setIsDialogOpen(false);
      setNewUser({ 
        full_name: '', 
        email: '', 
        password: '', 
        role: 'client',
        permissions: []
      });
      
      // Aguardar um pouco e recarregar para garantir que o usuário apareça
      setTimeout(() => {
        loadUsers();
      }, 1000);
      
    } catch (error: any) {
      console.error('💥 Erro ao criar usuário:', error);
      
      let errorMessage = 'Erro desconhecido ao criar usuário';
      
      if (error?.message) {
        if (error.message.includes('already registered') || error.message.includes('User already registered')) {
          errorMessage = 'Este email já está cadastrado no sistema';
        } else if (error.message.includes('Password should be at least')) {
          errorMessage = 'A senha deve ter pelo menos 6 caracteres';
        } else if (error.message.includes('Invalid email')) {
          errorMessage = 'Email inválido';
        } else if (error.message.includes('duplicate key value')) {
          errorMessage = 'Usuário já existe no sistema';
        } else if (error.message.includes('rate_limit')) {
          errorMessage = 'Muitas tentativas. Aguarde alguns minutos e tente novamente';
        } else {
          errorMessage = error.message;
        }
      }
      
      toast.error(`Erro ao criar usuário: ${errorMessage}`);
    } finally {
      setIsCreatingUser(false);
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

  const getStatusBadge = (isActive: boolean, emailConfirmed: boolean) => {
    if (!isActive) {
      return <Badge variant="secondary" className="text-xs">Inativo</Badge>;
    }
    if (!emailConfirmed) {
      return <Badge variant="outline" className="text-xs text-orange-600">Pendente Email</Badge>;
    }
    return <Badge variant="default" className="text-xs">Ativo</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Gerenciamento de Usuários</h1>
          <p className="text-muted-foreground">Gerencie usuários do sistema</p>
        </div>

        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={syncUsersFromAuth} 
            disabled={isSyncingUsers}
            className="text-blue-600 border-blue-600 hover:bg-blue-50"
          >
            <RotateCcw className={`h-4 w-4 mr-2 ${isSyncingUsers ? 'animate-spin' : ''}`} />
            {isSyncingUsers ? 'Sincronizando...' : 'Sincronizar'}
          </Button>

          <Button 
            variant="outline" 
            onClick={loadUsers} 
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Novo Usuário
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl">
              <DialogHeader>
                <DialogTitle>Criar Novo Usuário</DialogTitle>
              </DialogHeader>
              <div className="space-y-6 max-h-[70vh] overflow-y-auto">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <div className="flex items-center gap-2 text-blue-800">
                    <AlertTriangle className="h-4 w-4" />
                    <span className="font-medium">Informação Importante</span>
                  </div>
                  <p className="text-blue-700 text-sm mt-1">
                    O usuário receberá um email de confirmação para ativar a conta. 
                    Certifique-se de que o email esteja correto.
                  </p>
                </div>

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
                      placeholder="Mínimo 6 caracteres"
                      minLength={6}
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
                  <Button onClick={handleCreateUser} disabled={isCreatingUser}>
                    {isCreatingUser ? 'Criando...' : 'Criar Usuário'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Usuários do Sistema ({users.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
              <p>Carregando usuários...</p>
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum usuário encontrado na tabela de perfis</p>
              <p className="text-sm mb-4">Os usuários podem estar apenas no Supabase Auth</p>
              <div className="flex gap-2 justify-center">
                <Button 
                  onClick={syncUsersFromAuth}
                  disabled={isSyncingUsers}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <RotateCcw className={`h-4 w-4 mr-2 ${isSyncingUsers ? 'animate-spin' : ''}`} />
                  {isSyncingUsers ? 'Sincronizando...' : 'Sincronizar Usuários'}
                </Button>
                <Button 
                  variant="outline"
                  onClick={loadUsers}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Tentar Novamente
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <p className="text-green-800 text-sm">
                  ✅ {users.length} usuário(s) encontrado(s) e carregado(s) com sucesso!
                </p>
              </div>
              
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
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {getRoleLabel(user.role)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(user.is_active, user.email_confirmed)}
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
            </div>
          )}
        </CardContent>
      </Card>

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
