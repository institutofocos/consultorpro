import React, { useState, useEffect } from 'react';
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardContent 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Clock } from "lucide-react";
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Project, Stage } from './ProjectList';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from "@/components/ui/use-toast";
import { Link } from 'react-router-dom';
import { MessageSquare } from 'lucide-react';
import { fetchChatRoomsByProject } from '@/integrations/supabase/chat';
import { useQuery } from '@tanstack/react-query';

interface ProjectDetailsProps {
  project: Project;
  onClose: () => void;
  onProjectUpdated: () => void;
}

export const ProjectDetails: React.FC<ProjectDetailsProps> = ({ project, onClose, onProjectUpdated }) => {
  const [stages, setStages] = useState<Stage[]>(project.stages);
  const { toast } = useToast();
  
  // Buscar salas de chat relacionadas a este projeto
  const { data: projectChatRooms = [] } = useQuery({
    queryKey: ['project_chat_rooms', project.id],
    queryFn: () => fetchChatRoomsByProject(project.id)
  });

  const handleStageComplete = async (stageId: string) => {
    const updatedStages = stages.map(stage =>
      stage.id === stageId ? { ...stage, completed: !stage.completed } : stage
    );
    
    setStages(updatedStages);
    
    try {
      const { error } = await supabase
        .from('projects')
        .update({ stages: updatedStages })
        .eq('id', project.id);
      
      if (error) throw error;
      
      toast({
        title: "Sucesso",
        description: "Etapa atualizada com sucesso!"
      });
      
      onProjectUpdated(); // Refresh project list
    } catch (error: any) {
      console.error('Error updating stage:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: error.message || "Não foi possível atualizar a etapa."
      });
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, 'dd/MM/yyyy', { locale: ptBR });
    } catch (error) {
      console.error("Error formatting date:", error);
      return 'Data inválida';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">{project.name}</h2>
        <div className="space-x-2">
          {projectChatRooms.length > 0 && (
            <Link to="/chat" state={{ initialRoomId: projectChatRooms[0].id }}>
              <Button variant="outline" className="gap-2">
                <MessageSquare size={16} />
                Sala de Chat
              </Button>
            </Link>
          )}
          <Button variant="outline" onClick={onClose}>Voltar</Button>
        </div>
      </div>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Detalhes do Projeto</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="text-sm font-medium">Consultor Principal</div>
              <div className="text-muted-foreground">{project.mainConsultantName}</div>
            </div>
            <div>
              <div className="text-sm font-medium">Valor do Consultor</div>
              <div className="text-muted-foreground">
                {new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL'
                }).format(project.consultantValue)}
              </div>
            </div>
            <div>
              <div className="text-sm font-medium">Data de Início</div>
              <div className="text-muted-foreground">{formatDate(project.startDate)}</div>
            </div>
            <div>
              <div className="text-sm font-medium">Data de Término</div>
              <div className="text-muted-foreground">{formatDate(project.endDate)}</div>
            </div>
            <div>
              <div className="text-sm font-medium">Valor Total</div>
              <div className="text-muted-foreground">
                {new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL'
                }).format(project.totalValue)}
              </div>
            </div>
            <div>
              <div className="text-sm font-medium">Status</div>
              <div>
                {project.status === 'active' && (
                  <Badge className="bg-green-500">
                    <Clock className="mr-1 h-3 w-3" />
                    Em Andamento
                  </Badge>
                )}
                {project.status === 'completed' && (
                  <Badge className="bg-blue-500">
                    <Check className="mr-1 h-3 w-3" />
                    Concluído
                  </Badge>
                )}
                {project.status === 'planned' && (
                  <Badge variant="outline">
                    Planejado
                  </Badge>
                )}
              </div>
            </div>
          </div>
          <div>
            <div className="text-sm font-medium">Descrição</div>
            <div className="text-muted-foreground">{project.description}</div>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Etapas do Projeto</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            {stages.map((stage) => (
              <div key={stage.id} className="border rounded-md p-4">
                <div className="flex items-center justify-between">
                  <div className="font-medium">{stage.name}</div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleStageComplete(stage.id)}
                  >
                    {stage.completed ? 'Marcar como Incompleto' : 'Marcar como Concluído'}
                  </Button>
                </div>
                <div className="text-sm text-muted-foreground">
                  Data de Início: {formatDate(stage.startDate)}
                </div>
                <div className="text-sm text-muted-foreground">
                  Data de Término: {formatDate(stage.endDate)}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProjectDetails;
