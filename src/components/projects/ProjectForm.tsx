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
import { CalendarIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { useToast } from "@/components/ui/use-toast";
import { Consultant } from '../consultants/ConsultantList';
import { fetchConsultants } from '@/integrations/supabase/consultants';
import { Project, Stage } from './ProjectList';
import { supabase } from '@/integrations/supabase/client';
import { createChatRoom, addChatParticipant } from '@/integrations/supabase/chat';

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
  const [startDate, setStartDate] = useState<Date | undefined>(project ? new Date(project.startDate) : undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(project ? new Date(project.endDate) : undefined);
  const [totalValue, setTotalValue] = useState(project?.totalValue?.toString() || '');
  const [taxPercent, setTaxPercent] = useState(project?.taxPercent?.toString() || '');
  const [thirdPartyExpenses, setThirdPartyExpenses] = useState(project?.thirdPartyExpenses?.toString() || '');
  const [consultantValue, setConsultantValue] = useState(project?.consultantValue?.toString() || '');
  const [status, setStatus] = useState(project?.status || 'planned');
  const [stages, setStages] = useState<Stage[]>(project?.stages || []);
  const [consultants, setConsultants] = useState<Consultant[]>([]);
  const { toast } = useToast();
  
  useEffect(() => {
    fetchConsultants().then(setConsultants);
  }, []);

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
      status,
      stages
    };
    
    try {
      // Passar os dados para a função onSave do componente pai
      // Quando o projeto é criado no ProjectList, esta chamada insere no banco de dados
      // o que ativa o trigger para criar a sala de chat
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
          // Não falhar a operação principal se houver erro ao configurar a sala
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
              {consultants.map(consultant => (
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
                  {startDate ? format(startDate, "PPP") : (
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
                  disabled={(date) =>
                    date > new Date()
                  }
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
                  {endDate ? format(endDate, "PPP") : (
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
                    date < startDate!
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
          <Label htmlFor="consultantValue">Valor do Consultor</Label>
          <Input
            type="number"
            id="consultantValue"
            value={consultantValue}
            onChange={(e) => setConsultantValue(e.target.value)}
            placeholder="Valor do consultor"
          />
        </div>
        
        <div>
          <Label htmlFor="status">Status do Projeto</Label>
          <Select value={status} onValueChange={setStatus}>
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
        
        <div className="flex justify-end space-x-2">
          <Button variant="ghost" onClick={onCancel}>Cancelar</Button>
          <Button type="submit">{project ? 'Salvar Alterações' : 'Adicionar Projeto'}</Button>
        </div>
      </form>
    </div>
  );
};

export default ProjectForm;
