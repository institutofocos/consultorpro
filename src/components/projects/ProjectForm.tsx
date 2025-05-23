
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
import { CalendarIcon, Plus, Trash, MoreHorizontal, FileUp, Tag } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { useToast } from "@/components/ui/use-toast";
import { fetchConsultants } from '@/integrations/supabase/consultants';
import { fetchServices, fetchServiceById } from '@/integrations/supabase/services';
import { supabase } from '@/integrations/supabase/client';
import { createChatRoom, addChatParticipant } from '@/integrations/supabase/chat';
import { Consultant, Project, Stage } from './types';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { addDays } from 'date-fns';
import { BasicService } from '@/components/services/types';
import { Badge } from "@/components/ui/badge";

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
  const [supportConsultantValue, setSupportConsultantValue] = useState(project?.supportConsultantValue?.toString() || '0');
  const [status, setStatus] = useState<'planned' | 'active' | 'completed' | 'cancelled'>(project?.status || 'planned');
  const [stages, setStages] = useState<Stage[]>(project?.stages || []);
  const [consultants, setConsultants] = useState<Consultant[]>([]);
  const [services, setServices] = useState<BasicService[]>([]);
  const [selectedServiceId, setSelectedServiceId] = useState(project?.serviceId || '');
  const [tags, setTags] = useState<string[]>(project?.tags || []);
  const [newTag, setNewTag] = useState('');
  const [mainConsultantCommission, setMainConsultantCommission] = useState(project?.mainConsultantCommission?.toString() || '0');
  const [supportConsultantCommission, setSupportConsultantCommission] = useState(project?.supportConsultantCommission?.toString() || '0');
  const [fileUploading, setFileUploading] = useState(false);
  const { toast } = useToast();
  
  useEffect(() => {
    // Fetch consultants
    fetchConsultants().then(data => {
      setConsultants(data as unknown as Consultant[]);
      
      // If a consultant is already selected, set their commission percentage
      if (mainConsultantId) {
        const consultant = data.find(c => c.id === mainConsultantId);
        if (consultant && consultant.commission_percentage && !project?.mainConsultantCommission) {
          setMainConsultantCommission(consultant.commission_percentage.toString());
        }
      }
      
      if (supportConsultantId) {
        const consultant = data.find(c => c.id === supportConsultantId);
        if (consultant && consultant.commission_percentage && !project?.supportConsultantCommission) {
          setSupportConsultantCommission(consultant.commission_percentage.toString());
        }
      }
    });
    
    // Fetch services
    fetchServices().then(data => {
      setServices(data as unknown as BasicService[]);
    });
    
  }, []);
  
  // Handle consultant selection and set their default commission percentage
  const handleMainConsultantChange = (id: string) => {
    setMainConsultantId(id);
    if (id) {
      const consultant = consultants.find(c => c.id === id);
      if (consultant && consultant.commission_percentage) {
        setMainConsultantCommission(consultant.commission_percentage.toString());
        recalculateConsultantValues(totalValue, taxPercent, thirdPartyExpenses, consultant.commission_percentage.toString(), supportConsultantCommission);
      }
    }
  };
  
  const handleSupportConsultantChange = (id: string) => {
    setSupportConsultantId(id);
    if (id) {
      const consultant = consultants.find(c => c.id === id);
      if (consultant && consultant.commission_percentage) {
        setSupportConsultantCommission(consultant.commission_percentage.toString());
        recalculateConsultantValues(totalValue, taxPercent, thirdPartyExpenses, mainConsultantCommission, consultant.commission_percentage.toString());
      } else {
        setSupportConsultantCommission('0');
        recalculateConsultantValues(totalValue, taxPercent, thirdPartyExpenses, mainConsultantCommission, '0');
      }
    } else {
      setSupportConsultantCommission('0');
      setSupportConsultantValue('0');
    }
  };
  
  // Calculate consultant values based on commissions
  const recalculateConsultantValues = (
    total: string, 
    tax: string, 
    expenses: string, 
    mainCommission: string, 
    supportCommission: string
  ) => {
    const totalVal = parseFloat(total) || 0;
    const taxVal = (parseFloat(tax) || 0) / 100 * totalVal;
    const expensesVal = parseFloat(expenses) || 0;
    
    // Base for consultant calculation
    const baseAfterDeductions = totalVal - taxVal - expensesVal;
    
    // Calculate main consultant value based on commission
    const mainCommissionVal = parseFloat(mainCommission) || 0;
    const mainConsultantVal = (mainCommissionVal / 100) * baseAfterDeductions;
    setConsultantValue(mainConsultantVal.toFixed(2));
    
    // Calculate support consultant value - based on a percentage of the main consultant's value
    const supportCommissionVal = parseFloat(supportCommission) || 0;
    const supportConsultantVal = supportConsultantId ? (supportCommissionVal / 100) * mainConsultantVal : 0;
    setSupportConsultantValue(supportConsultantVal.toFixed(2));
  };
  
  // Watch for changes in values that affect consultant calculations
  useEffect(() => {
    recalculateConsultantValues(
      totalValue, 
      taxPercent, 
      thirdPartyExpenses,
      mainConsultantCommission,
      supportConsultantCommission
    );
  }, [totalValue, taxPercent, thirdPartyExpenses, mainConsultantCommission, supportConsultantCommission]);

  // Initialize stages from a service template if no stages provided
  const initializeStagesFromService = async (serviceId: string) => {
    // Verificar se o serviceId está vazio
    if (!serviceId) {
      setSelectedServiceId('');
      setDescription('');
      return;
    }

    setSelectedServiceId(serviceId);
    
    // Buscar o serviço selecionado diretamente do banco de dados
    try {
      const selectedService = await fetchServiceById(serviceId);
      if (selectedService) {
        console.log("Selected service:", selectedService);
        
        // Atualizar a descrição com a descrição do serviço
        if (selectedService.description) {
          setDescription(selectedService.description);
        }
        
        // Set the total value and tax rate from the service
        if (selectedService.total_value) {
          setTotalValue(selectedService.total_value.toString());
        }
        
        if (selectedService.tax_rate) {
          setTaxPercent(selectedService.tax_rate.toString());
        }
        
        // Handle stages
        if (selectedService.stages) {
          try {
            let serviceStages: Stage[];
            if (typeof selectedService.stages === 'string') {
              serviceStages = JSON.parse(selectedService.stages);
            } else {
              serviceStages = selectedService.stages as any;
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
                  description: stage.description || '', // Make sure description field is present
                  startDate: stage.startDate || stageStartDate.toISOString().split('T')[0],
                  endDate: stage.endDate || stageEndDate.toISOString().split('T')[0],
                  completed: stage.completed || false,
                  clientApproved: false,
                  consultantPaid: false,
                  attachment: stage.attachment || '' // Make sure attachment field is present
                } as Stage;
              });
              
              setStages(stagesWithDates);
              console.log("Stages loaded from service:", stagesWithDates);
            }
          } catch (e) {
            console.error("Error parsing service stages:", e);
          }
        }
      }
    } catch (error) {
      console.error("Error fetching service details:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível carregar os detalhes do serviço."
      });
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
      description: '', // Added description field
      days: 5,
      hours: 20,
      value: 2200,
      startDate: newStageStartDate.toISOString().split('T')[0],
      endDate: newStageEndDate.toISOString().split('T')[0],
      completed: false,
      clientApproved: false,
      consultantPaid: false,
      attachment: '' // Added attachment field
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
    const consultantCost = Number(consultantValue) || 0;
    const supportConsultantCost = Number(supportConsultantValue) || 0;
    
    // Descontar todos os valores conforme solicitado
    return total - tax - expenses - consultantCost - supportConsultantCost;
  };
  
  const handleAddTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };
  
  // Handle file upload for stage attachments
  const handleFileUpload = async (index: number, files: FileList | null) => {
    if (!files || !files[0]) return;
    
    const file = files[0];
    setFileUploading(true);
    
    // Here you would typically upload to a file storage service
    // For now we'll just store the file name to demonstrate functionality
    try {
      // In a real implementation, upload to storage and get the file URL
      // const { data, error } = await supabase.storage.from('stage-attachments').upload(...)
      
      // For demo purposes, just store the file name
      const updatedStages = [...stages];
      updatedStages[index] = { 
        ...updatedStages[index], 
        attachment: file.name 
      };
      setStages(updatedStages);
      
      toast({
        title: "Sucesso",
        description: "Arquivo anexado com sucesso!"
      });
    } catch (error) {
      console.error('Error uploading file:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível anexar o arquivo."
      });
    } finally {
      setFileUploading(false);
    }
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
      serviceId: selectedServiceId || null, // Para aceitar valor vazio ou nulo
      mainConsultantId,
      mainConsultantName: mainConsultant?.name,
      mainConsultantPixKey: mainConsultant?.pix_key,
      mainConsultantCommission: parseFloat(mainConsultantCommission) || 0,
      supportConsultantId: supportConsultantId || null, // Para aceitar valor vazio ou nulo
      supportConsultantName: supportConsultant?.name,
      supportConsultantPixKey: supportConsultant?.pix_key,
      supportConsultantCommission: parseFloat(supportConsultantCommission) || 0,
      startDate: startDate ? startDate.toISOString() : null,
      endDate: endDate ? endDate.toISOString() : null,
      totalValue: parseFloat(totalValue) || 0,
      taxPercent: parseFloat(taxPercent) || 0,
      thirdPartyExpenses: parseFloat(thirdPartyExpenses) || 0,
      consultantValue: parseFloat(consultantValue) || 0,
      supportConsultantValue: parseFloat(supportConsultantValue) || 0,
      status,
      stages,
      tags
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
        
        {/* Tags field */}
        <div>
          <Label>Tags</Label>
          <div className="flex flex-wrap gap-2 mb-2">
            {tags.map(tag => (
              <Badge key={tag} className="flex items-center gap-1 bg-blue-500">
                {tag}
                <button
                  type="button"
                  onClick={() => handleRemoveTag(tag)}
                  className="ml-1 text-xs hover:text-red-300"
                >
                  ×
                </button>
              </Badge>
            ))}
          </div>
          <div className="flex gap-2">
            <Input 
              value={newTag} 
              onChange={(e) => setNewTag(e.target.value)}
              placeholder="Adicionar tag" 
              onKeyPress={(e) => e.key === 'Enter' && e.preventDefault()}
            />
            <Button 
              type="button" 
              onClick={handleAddTag} 
              size="sm" 
              className="whitespace-nowrap"
            >
              <Tag className="h-4 w-4 mr-1" /> Adicionar
            </Button>
          </div>
        </div>
        
        <div>
          <Label htmlFor="service">Serviço Vinculado</Label>
          <Select 
            value={selectedServiceId} 
            onValueChange={initializeStagesFromService}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione um serviço para vincular ao projeto" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Nenhum</SelectItem>
              {services.map(service => (
                <SelectItem key={service.id} value={service.id}>{service.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedServiceId && (
            <p className="text-sm text-muted-foreground mt-1">
              As etapas e valores do serviço selecionado foram carregados automaticamente.
            </p>
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="mainConsultantId">Consultor Principal</Label>
            <Select value={mainConsultantId} onValueChange={handleMainConsultantChange}>
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
            <Label htmlFor="mainConsultantCommission">Percentual de Repasse (%)</Label>
            <Input
              type="number"
              id="mainConsultantCommission"
              value={mainConsultantCommission}
              onChange={(e) => setMainConsultantCommission(e.target.value)}
              placeholder="Percentual de repasse"
            />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="supportConsultantId">Consultor de Apoio (Opcional)</Label>
            <Select value={supportConsultantId} onValueChange={handleSupportConsultantChange}>
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
          
          <div>
            <Label htmlFor="supportConsultantCommission">Percentual de Repasse (%)</Label>
            <Input
              type="number"
              id="supportConsultantCommission"
              value={supportConsultantCommission}
              onChange={(e) => setSupportConsultantCommission(e.target.value)}
              placeholder="Percentual de repasse"
              disabled={!supportConsultantId}
            />
          </div>
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
            <p className="text-xs text-muted-foreground mt-1">
              Valor total - imposto - despesas terceiros - valor consultores
            </p>
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
            <p className="text-xs text-muted-foreground mt-1">
              Sugestão: {mainConsultantCommission}% do valor após impostos e despesas
            </p>
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
            {supportConsultantId && (
              <p className="text-xs text-muted-foreground mt-1">
                Sugestão: {supportConsultantCommission}% do valor do consultor principal
              </p>
            )}
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
              <Button type="button" onClick={handleAddStage} size="sm">
                <Plus className="h-4 w-4 mr-1" /> Adicionar
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {stages.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                Nenhuma etapa adicionada. Clique em "Adicionar" para criar etapas ou selecione um serviço para carregar etapas automaticamente.
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
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <Label htmlFor={`stage-name-${index}`} className="text-xs">Nome</Label>
                        <Input
                          id={`stage-name-${index}`}
                          value={stage.name}
                          onChange={(e) => handleUpdateStage(index, 'name', e.target.value)}
                          size={10}
                        />
                      </div>
                      
                      {/* Added description field for stages */}
                      <div>
                        <Label htmlFor={`stage-description-${index}`} className="text-xs">Descrição</Label>
                        <Input
                          id={`stage-description-${index}`}
                          value={stage.description || ''}
                          onChange={(e) => handleUpdateStage(index, 'description', e.target.value)}
                          placeholder="Descrição da etapa"
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
                      
                      {/* File attachment field */}
                      <div>
                        <Label htmlFor={`stage-attachment-${index}`} className="text-xs">Anexo</Label>
                        <div className="flex gap-2 items-center">
                          <Input
                            id={`stage-attachment-${index}`}
                            type="file"
                            onChange={(e) => handleFileUpload(index, e.target.files)}
                            className="w-full"
                          />
                          {stage.attachment && (
                            <div className="text-xs text-green-600">
                              {stage.attachment}
                            </div>
                          )}
                        </div>
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
