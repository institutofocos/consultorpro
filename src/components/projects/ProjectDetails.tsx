
import React from 'react';
import { Project } from './types';
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface ProjectDetailsProps {
  project: Project;
  onClose: () => void;
  onProjectUpdated: () => void;
}

export const ProjectDetails: React.FC<ProjectDetailsProps> = ({ 
  project, 
  onClose, 
  onProjectUpdated 
}) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Detalhes do Projeto</h2>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold">{project.name}</h3>
          <p className="text-muted-foreground">{project.description}</p>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium">Data de Início</label>
            <p>{project.startDate}</p>
          </div>
          <div>
            <label className="text-sm font-medium">Data de Término</label>
            <p>{project.endDate}</p>
          </div>
        </div>
        
        <div>
          <label className="text-sm font-medium">Valor Total</label>
          <p>R$ {project.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
        </div>
        
        {project.mainConsultantName && (
          <div>
            <label className="text-sm font-medium">Consultor Principal</label>
            <p>{project.mainConsultantName}</p>
            {project.mainConsultantPixKey && (
              <p className="text-sm text-muted-foreground">PIX: {project.mainConsultantPixKey}</p>
            )}
          </div>
        )}
        
        {project.supportConsultantName && (
          <div>
            <label className="text-sm font-medium">Consultor de Apoio</label>
            <p>{project.supportConsultantName}</p>
            {project.supportConsultantPixKey && (
              <p className="text-sm text-muted-foreground">PIX: {project.supportConsultantPixKey}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectDetails;
