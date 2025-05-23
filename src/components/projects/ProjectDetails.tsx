
import React, { useState, useEffect } from 'react';
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardContent 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Clock, FileText, Eye } from "lucide-react";
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Project, Stage } from './types';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from "@/components/ui/use-toast";
import { Link } from 'react-router-dom';
import { MessageSquare } from 'lucide-react';
import { fetchChatRoomsByProject } from '@/integrations/supabase/chat';
import { useQuery } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface ProjectDetailsProps {
  project: Project;
  onClose: () => void;
  onProjectUpdated: () => void;
}

interface StageStatus {
  completed: boolean;
  clientApproved: boolean;
  managerApproved: boolean;
  invoiceIssued: boolean;
  paymentReceived: boolean;
  consultantsSettled: boolean;
}

type StageStatusKey = keyof StageStatus;

export const ProjectDetails: React.FC<ProjectDetailsProps> = ({ project, onClose, onProjectUpdated }) => {
  const [stages, setStages] = useState<Stage[]>([]);
  const [showDescriptionModal, setShowDescriptionModal] = useState(false);
  const [currentStageDescription, setCurrentStageDescription] = useState("");
  const { toast } = useToast();
  
  // Initialize stages from project with proper error handling and validation
  useEffect(() => {
    console.log('ProjectDetails - Loading project:', project);
    console.log('ProjectDetails - project.stages type:', typeof project.stages);
    console.log('ProjectDetails - project.stages content:', project.stages);
    
    let parsedStages: Stage[] = [];
    
    try {
      if (project.stages) {
        // Handle different possible formats of stages data
        if (typeof project.stages === 'string') {
          // If stages is a JSON string, parse it
          const parsed = JSON.parse(project.stages);
          if (Array.isArray(parsed)) {
            parsedStages = parsed;
          }
        } else if (Array.isArray(project.stages)) {
          // If stages is already an array, use it directly
          parsedStages = project.stages;
        } else if (typeof project.stages === 'object' && project.stages !== null) {
          // If stages is an object but not an array, try to extract array
          const stagesObj = project.stages as any;
          if (stagesObj.stages && Array.isArray(stagesObj.stages)) {
            parsedStages = stagesObj.stages;
          } else {
            // Try to convert object to array
            parsedStages = Object.values(stagesObj).filter(item => 
              item && typeof item === 'object' && 'id' in item
            ) as Stage[];
          }
        }
      }
      
      // Ensure parsedStages is actually an array
      if (!Array.isArray(parsedStages)) {
        console.warn('Stages is not an array after parsing:', parsedStages);
        parsedStages = [];
      }
      
      // Validate and clean stage data
      parsedStages = parsedStages.map((stage, index) => ({
        id: stage.id || `stage-${index}`,
        name: stage.name || `Etapa ${index + 1}`,
        description: stage.description || '',
        days: Number(stage.days) || 1,
        hours: Number(stage.hours) || 8,
        value: Number(stage.value) || 0,
        startDate: stage.startDate || '',
        endDate: stage.endDate || '',
        consultantId: stage.consultantId || undefined,
        completed: Boolean(stage.completed),
        clientApproved: Boolean(stage.clientApproved),
        managerApproved: Boolean(stage.managerApproved),
        invoiceIssued: Boolean(stage.invoiceIssued),
        paymentReceived: Boolean(stage.paymentReceived),
        consultantsSettled: Boolean(stage.consultantsSettled),
        attachment: stage.attachment || ''
      }));
      
      console.log('ProjectDetails - Parsed stages:', parsedStages);
      setStages(parsedStages);
      
    } catch (error) {
      console.error('Error parsing project stages:', error);
      console.error('Raw stages data:', project.stages);
      setStages([]);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao carregar etapas do projeto. Dados podem estar corrompidos."
      });
    }
  }, [project, toast]);
  
  // Buscar salas de chat relacionadas a este projeto
  const { data: projectChatRooms = [] } = useQuery({
    queryKey: ['project_chat_rooms', project.id],
    queryFn: () => fetchChatRoomsByProject(project.id)
  });

  // Calculate project progress based on manager-approved stages
  const calculateProjectProgress = () => {
    if (stages.length === 0) return 0;
    const approvedStages = stages.filter(stage => stage.managerApproved).length;
    return Math.round((approvedStages / stages.length) * 100);
  };

  // Update project status based on stage completion
  const updateProjectStatus = async (updatedStages: Stage[]) => {
    const progress = Math.round((updatedStages.filter(stage => stage.managerApproved).length / updatedStages.length) * 100);
    
    let newStatus = project.status;
    if (progress === 100) {
      newStatus = 'completed';
    } else if (progress > 0) {
      newStatus = 'active';
    } else {
      newStatus = 'planned';
    }
    
    // Update project status if it changed
    if (newStatus !== project.status) {
      try {
        const { error } = await supabase
          .from('projects')
          .update({ 
            status: newStatus,
            stages: JSON.stringify(updatedStages)
          })
          .eq('id', project.id);
        
        if (error) throw error;
        
        toast({
          title: "Status do projeto atualizado",
          description: `Projeto marcado como: ${newStatus === 'completed' ? 'Concluído' : newStatus === 'active' ? 'Em Andamento' : 'Planejado'}`
        });
      } catch (error: any) {
        console.error('Error updating project status:', error);
      }
    }
  };

  const handleStageStatusUpdate = async (stageId: string, statusField: StageStatusKey, value: boolean) => {
    const updatedStages = stages.map(stage => {
      if (stage.id === stageId) {
        const updatedStage = { ...stage, [statusField]: value };
        
        // Auto-mark stage as completed when manager approves
        if (statusField === 'managerApproved' && value) {
          updatedStage.completed = true;
        }
        
        // If manager disapproves, unmark completion
        if (statusField === 'managerApproved' && !value) {
          updatedStage.completed = false;
        }
        
        return updatedStage;
      }
      return stage;
    });
    
    setStages(updatedStages);
    
    try {
      // Update stages in database
      const { error } = await supabase
        .from('projects')
        .update({ stages: JSON.stringify(updatedStages) })
        .eq('id', project.id);
      
      if (error) throw error;
      
      // Update project status based on progress
      await updateProjectStatus(updatedStages);
      
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

  const showStageDescription = (description: string) => {
    setCurrentStageDescription(description || "Sem descrição disponível");
    setShowDescriptionModal(true);
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

  // Calculate net value (company revenue)
  const calculateNetValue = () => {
    const totalValue = project.totalValue || 0;
    const consultantValue = project.consultantValue || 0;
    const supportConsultantValue = project.supportConsultantValue || 0;
    const thirdPartyExpenses = project.thirdPartyExpenses || 0;
    return totalValue - consultantValue - supportConsultantValue - thirdPartyExpenses;
  };

  const projectProgress = calculateProjectProgress();

  return (
    <div className="max-h-[90vh] overflow-y-auto">
      <div className="space-y-6 p-4">
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
                <div className="text-xs text-slate-500">Valor: {new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL'
                }).format(project.consultantValue || 0)}</div>
                {project.mainConsultantPixKey && (
                  <div className="text-xs text-slate-500">PIX: {project.mainConsultantPixKey}</div>
                )}
              </div>
              
              {project.supportConsultantName && (
                <div>
                  <div className="text-sm font-medium">Consultor de Apoio</div>
                  <div className="text-muted-foreground">{project.supportConsultantName}</div>
                  <div className="text-xs text-slate-500">Valor: {new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL'
                  }).format(project.supportConsultantValue || 0)}</div>
                  {project.supportConsultantPixKey && (
                    <div className="text-xs text-slate-500">PIX: {project.supportConsultantPixKey}</div>
                  )}
                </div>
              )}
              
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
                <div className="text-sm font-medium">Valor Líquido (Empresa)</div>
                <div className="text-muted-foreground">
                  {new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL'
                  }).format(calculateNetValue())}
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
              
              <div>
                <div className="text-sm font-medium">Progresso do Projeto</div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                      style={{ width: `${projectProgress}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium">{projectProgress}%</span>
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {stages.filter(s => s.managerApproved).length} de {stages.length} etapas aprovadas pelo gestor
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
            {stages.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>Nenhuma etapa encontrada para este projeto.</p>
                <p className="text-sm mt-2">As etapas são definidas durante a criação/edição do projeto.</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {stages.map((stage) => (
                  <div key={stage.id} className="border rounded-md p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center">
                        <div className="font-medium">{stage.name}</div>
                        {stage.description && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  className="ml-2 p-0 h-6 w-6"
                                  onClick={() => showStageDescription(stage.description || "")}
                                >
                                  <FileText className="h-4 w-4 text-blue-500" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Ver descrição da etapa</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                      </div>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm">Gerenciar Status</Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-56">
                          <DropdownMenuLabel>Atualizar Status da Etapa</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuGroup>
                            <DropdownMenuItem onClick={() => handleStageStatusUpdate(stage.id, 'clientApproved', !stage.clientApproved)}>
                              <Check className={`mr-2 h-4 w-4 ${stage.clientApproved ? 'text-green-600' : 'text-gray-400'}`} />
                              <span>Aprovado pelo cliente</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleStageStatusUpdate(stage.id, 'managerApproved', !stage.managerApproved)}>
                              <Check className={`mr-2 h-4 w-4 ${stage.managerApproved ? 'text-green-600' : 'text-gray-400'}`} />
                              <span>Aprovado pelo gestor</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleStageStatusUpdate(stage.id, 'invoiceIssued', !stage.invoiceIssued)}>
                              <Check className={`mr-2 h-4 w-4 ${stage.invoiceIssued ? 'text-green-600' : 'text-gray-400'}`} />
                              <span>Nota fiscal emitida</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleStageStatusUpdate(stage.id, 'paymentReceived', !stage.paymentReceived)}>
                              <Check className={`mr-2 h-4 w-4 ${stage.paymentReceived ? 'text-green-600' : 'text-gray-400'}`} />
                              <span>Pagamento recebido</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleStageStatusUpdate(stage.id, 'consultantsSettled', !stage.consultantsSettled)}>
                              <Check className={`mr-2 h-4 w-4 ${stage.consultantsSettled ? 'text-green-600' : 'text-gray-400'}`} />
                              <span>Consultores pagos</span>
                            </DropdownMenuItem>
                          </DropdownMenuGroup>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    
                    <div className="text-sm text-muted-foreground grid grid-cols-2 gap-1">
                      <div>Data de Início: {stage.startDate ? formatDate(stage.startDate) : 'Não definida'}</div>
                      <div>Data de Término: {stage.endDate ? formatDate(stage.endDate) : 'Não definida'}</div>
                      <div>Valor: {new Intl.NumberFormat('pt-BR', {style: 'currency', currency: 'BRL'}).format(stage.value || 0)}</div>
                      
                      <div className="flex flex-wrap gap-1 col-span-2 mt-2">
                        {stage.completed && (
                          <Badge variant="outline" className="bg-slate-100 text-slate-800 border-slate-300">
                            Etapa concluída
                          </Badge>
                        )}
                        {stage.clientApproved && (
                          <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">
                            Aprovado pelo cliente
                          </Badge>
                        )}
                        {stage.managerApproved && (
                          <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300">
                            Aprovado pelo gestor
                          </Badge>
                        )}
                        {stage.invoiceIssued && (
                          <Badge variant="outline" className="bg-purple-100 text-purple-800 border-purple-300">
                            Nota fiscal emitida
                          </Badge>
                        )}
                        {stage.paymentReceived && (
                          <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300">
                            Pagamento recebido
                          </Badge>
                        )}
                        {stage.consultantsSettled && (
                          <Badge variant="outline" className="bg-indigo-100 text-indigo-800 border-indigo-300">
                            Consultores pagos
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Modal for displaying stage description */}
        <Dialog open={showDescriptionModal} onOpenChange={setShowDescriptionModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Descrição da Etapa</DialogTitle>
            </DialogHeader>
            <DialogDescription>
              <div className="mt-2 whitespace-pre-line">
                {currentStageDescription}
              </div>
            </DialogDescription>
            <div className="mt-4 flex justify-end">
              <DialogClose asChild>
                <Button variant="secondary">Fechar</Button>
              </DialogClose>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default ProjectDetails;
