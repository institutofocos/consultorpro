
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { X, Edit, Calendar, User, DollarSign, Clock, FileText, Activity } from 'lucide-react';
import { Project } from './types';
import ProjectStagesList from './ProjectStagesList';
import ProjectHistory from './ProjectHistory';

interface ProjectDetailsProps {
  project: Project;
  onClose: () => void;
  onProjectUpdated: () => void;
}

const ProjectDetails: React.FC<ProjectDetailsProps> = ({
  project,
  onClose,
  onProjectUpdated
}) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value || 0);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    try {
      return new Date(dateString).toLocaleDateString('pt-BR');
    } catch (error) {
      console.error('Error formatting date:', error);
      return '-';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'em_planejamento':
        return 'bg-blue-100 text-blue-800';
      case 'em_producao':
        return 'bg-yellow-100 text-yellow-800';
      case 'concluido':
        return 'bg-green-100 text-green-800';
      case 'cancelado':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'em_planejamento':
        return 'Em Planejamento';
      case 'em_producao':
        return 'Em Produção';
      case 'concluido':
        return 'Concluído';
      case 'cancelado':
        return 'Cancelado';
      default:
        return status;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h2 className="text-2xl font-bold">{project.name}</h2>
            <Badge className={getStatusColor(project.status)}>
              {getStatusLabel(project.status)}
            </Badge>
            {project.projectId && (
              <Badge variant="outline">
                ID: {project.projectId}
              </Badge>
            )}
          </div>
          {project.description && (
            <p className="text-muted-foreground max-w-3xl">
              {project.description}
            </p>
          )}
        </div>
        <Button variant="outline" size="sm" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Visão Geral
          </TabsTrigger>
          <TabsTrigger value="stages" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Etapas
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Histórico
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Informações Gerais
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Cliente</label>
                  <p className="text-sm">{project.clientName || '-'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Serviço</label>
                  <p className="text-sm">{project.serviceName || '-'}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Data Início</label>
                    <p className="text-sm">{formatDate(project.startDate)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Data Fim</label>
                    <p className="text-sm">{formatDate(project.endDate)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Equipe
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Consultor Principal</label>
                  <p className="text-sm">{project.mainConsultantName || '-'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Consultor de Apoio</label>
                  <p className="text-sm">{project.supportConsultantName || '-'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Gestor</label>
                  <p className="text-sm">{project.managerName || '-'}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Financial Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Informações Financeiras
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Valor Total</label>
                  <p className="text-lg font-semibold">{formatCurrency(project.totalValue)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Total de Horas</label>
                  <p className="text-lg font-semibold">{project.totalHours || 0}h</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Taxa por Hora</label>
                  <p className="text-lg font-semibold">{formatCurrency(project.hourlyRate || 0)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Progresso</label>
                  <p className="text-lg font-semibold">
                    {project.completedStages || 0}/{project.stages?.length || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tags */}
          {project.tagNames && project.tagNames.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Tags</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {project.tagNames.map((tagName, index) => (
                    <Badge key={index} variant="secondary">
                      {tagName}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="stages">
          <ProjectStagesList
            project={project}
            onProjectUpdated={onProjectUpdated}
          />
        </TabsContent>

        <TabsContent value="history">
          <ProjectHistory projectId={project.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ProjectDetails;
