
import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Check, 
  X, 
  ArrowLeft, 
  Clock,
  CheckCircle2,
  AlertTriangle
} from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from '@/integrations/supabase/client';
import { useToast } from "@/components/ui/use-toast";

interface Stage {
  id: string;
  name: string;
  hours: number;
  days: number;
  value: number;
  startDate: string;
  endDate: string;
  completed: boolean;
  clientApproved: boolean;
  consultantPaid: boolean;
}

interface ProjectDetailsProps {
  project: any;
  onClose: () => void;
  onProjectUpdated: () => void;
}

export const ProjectDetails: React.FC<ProjectDetailsProps> = ({ project, onClose, onProjectUpdated }) => {
  const [stages, setStages] = useState<Stage[]>(project.stages || []);
  const { toast } = useToast();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
  };

  const getDaysOverdue = (endDate: string, completed: boolean) => {
    if (completed) return 0;
    
    const today = new Date();
    const end = new Date(endDate);
    
    if (today <= end) return 0;
    
    const diffTime = Math.abs(today.getTime() - end.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
    return diffDays;
  };

  const handleStatusChange = async (index: number, field: keyof Stage, value: boolean) => {
    try {
      const updatedStages = [...stages];
      updatedStages[index] = { ...updatedStages[index], [field]: value };
      
      // If marking as completed, also update the completedStages count
      if (field === 'completed' && value) {
        // Auto-update project status if all stages are completed
        const allCompleted = updatedStages.every(stage => stage.completed);
        let newStatus = project.status;
        
        if (allCompleted) {
          newStatus = 'completed';
        } else if (project.status !== 'active' && updatedStages.some(stage => stage.completed)) {
          newStatus = 'active';
        }
        
        const { error } = await supabase
          .from('projects')
          .update({
            stages: updatedStages,
            status: newStatus
          })
          .eq('id', project.id);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('projects')
          .update({ stages: updatedStages })
          .eq('id', project.id);
        
        if (error) throw error;
      }
      
      setStages(updatedStages);
      toast({
        title: "Sucesso",
        description: "Status da etapa atualizado com sucesso!"
      });
      
      onProjectUpdated(); // Refresh project list
    } catch (error: any) {
      console.error('Error updating stage status:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: error.message || "Não foi possível atualizar o status da etapa."
      });
    }
  };

  return (
    <Card className="shadow-card animate-fade-in">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={onClose} className="p-0 h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <CardTitle className="flex-1 text-center">{project.name}</CardTitle>
          <div className="w-8"></div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Informações principais do projeto */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h3 className="text-lg font-bold mb-3">Informações do Projeto</h3>
            <dl className="space-y-2">
              <div className="grid grid-cols-3">
                <dt className="font-medium text-muted-foreground">Data Início:</dt>
                <dd className="col-span-2">{formatDate(project.startDate)}</dd>
              </div>
              <div className="grid grid-cols-3">
                <dt className="font-medium text-muted-foreground">Data Fim:</dt>
                <dd className="col-span-2">{formatDate(project.endDate)}</dd>
              </div>
              <div className="grid grid-cols-3">
                <dt className="font-medium text-muted-foreground">Valor Total:</dt>
                <dd className="col-span-2">{formatCurrency(project.totalValue)}</dd>
              </div>
              <div className="grid grid-cols-3">
                <dt className="font-medium text-muted-foreground">Status:</dt>
                <dd className="col-span-2">
                  {project.status === 'active' && (
                    <Badge className="bg-green-500">Em Andamento</Badge>
                  )}
                  {project.status === 'completed' && (
                    <Badge className="bg-blue-500">Concluído</Badge>
                  )}
                  {project.status === 'planned' && (
                    <Badge variant="outline">Planejado</Badge>
                  )}
                </dd>
              </div>
            </dl>
          </div>
          
          <div>
            <h3 className="text-lg font-bold mb-3">Consultores</h3>
            <dl className="space-y-4">
              <div>
                <dt className="font-medium">Consultor Principal:</dt>
                <dd>{project.mainConsultantName}</dd>
                <dt className="text-sm text-muted-foreground mt-1">Chave PIX:</dt>
                <dd className="text-sm">{project.mainConsultantPixKey || 'Não cadastrada'}</dd>
              </div>
              
              {project.supportConsultantName && (
                <div>
                  <dt className="font-medium">Consultor de Apoio:</dt>
                  <dd>{project.supportConsultantName}</dd>
                  <dt className="text-sm text-muted-foreground mt-1">Chave PIX:</dt>
                  <dd className="text-sm">{project.supportConsultantPixKey || 'Não cadastrada'}</dd>
                </div>
              )}
            </dl>
          </div>
        </div>
        
        {/* Etapas do Projeto */}
        <div>
          <h3 className="text-lg font-bold mb-3">Etapas do Projeto</h3>
          
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Etapa</TableHead>
                <TableHead>Período</TableHead>
                <TableHead>Horas</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Situação</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stages.length > 0 ? (
                stages.map((stage, index) => {
                  const daysOverdue = getDaysOverdue(stage.endDate, stage.completed);
                  
                  return (
                    <TableRow key={stage.id || index}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{stage.name}</div>
                          {daysOverdue > 0 && !stage.completed && (
                            <div className="mt-1">
                              <Badge variant="destructive" className="flex items-center gap-1">
                                <AlertTriangle className="h-3 w-3" />
                                <span>{daysOverdue} dias em atraso</span>
                              </Badge>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{formatDate(stage.startDate)} até</div>
                          <div>{formatDate(stage.endDate)}</div>
                        </div>
                      </TableCell>
                      <TableCell>{stage.hours}h</TableCell>
                      <TableCell>{formatCurrency(stage.value)}</TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <Badge 
                            className={stage.completed ? "bg-green-500" : "bg-gray-300"}
                          >
                            {stage.completed ? 'Concluída' : 'Pendente'}
                          </Badge>
                          
                          {stage.completed && (
                            <>
                              <Badge 
                                className={stage.clientApproved ? "bg-blue-500" : "bg-gray-300"}
                              >
                                {stage.clientApproved ? 'Aprovada pelo Cliente' : 'Aguardando Aprovação'}
                              </Badge>
                              
                              <Badge 
                                className={stage.consultantPaid ? "bg-purple-500" : "bg-gray-300"}
                              >
                                {stage.consultantPaid ? 'Pagamento Efetuado' : 'Pagamento Pendente'}
                              </Badge>
                            </>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col space-y-2 items-end">
                          <Button 
                            variant={stage.completed ? "ghost" : "outline"}
                            size="sm"
                            className={stage.completed ? "text-green-500" : ""}
                            onClick={() => handleStatusChange(index, 'completed', !stage.completed)}
                          >
                            {stage.completed ? <Check className="h-4 w-4 mr-1" /> : <Clock className="h-4 w-4 mr-1" />}
                            {stage.completed ? 'Concluída' : 'Concluir'}
                          </Button>
                          
                          {stage.completed && (
                            <>
                              <Button 
                                variant={stage.clientApproved ? "ghost" : "outline"}
                                size="sm"
                                className={stage.clientApproved ? "text-blue-500" : ""}
                                onClick={() => handleStatusChange(index, 'clientApproved', !stage.clientApproved)}
                              >
                                {stage.clientApproved ? 'Aprovada' : 'Aprovar'}
                              </Button>
                              
                              <Button 
                                variant={stage.consultantPaid ? "ghost" : "outline"}
                                size="sm"
                                className={stage.consultantPaid ? "text-purple-500" : ""}
                                onClick={() => handleStatusChange(index, 'consultantPaid', !stage.consultantPaid)}
                              >
                                {stage.consultantPaid ? 'Pago' : 'Pagar'}
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Nenhuma etapa cadastrada para este projeto
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
      
      <CardFooter className="flex justify-end">
        <Button variant="outline" onClick={onClose}>Voltar</Button>
      </CardFooter>
    </Card>
  );
};

export default ProjectDetails;
