
import React, { useState, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, Plus, Trash, MoreHorizontal } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { useToast } from "@/components/ui/use-toast";
import { fetchConsultants } from '@/integrations/supabase/consultants';
import { supabase } from '@/integrations/supabase/client';
import { createChatRoom, addChatParticipant } from '@/integrations/supabase/chat';
import { Consultant, Project, Stage } from './types';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { addDays } from 'date-fns';

interface ProjectFormProps {
  project?: Project | null;
  onSave: (project: any) => Promise<any>;
  onCancel: () => void;
}

export const ProjectForm: React.FC<ProjectFormProps> = ({ project, onSave, onCancel }) => {
  const [name, setName] = useState(project?.name || '');
  const [description, setDescription] = useState(project?.description || '');
  const [mainConsultantId, setMainConsultantId] = useState(project?.mainConsultantId || '');
  const [supportConsultantId, setSupportConsultantId] = useState(project?.supportConsultantId || '');
  const [startDate, setStartDate] = useState<Date | undefined>(project ? new Date(project.startDate) : new Date());
  const [endDate, setEndDate] = useState<Date | undefined>(project ? new Date(project.endDate) : addDays(new Date(), 30));
  const [totalValue, setTotalValue] = useState(project?.totalValue?.toString() || '');
  const [taxPercent, setTaxPercent] = useState(project?.taxPercent?.toString() || '16');
  const [thirdPartyExpenses, setThirdPartyExpenses] = useState(project?.thirdPartyExpenses?.toString() || '0');
  const [consultantValue, setConsultantValue] = useState(project?.consultantValue?.toString() || '');
  // Since supportConsultantValue doesn't exist on Project type, we'll use a default empty string
  const [supportConsultantValue, setSupportConsultantValue] = useState('0');
  const [status, setStatus] = useState<'planned' | 'active' | 'completed' | 'cancelled'>(project?.status || 'planned');
  const [stages, setStages] = useState<Stage[]>(project?.stages || []);
  const [consultants, setConsultants] = useState<Consultant[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const { toast } = useToast();
  
  useEffect(() => {
    // Fetch consultants
    fetchConsultants().then(data => setConsultants(data as unknown as Consultant[]));
    
    // Fetch services for stage templates
    const fetchServices = async () => {
      const { data, error } = await supabase
        .from('services')
        .select('*');
      
      if (!error && data) {
        setServices(data);
      }
    };
    
    fetchServices();
  }, []);

  // Initialize stages from a service template if no stages provided
  const initializeStagesFromService = (serviceId: string) => {
    const selectedService = services.find(s => s.id === serviceId);
    if (selectedService && selectedService.stages) {
      try {
        let serviceStages: Stage[];
        if (typeof selectedService.stages === 'string') {
          serviceStages = JSON.parse(selectedService.stages);
        } else {
          serviceStages = selectedService.stages;
        }
        
        if (Array.isArray(serviceStages)) {
          // Add required fields that exist on projects but might not on service templates
          const stagesWithDates = serviceStages.map((stage, index) => {
            // Calculate the start and end date for each stage
            const stageDuration = stage.days || 1;
            let stageStartDate;
            
            if (index === 0) {
              stageStartDate = startDate ? new Date(startDate) : new Date();
            } else {
              const prevStage = serviceStages[index - 1];
              stageStartDate = addDays(
                new Date(prevStage.endDate || prevStage.startDate || new Date()), 
                1
              );
            }
            
            const stageEndDate = addDays(stageStartDate, stageDuration - 1);
            
            // Convert all ids to strings to match the Stage type
            return {
              ...stage,
              id: stage.id ? stage.id.toString() : Date.now().toString() + index,
              startDate: stage.startDate || stageStartDate.toISOString().split('T')[0],
              endDate: stage.endDate || stageEndDate.toISOString().split('T')[0],
              completed: stage.completed || false
            } as Stage;
          });
          
          setStages(stagesWithDates);
          
          // Set the total value from service if not set
          if (!totalValue && selectedService.total_value) {
            setTotalValue(selectedService.total_value.toString());
          }
        }
      } catch (e) {
        console.error("Error parsing service stages:", e);
      }
    }
  };

  const handleAddStage = () => {
    const newStageStartDate = stages.length > 0 
      ? addDays(new Date(stages[stages.length - 1].endDate), 1)
      : startDate || new Date();
      
    const newStageEndDate = addDays(newStageStartDate, 5);
    
    const newStage: Stage = {
      id: Date.now().toString(),
      name: `Nova Etapa ${stages.length + 1}`,
      days: 5,
      hours: 20,
      value: 2200,
      startDate: newStageStartDate.toISOString().split('T')[0],
      endDate: newStageEndDate.toISOString().split('T')[0],
      completed: false
    };
    
    setStages([...stages, newStage]);
  };

  const handleUpdateStage = (index: number, field: keyof Stage, value: any) => {
    const updatedStages = [...stages];
    updatedStages[index] = { ...updatedStages[index], [field]: value };
    
    // If updating days, recalculate endDate
    if (field === 'days') {
      const startDateObj = new Date(updatedStages[index].startDate);
      updatedStages[index].endDate = addDays(startDateObj, Number(value) - 1)
        .toISOString().split('T')[0];
    }
    
    setStages(updatedStages);
  };

  const handleDeleteStage = (index: number) => {
    setStages(stages.filter((_, i) => i !== index));
  };

  const calculateNetValue = () => {
    const total = Number(totalValue) || 0;
    const tax = (Number(taxPercent) || 0) / 100 * total;
    const expenses = Number(thirdPartyExpenses) || 0;
    return total - tax - expenses;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!name.trim() || !mainConsultantId || !startDate || !endDate) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Por favor, preencha todos os campos obrigatórios."
      });
      return;
    }
    
    const mainConsultant = consultants.find(c => c.id === mainConsultantId);
    const supportConsultant = consultants.find(c => c.id === supportConsultantId);

    const formData = {
      id: project?.id,
      name,
      description,
      mainConsultantId,
      mainConsultantName: mainConsultant?.name,
      mainConsultantPixKey: mainConsultant?.pix_key,
      supportConsultantId,
      supportConsultantName: supportConsultant?.name,
      supportConsultantPixKey: supportConsultant?.pix_key,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      totalValue: parseFloat(totalValue),
      taxPercent: parseFloat(taxPercent),
      thirdPartyExpenses: parseFloat(thirdPartyExpenses),
      consultantValue: parseFloat(consultantValue),
      supportConsultantValue: parseFloat(supportConsultantValue),
      status,
      stages
    };
    
    try {
      // Passar os dados para a função onSave do componente pai
      const savedProject = await onSave(formData);
      
      // Se for um novo projeto, vamos adicionar os participantes à sala de chat criada pelo trigger
      if (!project && savedProject?.id) {
        try {
          // Buscar a sala de chat criada para este projeto
          const { data: chatRooms } = await supabase
            .from('chat_rooms')
            .select('*')
            .eq('project_id', savedProject.id);
          
          if (chatRooms && chatRooms.length > 0) {
            const chatRoom = chatRooms[0];
            
            // Adicionar o consultor principal como participante
            if (mainConsultant) {
              await addChatParticipant(
                chatRoom.id,
                mainConsultant.id,
                mainConsultant.name,
                'consultor_principal'
              );
            }
            
            // Adicionar o consultor de suporte, se existir
            if (supportConsultant) {
              await addChatParticipant(
                chatRoom.id,
                supportConsultant.id,
                supportConsultant.name,
                'consultor_suporte'
              );
            }
          }
        } catch (error) {
          console.error("Erro ao configurar sala de chat para o projeto:", error);
        }
      }
    } catch (error) {
      console.error('Erro ao salvar projeto:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível salvar o projeto."
      });
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">{project ? 'Editar Projeto' : 'Adicionar Projeto'}</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="name">Nome do Projeto</Label>
          <Input 
            type="text" 
            id="name" 
            value={name} 
            onChange={(e) => setName(e.target.value)} 
            placeholder="Nome do projeto" 
            required
          />
        </div>
        
        <div>
          <Label htmlFor="description">Descrição</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Descrição do projeto"
          />
        </div>
        
        <div>
          <Label htmlFor="mainConsultantId">Consultor Principal</Label>
          <Select value={mainConsultantId} onValueChange={setMainConsultantId}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione um consultor" />
            </SelectTrigger>
            <SelectContent>
              {consultants.map(consultant => (
                <SelectItem key={consultant.id} value={consultant.id}>{consultant.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <Label htmlFor="supportConsultantId">Consultor de Apoio (Opcional)</Label>
          <Select value={supportConsultantId} onValueChange={setSupportConsultantId}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione um consultor (opcional)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Nenhum</SelectItem>
              {consultants
                .filter(c => c.id !== mainConsultantId)
                .map(consultant => (
                  <SelectItem key={consultant.id} value={consultant.id}>{consultant.name}</SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Data de Início</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !startDate && "text-muted-foreground"
                  )}
                >
                  {startDate ? format(startDate, "dd/MM/yyyy") : (
                    <span>Selecione a data</span>
                  )}
                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={startDate}
                  onSelect={setStartDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
          
          <div>
            <Label>Data de Término</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !endDate && "text-muted-foreground"
                  )}
                >
                  {endDate ? format(endDate, "dd/MM/yyyy") : (
                    <span>Selecione a data</span>
                  )}
                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={endDate}
                  onSelect={setEndDate}
                  disabled={(date) =>
                    startDate ? date < startDate : false
                  }
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="totalValue">Valor Total do Projeto</Label>
            <Input
              type="number"
              id="totalValue"
              value={totalValue}
              onChange={(e) => setTotalValue(e.target.value)}
              placeholder="Valor total"
            />
          </div>
          
          <div>
            <Label htmlFor="taxPercent">Taxa de Imposto (%)</Label>
            <Input
              type="number"
              id="taxPercent"
              value={taxPercent}
              onChange={(e) => setTaxPercent(e.target.value)}
              placeholder="Taxa de imposto"
            />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="thirdPartyExpenses">Despesas de Terceiros</Label>
            <Input
              type="number"
              id="thirdPartyExpenses"
              value={thirdPartyExpenses}
              onChange={(e) => setThirdPartyExpenses(e.target.value)}
              placeholder="Despesas de terceiros"
            />
          </div>
          
          <div>
            <Label htmlFor="netValue">Valor Líquido (calculado)</Label>
            <Input
              type="number"
              id="netValue"
              value={calculateNetValue()}
              disabled
              className="bg-muted"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="consultantValue">Valor do Consultor Principal</Label>
            <Input
              type="number"
              id="consultantValue"
              value={consultantValue}
              onChange={(e) => setConsultantValue(e.target.value)}
              placeholder="Valor do consultor principal"
            />
          </div>
          
          <div>
            <Label htmlFor="supportConsultantValue">Valor do Consultor de Apoio</Label>
            <Input
              type="number"
              id="supportConsultantValue"
              value={supportConsultantValue}
              onChange={(e) => setSupportConsultantValue(e.target.value)}
              placeholder="Valor do consultor de apoio"
              disabled={!supportConsultantId}
            />
          </div>
        </div>
        
        <div>
          <Label htmlFor="status">Status do Projeto</Label>
          <Select 
            value={status} 
            onValueChange={(value: 'planned' | 'active' | 'completed' | 'cancelled') => setStatus(value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione o status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="planned">Planejado</SelectItem>
              <SelectItem value="active">Em Andamento</SelectItem>
              <SelectItem value="completed">Concluído</SelectItem>
              <SelectItem value="cancelled">Cancelado</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Seção para etapas do projeto */}
        <Card>
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle>Etapas do Projeto</CardTitle>
            <div className="flex gap-2">
              {services.length > 0 && (
                <Select onValueChange={initializeStagesFromService}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Carregar de serviço" />
                  </SelectTrigger>
                  <SelectContent>
                    {services.map(service => (
                      <SelectItem key={service.id} value={service.id}>{service.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              <Button type="button" onClick={handleAddStage} size="sm">
                <Plus className="h-4 w-4 mr-1" /> Adicionar
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {stages.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                Nenhuma etapa adicionada. Clique em "Adicionar" para criar etapas.
              </div>
            ) : (
              <div className="space-y-3">
                {stages.map((stage, index) => (
                  <div key={stage.id} className="border rounded-md p-3">
                    <div className="flex justify-between items-center mb-2">
                      <div className="font-medium">{stage.name}</div>
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteStage(index)}>
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <Label htmlFor={`stage-name-${index}`} className="text-xs">Nome</Label>
                        <Input
                          id={`stage-name-${index}`}
                          value={stage.name}
                          onChange={(e) => handleUpdateStage(index, 'name', e.target.value)}
                          size={10}
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor={`stage-days-${index}`} className="text-xs">Dias</Label>
                        <Input
                          id={`stage-days-${index}`}
                          type="number"
                          value={stage.days}
                          onChange={(e) => handleUpdateStage(index, 'days', Number(e.target.value))}
                          size={5}
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor={`stage-hours-${index}`} className="text-xs">Horas</Label>
                        <Input
                          id={`stage-hours-${index}`}
                          type="number"
                          value={stage.hours}
                          onChange={(e) => handleUpdateStage(index, 'hours', Number(e.target.value))}
                          size={5}
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor={`stage-value-${index}`} className="text-xs">Valor</Label>
                        <Input
                          id={`stage-value-${index}`}
                          type="number"
                          value={stage.value}
                          onChange={(e) => handleUpdateStage(index, 'value', Number(e.target.value))}
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor={`stage-start-${index}`} className="text-xs">Data Início</Label>
                        <Input
                          id={`stage-start-${index}`}
                          type="date"
                          value={stage.startDate}
                          onChange={(e) => handleUpdateStage(index, 'startDate', e.target.value)}
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor={`stage-end-${index}`} className="text-xs">Data Fim</Label>
                        <Input
                          id={`stage-end-${index}`}
                          type="date"
                          value={stage.endDate}
                          onChange={(e) => handleUpdateStage(index, 'endDate', e.target.value)}
                        />
                      </div>
                      
                      {project && (
                        <div className="flex items-center space-x-2 pt-6">
                          <input
                            type="checkbox"
                            id={`stage-completed-${index}`}
                            checked={stage.completed}
                            onChange={(e) => handleUpdateStage(index, 'completed', e.target.checked)}
                            className="rounded border-gray-300"
                          />
                          <Label htmlFor={`stage-completed-${index}`} className="text-xs cursor-pointer">
                            Concluída
                          </Label>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        
        <div className="flex justify-end space-x-2">
          <Button variant="ghost" onClick={onCancel} type="button">Cancelar</Button>
          <Button type="submit">{project ? 'Salvar Alterações' : 'Adicionar Projeto'}</Button>
        </div>
      </form>
    </div>
  );
};

export default ProjectForm;
