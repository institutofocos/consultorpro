
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ProjectForm from '@/components/projects/ProjectForm';

const ProjectNew: React.FC = () => {
  const navigate = useNavigate();

  const handleClose = () => {
    navigate('/projects');
  };

  const handleSave = () => {
    navigate('/projects');
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4">
          <div className="flex h-14 items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClose}
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Voltar
              </Button>
              <div>
                <h1 className="text-lg font-semibold">Novo Projeto</h1>
                <p className="text-sm text-muted-foreground">
                  Criar um novo projeto no sistema
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <ProjectForm
          onClose={handleClose}
          onSave={handleSave}
        />
      </div>
    </div>
  );
};

export default ProjectNew;
