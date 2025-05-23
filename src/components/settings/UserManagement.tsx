import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { UserCircle, UserCheck, UserX, UserCog, Shield, RefreshCcw, UserPlus, Eye, EyeOff, RefreshCw, CheckCircle2 } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { supabase } from '@/integrations/supabase/client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { UserProfile, ModulePermission } from '@/types/auth';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { updateUserPermissions, resetUserPassword } from '@/services/auth';
import { toast as sonnerToast } from "sonner";
import { Switch } from "@/components/ui/switch";

// Lista de módulos do sistema para permissões
const systemModules = [
  { id: 'dashboard', name: 'Dashboard', description: 'Painel principal do sistema' },
  { id: 'consultants', name: 'Consultores', description: 'Gerenciamento de consultores' },
  { id: 'clients', name: 'Clientes', description: 'Gerenciamento de clientes' },
  { id: 'projects', name: 'Projetos', description: 'Gerenciamento de projetos' },
  { id: 'services', name: 'Serviços', description: 'Gerenciamento de serviços' },
  { id: 'tags', name: 'Tags', description: 'Gerenciamento de tags' },
  { id: 'demands', name: 'Demandas', description: 'Gerenciamento de demandas' },
  { id: 'kpis', name: 'KPIs', description: 'Indicadores de desempenho' },
  { id: 'okrs', name: 'OKRs', description: 'Objetivos e resultados-chave' },
  { id: 'financial', name: 'Financeiro', description: 'Gestão financeira' },
  { id: 'activities', name: 'Atividades', description: 'Registro de atividades' },
  { id: 'notes', name: 'Anotações', description: 'Gerenciamento de anotações' },
  { id: 'chat', name: 'Chat', description: 'Chat interno' },
  { id: 'reports', name: 'Relatórios', description: 'Relatórios gerenciais' },
  { id: 'settings', name: 'Configurações', description: 'Configurações do sistema' }
];

// Tipos de perfis disponíveis
const userRoles = [
  { id: 'admin', name: 'Administrador' },
  { id: 'consultant', name: 'Consultor' },
  { id: 'client', name: 'Cliente' },
  { id: 'manager', name: 'Gestor' },
  { id: 'commercial', name: 'Comercial' },
  { id: 'financial', name: 'Financeiro' },
  { id: 'marketing', name: 'Marketing' },
  { id: 'intern', name: 'Estagiário' }
];

interface UserWithProfile {
  id: string;
  email: string;
  profile: UserProfile | null;
  is_disabled?: boolean;
}

interface UserWithPermissions extends UserWithProfile {
  permissions: ModulePermission[];
}

interface CreateUserFormData {
  email: string;
  password: string;
  fullName: string;
  role: string;
}

