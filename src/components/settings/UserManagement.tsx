import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { UserCircle, UserCheck, UserX, UserCog, Shield, RefreshCcw } from 'lucide-react';
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

// Lista de módulos do sistema para permissões
const systemModules = [
  { id: 'dashboard', name: 'Dashboard', description: 'Painel principal do sistema' },
  { id: 'consultants', name: 'Consultores', description: 'Gerenciamento de consultores' },
  { id: 'clients', name: 'Clientes', description: 'Gerenciamento de clientes' },
  { id: 'projects', name: 'Projetos', description: 'Gerenciamento de projetos' },
  { id: 'services', name: 'Serviços', description: 'Gerenciamento de serviços' },
  { id: 'tags', name: 'Tags', description: 'Gerenciamento de tags' },
  { id: 'kpis', name: 'KPIs', description: 'Indicadores de desempenho' },
  { id: 'okrs', name: 'OKRs', description: 'Objetivos e resultados-chave' },
  { id: 'financial', name: 'Financeiro', description: 'Gestão financeira' },
  { id: 'activities', name: 'Atividades', description: 'Registro de atividades' },
  { id: 'notes', name: 'Anotações', description: 'Gerenciamento de anotações' },
  { id: 'chat', name: 'Chat', description: 'Chat interno' },
  { id: 'reports', name: 'Relatórios', description: 'Relatórios gerenciais' },
  { id: 'settings', name: 'Configurações', description: 'Configurações do sistema' }
];

interface UserWithProfile {
  id: string;
  email: string;
  profile: UserProfile | null;
}

interface UserWithPermissions extends UserWithProfile {
  permissions: ModulePermission[];
}

const UserManagement = () => {
  const { toast } = useToast();
  const [selectedUser, setSelectedUser] = useState<UserWithProfile | null>(null);
  const [isPermissionDialogOpen, setIsPermissionDialogOpen] = useState(false);
  const [permissionsLoading, setPermissionsLoading] = useState(false);
  const [userPermissions, setUserPermissions] = useState<ModulePermission[]>([]);
  const [userType, setUserType] = useState<string>('all');
  const [isResendingInvite, setIsResendingInvite] = useState<string | null>(null);
  
  // Buscar usuários e seus perfis
  const { data: users = [], isLoading: isLoadingUsers, refetch: refetchUsers } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
      
      if (authError) throw authError;
      
      // Buscar perfis de todos os usuários
      const { data: profiles, error: profilesError } = await supabase
        .from('user_profiles')
        .select('*');
        
      if (profilesError) throw profilesError;
      
      // Combinar usuários com seus perfis
      return authUsers.users.map(user => ({
        id: user.id,
        email: user.email,
        profile: profiles?.find(p => p.id === user.id) || null
      })) as UserWithProfile[];
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
      // Encontrar permissão existente ou criar nova
      let currentPermission = userPermissions.find(p => p.module_name === moduleName);
      let updatedPermissions;
      
      if (currentPermission) {
        // Atualizar permissão existente
        const updatedPermission = {
          ...currentPermission,
          [permissionType === 'view' ? 'can_view' : 'can_edit']: value
        };
        
        // Se desmarcar 'view', também desmarcar 'edit'
        if (permissionType === 'view' && !value) {
          updatedPermission.can_edit = false;
        }
        
        updatedPermissions = userPermissions.map(p => 
          p.module_name === moduleName ? updatedPermission : p
        );
      } else {
        // Criar nova permissão
        const newPermission = {
          id: '',
          user_id: selectedUser.id,
          module_name: moduleName,
          can_view: permissionType === 'view' ? value : false,
          can_edit: permissionType === 'edit' ? value : false
        };
        
        updatedPermissions = [...userPermissions, newPermission];
      }
      
      // Atualizar estado local
      setUserPermissions(updatedPermissions);
      
      // Atualizar no banco de dados
      const permToUpdate = updatedPermissions.find(p => p.module_name === moduleName)!;
      await updateUserPermissions(
        selectedUser.id, 
        moduleName, 
        { can_view: permToUpdate.can_view, can_edit: permToUpdate.can_edit }
      );
    } catch (error) {
      console.error('Erro ao atualizar permissão:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível atualizar a permissão."
      });
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

  const getRoleBadge = (role?: string) => {
    if (!role) return <Badge variant="outline">Indefinido</Badge>;
    
    switch (role) {
      case 'admin':
        return <Badge className="bg-red-500">Administrador</Badge>;
      case 'consultant':
        return <Badge className="bg-blue-500">Consultor</Badge>;
      case 'client':
        return <Badge className="bg-green-500">Cliente</Badge>;
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
          <Select value={userType} onValueChange={setUserType}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filtrar por tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os usuários</SelectItem>
              <SelectItem value="admin">Administradores</SelectItem>
              <SelectItem value="consultant">Consultores</SelectItem>
              <SelectItem value="client">Clientes</SelectItem>
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
                  <TableHead>Cadastrado em</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">
                      {user.profile?.full_name || "Sem nome"}
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      {getRoleBadge(user.profile?.role)}
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
                              Reenviar
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
      </CardContent>
    </Card>
  );
};

export default UserManagement;
