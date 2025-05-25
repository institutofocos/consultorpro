
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Edit, Calendar, User, DollarSign, Clock, Tag, Copy, Check } from "lucide-react";
import { fetchProjectById } from "@/integrations/supabase/projects";
import { Project } from "./types";
import { useToast } from "@/components/ui/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export const ProjectDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedMainPix, setCopiedMainPix] = useState(false);
  const [copiedSupportPix, setCopiedSupportPix] = useState(false);

  useEffect(() => {
    if (id) {
      loadProject(id);
    }
  }, [id]);

  const loadProject = async (projectId: string) => {
    try {
      setLoading(true);
      const projectData = await fetchProjectById(projectId);
      if (projectData) {
        setProject(projectData);
      } else {
        toast({
          variant: "destructive",
          title: "Erro",
          description: "Projeto não encontrado"
        });
        navigate('/projects');
      }
    } catch (error) {
      console.error('Error loading project:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao carregar projeto"
      });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string, type: 'main' | 'support') => {
    try {
      await navigator.clipboard.writeText(text);
      if (type === 'main') {
        setCopiedMainPix(true);
        setTimeout(() => setCopiedMainPix(false), 2000);
      } else {
        setCopiedSupportPix(true);
        setTimeout(() => setCopiedSupportPix(false), 2000);
      }
      toast({
        title: "Copiado!",
        description: "Chave PIX copiada para a área de transferência"
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível copiar a chave PIX"
      });
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="h-64 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-muted-foreground">Projeto não encontrado</h2>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'planned': return 'bg-blue-100 text-blue-800';
      case 'active': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'planned': return 'Planejado';
      case 'active': return 'Ativo';
      case 'completed': return 'Concluído';
      case 'cancelled': return 'Cancelado';
      default: return status;
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/projects')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{project.name}</h1>
            <p className="text-muted-foreground">ID: {project.projectId}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Badge className={getStatusColor(project.status)}>
            {getStatusText(project.status)}
          </Badge>
          <Button onClick={() => navigate(`/projects/edit/${project.id}`)}>
            <Edit className="mr-2 h-4 w-4" />
            Editar
          </Button>
        </div>
      </div>

      {/* Informações Básicas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Cronograma
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Data de Início</label>
              <p className="text-lg">{format(new Date(project.startDate), 'dd/MM/yyyy', { locale: ptBR })}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Data de Término</label>
              <p className="text-lg">{format(new Date(project.endDate), 'dd/MM/yyyy', { locale: ptBR })}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Total de Horas</label>
              <p className="text-lg">{project.totalHours || 0}h</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Valores
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Valor Total</label>
              <p className="text-lg font-semibold">R$ {project.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Taxa (%)</label>
              <p className="text-lg">{project.taxPercent}%</p>
            </div>
            {project.hourlyRate && project.hourlyRate > 0 && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Valor por Hora</label>
                <p className="text-lg">R$ {project.hourlyRate.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Consultores */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Consultores
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Consultor Principal */}
          <div>
            <label className="text-sm font-medium text-muted-foreground">Consultor Principal</label>
            <p className="text-lg font-medium">{project.mainConsultantName || 'Não definido'}</p>
            <p className="text-sm text-muted-foreground">Comissão: {project.mainConsultantCommission}%</p>
            {project.consultantValue && project.consultantValue > 0 && (
              <p className="text-sm text-muted-foreground">
                Valor: R$ {project.consultantValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            )}
            {project.mainConsultantPixKey && (
              <div className="flex items-center gap-2 mt-2">
                <span className="text-sm text-muted-foreground">PIX:</span>
                <code className="bg-muted px-2 py-1 rounded text-sm">{project.mainConsultantPixKey}</code>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(project.mainConsultantPixKey!, 'main')}
                  className="h-6 w-6 p-0"
                >
                  {copiedMainPix ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                </Button>
              </div>
            )}
          </div>

          {/* Consultor de Apoio */}
          {project.supportConsultantId && (
            <div>
              <label className="text-sm font-medium text-muted-foreground">Consultor de Apoio</label>
              <p className="text-lg font-medium">{project.supportConsultantName}</p>
              <p className="text-sm text-muted-foreground">Comissão: {project.supportConsultantCommission}%</p>
              {project.supportConsultantValue && project.supportConsultantValue > 0 && (
                <p className="text-sm text-muted-foreground">
                  Valor: R$ {project.supportConsultantValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              )}
              {project.supportConsultantPixKey && (
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-sm text-muted-foreground">PIX:</span>
                  <code className="bg-muted px-2 py-1 rounded text-sm">{project.supportConsultantPixKey}</code>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(project.supportConsultantPixKey!, 'support')}
                    className="h-6 w-6 p-0"
                  >
                    {copiedSupportPix ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Descrição e Tags */}
      {(project.description || (project.tags && project.tags.length > 0)) && (
        <Card>
          <CardHeader>
            <CardTitle>Informações Adicionais</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {project.description && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Descrição</label>
                <p className="text-sm mt-1">{project.description}</p>
              </div>
            )}
            {project.tags && project.tags.length > 0 && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Tags</label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {project.tags.map((tag, index) => (
                    <Badge key={index} variant="secondary">
                      <Tag className="mr-1 h-3 w-3" />
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Etapas */}
      {project.stages && project.stages.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Etapas do Projeto
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {project.stages.map((stage, index) => (
                <div key={stage.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">Etapa {index + 1}: {stage.name}</h4>
                    <Badge variant={stage.completed ? "default" : "secondary"}>
                      {stage.completed ? "Concluída" : "Pendente"}
                    </Badge>
                  </div>
                  {stage.description && (
                    <p className="text-sm text-muted-foreground mb-2">{stage.description}</p>
                  )}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Dias:</span> {stage.days}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Horas:</span> {stage.hours}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Valor:</span> R$ {stage.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Data fim:</span> {stage.endDate ? format(new Date(stage.endDate), 'dd/MM/yyyy', { locale: ptBR }) : 'Não definida'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ProjectDetails;
