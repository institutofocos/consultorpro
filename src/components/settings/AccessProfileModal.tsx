import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Shield, Save, X } from 'lucide-react';
import { AccessProfile, ModulePermission } from '@/types/auth';

interface AccessProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile?: AccessProfile | null;
  isCreating: boolean;
}

const MODULE_LABELS = {
  dashboard: 'Dashboard',
  consultants: 'Consultores',
  clients: 'Clientes',
  projects: 'Projetos',
  demands: 'Demandas',
  services: 'Serviços',
  calendar: 'Calendário',
  chat: 'Chat',
  financial: 'Financeiro',
  settings: 'Configurações'
} as const;

type ModuleName = keyof typeof MODULE_LABELS;

const ALL_MODULES = Object.keys(MODULE_LABELS) as ModuleName[];

const AccessProfileModal: React.FC<AccessProfileModalProps> = ({
  isOpen,
  onClose,
  profile,
  isCreating
}) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    is_active: true
  });
  const [permissions, setPermissions] = useState<Record<string, ModulePermission>>({});
  const [loading, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (profile && !isCreating) {
      setFormData({
        name: profile.name,
        description: profile.description || '',
        is_active: profile.is_active
      });

      // Converter array de permissões para objeto indexado por module_name
      const permissionsObj: Record<string, ModulePermission> = {};
      profile.permissions.forEach(perm => {
        permissionsObj[perm.module_name] = perm;
      });

      // Garantir que todos os módulos tenham uma entrada
      ALL_MODULES.forEach(module => {
        if (!permissionsObj[module]) {
          permissionsObj[module] = {
            module_name: module,
            can_view: false,
            can_edit: false,
            can_delete: false,
            restrict_to_linked: false
          };
        }
      });

      setPermissions(permissionsObj);
    } else {
      // Resetar para novo perfil
      setFormData({
        name: '',
        description: '',
        is_active: true
      });

      const emptyPermissions: Record<string, ModulePermission> = {};
      ALL_MODULES.forEach(module => {
        emptyPermissions[module] = {
          module_name: module,
          can_view: false,
          can_edit: false,
          can_delete: false,
          restrict_to_linked: false
        };
      });
      setPermissions(emptyPermissions);
    }
    setError('');
  }, [profile, isCreating, isOpen]);

  const handlePermissionChange = (module: string, permission: 'can_view' | 'can_edit' | 'can_delete' | 'restrict_to_linked', value: boolean) => {
    setPermissions(prev => ({
      ...prev,
      [module]: {
        ...prev[module],
        [permission]: value,
        // Se desmarcar can_view, também desmarcar restrict_to_linked
        ...(permission === 'can_view' && !value ? { restrict_to_linked: false } : {})
      }
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError('');

      if (!formData.name.trim()) {
        throw new Error('Nome é obrigatório');
      }

      let profileId: string;

      if (isCreating) {
        // Criar novo perfil
        const { data: newProfile, error: profileError } = await supabase
          .from('access_profiles')
          .insert({
            name: formData.name.trim(),
            description: formData.description.trim() || null,
            is_active: formData.is_active,
            is_system_default: false
          })
          .select('id')
          .single();

        if (profileError) {
          throw profileError;
        }

        profileId = newProfile.id;
      } else {
        // Atualizar perfil existente
        const { error: profileError } = await supabase
          .from('access_profiles')
          .update({
            name: formData.name.trim(),
            description: formData.description.trim() || null,
            is_active: formData.is_active,
            updated_at: new Date().toISOString()
          })
          .eq('id', profile!.id);

        if (profileError) {
          throw profileError;
        }

        profileId = profile!.id;

        // Remover permissões existentes para recriá-las
        const { error: deleteError } = await supabase
          .from('profile_module_permissions')
          .delete()
          .eq('profile_id', profileId);

        if (deleteError) {
          throw deleteError;
        }
      }

      // Inserir permissões
      const permissionsToInsert = Object.values(permissions)
        .filter(perm => perm.can_view || perm.can_edit || perm.can_delete);

      for (const perm of permissionsToInsert) {
        const { error: permissionError } = await supabase
          .from('profile_module_permissions')
          .insert({
            profile_id: profileId,
            module_name: perm.module_name,
            can_view: perm.can_view,
            can_edit: perm.can_edit,
            can_delete: perm.can_delete || false,
            restrict_to_linked: perm.restrict_to_linked || false
          });

        if (permissionError) {
          throw permissionError;
        }
      }

      toast.success(`Perfil ${isCreating ? 'criado' : 'atualizado'} com sucesso!`);
      onClose();

    } catch (error: any) {
      console.error('Erro ao salvar perfil:', error);
      setError(error.message || 'Erro ao salvar perfil');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent size="xl" className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            {isCreating ? 'Criar Novo Perfil' : 'Editar Perfil'}
          </DialogTitle>
          <DialogDescription>
            {isCreating 
              ? 'Defina as informações e permissões para o novo perfil de acesso.'
              : 'Modifique as informações e permissões do perfil de acesso.'
            }
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-6">
          {/* Informações básicas */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Nome do Perfil *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Digite o nome do perfil"
                disabled={profile?.is_system_default}
              />
            </div>

            <div>
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Descreva as características deste perfil"
                rows={3}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: !!checked }))}
              />
              <Label htmlFor="is_active">Perfil ativo</Label>
            </div>

            {profile?.is_system_default && (
              <Badge variant="secondary" className="w-fit">
                Perfil padrão do sistema - Nome não pode ser alterado
              </Badge>
            )}
          </div>

          {/* Permissões por módulo */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Permissões por Módulo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {ALL_MODULES.map((module) => (
                  <div key={module} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium">{MODULE_LABELS[module]}</h4>
                    </div>
                    
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id={`${module}_view`}
                          checked={permissions[module]?.can_view || false}
                          onCheckedChange={(checked) => 
                            handlePermissionChange(module, 'can_view', !!checked)
                          }
                        />
                        <Label htmlFor={`${module}_view`} className="text-sm">
                          Visualizar
                        </Label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id={`${module}_edit`}
                          checked={permissions[module]?.can_edit || false}
                          onCheckedChange={(checked) => 
                            handlePermissionChange(module, 'can_edit', !!checked)
                          }
                        />
                        <Label htmlFor={`${module}_edit`} className="text-sm">
                          Editar
                        </Label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id={`${module}_delete`}
                          checked={permissions[module]?.can_delete || false}
                          onCheckedChange={(checked) => 
                            handlePermissionChange(module, 'can_delete', !!checked)
                          }
                        />
                        <Label htmlFor={`${module}_delete`} className="text-sm">
                          Excluir
                        </Label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id={`${module}_restrict`}
                          checked={permissions[module]?.restrict_to_linked || false}
                          onCheckedChange={(checked) => 
                            handlePermissionChange(module, 'restrict_to_linked', !!checked)
                          }
                          disabled={!permissions[module]?.can_view}
                        />
                        <Label htmlFor={`${module}_restrict`} className="text-sm">
                          Apenas vinculados
                        </Label>
                      </div>
                    </div>
                    
                    {permissions[module]?.restrict_to_linked && (
                      <div className="mt-2 text-xs text-muted-foreground bg-yellow-50 p-2 rounded border border-yellow-200">
                        ⚠️ O usuário verá apenas informações relacionadas ao consultor ou cliente vinculado a ele
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            <X className="h-4 w-4 mr-2" />
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            <Save className="h-4 w-4 mr-2" />
            {loading ? 'Salvando...' : 'Salvar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AccessProfileModal;
