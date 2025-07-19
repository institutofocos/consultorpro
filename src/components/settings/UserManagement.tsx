
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Users, Search, RefreshCw, Mail, Calendar, UserCheck, Link, Check, Shield } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import UserLinkModal from './UserLinkModal';
import UserProfileModal from './UserProfileModal';

interface AuthUser {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at: string | null;
  email_confirmed_at: string | null;
}

interface UserLink {
  user_id: string;
  consultant_id: string | null;
  consultant_name: string | null;
  client_id: string | null;
  client_name: string | null;
}

interface UserProfile {
  user_id: string;
  profile_id: string;
  profile_name: string;
  profile_description: string;
}

const UserManagement = () => {
  const [users, setUsers] = useState<AuthUser[]>([]);
  const [userLinks, setUserLinks] = useState<UserLink[]>([]);
  const [userProfiles, setUserProfiles] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState('');
  const [selectedUser, setSelectedUser] = useState<AuthUser | null>(null);
  const [linkModalOpen, setLinkModalOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError('');

      console.log('Buscando usuários...');

      const { data, error } = await supabase.rpc('get_auth_users');

      if (error) {
        console.error('Erro RPC get_auth_users:', error);
        throw new Error(`Erro na função get_auth_users: ${error.message}`);
      }

      console.log('Dados retornados:', data);

      if (data && Array.isArray(data)) {
        const formattedUsers = data.map((user: any) => ({
          id: user.id || '',
          email: user.email || '',
          created_at: user.created_at || new Date().toISOString(),
          last_sign_in_at: user.last_sign_in_at || null,
          email_confirmed_at: user.email_confirmed_at || null,
        }));

        setUsers(formattedUsers);
        console.log(`${formattedUsers.length} usuários carregados com sucesso`);

        // Buscar vínculos e perfis para todos os usuários
        await fetchUserLinks(formattedUsers.map(u => u.id));
        await fetchUserProfiles(formattedUsers.map(u => u.id));
      } else {
        console.warn('Nenhum usuário encontrado ou dados inválidos');
        setUsers([]);
        setUserLinks([]);
        setUserProfiles([]);
      }

    } catch (error: any) {
      console.error('Erro completo ao buscar usuários:', error);
      const errorMessage = error.message || 'Erro desconhecido ao carregar usuários';
      setError(errorMessage);
      toast.error('Erro ao carregar usuários: ' + errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserLinks = async (userIds: string[]) => {
    try {
      console.log('Buscando vínculos dos usuários...');
      
      const linksPromises = userIds.map(async (userId) => {
        const { data, error } = await supabase.rpc('get_user_links', { p_user_id: userId });
        
        if (error) {
          console.error(`Erro ao buscar vínculos para usuário ${userId}:`, error);
          return null;
        }
        
        return data && data.length > 0 ? data[0] : null;
      });

      const linksResults = await Promise.all(linksPromises);
      const validLinks = linksResults.filter(Boolean) as UserLink[];
      
      setUserLinks(validLinks);
      console.log(`${validLinks.length} vínculos encontrados`);
      
    } catch (error: any) {
      console.error('Erro ao buscar vínculos:', error);
    }
  };

  const fetchUserProfiles = async (userIds: string[]) => {
    try {
      console.log('Buscando perfis dos usuários...');
      
      const profilesPromises = userIds.map(async (userId) => {
        const { data, error } = await supabase.rpc('get_user_profile', { p_user_id: userId });
        
        if (error) {
          console.error(`Erro ao buscar perfil para usuário ${userId}:`, error);
          return null;
        }
        
        return data && data.length > 0 ? data[0] : null;
      });

      const profilesResults = await Promise.all(profilesPromises);
      const validProfiles = profilesResults.filter(Boolean) as UserProfile[];
      
      setUserProfiles(validProfiles);
      console.log(`${validProfiles.length} perfis encontrados`);
      
    } catch (error: any) {
      console.error('Erro ao buscar perfis:', error);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const filteredUsers = users.filter(user =>
    user.email && user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Nunca';
    try {
      return format(new Date(dateString), 'dd/MM/yyyy HH:mm', { locale: ptBR });
    } catch {
      return 'Data inválida';
    }
  };

  const getStatusBadge = (user: AuthUser) => {
    if (!user.email_confirmed_at) {
      return <Badge variant="secondary">Não confirmado</Badge>;
    }
    if (user.last_sign_in_at) {
      return <Badge variant="default">Ativo</Badge>;
    }
    return <Badge variant="outline">Confirmado</Badge>;
  };

  const getUserLink = (userId: string) => {
    return userLinks.find(link => link.user_id === userId);
  };

  const getUserProfile = (userId: string) => {
    return userProfiles.find(profile => profile.user_id === userId);
  };

  const isUserLinked = (userId: string) => {
    const link = getUserLink(userId);
    return !!(link && (link.consultant_id || link.client_id));
  };

  const handleOpenLinkModal = (user: AuthUser) => {
    setSelectedUser(user);
    setLinkModalOpen(true);
  };

  const handleOpenProfileModal = (user: AuthUser) => {
    setSelectedUser(user);
    setProfileModalOpen(true);
  };

  const handleCloseLinkModal = () => {
    setSelectedUser(null);
    setLinkModalOpen(false);
    // Recarregar dados quando fechar o modal
    fetchUsers();
  };

  const handleCloseProfileModal = () => {
    setSelectedUser(null);
    setProfileModalOpen(false);
    // Recarregar dados quando fechar o modal
    fetchUsers();
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Gerenciamento de Usuários
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin" />
            <span className="ml-2">Carregando usuários...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Gerenciamento de Usuários
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar por email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button onClick={fetchUsers} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Atualizar
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold">{users.length}</p>
                    <p className="text-sm text-muted-foreground">Total de usuários</p>
                  </div>
                  <Users className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold">
                      {users.filter(u => u.email_confirmed_at).length}
                    </p>
                    <p className="text-sm text-muted-foreground">Confirmados</p>
                  </div>
                  <UserCheck className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold">
                      {users.filter(u => u.last_sign_in_at).length}
                    </p>
                    <p className="text-sm text-muted-foreground">Já fizeram login</p>
                  </div>
                  <Calendar className="h-8 w-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Perfil</TableHead>
                  <TableHead>Data de Cadastro</TableHead>
                  <TableHead>Último Login</TableHead>
                  <TableHead>Confirmação de Email</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      {searchTerm ? 'Nenhum usuário encontrado com este email' : 'Nenhum usuário cadastrado'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user) => {
                    const linked = isUserLinked(user.id);
                    const userProfile = getUserProfile(user.id);
                    
                    return (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-gray-400" />
                            {user.email || 'Email não disponível'}
                          </div>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(user)}
                        </TableCell>
                        <TableCell>
                          {userProfile ? (
                            <Badge 
                              variant="default" 
                              className="cursor-pointer hover:bg-opacity-80"
                              onClick={() => handleOpenProfileModal(user)}
                            >
                              <Shield className="h-3 w-3 mr-1" />
                              {userProfile.profile_name}
                            </Badge>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleOpenProfileModal(user)}
                              className="h-6 px-2 text-xs"
                            >
                              <Shield className="h-3 w-3 mr-1" />
                              Atribuir
                            </Button>
                          )}
                        </TableCell>
                        <TableCell>
                          {formatDate(user.created_at)}
                        </TableCell>
                        <TableCell>
                          {formatDate(user.last_sign_in_at)}
                        </TableCell>
                        <TableCell>
                          {user.email_confirmed_at ? formatDate(user.email_confirmed_at) : 'Não confirmado'}
                        </TableCell>
                        <TableCell>
                          <div className="text-center text-sm text-muted-foreground">
                            -
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          <div className="text-sm text-muted-foreground">
            <p>
              * Esta lista mostra todos os usuários registrados no sistema. 
              Os usuários precisam confirmar seus emails antes de poder fazer login.
            </p>
          </div>
        </CardContent>
      </Card>

      {selectedUser && linkModalOpen && (
        <UserLinkModal
          isOpen={linkModalOpen}
          onClose={handleCloseLinkModal}
          user={selectedUser}
        />
      )}

      {selectedUser && profileModalOpen && (
        <UserProfileModal
          isOpen={profileModalOpen}
          onClose={handleCloseProfileModal}
          user={selectedUser}
        />
      )}
    </>
  );
};

export default UserManagement;
