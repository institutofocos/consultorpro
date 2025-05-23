import React, { useState, useEffect } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { PlusCircle, X, AlertCircle, Edit2, Calendar } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { ServiceStage } from "../services/types";
import { format } from "date-fns";

// Mock clients for select
const mockClients = [
  { id: 1, name: 'Empresa ABC Ltda.' },
  { id: 2, name: 'XYZ Consultoria' },
  { id: 3, name: 'Tech Solutions S.A.' },
  { id: 4, name: 'Indústrias Nova Era' },
  { id: 5, name: 'Comércio Global Ltda.' },
];

// Mock consultants for select
const mockConsultants = [
  { id: 1, name: 'Ana Silva' },
  { id: 2, name: 'Carlos Mendes' },
  { id: 3, name: 'Patricia Lemos' },
  { id: 4, name: 'Roberto Gomes' },
  { id: 5, name: 'Juliana Alves' },
];

// Mock KPIs for select
const mockKpis = [
  { id: 1, name: 'Satisfação do cliente', pillar: 'Qualidade' },
  { id: 2, name: 'ROI do projeto', pillar: 'Financeiro' },
  { id: 3, name: 'Cumprimento de prazos', pillar: 'Processos' },
  { id: 4, name: 'Inovação implementada', pillar: 'Inovação' },
];

// Mock OKRs for select
const mockOkrs = [
  { id: 1, name: 'Aumentar satisfação do cliente em 15%' },
  { id: 2, name: 'Reduzir custos operacionais em 20%' },
  { id: 3, name: 'Implementar novo sistema em 6 meses' },
];

const formSchema = z.object({
  name: z.string().min(3, { message: 'Nome deve ter pelo menos 3 caracteres' }),
  description: z.string().min(10, { message: 'Descrição deve ter pelo menos 10 caracteres' }),
  client: z.string({ required_error: 'Selecione um cliente' }),
  service: z.string().optional(),
  mainConsultant: z.string({ required_error: 'Selecione um consultor' }),
  startDate: z.string(),
  endDate: z.string(),
  totalValue: z.coerce.number().positive({ message: 'Valor deve ser maior que 0' }),
  taxPercent: z.coerce.number().min(0).max(100),
  thirdPartyExpenses: z.coerce.number().min(0),
  consultantValue: z.coerce.number().min(0),
});

type FormValues = z.infer<typeof formSchema>;

interface ProjectFormProps {
  project?: any;
  onSave: (data: any) => void;
  onCancel: () => void;
}

interface ProjectStage extends ServiceStage {
  startDate: string;
  endDate: string;
}

