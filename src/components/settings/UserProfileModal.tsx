
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
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import SearchableSelect from "@/components/ui/searchable-select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Shield, Save, X, User } from 'lucide-react';

interface AuthUser {
  id: string;
  email: string;
}

interface AccessProfile {
  id: string;
  name: string;
  description: string;
}

interface UserProfile {
  user_id: string;
  profile_id: string;
  profile_name: string;
  profile_description: string;
}

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: AuthUser;
}

const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  user
}) => {
  const [profiles, setProfiles] = useState<AccessProfile[]>([]);
  const [currentProfile, setCurrentProfile] = useState<UserProfile | null>(null);
  const [selectedProfileId, setSelectedProfileId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchProfiles = async () => {
    try {
      const { data, error } = await supabase.rpc('get_access_profiles');
      
      if (error) {
        throw error;
      }

      if (data) {
        setProfiles(data);
      }
    } catch (error: any) {
      console.error('Erro ao buscar perfis:', error);
      setError('Erro ao carregar perfis de acesso');
    }
  };

  const fetchUserProfile = async () => {
    try {
      const { data, error } = await supabase.rpc('get_user_profile', { 
        p_user_id: user.id 
      });
      
      if (error) {
        throw error;
      }

      if (data && data.length > 0) {
        setCurrentProfile(data[0]);
        setSelectedProfileId(data[0].profile_id);
      } else {
        setCurrentProfile(null);
        setSelectedProfileId('');
      }
    } catch (error: any) {
      console.error('Erro ao buscar perfil do usuário:', error);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchProfiles();
      fetchUserProfile();
      setError('');
    }
  }, [isOpen, user.id]);

  const handleSave = async () => {
    if (!selectedProfileId) {
      setError('Selecione um perfil para atribuir ao usuário');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const { error } = await supabase.rpc('assign_user_profile', {
        p_user_id: user.id,
        p_profile_id: selectedProfileId
      });

      if (error) {
        throw error;
      }

      toast.success('Perfil atribuído com sucesso!');
      onClose();

    } catch (error: any) {
      console.error('Erro ao atribuir perfil:', error);
      setError(error.message || 'Erro ao atribuir perfil');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveProfile = async () => {
    try {
      setLoading(true);
      setError('');

      const { error } = await supabase
        .from('user_profiles')
        .delete()
        .eq('user_id', user.id);

      if (error) {
        throw error;
      }

      toast.success('Perfil removido com sucesso!');
      onClose();

    } catch (error: any) {
      console.error('Erro ao remover perfil:', error);
      setError(error.message || 'Erro ao remover perfil');
    } finally {
      setLoading(false);
    }
  };

  const profileOptions = profiles.map(profile => ({
    id: profile.id,
    name: profile.name
  }));

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Gerenciar Perfil de Acesso
          </DialogTitle>
          <DialogDescription>
            Atribua um perfil de acesso para o usuário: {user.email}
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          {currentProfile && (
            <div className="p-3 bg-gray-50 rounded-lg border">
              <Label className="text-sm font-medium text-gray-700">Perfil Atual:</Label>
              <div className="mt-1">
                <Badge variant="default" className="mb-1">
                  {currentProfile.profile_name}
                </Badge>
                {currentProfile.profile_description && (
                  <p className="text-xs text-gray-600 mt-1">
                    {currentProfile.profile_description}
                  </p>
                )}
              </div>
            </div>
          )}

          <div>
            <Label htmlFor="profile">Perfil de Acesso</Label>
            <SearchableSelect
              options={profileOptions}
              value={selectedProfileId}
              onValueChange={(value) => setSelectedProfileId(value as string)}
              placeholder="Selecione um perfil..."
              searchPlaceholder="Buscar perfil..."
              emptyText="Nenhum perfil encontrado"
              disabled={loading}
            />
          </div>

          {selectedProfileId && (
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-800">
                  Perfil Selecionado
                </span>
              </div>
              {profiles.find(p => p.id === selectedProfileId)?.description && (
                <p className="text-xs text-blue-700">
                  {profiles.find(p => p.id === selectedProfileId)?.description}
                </p>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <div className="flex justify-between w-full">
            <div>
              {currentProfile && (
                <Button 
                  variant="destructive" 
                  onClick={handleRemoveProfile} 
                  disabled={loading}
                  size="sm"
                >
                  Remover Perfil
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose} disabled={loading}>
                <X className="h-4 w-4 mr-2" />
                Cancelar
              </Button>
              <Button onClick={handleSave} disabled={loading || !selectedProfileId}>
                <Save className="h-4 w-4 mr-2" />
                {loading ? 'Salvando...' : 'Salvar'}
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default UserProfileModal;
