
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface User {
  id: string;
  full_name: string;
  role: string;
  email?: string;
  created_at: string;
  last_login?: string;
  is_active?: boolean;
}

interface UserEditModalProps {
  user: User | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUserUpdated: () => void;
}

const userRoles = [
  { value: 'admin', label: 'Administrador' },
  { value: 'consultant', label: 'Consultor' },
  { value: 'manager', label: 'Gestor' },
  { value: 'financial', label: 'Financeiro' },
  { value: 'client', label: 'Cliente' }
];

const UserEditModal: React.FC<UserEditModalProps> = ({
  user,
  open,
  onOpenChange,
  onUserUpdated
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    full_name: user?.full_name || '',
    role: user?.role || 'client',
    email: user?.email || '',
    is_active: user?.is_active !== false // default to true if not specified
  });

  React.useEffect(() => {
    if (user) {
      setFormData({
        full_name: user.full_name || '',
        role: user.role || 'client',
        email: user.email || '',
        is_active: user.is_active !== false
      });
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsLoading(true);
    try {
      // Atualizar perfil do usuário
      const { error: profileError } = await supabase
        .from('user_profiles')
        .update({
          full_name: formData.full_name,
          role: formData.role,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (profileError) {
        console.error('Erro ao atualizar perfil:', profileError);
        throw profileError;
      }

      // Se for um consultor, atualizar na tabela de consultores também
      if (formData.role === 'consultant') {
        const { error: consultantError } = await supabase
          .from('consultants')
          .upsert({
            id: user.id,
            name: formData.full_name,
            email: formData.email,
            updated_at: new Date().toISOString()
          });

        if (consultantError) {
          console.error('Erro ao atualizar consultor:', consultantError);
        }
      }

      // Se for um cliente, atualizar na tabela de clientes também
      if (formData.role === 'client') {
        const { error: clientError } = await supabase
          .from('clients')
          .upsert({
            id: user.id,
            contact_name: formData.full_name,
            name: formData.full_name,
            email: formData.email,
            created_at: user.created_at
          });

        if (clientError) {
          console.error('Erro ao atualizar cliente:', clientError);
        }
      }

      toast.success('Usuário atualizado com sucesso!');
      onUserUpdated();
      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao atualizar usuário:', error);
      toast.error('Erro ao atualizar usuário');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleUserStatus = async () => {
    if (!user) return;

    const newStatus = !formData.is_active;
    setIsLoading(true);

    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({
          is_active: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) throw error;

      setFormData(prev => ({ ...prev, is_active: newStatus }));
      toast.success(`Usuário ${newStatus ? 'ativado' : 'desativado'} com sucesso!`);
      onUserUpdated();
    } catch (error) {
      console.error('Erro ao alterar status do usuário:', error);
      toast.error('Erro ao alterar status do usuário');
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Editar Usuário</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="full_name">Nome Completo</Label>
            <Input
              id="full_name"
              value={formData.full_name}
              onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
              placeholder="Nome completo do usuário"
              required
            />
          </div>

          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              placeholder="email@exemplo.com"
            />
          </div>

          <div>
            <Label htmlFor="role">Tipo de Usuário</Label>
            <Select value={formData.role} onValueChange={(value) => setFormData(prev => ({ ...prev, role: value }))}>
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

          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div>
              <Label className="text-sm font-medium">
                Status de Acesso
              </Label>
              <p className="text-sm text-muted-foreground">
                {formData.is_active ? 'Usuário ativo no sistema' : 'Usuário desativado'}
              </p>
            </div>
            <Switch
              checked={formData.is_active}
              onCheckedChange={toggleUserStatus}
              disabled={isLoading}
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default UserEditModal;