export const ProjectForm: React.FC<ProjectFormProps> = ({ project, onSave, onCancel }) => {
  const [totalValue, setTotalValue] = useState(project?.totalValue || 0);
  const [taxPercent, setTaxPercent] = useState(project?.taxPercent || 16);
  const [thirdPartyExpenses, setThirdPartyExpenses] = useState(project?.thirdPartyExpenses || 0);
  const [consultantValue, setConsultantValue] = useState(project?.consultantValue || 0);
  const [netValue, setNetValue] = useState(0);
  const [services, setServices] = useState<any[]>([]);
  const [selectedService, setSelectedService] = useState<any>(null);
  const [projectStages, setProjectStages] = useState<ProjectStage[]>(project?.stages || []);
  
  const [stageName, setStageName] = useState("");
  const [stageHours, setStageHours] = useState<number>(0);
  const [stageDays, setStageDays] = useState<number>(0);
  const [stageValue, setStageValue] = useState<number>(0);
  const [stageStartDate, setStageStartDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [stageEndDate, setStageEndDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [error, setError] = useState<string | null>(null);
  const [editingStage, setEditingStage] = useState<ProjectStage | null>(null);
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: project ? {
      name: project.name,
      description: project.description,
      client: project.client,
      service: project.service,
      mainConsultant: project.mainConsultant,
      startDate: project.startDate,
      endDate: project.endDate,
      totalValue: project.totalValue,
      taxPercent: project.taxPercent,
      thirdPartyExpenses: project.thirdPartyExpenses,
      consultantValue: project.consultantValue,
    } : {
      name: '',
      description: '',
      client: '',
      service: '',
      mainConsultant: '',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      totalValue: 0,
      taxPercent: 16,
      thirdPartyExpenses: 0,
      consultantValue: 0,
    }
  });
  
  // Calculate net value whenever related values change
  React.useEffect(() => {
    const taxAmount = (totalValue * taxPercent) / 100;
    const calculatedNetValue = totalValue - taxAmount - thirdPartyExpenses - consultantValue;
    setNetValue(calculatedNetValue);
  }, [totalValue, taxPercent, thirdPartyExpenses, consultantValue]);
  
  // Fetch available services
  useEffect(() => {
    const fetchServices = async () => {
      try {
        const { data, error } = await supabase
          .from('tags')
          .select('*')
          .order('name');
          
        if (error) throw error;
        
        // Use mock data for now, will be replaced with real API call
        const mockServices = [
          { 
            id: "1", 
            name: 'Consultoria Estratégica', 
            totalHours: 120, 
            hourlyRate: 125, 
            totalValue: 15000, 
            taxRate: 16, 
            extraCosts: 500, 
            netValue: 12100,
            stages: [
              { id: 101, name: 'Diagnóstico Inicial', hours: 40, value: 5000, days: 5 },
              { id: 102, name: 'Desenvolvimento de Estratégia', hours: 60, value: 7500, days: 7 },
              { id: 103, name: 'Implementação e Monitoramento', hours: 20, value: 2500, days: 3 }
            ]
          },
          { 
            id: "2", 
            name: 'Gestão de Projetos', 
            totalHours: 160, 
            hourlyRate: 112.50, 
            totalValue: 18000, 
            taxRate: 16, 
            extraCosts: 800, 
            netValue: 14320,
            stages: [
              { id: 201, name: 'Planejamento', hours: 40, value: 4500, days: 5 },
              { id: 202, name: 'Execução', hours: 100, value: 11250, days: 12 },
              { id: 203, name: 'Encerramento', hours: 20, value: 2250, days: 3 }
            ]
          }
        ];
        
        setServices(mockServices);
      } catch (error: any) {
        console.error('Error fetching services:', error);
        toast.error('Erro ao carregar serviços');
      }
    };
    
    fetchServices();
  }, []);
  
  // Handle service selection
  const handleServiceChange = (serviceId: string) => {
    const service = services.find(s => s.id === serviceId);
    setSelectedService(service);
    
    if (service) {
      // Set project values based on selected service
      form.setValue('totalValue', service.totalValue);
      setTotalValue(service.totalValue);
      
      // Convert service stages to project stages
      const today = new Date();
      const stageStartDate = new Date();
      
      const newProjectStages: ProjectStage[] = service.stages.map((stage: ServiceStage, index: number) => {
        // Calculate stage dates
        const startDate = new Date(stageStartDate);
        startDate.setDate(startDate.getDate() + (index > 0 ? service.stages[index-1].days : 0));
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + stage.days);
        
        return {
          ...stage,
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0]
        };
      });
      
      setProjectStages(newProjectStages);
    }
  };
  
  // Reset the stage form
  const resetStageForm = () => {
    setStageName("");
    setStageHours(0);
    setStageDays(0);
    setStageValue(0);
    setStageStartDate(new Date().toISOString().split('T')[0]);
    setStageEndDate(new Date().toISOString().split('T')[0]);
    setEditingStage(null);
    setError(null);
  };

  const handleAddOrUpdateStage = () => {
    if (!stageName.trim()) {
      setError("Nome da etapa é obrigatório");
      return;
    }
    
    if (stageHours <= 0) {
      setError("Horas da etapa devem ser maior que 0");
      return;
    }

    if (stageDays <= 0) {
      setError("Dias da etapa devem ser maior que 0");
      return;
    }
    
    if (new Date(stageEndDate) < new Date(stageStartDate)) {
      setError("Data de término deve ser após a data de início");
      return;
    }
    
    if (editingStage) {
      // Update existing stage
      setProjectStages(projectStages.map(stage => 
        stage.id === editingStage.id 
          ? { 
              ...stage, 
              name: stageName, 
              hours: stageHours, 
              days: stageDays, 
              value: stageValue,
              startDate: stageStartDate,
              endDate: stageEndDate
            } 
          : stage
      ));
      toast.success("Etapa atualizada com sucesso");
    } else {
      // Add new stage
      setProjectStages([
        ...projectStages,
        {
          id: Date.now(), // Use timestamp for unique ID
          name: stageName,
          hours: stageHours,
          days: stageDays,
          value: stageValue,
          startDate: stageStartDate,
          endDate: stageEndDate
        }
      ]);
    }
    
    resetStageForm();
  };
  
  const handleEditStage = (stage: ProjectStage) => {
    setStageName(stage.name);
    setStageHours(stage.hours);
    setStageDays(stage.days || 0);
    setStageValue(stage.value);
    setStageStartDate(stage.startDate);
    setStageEndDate(stage.endDate);
    setEditingStage(stage);
    setError(null);
  };
  
  const handleRemoveStage = (id: number) => {
    setProjectStages(projectStages.filter((stage) => stage.id !== id));
    if (editingStage?.id === id) {
      resetStageForm();
    }
  };
  
  const onSubmit = async (data: FormValues) => {
    const projectData = {
      ...data,
      status: 'planned',
      netValue,
      stages: projectStages
    };
    onSave(projectData);
  };

  // Format currency for display
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };
  
  return (
    <Card className="shadow-card animate-slide-in">
      <CardHeader>
        <CardTitle>{project ? 'Editar Projeto' : 'Adicionar Projeto'}</CardTitle>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Informações Básicas</h3>
              
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome do Projeto</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome do projeto ou serviço" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Descreva o projeto..." 
                        className="min-h-[80px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="client"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cliente</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione um cliente" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {mockClients.map(client => (
                            <SelectItem key={client.id} value={client.id.toString()}>
                              {client.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="service"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Serviço</FormLabel>
                      <Select 
                        onValueChange={(value) => {
                          field.onChange(value);
                          handleServiceChange(value);
                        }} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione um serviço (opcional)" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {services.map(service => (
                            <SelectItem key={service.id} value={service.id.toString()}>
                              {service.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="mainConsultant"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Consultor Principal</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione um consultor" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {mockConsultants.map(consultant => (
                            <SelectItem key={consultant.id} value={consultant.name}>
                              {consultant.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data de Início</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="endDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data de Término</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
            
            <Separator />
            
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Informações Financeiras</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="totalValue"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Valor Total do Projeto</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="0.00" 
                          {...field} 
                          onChange={(e) => {
                            field.onChange(e);
                            setTotalValue(Number(e.target.value));
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="taxPercent"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Percentual de Imposto (%)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="16%" 
                          {...field}
                          onChange={(e) => {
                            field.onChange(e);
                            setTaxPercent(Number(e.target.value));
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="thirdPartyExpenses"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Gastos com Terceiros</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="0.00" 
                          {...field}
                          onChange={(e) => {
                            field.onChange(e);
                            setThirdPartyExpenses(Number(e.target.value));
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="consultantValue"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Valor de Repasse ao Consultor</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="0.00" 
                          {...field}
                          onChange={(e) => {
                            field.onChange(e);
                            setConsultantValue(Number(e.target.value));
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="bg-muted p-4 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Valor Líquido do Projeto:</span>
                  <span className="text-lg font-bold">{formatCurrency(netValue)}</span>
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  Calculado como: Valor Total - Impostos - Gastos com Terceiros - Repasse ao Consultor
                </div>
              </div>
            </div>
            
            <Separator />
            
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Etapas do Projeto</h3>
              
              {error && (
                <Alert variant="destructive" className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                  <div className="md:col-span-2">
                    <FormLabel>Nome da Etapa</FormLabel>
                    <Input
                      placeholder="Nome da etapa"
                      value={stageName}
                      onChange={(e) => setStageName(e.target.value)}
                    />
                  </div>
                  
                  <div>
                    <FormLabel>Horas</FormLabel>
                    <Input
                      type="number"
                      placeholder="0"
                      value={stageHours || ""}
                      onChange={(e) => setStageHours(parseFloat(e.target.value) || 0)}
                    />
                  </div>

                  <div>
                    <FormLabel>Dias</FormLabel>
                    <Input
                      type="number"
                      placeholder="0"
                      value={stageDays || ""}
                      onChange={(e) => setStageDays(parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  
                  <div>
                    <FormLabel>Valor</FormLabel>
                    <Input
                      type="number"
                      placeholder="0"
                      value={stageValue || ""}
                      onChange={(e) => setStageValue(parseFloat(e.target.value) || 0)}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <FormLabel>Data de Início</FormLabel>
                    <Input
                      type="date"
                      value={stageStartDate}
                      onChange={(e) => setStageStartDate(e.target.value)}
                    />
                  </div>
                  
                  <div>
                    <FormLabel>Data de Término</FormLabel>
                    <Input
                      type="date"
                      value={stageEndDate}
                      onChange={(e) => setStageEndDate(e.target.value)}
                    />
                  </div>
                </div>
                
                <Button 
                  type="button" 
                  onClick={handleAddOrUpdateStage}
                  size="sm" 
                  className="w-full"
                >
                  {editingStage ? (
                    <>
                      <Edit2 className="mr-2 h-4 w-4" />
                      Atualizar Etapa
                    </>
                  ) : (
                    <>
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Adicionar Etapa
                    </>
                  )}
                </Button>
                
                {editingStage && (
                  <Button
                    type="button"
                    onClick={resetStageForm}
                    size="sm"
                    variant="outline"
                    className="w-full mt-2"
                  >
                    Cancelar Edição
                  </Button>
                )}
                
                {projectStages.length > 0 && (
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-muted">
                          <th className="px-4 py-2 text-left">Etapa</th>
                          <th className="px-4 py-2 text-right">Horas</th>
                          <th className="px-4 py-2 text-right">Dias</th>
                          <th className="px-4 py-2 text-right">Valor (R$)</th>
                          <th className="px-4 py-2 text-center">Período</th>
                          <th className="px-4 py-2 text-center">Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {projectStages.map((stage) => (
                          <tr key={stage.id} className="border-t">
                            <td className="px-4 py-3">{stage.name}</td>
                            <td className="px-4 py-3 text-right">{stage.hours}h</td>
                            <td className="px-4 py-3 text-right">{stage.days} dias</td>
                            <td className="px-4 py-3 text-right">R${stage.value.toFixed(2)}</td>
                            <td className="px-4 py-3 text-center">
                              <div className="flex items-center justify-center gap-1 text-xs">
                                <Calendar className="h-3 w-3 text-muted-foreground" />
                                <span>{stage.startDate} a {stage.endDate}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <div className="flex justify-center gap-1">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleEditStage(stage)}
                                >
                                  <Edit2 className="h-4 w-4" />
                                </Button>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleRemoveStage(stage.id)}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
          
          <CardFooter className="flex justify-between">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
            <Button type="submit">
              {project ? 'Atualizar' : 'Criar'} Projeto
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
};
