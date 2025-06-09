
import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ProjectForm from '@/components/projects/ProjectForm';
import { fetchProjects } from '@/integrations/supabase/projects';

const ProjectEdit: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: fetchProjects,
  });

  const project = projects.find(p => p.id === id);

  const handleClose = () => {
    navigate('/projects');
  };

  const handleSave = () => {
    navigate('/projects');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando projeto...</p>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Projeto não encontrado</h1>
          <p className="text-muted-foreground mb-4">O projeto solicitado não foi encontrado.</p>
          <Button onClick={handleClose}>
            Voltar para Projetos
          </Button>
        </div>
      </div>
    );
  }

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
                <h1 className="text-lg font-semibold">Editar Projeto</h1>
                <p className="text-sm text-muted-foreground">
                  {project.name}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <ProjectForm
          project={project}
          onClose={handleClose}
          onSave={handleSave}
        />
      </div>
    </div>
  );
};

export default ProjectEdit;