const UserManagement = () => {
  const { toast } = useToast();
  const [selectedUser, setSelectedUser] = useState<UserWithProfile | null>(null);
  const [isPermissionDialogOpen, setIsPermissionDialogOpen] = useState(false);
  const [isCreateUserDialogOpen, setIsCreateUserDialogOpen] = useState(false);
  const [permissionsLoading, setPermissionsLoading] = useState(false);
  const [userPermissions, setUserPermissions] = useState<ModulePermission[]>([]);
  const [userType, setUserType] = useState<string>('all');
  const [isResendingInvite, setIsResendingInvite] = useState<string | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<string | null>(null);
  const [newUser, setNewUser] = useState<CreateUserFormData>({
    email: '',
    password: '',
    fullName: '',
    role: 'client'
  });
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  
  // Buscar usuários e seus perfis
  const { data: users = [], isLoading: isLoadingUsers, refetch: refetchUsers } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      try {
        // Fetch users from auth schema
        const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
        
        if (authError) throw authError;
        
        // Fetch profiles for all users
        const { data: profiles, error: profilesError } = await supabase
          .from('user_profiles')
          .select('*');
          
        if (profilesError) throw profilesError;
        
        // Combine users with their profiles and convert dates
        return authUsers.users.map(user => {
          const userProfile = profiles?.find(p => p.id === user.id);
          return {
            id: user.id,
            email: user.email,
            is_disabled: user.banned || false,
            profile: userProfile ? {
              ...userProfile,
              created_at: userProfile.created_at ? new Date(userProfile.created_at) : new Date(),
              updated_at: userProfile.updated_at ? new Date(userProfile.updated_at) : new Date(),
              last_login: userProfile.last_login ? new Date(userProfile.last_login) : undefined
            } : null
          } as UserWithProfile;
        });
      } catch (error) {
        console.error("Error fetching users:", error);
        throw error;
      }
    }
  });
  
  // Filtrar usuários com base no tipo selecionado
  const filteredUsers = userType === 'all' 
    ? users 
    : users.filter(user => user.profile?.role === userType);

  const handleOpenPermissions = async (user: UserWithProfile) => {
    setSelectedUser(user);
    setPermissionsLoading(true);
    
    try {
      const { data: permissions, error } = await supabase
        .from('module_permissions')
        .select('*')
        .eq('user_id', user.id);
        
      if (error) throw error;
      
      setUserPermissions(permissions || []);
      setIsPermissionDialogOpen(true);
    } catch (error) {
      console.error('Erro ao carregar permissões:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível carregar as permissões do usuário."
      });
    } finally {
      setPermissionsLoading(false);
    }
  };

  const handleUpdatePermission = async (moduleName: string, permissionType: 'view' | 'edit', value: boolean) => {
    if (!selectedUser) return;
    
    try {
      // Find existing permission or create new
      let currentPermission = userPermissions.find(p => p.module_name === moduleName);
      let updatedPermissions;
      
      if (currentPermission) {
        // Update existing permission
        const updatedPermission = {
          ...currentPermission,
          [permissionType === 'view' ? 'can_view' : 'can_edit']: value
        };
        
        // If uncheck 'view', also uncheck 'edit'
        if (permissionType === 'view' && !value) {
          updatedPermission.can_edit = false;
        }
        
        updatedPermissions = userPermissions.map(p => 
          p.module_name === moduleName ? updatedPermission : p
        );
      } else {
        // Create new permission
        const newPermission = {
          id: '',
          user_id: selectedUser.id,
          module_name: moduleName,
          can_view: permissionType === 'view' ? value : false,
          can_edit: permissionType === 'edit' ? value : false
        };
        
        updatedPermissions = [...userPermissions, newPermission];
      }
      
      // Update local state
      setUserPermissions(updatedPermissions);
      
      // Update in database
      const permToUpdate = updatedPermissions.find(p => p.module_name === moduleName)!;
      await updateUserPermissions(
        selectedUser.id, 
        moduleName, 
        { can_view: permToUpdate.can_view, can_edit: permToUpdate.can_edit }
      );

      sonnerToast.success("Permissão atualizada com sucesso");
    } catch (error) {
      console.error('Erro ao atualizar permissão:', error);
      sonnerToast.error("Erro ao atualizar permissão");
    }
  };

  const handleResendInvite = async (email: string) => {
    setIsResendingInvite(email);
    try {
      await resetUserPassword(email);
      toast({
        title: "Convite enviado",
        description: `Um novo email de acesso foi enviado para ${email}`
      });
    } catch (error) {
      console.error('Erro ao reenviar convite:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível reenviar o convite."
      });
    } finally {
      setIsResendingInvite(null);
    }
  };

  const toggleUserStatus = async (user: UserWithProfile) => {
    setIsUpdatingStatus(user.id);
    
    try {
      const newStatus = !user.is_disabled;
      
      // Update user status - Fix for admin API methods
      if (newStatus) {
        // Ban user instead of disableUser
        const { error } = await supabase.auth.admin.updateUserById(
          user.id,
          { banned: true }
        );
        if (error) throw error;
      } else {
        // Unban user instead of enableUser
        const { error } = await supabase.auth.admin.updateUserById(
          user.id,
          { banned: false }
        );
        if (error) throw error;
      }
      
      // Update local state
      const updatedUsers = users.map(u => 
        u.id === user.id ? { ...u, is_disabled: newStatus } : u
      );
      
      // Refresh user list
      refetchUsers();
      
      sonnerToast.success(`Usuário ${newStatus ? 'desativado' : 'ativado'} com sucesso`);
    } catch (error) {
      console.error('Erro ao atualizar status do usuário:', error);
      sonnerToast.error("Erro ao atualizar status do usuário");
    } finally {
      setIsUpdatingStatus(null);
    }
  };

  const createNewUser = async () => {
    if (!newUser.email || !newUser.password || !newUser.fullName || !newUser.role) {
      sonnerToast.error("Preencha todos os campos obrigatórios");
      return;
    }
    
    setIsCreatingUser(true);
    
    try {
      // Create user in auth
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: newUser.email,
        password: newUser.password,
        email_confirm: true,
        user_metadata: {
          full_name: newUser.fullName,
          role: newUser.role
        }
      });
      
      if (authError) throw authError;
      
      if (authData.user) {
        // Ensure profile is created
        const { error: profileError } = await supabase
          .from('user_profiles')
          .upsert({
            id: authData.user.id,
            full_name: newUser.fullName,
            role: newUser.role,
          });
          
        if (profileError) throw profileError;
      }
      
      // Reset form and close dialog
      setNewUser({
        email: '',
        password: '',
        fullName: '',
        role: 'client'
      });
      
      setIsCreateUserDialogOpen(false);
      refetchUsers();
      
      sonnerToast.success("Usuário criado com sucesso");
    } catch (error: any) {
      console.error('Erro ao criar usuário:', error);
      sonnerToast.error(`Erro ao criar usuário: ${error.message}`);
    } finally {
      setIsCreatingUser(false);
    }
  };

  const getRoleBadge = (role?: string) => {
    if (!role) return <Badge variant="outline">Indefinido</Badge>;
    
    switch (role) {
      case 'admin':
        return <Badge className="bg-red-500">Administrador</Badge>;
      case 'consultant':
        return <Badge className="bg-blue-500">Consultor</Badge>;
      case 'client':
        return <Badge className="bg-green-500">Cliente</Badge>;
      case 'manager':
        return <Badge className="bg-purple-500">Gestor</Badge>;
      case 'commercial':
        return <Badge className="bg-orange-500">Comercial</Badge>;
      case 'financial':
        return <Badge className="bg-emerald-500">Financeiro</Badge>;
      case 'marketing':
        return <Badge className="bg-pink-500">Marketing</Badge>;
      case 'intern':
        return <Badge className="bg-yellow-500">Estagiário</Badge>;
      default:
        return <Badge variant="outline">{role}</Badge>;
    }
  };
  
  return (
    <Card className="shadow-card">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-xl">
          <div className="flex items-center">
            <UserCircle className="h-5 w-5 mr-2" />
            <span>Gerenciamento de Usuários</span>
          </div>
        </CardTitle>
        <div className="flex items-center space-x-2">
          <Button 
            variant="outline" 
            onClick={() => setIsCreateUserDialogOpen(true)}
            className="mr-2"
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Novo Usuário
          </Button>
          <Select value={userType} onValueChange={setUserType}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filtrar por tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os usuários</SelectItem>
              <SelectItem value="admin">Administradores</SelectItem>
              <SelectItem value="consultant">Consultores</SelectItem>
              <SelectItem value="client">Clientes</SelectItem>
              <SelectItem value="manager">Gestores</SelectItem>
              <SelectItem value="commercial">Comercial</SelectItem>
              <SelectItem value="financial">Financeiro</SelectItem>
              <SelectItem value="marketing">Marketing</SelectItem>
              <SelectItem value="intern">Estagiários</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={() => refetchUsers()}>
            <RefreshCcw className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoadingUsers ? (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : filteredUsers.length > 0 ? (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Cadastrado em</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id} className={user.is_disabled ? "opacity-60" : ""}>
                    <TableCell className="font-medium">
                      {user.profile?.full_name || "Sem nome"}
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      {getRoleBadge(user.profile?.role)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.is_disabled ? "destructive" : "outline"} className={!user.is_disabled ? "bg-green-500 hover:bg-green-600" : ""}>
                        {user.is_disabled ? "Inativo" : "Ativo"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {user.profile?.created_at ? 
                        format(new Date(user.profile.created_at), 'dd/MM/yyyy') : 
                        "N/A"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenPermissions(user)}
                        >
                          <Shield className="h-4 w-4 mr-1" />
                          Permissões
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleResendInvite(user.email)}
                          disabled={isResendingInvite === user.email}
                        >
                          {isResendingInvite === user.email ? (
                            <RefreshCcw className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <RefreshCcw className="h-4 w-4 mr-1" />
                              Redefinir
                            </>
                          )}
                        </Button>
                        <Button
                          variant={user.is_disabled ? "default" : "destructive"}
                          size="sm"
                          onClick={() => toggleUserStatus(user)}
                          disabled={isUpdatingStatus === user.id}
                        >
                          {isUpdatingStatus === user.id ? (
                            <RefreshCw className="h-4 w-4 animate-spin" />
                          ) : user.is_disabled ? (
                            <>
                              <Eye className="h-4 w-4 mr-1" />
                              Ativar
                            </>
                          ) : (
                            <>
                              <EyeOff className="h-4 w-4 mr-1" />
                              Desativar
                            </>
                          )}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            Nenhum usuário encontrado.
          </div>
        )}

        {/* Dialog para gerenciar permissões de módulos */}
        <Dialog open={isPermissionDialogOpen} onOpenChange={setIsPermissionDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Permissões de Usuário</DialogTitle>
              <DialogDescription>
                {selectedUser?.profile?.full_name || selectedUser?.email || "Usuário"} - {selectedUser?.profile?.role}
              </DialogDescription>
            </DialogHeader>
            
            {permissionsLoading ? (
              <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              </div>
            ) : (
              <div className="overflow-y-auto max-h-[60vh]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Módulo</TableHead>
                      <TableHead className="w-24 text-center">Visualizar</TableHead>
                      <TableHead className="w-24 text-center">Editar</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {systemModules.map((module) => {
                      const permission = userPermissions.find(p => p.module_name === module.id);
                      const canView = permission?.can_view || false;
                      const canEdit = permission?.can_edit || false;
                      
                      return (
                        <TableRow key={module.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{module.name}</div>
                              <div className="text-sm text-muted-foreground">
                                {module.description}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <Checkbox 
                              checked={canView}
                              onCheckedChange={(checked) => 
                                handleUpdatePermission(module.id, 'view', checked === true)
                              }
                            />
                          </TableCell>
                          <TableCell className="text-center">
                            <Checkbox 
                              checked={canEdit}
                              disabled={!canView}
                              onCheckedChange={(checked) => 
                                handleUpdatePermission(module.id, 'edit', checked === true)
                              }
                            />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
            
            <DialogFooter>
              <Button onClick={() => setIsPermissionDialogOpen(false)}>
                Fechar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        {/* Dialog para criar novo usuário */}
        <Dialog open={isCreateUserDialogOpen} onOpenChange={setIsCreateUserDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar Novo Usuário</DialogTitle>
              <DialogDescription>
                Preencha os dados para adicionar um novo usuário ao sistema
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Nome completo</Label>
                  <Input 
                    id="fullName" 
                    value={newUser.fullName}
                    onChange={(e) => setNewUser({...newUser, fullName: e.target.value})}
                    placeholder="Nome do usuário"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input 
                    id="email" 
                    type="email"
                    value={newUser.email}
                    onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                    placeholder="email@exemplo.com"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password">Senha</Label>
                  <Input 
                    id="password" 
                    type="password"
                    value={newUser.password}
                    onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                    placeholder="Senha de acesso"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="role">Perfil</Label>
                  <Select value={newUser.role} onValueChange={(value) => setNewUser({...newUser, role: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um perfil" />
                    </SelectTrigger>
                    <SelectContent>
                      {userRoles.map((role) => (
                        <SelectItem key={role.id} value={role.id}>
                          {role.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateUserDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={createNewUser} disabled={isCreatingUser}>
                {isCreatingUser ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                    Criando...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Criar Usuário
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default UserManagement;
