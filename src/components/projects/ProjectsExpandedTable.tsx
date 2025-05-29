
import React, { useState } from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Edit, 
  Trash2, 
  ExternalLink, 
  Eye, 
  Calendar,
  User,
  Building,
  Briefcase,
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  Url
} from 'lucide-react';
import { Project } from './types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

interface ProjectsExpandedTableProps {
  projects: Project[];
  onDeleteProject: (id: string) => void;
  onEditProject: (project: Project) => void;
  onRefresh: () => void;
}

const ProjectsExpandedTable: React.FC<ProjectsExpandedTableProps> = ({
  projects,
  onDeleteProject,
  onEditProject,
  onRefresh
}) => {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const toggleRowExpansion = (projectId: string) => {
    const newExpandedRows = new Set(expandedRows);
    if (expandedRows.has(projectId)) {
      newExpandedRows.delete(projectId);
    } else {
      newExpandedRows.add(projectId);
    }
    setExpandedRows(newExpandedRows);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'dd/MM/yyyy', { locale: ptBR });
    } catch {
      return dateString;
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'completed':
      case 'concluido':
        return 'default';
      case 'active':
      case 'em_producao':
        return 'secondary';
      case 'planned':
      case 'em_planejamento':
        return 'outline';
      case 'cancelled':
      case 'cancelado':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const handleUrlClick = (url: string) => {
    if (url) {
      // Ensure URL has protocol
      const formattedUrl = url.startsWith('http') ? url : `https://${url}`;
      window.open(formattedUrl, '_blank', 'noopener,noreferrer');
    }
  };

  if (projects.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Nenhum projeto encontrado
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[50px]"></TableHead>
            <TableHead>Projeto</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Cliente</TableHead>
            <TableHead>Consultor</TableHead>
            <TableHead>Serviço</TableHead>
            <TableHead>Tags</TableHead>
            <TableHead>Valor Total</TableHead>
            <TableHead>Data Início</TableHead>
            <TableHead>Data Fim</TableHead>
            <TableHead>URL</TableHead>
            <TableHead>Descrição</TableHead>
            <TableHead>Progresso</TableHead>
            <TableHead className="w-[100px]">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {projects.map((project) => (
            <React.Fragment key={project.id}>
              <TableRow className="hover:bg-muted/50">
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleRowExpansion(project.id)}
                    className="p-1"
                  >
                    {expandedRows.has(project.id) ? (
                      <XCircle className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </TableCell>
                <TableCell className="font-medium">
                  <div className="flex flex-col">
                    <span className="font-semibold">{project.name}</span>
                    {project.projectId && (
                      <span className="text-xs text-muted-foreground">
                        ID: {project.projectId}
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={getStatusBadgeVariant(project.status)}>
                    {project.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Building className="h-4 w-4 text-muted-foreground" />
                    {project.clientName || 'N/A'}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    {project.mainConsultantName || 'N/A'}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Briefcase className="h-4 w-4 text-muted-foreground" />
                    {project.serviceName || 'N/A'}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {project.tagNames && project.tagNames.length > 0 ? (
                      project.tagNames.map((tag, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-muted-foreground text-sm">-</span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    {formatCurrency(project.totalValue || 0)}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    {project.startDate ? formatDate(project.startDate) : 'N/A'}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    {project.endDate ? formatDate(project.endDate) : 'N/A'}
                  </div>
                </TableCell>
                <TableCell>
                  {project.url ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleUrlClick(project.url!)}
                      className="p-1 h-8 w-8"
                      title={`Abrir ${project.url}`}
                    >
                      <Url className="h-4 w-4 text-blue-600" />
                    </Button>
                  ) : (
                    <span className="text-muted-foreground text-sm">-</span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="max-w-[200px] truncate" title={project.description}>
                    {project.description || 'N/A'}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      {project.completedStages || 0}/{project.stages?.length || 0}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEditProject(project)}
                      className="p-1 h-8 w-8"
                      title="Editar projeto"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDeleteProject(project.id)}
                      className="p-1 h-8 w-8 text-red-600 hover:text-red-700"
                      title="Excluir projeto"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
              
              {expandedRows.has(project.id) && (
                <TableRow>
                  <TableCell colSpan={14} className="bg-muted/20 p-4">
                    <div className="space-y-3">
                      <h4 className="font-semibold text-sm flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        Detalhes do Projeto
                      </h4>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="font-medium">Descrição Completa:</span>
                          <p className="text-muted-foreground mt-1">
                            {project.description || 'Sem descrição'}
                          </p>
                        </div>
                        
                        <div>
                          <span className="font-medium">Horas Totais:</span>
                          <p className="text-muted-foreground mt-1">
                            {project.totalHours || 0}h
                          </p>
                        </div>
                        
                        <div>
                          <span className="font-medium">Valor por Hora:</span>
                          <p className="text-muted-foreground mt-1">
                            {formatCurrency(project.hourlyRate || 0)}
                          </p>
                        </div>
                        
                        <div>
                          <span className="font-medium">Comissão Principal:</span>
                          <p className="text-muted-foreground mt-1">
                            {project.mainConsultantCommission || 0}%
                          </p>
                        </div>
                        
                        <div>
                          <span className="font-medium">Consultor Apoio:</span>
                          <p className="text-muted-foreground mt-1">
                            {project.supportConsultantName || 'N/A'}
                          </p>
                        </div>
                        
                        <div>
                          <span className="font-medium">Comissão Apoio:</span>
                          <p className="text-muted-foreground mt-1">
                            {project.supportConsultantCommission || 0}%
                          </p>
                        </div>

                        {project.url && (
                          <div>
                            <span className="font-medium">URL do Projeto:</span>
                            <p className="text-muted-foreground mt-1">
                              <Button
                                variant="link"
                                className="p-0 h-auto text-blue-600 underline"
                                onClick={() => handleUrlClick(project.url!)}
                              >
                                {project.url}
                              </Button>
                            </p>
                          </div>
                        )}
                      </div>
                      
                      {project.stages && project.stages.length > 0 && (
                        <div>
                          <h5 className="font-medium text-sm mb-2">Etapas do Projeto:</h5>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {project.stages.map((stage, index) => (
                              <div key={stage.id} className="flex items-center gap-2 text-xs">
                                <Badge variant={stage.completed ? "default" : "outline"}>
                                  {index + 1}
                                </Badge>
                                <span className={stage.completed ? "line-through text-muted-foreground" : ""}>
                                  {stage.name}
                                </span>
                                {stage.completed && <CheckCircle className="h-3 w-3 text-green-600" />}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </React.Fragment>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default ProjectsExpandedTable;
