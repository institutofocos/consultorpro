
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface ProjectGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string) => void;
  initialName?: string;
  title: string;
  selectedCount?: number;
}

const ProjectGroupModal: React.FC<ProjectGroupModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialName = '',
  title,
  selectedCount
}) => {
  const [groupName, setGroupName] = useState(initialName);

  const handleSave = () => {
    if (groupName.trim()) {
      onSave(groupName.trim());
      setGroupName('');
      onClose();
    }
  };

  const handleClose = () => {
    setGroupName(initialName);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="group-name">Nome do Grupo</Label>
            <Input
              id="group-name"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="Digite o nome do grupo..."
              onKeyPress={(e) => e.key === 'Enter' && handleSave()}
              autoFocus
            />
          </div>
          {selectedCount && (
            <p className="text-sm text-muted-foreground">
              {selectedCount} projeto(s) selecionado(s)
            </p>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={!groupName.trim()}>
            {initialName ? 'Salvar' : 'Criar Grupo'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ProjectGroupModal;
