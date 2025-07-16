import React from 'react';
import { Stage } from './types';

interface ProjectFormStageSectionProps {
  stages: Stage[];
  onStagesChange: (stages: Stage[]) => void;
  disabled: boolean;
}

const ProjectFormStageSection: React.FC<ProjectFormStageSectionProps> = ({
  stages,
  onStagesChange,
  disabled
}) => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Etapas do Projeto</h3>
      <p className="text-sm text-muted-foreground">
        Configure as etapas do projeto aqui.
      </p>
      {/* Placeholder for stage configuration */}
      <div className="p-4 border rounded-lg bg-gray-50">
        <p className="text-sm text-muted-foreground text-center">
          Configuração de etapas será implementada aqui
        </p>
      </div>
    </div>
  );
};

export default ProjectFormStageSection;
