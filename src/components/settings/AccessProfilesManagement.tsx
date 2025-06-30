import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Users, Search, RefreshCw, Plus, Edit, Trash2, Shield, ToggleLeft, ToggleRight } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import AccessProfileModal from './AccessProfileModal';

interface ModulePermission {
  module_name: string;
  can_view: boolean;
  can_edit: boolean;
  can_delete: boolean;
  restrict_to_linked?: boolean; // Nova propriedade opcional
}

interface AccessProfile {
  id: string;
  name: string;
  description: string;
  is_system_default: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  permissions: ModulePermission[];
}

const AccessProfilesManagement = () => {
  const [profiles, setProfiles] = useState<AccessProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState('');
  const [selectedProfile, setSelectedProfile] = useState<AccessProfile | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const fetchProfiles = async () => {
    try {
      setLoading(true);
      setError('');

      console.log('Buscando perfis de acesso...');

      const { data, error } = await supabase.rpc('get_access_profiles');

      if (error) {
        console.error('Erro ao buscar perfis:', error);
        throw new Error(`Erro ao buscar perfis: ${error.message}`);
      }

      console.log('Perfis carregados:', data);

      if (data && Array.isArray(data)) {
        // Transformar os dados para o tipo correto, garantindo que permissions seja um array válido
        const transformedProfiles: AccessProfile[] = data.map(profile => ({
          ...profile,
          permissions: Array.isArray(profile.permissions) 
            ? profile.permissions.map((perm: any) => ({
                module_name: perm.module_name || '',
                can_view: !!perm.can_view,
                can_edit: !!perm.can_edit,
                can_delete: !!perm.can_delete,
                restrict_to_linked: !!perm.restrict_to_linked
              }))
            : []
        }));
        
        setProfiles(transformedProfiles);
        console.log(`${transformedProfiles.length} perfis carregados com sucesso`);
      } else {
        console.warn('Nenhum perfil encontrado');
        setProfiles([]);
      }

    } catch (error: any) {
      console.error('Erro completo ao buscar perfis:', error);
      const errorMessage = error.message || 'Erro desconhecido ao carregar perfis';
      setError(errorMessage);
      toast.error('Erro ao carregar perfis: ' + errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const toggleProfileStatus = async (profileId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('access_profiles')
        .update({ 
          is_active: !currentStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', profileId);

      if (error) {
        throw error;
      }

      toast.success(`Perfil ${!currentStatus ? 'ativado' : 'desativado'} com sucesso!`);
      fetchProfiles();
    } catch (error: any) {
      console.error('Erro ao alterar status do perfil:', error);
      toast.error('Erro ao alterar status do perfil');
    }
  };

  const deleteProfile = async (profileId: string) => {
    if (!confirm('Tem certeza que deseja excluir este perfil? Esta ação não pode ser desfeita.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('access_profiles')
        .delete()
        .eq('id', profileId);

      if (error) {
        throw error;
      }

      toast.success('Perfil excluído com sucesso!');
      fetchProfiles();
    } catch (error: any) {
      console.error('Erro ao excluir perfil:', error);
      toast.error('Erro ao excluir perfil');
    }
  };

  useEffect(() => {
    fetchProfiles();
  }, []);

  const filteredProfiles = profiles.filter(profile =>
    profile.name && profile.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'dd/MM/yyyy HH:mm', { locale: ptBR });
    } catch {
      return 'Data inválida';
    }
  };

  const getPermissionSummary = (permissions: ModulePermission[]) => {
    const viewCount = permissions.filter(p => p.can_view).length;
    const editCount = permissions.filter(p => p.can_edit).length;
    const deleteCount = permissions.filter(p => p.can_delete).length;
    const restrictedCount = permissions.filter(p => p.restrict_to_linked).length;
    
    let summary = `${viewCount} visualizar | ${editCount} editar | ${deleteCount} excluir`;
    if (restrictedCount > 0) {
      summary += ` | ${restrictedCount} restrito`;
    }
    
    return summary;
  };

  const handleOpenModal = (profile?: AccessProfile) => {
    if (profile) {
      setSelectedProfile(profile);
      setIsCreating(false);
    } else {
      setSelectedProfile(null);
      setIsCreating(true);
    }
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setSelectedProfile(null);
    setIsCreating(false);
    setModalOpen(false);
    fetchProfiles();
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Perfis de Acesso
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin" />
            <span className="ml-2">Carregando perfis...</span>
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
            <Shield className="h-5 w-5" />
            Perfis de Acesso
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
                placeholder="Buscar por nome..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={() => handleOpenModal()} className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Novo Perfil
              </Button>
              <Button onClick={fetchProfiles} variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Atualizar
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold">{profiles.length}</p>
                    <p className="text-sm text-muted-foreground">Total de perfis</p>
                  </div>
                  <Shield className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold">
                      {profiles.filter(p => p.is_active).length}
                    </p>
                    <p className="text-sm text-muted-foreground">Ativos</p>
                  </div>
                  <ToggleRight className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold">
                      {profiles.filter(p => p.is_system_default).length}
                    </p>
                    <p className="text-sm text-muted-foreground">Padrão do sistema</p>
                  </div>
                  <Shield className="h-8 w-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold">
                      {profiles.filter(p => !p.is_active).length}
                    </p>
                    <p className="text-sm text-muted-foreground">Inativos</p>
                  </div>
                  <ToggleLeft className="h-8 w-8 text-red-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Permissões</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Data de Criação</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProfiles.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      {searchTerm ? 'Nenhum perfil encontrado com este nome' : 'Nenhum perfil cadastrado'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredProfiles.map((profile) => (
                    <TableRow key={profile.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div>
                            <div className="font-medium">{profile.name}</div>
                            {profile.is_system_default && (
                              <Badge variant="secondary" className="text-xs">
                                Sistema
                              </Badge>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-xs">
                        <div className="truncate" title={profile.description}>
                          {profile.description || 'Sem descrição'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-muted-foreground">
                          {getPermissionSummary(profile.permissions)}
                        </div>
                      </TableCell>
                      <TableCell>
                        {profile.is_active ? (
                          <Badge variant="default">Ativo</Badge>
                        ) : (
                          <Badge variant="secondary">Inativo</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {formatDate(profile.created_at)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleOpenModal(profile)}
                          >
                            <Edit className="h-3 w-3 mr-1" />
                            Editar
                          </Button>
                          
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => toggleProfileStatus(profile.id, profile.is_active)}
                          >
                            {profile.is_active ? (
                              <ToggleLeft className="h-3 w-3 mr-1" />
                            ) : (
                              <ToggleRight className="h-3 w-3 mr-1" />
                            )}
                            {profile.is_active ? 'Desativar' : 'Ativar'}
                          </Button>

                          {!profile.is_system_default && (
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => deleteProfile(profile.id)}
                            >
                              <Trash2 className="h-3 w-3 mr-1" />
                              Excluir
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {modalOpen && (
        <AccessProfileModal
          isOpen={modalOpen}
          onClose={handleCloseModal}
          profile={selectedProfile}
          isCreating={isCreating}
        />
      )}
    </>
  );
};

export default AccessProfilesManagement;
