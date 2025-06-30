
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
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Link, Save, X, Users, Building } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface AuthUser {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at: string | null;
  email_confirmed_at: string | null;
}

interface UserLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: AuthUser;
}

interface Consultant {
  id: string;
  name: string;
  email: string;
}

interface Client {
  id: string;
  name: string;
  contact_name: string;
}

interface AccessProfile {
  id: string;
  name: string;
  description: string;
  is_active: boolean;
}

const UserLinkModal: React.FC<UserLinkModalProps> = ({ isOpen, onClose, user }) => {
  const [consultants, setConsultants] = useState<Consultant[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [accessProfiles, setAccessProfiles] = useState<AccessProfile[]>([]);
  const [selectedConsultant, setSelectedConsultant] = useState<string>('');
  const [selectedClient, setSelectedClient] = useState<string>('');
  const [selectedProfile, setSelectedProfile] = useState<string>('');
  const [linkType, setLinkType] = useState<'consultant' | 'client' | ''>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentLinks, setCurrentLinks] = useState<any>(null);

  useEffect(() => {
    if (isOpen) {
      fetchData();
      fetchCurrentLinks();
    }
  }, [isOpen, user.id]);

  const fetchData = async () => {
    try {
      // Buscar consultores
      const { data: consultantsData, error: consultantsError } = await supabase
        .from('consultants')
        .select('id, name, email')
        .order('name');

      if (consultantsError) throw consultantsError;
      setConsultants(consultantsData || []);

      // Buscar clientes
      const { data: clientsData, error: clientsError } = await supabase
        .from('clients')
        .select('id, name, contact_name')
        .order('name');

      if (clientsError) throw clientsError;
      setClients(clientsData || []);

      // Buscar perfis de acesso
      const { data: profilesData, error: profilesError } = await supabase
        .from('access_profiles')
        .select('id, name, description, is_active')
        .eq('is_active', true)
        .order('name');

      if (profilesError) throw profilesError;
      setAccessProfiles(profilesData || []);

    } catch (error: any) {
      console.error('Erro ao carregar dados:', error);
      setError(error.message);
    }
  };

  const fetchCurrentLinks = async () => {
    try {
      const { data, error } = await supabase.rpc('get_user_links', {
        p_user_id: user.id
      });

      if (error) throw error;

      if (data && data.length > 0) {
        const userLink = data[0];
        setCurrentLinks(userLink);
        
        if (userLink.consultant_id) {
          setLinkType('consultant');
          setSelectedConsultant(userLink.consultant_id);
        }
        
        if (userLink.client_id) {
          setLinkType('client');
          setSelectedClient(userLink.client_id);
        }
      }
    } catch (error: any) {
      console.error('Erro ao buscar vínculos atuais:', error);
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      setError('');

      if (!linkType) {
        throw new Error('Selecione o tipo de vínculo');
      }

      if (!selectedProfile) {
        throw new Error('Selecione um perfil de acesso');
      }

      if (linkType === 'consultant' && !selectedConsultant) {
        throw new Error('Selecione um consultor');
      }

      if (linkType === 'client' && !selectedClient) {
        throw new Error('Selecione um cliente');
      }

      // Remover vínculos existentes
      await supabase.from('user_consultant_links').delete().eq('user_id', user.id);
      await supabase.from('user_client_links').delete().eq('user_id', user.id);

      // Criar novo vínculo
      if (linkType === 'consultant') {
        const { error } = await supabase
          .from('user_consultant_links')
          .insert({
            user_id: user.id,
            consultant_id: selectedConsultant,
            profile_id: selectedProfile
          });

        if (error) throw error;
      } else if (linkType === 'client') {
        const { error } = await supabase
          .from('user_client_links')
          .insert({
            user_id: user.id,
            client_id: selectedClient,
            profile_id: selectedProfile
          });

        if (error) throw error;
      }

      toast.success('Usuário vinculado com sucesso!');
      onClose();

    } catch (error: any) {
      console.error('Erro ao vincular usuário:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveLink = async () => {
    try {
      setLoading(true);
      
      await supabase.from('user_consultant_links').delete().eq('user_id', user.id);
      await supabase.from('user_client_links').delete().eq('user_id', user.id);

      toast.success('Vínculo removido com sucesso!');
      onClose();
    } catch (error: any) {
      console.error('Erro ao remover vínculo:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link className="h-5 w-5" />
            Vincular Usuário
          </DialogTitle>
          <DialogDescription>
            Vincule o usuário {user.email} a um consultor ou cliente e defina seu perfil de acesso.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          {/* Tipo de vínculo */}
          <div>
            <Label>Tipo de Vínculo</Label>
            <Select value={linkType} onValueChange={(value: 'consultant' | 'client') => setLinkType(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo de vínculo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="consultant">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Consultor
                  </div>
                </SelectItem>
                <SelectItem value="client">
                  <div className="flex items-center gap-2">
                    <Building className="h-4 w-4" />
                    Cliente
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Seleção de consultor */}
          {linkType === 'consultant' && (
            <div>
              <Label>Consultor</Label>
              <Select value={selectedConsultant} onValueChange={setSelectedConsultant}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um consultor" />
                </SelectTrigger>
                <SelectContent>
                  {consultants.map((consultant) => (
                    <SelectItem key={consultant.id} value={consultant.id}>
                      {consultant.name} - {consultant.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Seleção de cliente */}
          {linkType === 'client' && (
            <div>
              <Label>Cliente</Label>
              <Select value={selectedClient} onValueChange={setSelectedClient}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um cliente" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name} - {client.contact_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Seleção de perfil de acesso */}
          <div>
            <Label>Perfil de Acesso</Label>
            <Select value={selectedProfile} onValueChange={setSelectedProfile}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um perfil de acesso" />
              </SelectTrigger>
              <SelectContent>
                {accessProfiles.map((profile) => (
                  <SelectItem key={profile.id} value={profile.id}>
                    <div>
                      <div className="font-medium">{profile.name}</div>
                      {profile.description && (
                        <div className="text-xs text-muted-foreground">{profile.description}</div>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter className="flex gap-2">
          {currentLinks && (
            <Button variant="destructive" onClick={handleRemoveLink} disabled={loading}>
              Remover Vínculo
            </Button>
          )}
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

export default UserLinkModal;
