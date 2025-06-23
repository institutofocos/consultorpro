
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Calendar, User, Building, DollarSign, Clock, CheckCircle } from 'lucide-react';
import { Project } from '@/components/projects/types';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ProjectDetailsModalProps {
  project: Project;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ProjectDetailsModal: React.FC<ProjectDetailsModalProps> = ({
  project,
  open,
  onOpenChange,
}) => {
  const getStatusColor = (status: string) => {
    const statusColors = {
      'iniciar_projeto': 'bg-gray-100 text-gray-800',
      'em_producao': 'bg-blue-100 text-blue-800',
      'aguardando_assinatura': 'bg-yellow-100 text-yellow-800',
      'aguardando_aprovacao': 'bg-orange-100 text-orange-800',
      'aguardando_nota_fiscal': 'bg-purple-100 text-purple-800',
      'aguardando_pagamento': 'bg-pink-100 text-pink-800',
      'aguardando_repasse': 'bg-indigo-100 text-indigo-800',
      'finalizados': 'bg-green-100 text-green-800',
      'cancelados': 'bg-red-100 text-red-800',
    };
    return statusColors[status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800';
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (date: string) => {
    return formatDistanceToNow(new Date(date), { 
      addSuffix: true, 
      locale: ptBR 
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <span>{project.name}</span>
            <Badge className={`${getStatusColor(project.status)}`}>
              {project.status.replace('_', ' ')}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Informações Básicas */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-600">Valor Total</span>
              </div>
              <p className="font-semibold">{formatCurrency(project.totalValue)}</p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-600">Prazo</span>
              </div>
              <p className="font-semibold">{formatDate(project.endDate)}</p>
            </div>

            {project.clientName && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Building className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600">Cliente</span>
                </div>
                <p className="font-semibold">{project.clientName}</p>
              </div>
            )}

            {project.mainConsultantName && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600">Consultor Principal</span>
                </div>
                <p className="font-semibold">{project.mainConsultantName}</p>
              </div>
            )}
          </div>

          {/* Descrição */}
          {project.description && (
            <div className="space-y-2">
              <h4 className="font-semibold">Descrição</h4>
              <p className="text-gray-600">{project.description}</p>
            </div>
          )}

          {/* Etapas */}
          {project.stages && project.stages.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-semibold">Etapas do Projeto</h4>
              <div className="space-y-2">
                {project.stages.map((stage, index) => (
                  <div key={stage.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      {stage.completed ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <div className="h-4 w-4 rounded-full border-2 border-gray-300" />
                      )}
                      <div>
                        <p className="font-medium">{stage.name}</p>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {stage.hours}h · {stage.days} dias
                          </span>
                          <span className="flex items-center gap-1">
                            <DollarSign className="h-3 w-3" />
                            {formatCurrency(stage.value)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <Badge className={`text-xs ${getStatusColor(stage.status || 'iniciar_projeto')}`}>
                      {(stage.status || 'iniciar_projeto').replace('_', ' ')}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tags */}
          {project.tags && project.tags.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-semibold">Tags</h4>
              <div className="flex flex-wrap gap-2">
                {project.tags.map((tag, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProjectDetailsModal;
