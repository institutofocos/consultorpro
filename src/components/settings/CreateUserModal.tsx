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
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import SearchableSelect from "@/components/ui/searchable-select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { UserPlus, Save, X } from 'lucide-react';

interface AccessProfile {
  id: string;
  name: string;
  description: string;
}

interface CreateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUserCreated: () => void;
}

const CreateUserModal: React.FC<CreateUserModalProps> = ({
  isOpen,
  onClose,
  onUserCreated
}) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    profileId: ''
  });
  const [profiles, setProfiles] = useState<AccessProfile[]>([]);
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

  useEffect(() => {
    if (isOpen) {
      fetchProfiles();
      setFormData({
        email: '',
        password: '',
        confirmPassword: '',
        profileId: ''
      });
      setError('');
    }
  }, [isOpen]);

  const validateForm = () => {
    if (!formData.email.trim()) {
      setError('Email é obrigatório');
      return false;
    }

    if (!formData.email.includes('@')) {
      setError('Email deve ser válido');
      return false;
    }

    if (!formData.password.trim()) {
      setError('Senha é obrigatória');
      return false;
    }

    if (formData.password.length < 6) {
      setError('Senha deve ter pelo menos 6 caracteres');
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Senhas não coincidem');
      return false;
    }

    if (!formData.profileId) {
      setError('Perfil de acesso é obrigatório');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      setError('');

      // Criar usuário no Supabase Auth usando service role
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email.trim(),
        password: formData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/`
        }
      });

      if (authError) {
        throw new Error(`Erro ao criar usuário: ${authError.message}`);
      }

      if (!authData.user) {
        throw new Error('Usuário não foi criado corretamente');
      }

      // Atribuir perfil ao usuário
      const { error: profileError } = await supabase.rpc('assign_user_profile', {
        p_user_id: authData.user.id,
        p_profile_id: formData.profileId
      });

      if (profileError) {
        console.error('Erro ao atribuir perfil:', profileError);
        // Não falhar completamente, apenas avisar
        toast.warning('Usuário criado, mas houve erro ao atribuir perfil. Atribua manualmente.');
      }

      toast.success('Usuário criado com sucesso!');
      onUserCreated();
      onClose();

    } catch (error: any) {
      console.error('Erro ao criar usuário:', error);
      setError(error.message || 'Erro ao criar usuário');
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
            <UserPlus className="h-5 w-5" />
            Criar Novo Usuário
          </DialogTitle>
          <DialogDescription>
            Crie um novo usuário no sistema e atribua um perfil de acesso.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div>
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              placeholder="usuario@exemplo.com"
              required
              disabled={loading}
            />
          </div>

          <div>
            <Label htmlFor="password">Senha *</Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
              placeholder="Mínimo 6 caracteres"
              required
              disabled={loading}
              minLength={6}
            />
          </div>

          <div>
            <Label htmlFor="confirmPassword">Confirmar Senha *</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
              placeholder="Digite a senha novamente"
              required
              disabled={loading}
              minLength={6}
            />
          </div>

          <div>
            <Label htmlFor="profile">Perfil de Acesso *</Label>
            <SearchableSelect
              options={profileOptions}
              value={formData.profileId}
              onValueChange={(value) => setFormData(prev => ({ ...prev, profileId: value as string }))}
              placeholder="Selecione um perfil..."
              searchPlaceholder="Buscar perfil..."
              emptyText="Nenhum perfil encontrado"
              disabled={loading}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              <X className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              <Save className="h-4 w-4 mr-2" />
              {loading ? 'Criando...' : 'Criar Usuário'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateUserModal;