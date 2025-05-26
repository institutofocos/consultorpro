
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface ProjectDescriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectName: string;
  description: string;
}

const ProjectDescriptionModal: React.FC<ProjectDescriptionModalProps> = ({
  isOpen,
  onClose,
  projectName,
  description
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Descrição do Projeto: {projectName}</DialogTitle>
        </DialogHeader>
        <div className="mt-4">
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">
            {description || 'Nenhuma descrição disponível.'}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProjectDescriptionModal;
