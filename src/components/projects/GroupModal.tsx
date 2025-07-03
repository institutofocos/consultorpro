
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ProjectGroup } from '@/hooks/useProjectGroups';

interface GroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string) => void;
  group?: ProjectGroup | null;
  isLoading?: boolean;
}

const GroupModal: React.FC<GroupModalProps> = ({
  isOpen,
  onClose,
  onSave,
  group,
  isLoading = false,
}) => {
  const [groupName, setGroupName] = useState('');

  useEffect(() => {
    if (group) {
      setGroupName(group.name);
    } else {
      setGroupName('');
    }
  }, [group]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (groupName.trim()) {
      onSave(groupName.trim());
      if (!group) {
        setGroupName(''); // Only clear for new groups
      }
    }
  };

  const handleClose = () => {
    setGroupName('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {group ? 'Editar Grupo' : 'Criar Novo Grupo'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="groupName">Nome do Grupo</Label>
            <Input
              id="groupName"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="Digite o nome do grupo"
              required
            />
          </div>
          
          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={!groupName.trim() || isLoading}
            >
              {isLoading ? 'Salvando...' : (group ? 'Atualizar' : 'Criar')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default GroupModal;
