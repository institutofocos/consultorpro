
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Clock, User, Activity, GitBranch, CheckCircle, AlertCircle } from 'lucide-react';
import { useProjectHistory } from '@/hooks/useProjectHistory';
import { ProjectHistory as ProjectHistoryType } from '@/types/project-history';

interface ProjectHistoryProps {
  projectId: string;
}

const ProjectHistory: React.FC<ProjectHistoryProps> = ({ projectId }) => {
  const { history, isLoading, isError } = useProjectHistory(projectId);

  const getActionIcon = (actionType: string) => {
    switch (actionType) {
      case 'created':
        return <Activity className="h-4 w-4 text-green-600" />;
      case 'updated':
        return <AlertCircle className="h-4 w-4 text-blue-600" />;
      case 'status_changed':
        return <GitBranch className="h-4 w-4 text-orange-600" />;
      case 'stage_created':
        return <Activity className="h-4 w-4 text-green-600" />;
      case 'stage_updated':
        return <CheckCircle className="h-4 w-4 text-blue-600" />;
      case 'stage_status_changed':
        return <GitBranch className="h-4 w-4 text-orange-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getActionColor = (actionType: string) => {
    switch (actionType) {
      case 'created':
        return 'bg-green-100 text-green-800';
      case 'updated':
        return 'bg-blue-100 text-blue-800';
      case 'status_changed':
        return 'bg-orange-100 text-orange-800';
      case 'stage_created':
        return 'bg-green-100 text-green-800';
      case 'stage_updated':
        return 'bg-blue-100 text-blue-800';
      case 'stage_status_changed':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getActionLabel = (actionType: string) => {
    switch (actionType) {
      case 'created':
        return 'Criado';
      case 'updated':
        return 'Atualizado';
      case 'status_changed':
        return 'Status Alterado';
      case 'stage_created':
        return 'Etapa Criada';
      case 'stage_updated':
        return 'Etapa Atualizada';
      case 'stage_status_changed':
        return 'Status da Etapa Alterado';
      default:
        return actionType;
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(date);
    } catch (error) {
      console.error('Error formatting date:', error);
      return dateString;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Histórico do Projeto
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            Carregando histórico...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Histórico do Projeto
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-red-500">
            Erro ao carregar histórico. Tente novamente.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Histórico do Projeto
        </CardTitle>
      </CardHeader>
      <CardContent>
        {history.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Nenhuma atividade registrada ainda.
          </div>
        ) : (
          <ScrollArea className="h-96">
            <div className="space-y-4">
              {history.map((entry: ProjectHistoryType) => (
                <div key={entry.id} className="flex items-start gap-3 p-3 border rounded-lg">
                  <div className="flex-shrink-0 mt-1">
                    {getActionIcon(entry.action_type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge className={getActionColor(entry.action_type)} variant="secondary">
                        {getActionLabel(entry.action_type)}
                      </Badge>
                      {entry.stage_id && (
                        <Badge variant="outline" className="text-xs">
                          Etapa
                        </Badge>
                      )}
                    </div>
                    
                    <p className="text-sm text-gray-900 mb-2">
                      {entry.description}
                    </p>
                    
                    {entry.field_changed && entry.old_value && entry.new_value && (
                      <div className="text-xs text-muted-foreground bg-gray-50 p-2 rounded">
                        <strong>Campo:</strong> {entry.field_changed}<br />
                        <strong>De:</strong> {entry.old_value} <strong>Para:</strong> {entry.new_value}
                      </div>
                    )}
                    
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {entry.user_name || 'Sistema'}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDate(entry.created_at)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};

export default ProjectHistory;
